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

let scene, camera, renderer;

let isSupported = false;
const type = "immersive-ar";
let backMap;
const modelSize = 100;

const canvas = document.getElementById("scene");
const video = document.getElementById("video");
video.hidden = true;
const enableVideo = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

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

    // get user camera stream if available
    // const enableVideo = false;
    if (enableVideo) {
        navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: "environment"
            }
        }).then(stream => {
            video.srcObject = stream;
            video.play();
            video.onplay = _ => {
                video.classList.add("visible");
            };
        });
    }

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });

    const controls = new OrbitControls(camera, renderer.domElement);

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
        const imageData = Utils.videoSnapshot(video);

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

    const videoImage = Utils.videoSnapshot(video);
    scene.background = videoImage;
    scene.background.needsUpdate = true;

    renderer.render(scene, camera);
}

function loop(time) {
    update(time);
    render(time);
}

await init();

canvas.addEventListener('resize', Utils.resizeRenderer(renderer, camera));

renderer.setAnimationLoop(loop);

