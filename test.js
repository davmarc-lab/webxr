import * as THREE from 'three';

import { ARButton } from 'three/addons/webxr/ARButton.js'

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { AR } from 'js-aruco2'

import { Marker } from './marker'

import { Location, Corner, Arena } from './arena'

import * as Utils from './sceneUtils'
import { createAxis, createCube } from './helper';

import mqtt from "mqtt";

import fs from 'fs';

import { MQTTBroker } from './mqtt';

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

// xr session features
const reqFeats = [];

function getVideoImage() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function (stream) {
            if ("srcObject" in video) {
                video.srcObject = stream;
            } else {
                video.src = window.URL.createObjectURL(stream);
            }
        });

    const cs = document.createElement("canvas");
    cs.width = video.width;
    cs.height = video.height;

    const ctx = cs.getContext("2d");
    ctx.drawImage(video, 0, 0, video.width, video.height);
    document.body.appendChild(cs)
}

async function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR, FAR);

    video.width = window.innerWidth;
    video.height = window.innerHeight;

    const btn = document.getElementById("foo");
    btn.addEventListener('click', _ => {
        getVideoImage();
    });

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
    camera.position.z = 5;

    // const controls = new OrbitControls(camera, renderer.domElement);

    const img = await (new THREE.TextureLoader()).loadAsync("/assets/arena.png");
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

async function createArena(bestValues = true) {
    const corners = [];
    tracked.forEach(t => {
        const loc = locations.find(l => l.id == t.getId()).loc;
        if (!loc) return;

        const pp = new THREE.Object3D();
        pp.position.copy(t.getBestPosition());
        pp.add(createAxis());
        scene.add(pp);

        corners.push(new Corner(bestValues ? t.getBestPosition() : t.getAlternativePosition(),
            bestValues ? t.getBestRotation() : t.getAlternativeRotation(),
            loc));
    })

    arena = new Arena(corners);
    arena.createCasters();

    // await arena.addRobot(new THREE.Vector3(0, 0, 0), new THREE.Color(0xff0000));
    // await arena.addRobot(new THREE.Vector3(1, 20, 2), new THREE.Color(0x00ff00));
    // await arena.addRobot(new THREE.Vector3(-22, -4, 3), new THREE.Color(0x0000ff));

    scene.add(arena.getArena());

    arenaCreated = corners.length == 4;
}

function update() {
    if (renderer.info.render.frame % 100 == 0 && !calibrated) {
        handleCamera();
    }

    if (calibrated && !arenaCreated) {
        // create arena
        createArena();
    }
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

