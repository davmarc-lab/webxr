/**
 * Represents a robot entity in the scene.
 */
class Robot {
    /**
     * Creates a new Robot instance.
     *
     * @param {number} id Unique numeric identifier for the robot.
     * @param {THREE.Object3D} mesh The robot's 3D mesh loaded via GLTFLoader.
     */
    constructor(id, mesh) {
        this.id = id;
        this.mesh = mesh;
    }
}

export {
    Robot
}