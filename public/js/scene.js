import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

import * as xrutils from './session.js'

import * as server from '../../server.js'

const maxPixelCount = 3840 * 2160;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

camera.position.z = 5;

const canvas = document.getElementById("scene");

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.xr.enabled = true;

const enablePolyfill = navigator.xr == undefined;
const type = "immersive-vr";

xrutils.initXr(navigator);
const xr = navigator.xr;

const isSupported = await xrutils.requestSession(xr, type);

if (isSupported) {
    document.body.appendChild(ARButton.createButton(renderer));
    camera.position.set(0, 1.6, 2);
} else {
    const controls = new OrbitControls(camera, renderer.domElement);
}

const current = renderer.xr.getSession();

current.addEventListener('visibilitychange', (e) => {
    server.log(e);
});

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

function resizeRenderer(renderer) {
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
        renderer.setSize(width, height, false);
    }
    return needResize;
}

function render(time) {
    if (renderer.xr.isPresenting || !isSupported) {
        time *= 0.001;  // convert time to seconds

        cube.rotation.x = time;
        cube.rotation.y = time;

        renderer.render(scene, camera);

        if (resizeRenderer(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
    }
}

renderer.setAnimationLoop(render);


