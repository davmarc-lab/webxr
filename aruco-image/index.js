import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

import { AR } from 'js-aruco2'

import * as xrutils from './session.js'

function log(message) {
    fetch(`/log?${encodeURI(message)}`);
}

const maxPixelCount = 3840 * 2160;

const canvas = document.getElementById("scene");
// const ctx = canvas.getContext("2d");
// console.log(ctx);

const txtcanva = document.getElementById("txt");

// ---- js-aruco setup (no detection) ----
const detector = new AR.Detector({
    dictionaryName: "ARUCO"
});
console.log("js-aruco ready");

// ---- Three.js setup ----
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5;
// camera.position.set(0, 1.6, 2);

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    preserveDrawingBuffer: true
});
// renderer.setClearColor(new THREE.Color(0, 0, 0));

// Simple test object (not marker-related)
let material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
let cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
cube.position.z = -2;
// scene.add(cube);

document.body.appendChild(ARButton.createButton(renderer, {
    // requiredFeatures: ["unbounded"]
}));

// image
var map = new THREE.TextureLoader().load("marker.png");
var mat = new THREE.SpriteMaterial({ map: map, color: 0xffffff });
var sprite = new THREE.Sprite(mat);
sprite.scale.set(7, 7, 1);
scene.add(sprite);

function flipImageVertically(image) {
    const { width, height, data } = image;
    const rowSize = width * 4;
    const temp = new Uint8ClampedArray(rowSize);
    for (let y = 0; y < Math.floor(height / 2); y++) {
        const top = y * rowSize;
        const bottom = (height - y - 1) * rowSize;

        temp.set(data.subarray(top, top + rowSize));
        data.copyWithin(top, bottom, bottom + rowSize);
        data.set(temp, bottom);
    }
    return image;
}

window.addEventListener('resize', resizeRenderer());

function resizeRenderer() {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    let width = Math.floor(canvas.clientWidth * pixelRatio);
    let height = Math.floor(canvas.clientHeight * pixelRatio);
    const pixelCount = width * height;

    let renderScale = 1;
    if (pixelCount > maxPixelCount) {
        renderScale = Math.sqrt(maxPixelCount / pixelCount);
    }

    width = Math.floor(width * renderScale);
    height = Math.floor(height * renderScale);

    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
    }
}

function evaluateMarkers(markers) {
    markers.forEach(m => {
        console.log(m.corners)
    });
}

var make = true;

// ---- Render loop ----
function animate(time, frame) {
    time *= 0.001;

    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;

    // render to the canvas
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);

    if (make && renderer.info.render.frame % 100 == 0) {
        const width = canvas.width;
        const height = canvas.height;
        const rt = new THREE.WebGLRenderTarget(width, height);

        renderer.setRenderTarget(rt);
        renderer.render(scene, camera);

        const buffer = new Uint8Array(width * height * 4);
        renderer.readRenderTargetPixels(rt, 0, 0, width, height, buffer);

        const imageData = flipImageVertically(new ImageData(
            new Uint8ClampedArray(buffer),
            width,
            height
        ));

        material.map = map;
        cube.material.map.needsUpdate = true;
        // make = false;

        // send this image data to another page and render the result
        var markers = detector.detect(imageData);
        console.log("Markers found: " + markers.length);
        log("Markers found: " + markers.length);

        evaluateMarkers(markers);
    }
}

renderer.setAnimationLoop(animate);
