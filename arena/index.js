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
const modelSize = 35;

let tracked = [], calibrated = false;
let arenaCreated = false;

const FOV = 75;
const NEAR = 0.1;
const FAR = 1000;

let scene, camera, renderer, arena;

// camera scene
let imageCamera;

const canvas = document.getElementById("scene");
const divUi = document.getElementById("ui");
const pTrk = document.getElementById("tracked");
const pCal = document.getElementById("calibrated");
const btnCal = document.getElementById("calibrate");

// xr session features
const reqFeats = [];

async function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR, FAR);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
    renderer.xr.enabled = true;

    document.body.appendChild(ARButton.createButton(renderer, {
        requiredFeatures: reqFeats,
        optionalFeatures: ["dom-overlay"],
        domOverlay: { root: divUi }
    }));

    // init camera scene
    imageCamera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR, FAR);
    imageCamera.position.z = 5;

    const img = await (new THREE.TextureLoader()).loadAsync("arena.png");
    scene.background = img;

    // adds lights due to robot model material
    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(10, 10, 20).normalize();
    scene.add(directionalLight);

    btnCal.addEventListener("click", _ => {
        calibrated = false;
        pTrk.innerText = "Tracked: 0";
        pCal.innerText = "Calibrated: false";
        tracked = [];
    });
}

function handleCamera() {
    tracked = [];

    // draw the camera content in another scene as backgground
    // maybe get camera content using navigator and video?
    // but when the image is retrieved destroy video?
    const imageData = Utils.snapshot(renderer, camera, scene);

    const markers = detector.detect(imageData, imageData.width, imageData.height);
    if (markers.length == 0) return;

    if (markers.length == 4) {
        calibrated = true;
        pCal.innerText = "Calibrated: true";
    }

    // evaluating markers
    const posit = new POS.Posit(modelSize, renderer.domElement.width);
    markers.forEach(m => {
        let corners = m.corners;
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

function update(time) {
    time *= 0.001;  // convert time to seconds

    if (renderer.info.render.frame % 100 == 0 && !calibrated) {
        handleCamera();
    }

    if (calibrated && !arenaCreated) {
        // create arena
        const points = tracked.map(t => t.getBestPosition());
        console.log(points);

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

