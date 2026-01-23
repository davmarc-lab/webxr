import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { Location, Corner, Arena } from './arena.js'

import * as Utils from './sceneUtils'

const FOV = 75;
const NEAR = 0.1;
const FAR = 1000;

let scene, camera, renderer, arena;

const canvas = document.getElementById("scene");

// DEFAULT CASE
// const LEFT_TOP = new Corner(new THREE.Vector3(-100, 100, -100), Location.TOP_LEFT);
// const LEFT_BOT = new Corner(new THREE.Vector3(-100, -100, -100), Location.BOT_LEFT);
// const RIGHT_TOP = new Corner(new THREE.Vector3(50, 100, -100), Location.TOP_RIGHT);
// const RIGHT_BOT = new Corner(new THREE.Vector3(50, -100, -100), Location.BOT_RIGHT);

// LEFT SIDE CASE
// const LEFT_TOP = new Corner(new THREE.Vector3(-100, 100, 100), Location.TOP_LEFT);
// const LEFT_BOT = new Corner(new THREE.Vector3(-100, 30, 100), Location.BOT_LEFT);
// const RIGHT_TOP = new Corner(new THREE.Vector3(-100, 100, -100), Location.TOP_RIGHT);
// const RIGHT_BOT = new Corner(new THREE.Vector3(-100, 30, -100), Location.BOT_RIGHT);

// 45 ROTATED
// kinda works, a little weird because it doesn't follow the virtual face
// - a possible solution could be calculating an x axis for each edge (top and bot)
//   and calculate the average between the two, same for y axis
const LEFT_TOP = new Corner(new THREE.Vector3(-100, 100, -100), Location.TOP_LEFT);
const LEFT_BOT = new Corner(new THREE.Vector3(-100, -100, -100), Location.BOT_LEFT);
const RIGHT_TOP = new Corner(new THREE.Vector3(100, 100, -200), Location.TOP_RIGHT);
const RIGHT_BOT = new Corner(new THREE.Vector3(100, -100, -200), Location.BOT_RIGHT);

async function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR, FAR);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
    const controls = new OrbitControls(camera, renderer.domElement);

    arena = new Arena([LEFT_TOP, LEFT_BOT, RIGHT_TOP, RIGHT_BOT]);
    arena.createCasters();

    await arena.addRobot(new THREE.Vector3(0, 0, 0), new THREE.Color(0xff0000));
    await arena.addRobot(new THREE.Vector3(1, 20, 2), new THREE.Color(0x00ff00));
    const id = await arena.addRobot(new THREE.Vector3(-22, -4, 3), new THREE.Color(0x0000ff));

    // add arena to the scene
    scene.add(arena.getArena());

    // adds lights due to robot model material
    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(10, 10, 20).normalize();
    scene.add(directionalLight);

    const btnProject = document.getElementById("project");
    btnProject.addEventListener('click', _ => {
        arena.moveRobotByOffset(id, new THREE.Vector3(10, -5, 0));
    });
}

function update(time) {
    time *= 0.001;  // convert time to seconds
}

function render(time) {
    time *= 0.001;  // convert time to seconds

    renderer.render(scene, camera);
}

function loop(time) {
    update(time);
    render(time);
}

await init();

canvas.addEventListener('resize', Utils.resizeRenderer(renderer, camera));

renderer.setAnimationLoop(loop);

