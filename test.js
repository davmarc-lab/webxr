import * as THREE from 'three';

import { ARButton } from 'three/addons/webxr/ARButton.js'

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { AR } from 'js-aruco2'

import { Marker } from './marker'

import { Location, Corner, Arena } from './arena'

import * as Utils from './sceneUtils'
import { createAxis, createCube } from './helper';

import { MQTTBroker, parseBrokerMessage } from './mqtt';

const url = "ws://localhost:9001";
const opts = {
    clean: true,
    connectTimeout: 4000
}

const publishers = [
    "robots/+/position"
]

const broker = new MQTTBroker(url, opts);
broker.connect(publishers);


function log(message) {
    fetch(`/log?${encodeURI(message)}`);
}

// aruco detector
const detector = new AR.Detector({
    dictionaryName: "ARUCO"
});
const modelSize = 0.04;

let tracked = [], calibrated = false;
let arenaCreated = false;

const FOV = 75;
const NEAR = 0.1;
const FAR = 1000;

let scene, camera, renderer, arena;

const canvas = document.getElementById("scene");
const video = document.getElementById("video");
const divUi = document.getElementById("ui");
const pTrk = document.getElementById("tracked");
const pCal = document.getElementById("calibrated");
const btnCal = document.getElementById("calibrate");

const locations = [
    {
        id: 0,
        loc: Location.TOP_LEFT
    },
    {
        id: 1,
        loc: Location.TOP_RIGHT
    },
    {
        id: 2,
        loc: Location.BOT_LEFT
    },
    {
        id: 3,
        loc: Location.BOT_RIGHT
    },
];

const LEFT_TOP = new Corner(new THREE.Vector3(-100, 100, -100), new THREE.Vector3(0, 0, 0), Location.TOP_LEFT);
const LEFT_BOT = new Corner(new THREE.Vector3(-100, -100, -100), new THREE.Vector3(0, 0, 0), Location.BOT_LEFT);
const RIGHT_TOP = new Corner(new THREE.Vector3(100, 100, -100), new THREE.Vector3(0, 0, 0), Location.TOP_RIGHT);
const RIGHT_BOT = new Corner(new THREE.Vector3(100, -100, -100), new THREE.Vector3(0, 0, 0), Location.BOT_RIGHT);

// xr session features
const reqFeats = [];

async function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR, FAR);

    arena = new Arena([LEFT_TOP, LEFT_BOT, RIGHT_TOP, RIGHT_BOT]);
    arena.createCasters();
    scene.add(arena.getArena());

    broker.onMessage = async (topic, msg) => {
        const res = parseBrokerMessage(msg);

        const arenaPos = new THREE.Vector3(res.x, res.y, 0);
        const rId = res.robot_id;

        // is robot already in arena?
        if (!arena.hasRobot(rId)) {
            await arena.addRobot(rId, arenaPos);
        }
        arena.moveRobot(rId, arenaPos)
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

