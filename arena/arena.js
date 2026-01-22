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
const FOV = 75;
const NEAR = 0.1;
const FAR = 1000;

let scene, camera, renderer, arena;
const canvas = document.getElementById("scene");

const ORIGIN = new THREE.Vector3(0, 0, 0);
const CASTER_SCALE = new THREE.Vector3(50, 50, 50);

const cubeGeom = new THREE.BoxGeometry(1, 1, 1);
const cubeMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
function createCube(position, scale) {
    const c = new THREE.Mesh(cubeGeom, cubeMat);

    if (position === undefined) return c;
    c.position.set(position.x, position.y, position.z);

    if (scale === undefined) return c;
    c.scale.set(scale.x, scale.y, scale.z);

    return c;
}
class Arena {
    constructor(corners) {
        if (corners === undefined) throw new Error("Missing arena corners");
        if (corners.length != 4) throw new Error("Corners must be of size 4 -> given `" + corners.length + "`");

        this.corners = corners;
    }

    // casters are arena meshes on the area corners
    createCasters() {
        this.casters = [];
        this.corners.forEach(c => this.casters.push(createCube(c, CASTER_SCALE)));
    }

    getCasters() {
        if (this.casters === undefined) {
            console.error("Casters are not initialized, call `createCasters()`");
        }
        return this.casters;
    }

    getCorners() {
        return this.corners;
    }

    estimateArenaOrigin() {
        const x = this.#calculateCentroid(this.corners.map(p => p.x));
        const y = this.#calculateCentroid(this.corners.map(p => p.y));
        const z = this.#calculateCentroid(this.corners.map(p => p.z));
        return new THREE.Vector3(x, y, z);
    }

    #calculateCentroid(points) {
        if (points.length < 0) {
            console.error("[ERROR] points cannot be empty");
            return undefined;
        }
        if (points.length == 1) return points[0];

        return points.reduce((acc, val, _) => acc + val);
    }
}

let entities = [];

const LEFT_TOP = new THREE.Vector3(-100, 100, -100);
const LEFT_BOT = new THREE.Vector3(-100, -100, -100);
const RIGHT_TOP = new THREE.Vector3(50, 100, -100);
const RIGHT_BOT = new THREE.Vector3(50, -100, -100);

async function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR, FAR);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
    const controls = new OrbitControls(camera, renderer.domElement);

    arena = new Arena([LEFT_TOP, LEFT_BOT, RIGHT_TOP, RIGHT_BOT]);
    arena.createCasters();
    arena.getCasters().forEach(c => scene.add(c));

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

