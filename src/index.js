import * as THREE from 'three';

import { ARButton } from 'three/addons/webxr/ARButton.js'

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { AR } from 'js-aruco2'

import { Marker } from './marker'

import { Location, Corner, Arena, CASTER_SCALE } from './arena'

import * as Utils from './sceneUtils'

import { MQTTBroker, parseBrokerMessage } from './mqtt';

function log(message) {
    fetch(`/log?${encodeURI(message)}`);
}

// aruco detector
const detector = new AR.Detector({
    dictionaryName: "ARUCO"
});
const modelSize = 0.1;

let calibrated = false;
/**
 * @type {Array<Corner>}
 */
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
const reqFeats = ["viewer", "camera-access"];

// mqtt
const topics = [
    "robots/+/position"
]

const url = "wss://ugo-linux:9001";
const opts = {
    protocol: "wss",
    clean: true,
    connectTimeout: 4000,
    rejectUnauthorized: true
}

// create connection to the mqtt broker
const broker = new MQTTBroker(url, opts);
broker.connect(topics);

const simWorldSize = 100;

async function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR, FAR);
    camera.position.z = 0;

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas, preserveDrawingBuffer: true });
    renderer.xr.enabled = true;

    document.body.appendChild(ARButton.createButton(renderer, {
        requiredFeatures: reqFeats,
        optionalFeatures: ["dom-overlay"],
        domOverlay: { root: divUi }
    }));

    // init camera scene
    imageScene = new THREE.Scene();

    // adds lights due to robot model material
    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(10, 10, 20).normalize();
    scene.add(directionalLight);

    btnCal.addEventListener("click", _ => {
        calibrated = false;
        pCal.innerText = "Calibrated: false";
        tracked = [];
    });
}

function debugImage(image) {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");

    c.width = image.width;
    c.height = image.height;

    ctx.putImageData(image, 0, 0);
    document.body.appendChild(c);
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

    const old = renderer.getRenderTarget();
    const imageData = Utils.snapshot(renderer, camera, imageScene);
    renderer.setRenderTarget(old);

    // debugImage(imageData);
    return imageData;
}

function detectMarkers(imageData) {
    return detector.detect(imageData);
}

function trackMarkers(markers) {
    log("Markers: " + markers.length);
    if (markers.length == 0) return;

    tracked = [];
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
        const t = new Marker(m.id, pose);

        if (tracked.find(e => e.getId() == t.getId()) === undefined) {
            tracked.push(t);

            const pos = t.getBestPosition();
            log("ID: " + t.getId() + " => " + pos.x + ", " + pos.y + ", " + pos.z);
        }
    });

    if (tracked.length == 4) {
        calibrated = true;
        pCal.innerText = "Calibrated: true";
    } else {
        pCal.innerText = "Calibrated: false";
    }
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

let flag = false;
async function createArena(bestValues = true) {
    flag = true;
    // find right corners
    const corners = [];

    tracked.forEach(t => {
        const loc = locations.find(l => l.id == t.getId()).loc;
        if (!loc) return;

        const pos = bestValues ? t.getBestPosition() : t.getAlternativePosition()
        pos.applyMatrix4(camera.matrixWorld);
        const rot = bestValues ? t.getBestRotation() : t.getAlternativeRotation()

        corners.push(new Corner(pos, rot, loc));
    })

    arena = new Arena(corners, simWorldSize);
    CASTER_SCALE.set(modelSize, modelSize, modelSize);
    arena.createCasters();

    scene.add(arena.getArena());

    arenaCreated = corners.length == 4;
    if (arenaCreated) {
        log("Registering callback");
        broker.onMessage = async (topic, msg) => {
            // json parsed content of mqtt message
            const json = parseBrokerMessage(msg);

            const rId = json.robot_id;
            // const arenaPos = new THREE.Vector3(json.x * (100 / simWorldSize), json.y / simWorldSize, 0);
            const simPos = { x: json.x, y: json.y };
            const orient = json.orientation;

            // convert simulated arena coords into arena coords
            const normPos = Arena.normalizeSimulatedPos(arena, new THREE.Vector3(simPos.x, simPos.y, 0));

            // is robot already in arena?
            if (!arena.hasRobot(rId)) {
                await arena.addRobot(rId, normPos, orient);
            }

            // robot position
            arena.moveRobot(rId, normPos)

            // robot arena y-axis orientation
            arena.orientRobot(rId, orient)
        };
    }
}

function update(time) {
    time *= 0.001;  // convert time to seconds

    if (renderer.info.render.frame % 100 == 0 && !calibrated) {
        const image = getCameraImage();
        if (!image) return;
        const markers = detectMarkers(image);
        trackMarkers(markers);
    }

    if (!flag && calibrated && !arenaCreated) {
        // create arena
        createArena();
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

