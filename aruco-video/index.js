import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

import { AR } from 'js-aruco2'

import * as xrutils from './session.js'

import * as Utils from './utils.js'

function log(message) {
    fetch(`/log?${encodeURI(message)}`);
}

// ---- js-aruco setup  ----
const detector = new AR.Detector({
    dictionaryName: "ARUCO"
});
console.log("js-aruco ready");

const canvas = document.getElementById("scene");

// ---- Three.js setup ----
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 5);

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    preserveDrawingBuffer: true
});
renderer.xr.enabled = true;
// renderer.setClearColor(new THREE.Color(0, 0, 0));

const video = document.getElementById("video");
// const textureVideo = new THREE.VideoTexture(video);
// textureVideo.colorSpace = THREE.SRGBColorSpace;

// get user camera stream
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
        video: {}
    }).then(stream => {
        video.srcObject = stream;
        video.play();
    });
}

// Simple test object (not marker-related)
let material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
let cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
cube.position.z = -3;
scene.add(cube);

document.body.appendChild(ARButton.createButton(renderer, {
    requiredFeatures: ["unbounded"]
}));

// image
var map = new THREE.TextureLoader().load("marker.png");

window.addEventListener('resize', Utils.resizeRenderer(renderer, camera));

// ---- Render loop ----
function render(time) {
    time *= 0.001;

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // render to the canvas
    renderer.render(scene, camera);

    // detect very 100 frames
    if (renderer.info.render.frame % 200 == 0) {

        material.map = map;
        cube.material.map.needsUpdate = true;

        const oldRt = renderer.getRenderTarget();
        const imageData = Utils.snapshot(renderer, camera, scene);
        renderer.setRenderTarget(oldRt);

        // send this image data to another page and render the result
        var markers = detector.detect(imageData);
        console.log("Markers found: " + markers.length);
        log("Markers found: " + markers.length);

        Utils.evaluateMarkers(markers);
    }
}

function loop(time, _) {
    // update(time);
    render(time)
}

renderer.setAnimationLoop(loop);
