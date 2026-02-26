import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { AR } from 'js-aruco2'

import { Marker } from './marker'
import { Location, Corner, Arena, CASTER_SCALE } from './arena'

import * as Utils from './sceneUtils'
import { createCube } from './helper';

const FOV = 75;
const NEAR = 0.1;
const FAR = 1000;

let scene, camera, renderer, arena;
let tracked, corners;

const simWorldSize = 100;

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

// aruco detector
const detector = new AR.Detector({
    dictionaryName: "ARUCO"
});
const modelSize = 0.1;

const canvas = document.getElementById("scene");

// xr session features
const reqFeats = ["camera-access"];

const snap = document.getElementById("snap");
const est = document.getElementById("est");

let image = undefined;
let posit, imageScene;

const divUi = document.getElementById("ui");

function log(message) {
    fetch(`/log?${encodeURI(message)}`);
}

const timer = new THREE.Clock(false);
const times = [];

async function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR, FAR);

    imageScene = new THREE.Scene();

    camera.position.z = -100;

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
    camera.position.z = 5;

    const controls = new OrbitControls(camera, renderer.domElement);

    document.body.appendChild(ARButton.createButton(renderer, {
        requiredFeatures: reqFeats,
        optionalFeatures: ["dom-overlay"],
        domOverlay: { root: divUi }
    }));

    const textureLoader = new THREE.TextureLoader();
    const bgTexture = textureLoader.load("/assets/arena.png");
    scene.background = bgTexture;

    // background snapshot

    snap.addEventListener('click', _ => {
        // timer.start();
        image = Utils.snapshot(renderer, camera, scene);
        // const t = timer.getElapsedTime();
        // times.push(t);
        posit = new POS.Posit(modelSize, renderer.domElement.width);
    });

    est.addEventListener('click', _ => {
        timer.start();
        const markers = detector.detect(image);
        const t = timer.getElapsedTime();
        times.push(t);
        console.log(times);

        tracked = [];
        corners = [];

        markers.forEach(m => {
            let corners = m.corners;

            for (let i = 0; i < corners.length; ++i) {
                let corner = corners[i];
                corner.x = corner.x - (renderer.domElement.width / 2);
                corner.y = (renderer.domElement.height / 2) - corner.y;
            }

            const pose = posit.pose(corners);
            const t = new Marker(m.id, pose);

            if (tracked.find(e => e.getId() == t.getId()) === undefined) {
                tracked.push(t);

                const pos = t.getBestPosition();
                log("ID: " + t.getId() + " => " + pos.x + ", " + pos.y + ", " + pos.z);
            }

            // const err = pose.bestError;
            // log("ID: " + t.getId() + "\n\tErr: " + err +
            //     "\n\tPos: " + pos.x + ", " + pos.y + ", " + pos.z);
        });

        tracked.forEach(t => {
            const loc = locations.find(l => l.id == t.getId()).loc;
            if (!loc) return;

            const pos = t.getBestPosition();
            // handle camera world trasformations, not calculated during pose estimation
            pos.applyMatrix4(camera.matrixWorld);
            const rot = t.getBestRotation();

            corners.push(new Corner(pos, rot, loc));
        });

        if (arena) {
            const arenaObj = arena.getArena();
            scene.remove(arenaObj);
            arena.clearCorners();
        }

        arena = new Arena(corners, simWorldSize);
        CASTER_SCALE.set(modelSize, modelSize, modelSize);
        arena.createCasters();
        log("CASTERS")

        scene.add(arena.getArena());
    });
}

function getCameraImage() {
    if (!renderer.xr.getSession()) return undefined;

    const frame = renderer.xr.getFrame();
    const refSpace = renderer.xr.getReferenceSpace();
    if (!frame || !refSpace)
        return undefined;

    const viewPose = frame.getViewerPose(refSpace);
    if (!viewPose)
        return undefined;

    const view = viewPose.views.find(view => view.camera);
    if (!view)
        return undefined;

    const camText = renderer.xr.getCameraTexture(view.camera);
    if (!camText)
        return undefined;

    // draw the camera content in another scene as backgground
    imageScene.background = camText;
    imageScene.background.needsUpdate = true;

    const imageData = Utils.snapshot(renderer, camera, imageScene);

    // debugImage(imageData);
    return imageData;
}

function update() {
    // if (renderer.info.render.frame % 100 == 0 && image === undefined) {
    //     image = getCameraImage();
    //     log("Snap");
    // }
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

