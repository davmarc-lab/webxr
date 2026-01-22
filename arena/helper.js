import * as THREE from 'three';

const ORIGIN = new THREE.Vector3(0, 0, 0);
const CASTER_SCALE = new THREE.Vector3(50, 50, 50);
const ROB_SCALE = new THREE.Vector3(10, 10, 10);

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

function createRobot(position, scale) {
    const r = createCube(position, scale);
    r.material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    return r;
}
function createAxis() {
    const axes = new THREE.AxesHelper();
    axes.material.depthTest = false;
    axes.renderOrder = 1;
    return axes;
}

export {
    CASTER_SCALE,
    ROB_SCALE,
    createCube,
    createRobot,
    createAxis
}