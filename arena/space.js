import * as THREE from 'three';

import { ARButton } from 'three/addons/webxr/ARButton.js'

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { AR } from 'js-aruco2'

import { Marker } from './marker'

import { Location, Corner, Arena } from './arena'

import * as Utils from './sceneUtils'
import { createCube } from './helper';

function log(message) {
    fetch(`/log?${encodeURI(message)}`);
}

// aruco detector
const detector = new AR.Detector({
    dictionaryName: "ARUCO"
});
const modelSize = 50;

let calibrated = false;
let tracked;

const FOV = 45;
const NEAR = 0.1;
const FAR = 1000;

let scene, camera, renderer, arena;

// camera scene
let imageScene;

let arenaCreated = false;

const canvas = document.getElementById("scene");
const divUi = document.getElementById("ui");
const divCorners = document.getElementById("corners");
const pTrk = document.getElementById("tracked");
const pCal = document.getElementById("calibrated");
const btnCal = document.getElementById("calibrate");

// xr session features
const reqFeats = ["unbounded", "camera-access"];

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

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas, preserveDrawingBuffer: true });
    renderer.xr.enabled = true;

    document.body.appendChild(ARButton.createButton(renderer, {
        requiredFeatures: reqFeats,
        optionalFeatures: ["dom-overlay"],
        domOverlay: { root: divUi }
    }));

    // init camera scene
    imageScene = new THREE.Scene();

    // const controls = new OrbitControls(camera, renderer.domElement);

    // arena = new Arena([LEFT_TOP, LEFT_BOT, RIGHT_TOP, RIGHT_BOT]);
    // arena.createCasters();

    // await arena.addRobot(new THREE.Vector3(0, 0, 0), new THREE.Color(0xff0000));
    // await arena.addRobot(new THREE.Vector3(1, 20, 2), new THREE.Color(0x00ff00));
    // const id = await arena.addRobot(new THREE.Vector3(-22, -4, 3), new THREE.Color(0x0000ff));

    // add arena to the scene
    // scene.add(arena.getArena());

    // adds lights due to robot model material
    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(10, 10, 20).normalize();
    scene.add(directionalLight);

    // scene.add(createCube(new THREE.Vector3(0, 0, -286), new THREE.Vector3(modelSize, modelSize, modelSize)));

    btnCal.addEventListener("click", _ => {
        calibrated = false;
        pCal.innerText = "Calibrated: false";
        tracked = [];
    });
}

function handleCamera() {
    tracked = [];
    if (!renderer.xr.getSession()) return;

    const frame = renderer.xr.getFrame();
    const refSpace = renderer.xr.getReferenceSpace();
    if (!frame || !refSpace)
        return;

    const viewPose = frame.getViewerPose(refSpace);
    if (!viewPose)
        return;

    const view = viewPose.views.find(view => view.camera);
    if (!view)
        return;

    const camText = renderer.xr.getCameraTexture(view.camera);
    if (!camText)
        return;

    // draw the camera content in another scene as backgground
    // maybe get camera content using navigator and video?
    // but when the image is retrieved destroy video?
    imageScene.background = camText;
    imageScene.background.needsUpdate = true;

    const old = renderer.getRenderTarget();
    const imageData = Utils.snapshot(renderer, camera, imageScene);
    renderer.setRenderTarget(old);

    // // debug canvas to see the image
    // var canvas = document.createElement('canvas');
    // var ctx = canvas.getContext('2d');
    // canvas.width = 300
    // canvas.height = 400
    // ctx.putImageData(imageData, 0, 0, 0, 0, 400, 400);
    // image.src = canvas.toDataURL();

    const markers = detector.detect(imageData);
    log("Markers: " + markers.length);
    if (markers.length == 0) return;

    if (markers.length == 4) {
        calibrated = true;
        pCal.innerText = "Calibrated: true";
    } else {
        pCal.innerText = "Calibrated: false";
    }

    // evaluating markers
    const posit = new POS.Posit(modelSize, renderer.domElement.width);
    markers.forEach(m => {
        let corners = m.corners;

        // if it's not precise use this lines it should help
        for (let i = 0; i < corners.length; ++i) {
            let corner = corners[i];
            corner.x = corner.x - (renderer.domElement.width / 2);
            corner.y = (renderer.domElement.height / 2) - corner.y;
        }

        const pose = posit.pose(corners);
        tracked.push(new Marker(m.id, pose));
    });
    pTrk.innerText = "Tracked: " + tracked.length;
}

function updateUi(cubes) {
    cubes.forEach(c => {
        const pos = c.position;
        const p = document.createElement("p");
        p.innerText = "x: " + pos.x + ", y: " + pos.y + ", z: " + pos.z;
        divCorners.appendChild(p);
    });
}

function update(time) {
    time *= 0.001;  // convert time to seconds

    if (renderer.info.render.frame % 100 == 0 && !calibrated) {
        handleCamera();
    }

    if (calibrated && !arenaCreated) {
        // create arena
        const cubes = tracked.map(p => createCube(p.getBestPosition(), new THREE.Vector3(modelSize, modelSize, modelSize)));

        cubes.forEach(c => scene.add(c));
        // updateUi(cubes);
        arenaCreated = true;
    }
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

