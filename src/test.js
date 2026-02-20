import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { Location, Corner, Arena, CASTER_SCALE } from './arena'

import * as Utils from './sceneUtils'

import { MQTTClient, parseBrokerMessage } from './mqtt';

const url = "wss://localhost:9001";
const opts = {
    protocol: "wss",
    clean: true,
    connectTimeout: 4000,
    rejectUnauthorized: true
}

const publishers = [
    "robots/+/position"
]

const broker = new MQTTClient(url, opts);
broker.connect(publishers);

const FOV = 75;
const NEAR = 0.1;
const FAR = 1000;

let scene, camera, renderer, arena;

const canvas = document.getElementById("scene");

// default
const LEFT_TOP = new Corner(new THREE.Vector3(-100, 100, -100), new THREE.Vector3(0, 0, 0), Location.TOP_LEFT);
const LEFT_BOT = new Corner(new THREE.Vector3(-100, -100, -100), new THREE.Vector3(0, 0, 0), Location.BOT_LEFT);
const RIGHT_TOP = new Corner(new THREE.Vector3(100, 100, -100), new THREE.Vector3(0, 0, 0), Location.TOP_RIGHT);
const RIGHT_BOT = new Corner(new THREE.Vector3(100, -100, -100), new THREE.Vector3(0, 0, 0), Location.BOT_RIGHT);

// behind
// const LEFT_TOP = new Corner(new THREE.Vector3(100, 100, 100), new THREE.Vector3(0, 0, 0), Location.TOP_LEFT);
// const LEFT_BOT = new Corner(new THREE.Vector3(100, -100, 100), new THREE.Vector3(0, 0, 0), Location.BOT_LEFT);
// const RIGHT_TOP = new Corner(new THREE.Vector3(-100, 100, 100), new THREE.Vector3(0, 0, 0), Location.TOP_RIGHT);
// const RIGHT_BOT = new Corner(new THREE.Vector3(-100, -100, 100), new THREE.Vector3(0, 0, 0), Location.BOT_RIGHT);

// bottom
// const LEFT_TOP = new Corner(new THREE.Vector3(-100, 0, -100), new THREE.Vector3(0, 0, 0), Location.TOP_LEFT);
// const LEFT_BOT = new Corner(new THREE.Vector3(-100, 0, 100), new THREE.Vector3(0, 0, 0), Location.BOT_LEFT);
// const RIGHT_TOP = new Corner(new THREE.Vector3(100, 0, -100), new THREE.Vector3(0, 0, 0), Location.TOP_RIGHT);
// const RIGHT_BOT = new Corner(new THREE.Vector3(100, 0, 100), new THREE.Vector3(0, 0, 0), Location.BOT_RIGHT);

// left
// const LEFT_TOP = new Corner(new THREE.Vector3(-100, 100, 100), new THREE.Vector3(0, 0, 0), Location.TOP_LEFT);
// const LEFT_BOT = new Corner(new THREE.Vector3(-100, 30, 100), new THREE.Vector3(0, 0, 0), Location.BOT_LEFT);
// const RIGHT_TOP = new Corner(new THREE.Vector3(-100, 100, -100), new THREE.Vector3(0, 0, 0), Location.TOP_RIGHT);
// const RIGHT_BOT = new Corner(new THREE.Vector3(-100, 30, -100), new THREE.Vector3(0, 0, 0), Location.BOT_RIGHT);

// right
// const LEFT_TOP = new Corner(new THREE.Vector3(100, 100, -100), new THREE.Vector3(0, 0, 0), Location.TOP_LEFT);
// const LEFT_BOT = new Corner(new THREE.Vector3(100, 30, -100), new THREE.Vector3(0, 0, 0), Location.BOT_LEFT);
// const RIGHT_TOP = new Corner(new THREE.Vector3(100, 100, 100), new THREE.Vector3(0, 0, 0), Location.TOP_RIGHT);
// const RIGHT_BOT = new Corner(new THREE.Vector3(100, 30, 100), new THREE.Vector3(0, 0, 0), Location.BOT_RIGHT);

// 45 deg
// const LEFT_TOP = new Corner(new THREE.Vector3(-100, 100, -100), new THREE.Vector3(0, 0, 0), Location.TOP_LEFT);
// const LEFT_BOT = new Corner(new THREE.Vector3(-100, -100, -100), new THREE.Vector3(0, 0, 0), Location.BOT_LEFT);
// const RIGHT_TOP = new Corner(new THREE.Vector3(100, 100, -200), new THREE.Vector3(0, 0, 0), Location.TOP_RIGHT);
// const RIGHT_BOT = new Corner(new THREE.Vector3(100, -100, -200), new THREE.Vector3(0, 0, 0), Location.BOT_RIGHT);

// xr session features
const reqFeats = [];

const simWorldSize = 100;

async function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR, FAR);

    camera.position.z = -100;

    CASTER_SCALE.set(20, 20, 20);
    arena = new Arena([LEFT_TOP, LEFT_BOT, RIGHT_TOP, RIGHT_BOT], simWorldSize);
    arena.createCasters();
    scene.add(arena.getArena());

    broker.onMessage = async (topic, msg) => {
        // json parsed content of mqtt message
        const json = parseBrokerMessage(msg);

        const rId = json.robot_id;
        const simPos = { x: json.x, y: json.y };
        const orient = json.orientation;

        // convert simulated arena coords into arena coords
        const normPos = Arena.normalizeSimulatedPos(arena, new THREE.Vector3(simPos.x, simPos.y, 0));

        // is robot already in arena?
        if (!arena.hasRobot(rId)) {
            await arena.addRobot(rId, normPos, orient);
        }

        // robot position
        arena.moveRobot(rId, normPos)

        // robot arena y-axis orientation
        arena.orientRobot(rId, orient)
    };

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
    camera.position.z = 5;

    const controls = new OrbitControls(camera, renderer.domElement);

    // adds lights due to robot model material
    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(10, 10, 20).normalize();
    scene.add(directionalLight);
}

function update() {
}

function render() {
    renderer.render(scene, camera);
}

function loop(time) {
    update();
    render();
}

await init();

canvas.addEventListener('resize', Utils.resizeRenderer(renderer, camera));

renderer.setAnimationLoop(loop);

