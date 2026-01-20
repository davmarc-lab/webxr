import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

import { AR } from 'js-aruco2'

import * as xrutils from './session.js'

import * as Utils from './utils.js'

function log(message) {
    fetch(`/log?${encodeURI(message)}`);
}

const maxPixelCount = 3840 * 2160;

let scene, camera, canvas, renderer;
let isSupported = false;
const type = "immersive-ar";
let backMap;
const modelSize = 100;

// aruco detector
const detector = new AR.Detector({
    dictionaryName: "ARUCO"
});

let backCube;

const features = ["unbounded"];

const cubeGeom = new THREE.BoxGeometry(1, 1, 1);
const cubeMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

const cubes = [];

function createCube() {
    return new THREE.Mesh(cubeGeom, cubeMat);
}

async function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    canvas = document.getElementById("scene");

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
    // renderer.xr.enabled = true;

    // xrutils.initXr(navigator);
    // const xr = navigator.xr;

    // isSupported = await xrutils.isSupported(xr, type);

    if (isSupported) {
        // document.body.appendChild(ARButton.createButton(renderer, {
        //     requiredFeatures: features
        // }));
        // camera.position.set(0, 1.6, 2);
    } else {
        const controls = new OrbitControls(camera, renderer.domElement);
    }

    // background image
    backMap = new THREE.TextureLoader().load("arena.png");
    scene.background = backMap;

    const btnClear = document.getElementById("clear");
    btnClear.addEventListener('click', _ => {
        cubes.forEach(c => {
            scene.remove(c);
        });
    });

    const btnCalibrate = document.getElementById("calibrate");
    btnCalibrate.addEventListener('click', _ => {
        // take screen
        // retrieve the current render target
        const oldRt = renderer.getRenderTarget();
        // retrieve the image data of the current scene state
        // render on a different render target the scene content (camera as background)
        const imageData = Utils.snapshot(renderer, camera, scene);
        // restore the old render target
        renderer.setRenderTarget(oldRt);

        // detect markers
        const markers = detector.detect(imageData);

        // approx from 2D coords to 3D coords
        const posit = new POS.Posit(modelSize, canvas.width);
        for (let i = 0; i < markers.length; i++) {
            const m = markers[i];
            let corners = m.corners;

            for (let i = 0; i < corners.length; ++i) {
                let c = corners[i];
                c.x = c.x - (canvas.width / 2);
                c.y = (canvas.height / 2) - c.y;
            }

            const pose = posit.pose(m.corners);

            // take best translation and rotation
            const t = pose.bestTranslation;
            const r = pose.bestRotation;

            // create a cube with the calculated translation and rotation
            let cube = createCube();
            cube.position.x = t[0];
            cube.position.y = t[1];
            cube.position.z = -t[2];

            // marker size
            cube.scale.x = modelSize;
            cube.scale.y = modelSize;
            cube.scale.z = modelSize;

            cube.rotation.x = -Math.asin(-r[1][2]);
            cube.rotation.y = -Math.atan2(r[0][2], r[2][2]);
            cube.rotation.z = Math.atan2(r[1][0], r[1][1]);

            cubes.push(cube);

            scene.add(cube);
        }

        // create arena
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

