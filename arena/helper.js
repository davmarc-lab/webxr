import * as THREE from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ORIGIN = new THREE.Vector3(0, 0, 0);
const CASTER_SCALE = new THREE.Vector3(50, 50, 50);

const ROBOT_SCALE = 0.1;

const loader = new GLTFLoader();

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

async function createRobotMesh(position) {
    const gltf = await loader.loadAsync('/assets/robot.gltf');
    const robot = gltf.scene;

    robot.scale.set(ROBOT_SCALE, ROBOT_SCALE, ROBOT_SCALE)
    robot.position.copy(position);
    return robot;
}

function createAxis() {
    const axes = new THREE.AxesHelper();
    axes.material.depthTest = false;
    axes.renderOrder = 1;
    return axes;
}

function getScreenCoords(point, camera, width, height) {
    if (!point.isVector3 || !camera.isCamera) return undefined;

    const project = point.clone().project(camera);

    const whalf = width / 2;
    const hhalf = height / 2;

    return {
        x: project.x * whalf + whalf,
        y: -(project.y * hhalf) + hhalf,
    };
}

export {
    CASTER_SCALE,
    createCube,
    createRobotMesh,
    createAxis,
    getScreenCoords
}