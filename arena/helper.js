import * as THREE from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ROBOT_SCALE = 0.1;

const loader = new GLTFLoader();

const cubeGeom = new THREE.BoxGeometry(1, 1, 1);
const cubeMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

/**
 * Creates a standard cube threejs mesh with the same material and geometry.
 * 
 * @param {THREE.Vector3} position Cube position vector.
 * @param {THREE.Vector3} scale Cube scale vector.
 * @returns {THREE.Mesh} The mesh of the cube generated.
 */
function createCube(position, scale) {
    const c = new THREE.Mesh(cubeGeom, cubeMat);

    if (position !== undefined)
        c.position.set(position.x, position.y, position.z);

    if (scale !== undefined)
        c.scale.set(scale.x, scale.y, scale.z);

    return c;
}

/**
 * Loads the robot gltf model and set custom scale.
 * 
 * @param {THREE.Vector3} position Robot position vector.
 * @returns {THREE.Group} The imported model scene.
 */
async function createRobotMesh(position) {
    const gltf = await loader.loadAsync('/assets/robot.gltf');
    const robot = gltf.scene;

    robot.scale.set(ROBOT_SCALE, ROBOT_SCALE, ROBOT_SCALE)
    robot.position.copy(position);
    return robot;
}

/**
 * Creates helper axis used for debugging.
 * 
 * @returns The x, y and z axis helper.
 */
function createAxis() {
    const axes = new THREE.AxesHelper();
    axes.material.depthTest = false;
    axes.renderOrder = 1;
    return axes;
}

/**
 * Calculates the screen coordinates of a point in the scene.
 * 
 * @param {THREE.Vector3} point The point to evaluate.
 * @param {THREE.Camera} camera The camera in the scene.
 * @param {number} width Canvas width.
 * @param {number} height Canvas height.
 * @returns {THREE.Vector2} The screen space coordinates of the given point.
 */
function getScreenCoords(point, camera, width, height) {
    if (!point.isVector3 || !camera.isCamera) return undefined;

    const project = point.clone().project(camera);

    const whalf = width / 2;
    const hhalf = height / 2;

    return new THREE.Vector2(project.x * whalf + whalf, -(project.y * hhalf) + hhalf);
}

export {
    createCube,
    createRobotMesh,
    createAxis,
    getScreenCoords
}