import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

import * as xrutils from './session.js'

import { log } from '/log.js'

const maxPixelCount = 3840 * 2160;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

camera.position.z = 5;

const canvas = document.getElementById("scene");

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.xr.enabled = true;

const type = "immersive-ar";

xrutils.initXr(navigator);
const xr = navigator.xr;

const isSupported = await xrutils.isSupported(xr, type);

if (isSupported) {
    document.body.appendChild(ARButton.createButton(renderer, {
        requiredFeatures: ["unbounded"]
    }));
    camera.position.set(0, 1.6, 2);
    log(type + " is supported");
} else {
    const controls = new OrbitControls(camera, renderer.domElement);
}

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

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

function render(time) {
    if (renderer.xr.isPresenting || !isSupported) {
        if (isSupported)
            log(renderer.xr.getCamera().position);
        time *= 0.001;  // convert time to seconds

        cube.rotation.x = time;
        cube.rotation.y = time;

        renderer.render(scene, camera);
    }
}

renderer.setAnimationLoop(render);


