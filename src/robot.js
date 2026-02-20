/**
 * Represents a robot entity in the scene.
 */
class Robot {
    /**
     * Robot id.
     * @type {number}
     */
    #id;

    /**
     * Robot gltf loaded group.
     * @type {THREE.Group}
     */
    #mesh;

    /**
     * Robot y-axis orientation angle in radians.
     * 
     * @type {number}
     */
    #orientation;

    /**
     * Creates a new Robot instance.
     *
     * @param {number} id Unique numeric identifier for the robot.
     * @param {THREE.Group} mesh The robot 3D mesh loaded via GLTFLoader.
     * @param {number} orientation The robot y-axis angle in radians.
     */
    constructor(id, mesh, orientation) {
        this.#id = id;
        this.#mesh = mesh;
        this.#orientation = orientation;
    }

    /**
     * Retrieves the robot id given by the {@link Arena}.
     * 
     * @returns {number} The robot id.
     */
    getId() { return this.#id; }

    getPosition() { return this.#mesh.position; }

    setPosition(position) {
        this.#mesh.position.copy(position);
    }

    move(offset) {
        this.#mesh.position.add(offset);
    }

    getOrientation() { return this.#orientation; }

    setRotationMatrix(matrix) {
        this.#mesh.rotation.setFromRotationMatrix(matrix);
    }

    orient(axis, orient) {
        const offset = this.#orientation - orient;
        this.#orientation = orient;
        this.#mesh.rotateOnAxis(axis, offset);
    }
}

export {
    Robot
}