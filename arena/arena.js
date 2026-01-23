import * as THREE from 'three';

import { Robot } from './robot'

import { CASTER_SCALE, createCube, createRobotMesh, createAxis } from "./helper";

/**
 * Enum-like class representing valid corner locations.
 */
class Location {
    /** @type {string} */
    static TOP_LEFT = "Top Left";

    /** @type {string} */
    static TOP_RIGHT = "Top Right";

    /** @type {string} */
    static BOT_LEFT = "Bot Left";

    /** @type {string} */
    static BOT_RIGHT = "Bot Right";

    /**
     * Checks whether a given value is a valid Location.
     *
     * @param {string} location Location value to validate.
     * @returns {boolean} True if the location is valid.
     */
    static isValid(location) {
        return [this.TOP_LEFT, this.TOP_RIGHT, this.BOT_LEFT, this.BOT_RIGHT].includes(location);
    }
};

/**
 * Represents a corner of an {@link Arena} with a semantic location.
 */
class Corner {
    /**
     * @type {THREE.Vector3}
     */
    position;

    /**
     * @type {string}
     */
    location;

    /**
     * @param {THREE.Vector3} position Position of the corner in world space.
     * @param {string} location Logical corner location (must be a value from {@link Location}).
     */
    constructor(position, location) {
        if (!position.isVector3) throw new Error("The given position must be a `THREE.Vector3`");
        this.position = position;

        if (!Location.isValid(location)) throw new Error("The given location is not valid (it must be of type `Location`)");
        this.location = location;
    }
}

/**
 * Represents the coordinate axes of the arena.
 *
 * Defines the local x and y axes used to move entities inside of an arena.
 * Z axis is omitted because at the moment the arena is not managing depth.
 *
 * @see Arena
 */
class ArenaAxis {
    /**
     * @type {THREE.Vector3}
     */
    x;

    /**
     * @type {THREE.Vector3}
     */
    y;

    /**
     * Creates a new ArenaAxis instance.
     *
     * @param {THREE.Vector3} x Normalized vector representing the X axis.
     * @param {THREE.Vector3} y Normalized vector representing the Y axis.
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

/**
 * Represents a 3D arena composed of four corners and containing robots.
 *
 * The arena is responsible for positioning robots away from world origin.
 *
 * @see Corner
 * @see Robot
 */
class Arena {

    /** 
     * Array of {@link Corner} containing exactly four corners, used to
     * define arena boundaries.
     * 
     * @type {Array<Corner>}
     */
    corners;

    /** 
     * @type {Array<THREE.Object3D>}
     */
    casters;

    /** 
     * @type {THREE.Object3D}
     */
    arena;

    /**
     * Arena center point coordinates.
     * It represent the centroid of the square defined by the four corners.
     * 
     * @type {THREE.Vector3}
     */
    origin;

    /**
     * Indicates whether the arena origin needs to be recalculated.
     * 
     * @type {boolean}
     */
    isOriginOk;

    /**
     * Axes for the arena coordinate system.
     * 
     * @type {ArenaAxis}
     */
    axes;

    /**
     * Indicates whether the arena axes needs to be recalculated.
     * 
     * @type {boolean}
     */
    isAxisOk;

    /** 
     * @type {Array<Robot>}
     */
    robots;

    /**
     * Indicates the current id which the arena will give to a new robot.
     * 
     * @type {number}
     */
    robotId;

    /**
     * Creates a new Arena instance.
     *
     * @param {Array<Corner>} corners Array of exactly four {@link Corner} instances
     * defining the arena boundaries.
     *
     * @throws {Error} If corners are missing.
     * @throws {Error} If corners array does not contain exactly four elements.
     */
    constructor(corners) {
        if (corners === undefined) throw new Error("Missing arena corners");
        if (corners.length != 4) throw new Error("Corners must be of size 4 -> given `" + corners.length + "`");

        this.corners = corners;
        this.casters = [];

        this.arena = new THREE.Object3D();

        this.origin = new THREE.Vector3(0, 0, 0);
        this.isOriginOk = false;

        this.axes = {};
        this.isAxisOk = false;

        this.robots = [];
        this.robotId = 0;
    }

    /**
     * Creates all casters for each corner, it also add all axes of the mesh.
     * A caster is a mesh associated to one corner.
     */
    createCasters() {
        this.corners.forEach(c => this.casters.push(createCube(c.position, CASTER_SCALE)));
        this.casters.forEach(c => this.arena.add(c));
        this.casters.forEach(e => e.add(createAxis()));
    }

    /**
     * Retrieves all the casters mesh created.
     * 
     * @returns {Array<THREE.Object3D> | undefined} The array of all casters.
     */
    getCasters() {
        if (this.casters === undefined) {
            console.error("[ERROR] Casters are not initialized, call `createCasters()`");
            return undefined;
        }
        return this.casters;
    }

    /**
     * Retrieves the array containing all the arena corners.
     * 
     * @returns {Array<Corner>} The arena corners.
     */
    getCorners() { return this.corners; }

    /**
     * Retrieves the arena mesh.
     * 
     * @returns {THREE.Object3D} The arena mesh.
     */
    getArena() { return this.arena; }

    /**
     * Retrieves the arena origin point.
     * It is obtained by calculating the centroid of the virtual square.
     * 
     * It needs to be calculated only if one corner position is changed.
     *  
     * @returns {THREE.Vector3} The arena origin point in WCS (World Coordinate System).
     */
    getArenaOrigin() {
        if (!this.isOriginOk) this.#estimateArenaOrigin();

        return this.origin;
    }

    /**
     * Retrieves all the robots in the arena.
     * 
     * @returns {Array<Robot>} The array containing all the robots.
     */
    getRobots() { return this.robots; }

    /**
     * Calculates the arena local axis to place robot inside.
     * To find the x-axis and y-axis, calculates the distance vector between two corners
     * and normalizes the result.
     *
     * They need to be calculated only if the corner position is changed.
     *  
     * This is not generic, in fact it needs to know which one is the top left corner or
     * whic one is the top right corner etc.
     * 
     * @returns {ArenaAxis} The arena relative axes.
     */
    getArenaAxis() {
        if (this.isAxisOk) return this.axes;

        this.#estimateArenaAxis();
        return this.axes;
    }

    /**
     * Adds a robot to the arena at the given position.
     *
     * @param {THREE.Vector3} position Arena space position of the robot.
     *
     * @returns {Promise<number> | undefined} Resolves with the if of newly created Robot instance.
     */
    async addRobot(position) {
        if (position === undefined) {
            console.error("[ERROR] Robot position cannot be empty");
            return undefined;
        }

        // recalculate arena origin point if needed
        if (!this.isOriginOk) this.#estimateArenaOrigin();

        // recalculate arena axes if needed
        if (!this.isAxisOk) this.#estimateArenaAxis();

        // robot position start from arena origin point
        const robotPos = this.#calcRelativePosition(position);

        const mesh = await createRobotMesh(robotPos);
        if (mesh === undefined) {
            console.error("[ERROR] Cannot create robot mesh");
            return undefined;
        }

        const robot = new Robot(this.robotId, mesh);
        this.robotId++;

        // add the new robot to the tracked ones
        this.robots.push(robot);

        // add the new robot mesh to the arena
        this.arena.add(mesh);

        return robot.id;
    }

    /**
     * Moves the robot with the given id to the position relative to arena origin.
     * 
     * @param {number} id The robot id.
     * @param {THREE.Vector3} position The robot relative position.
     */
    moveRobot(id, position) {
        // using forEach to avoid getting the first (array[0])
        this.robots.filter(r => r.id === id)
            .forEach(r => r.mesh.position.copy(this.#calcRelativePosition(position)));
    }

    /**
     * Moves the robot with the given id by the given offset, along arena axes,
     * relative to current position.
     * 
     * @param {number} id The robot id.
     * @param {THREE.Vector3} offset The position offset along arena axes.
     */
    moveRobotByOffset(id, offset) {
        // using forEach to avoid getting the first (array[0])
        this.robots.filter(r => r.id === id)
            .forEach(r => r.mesh.position.add(this.#calcRelativeOffset(offset)));
    }

    /**
     * Retrieves the corner placed at the given location.
     * 
     * @see Location
     * 
     * @param {Location} location The corner location.
     * @returns 
     */
    #getCornerFromLocation(location) {
        if (!Location.isValid(location)) return undefined;

        return this.corners.find(c => c.location == location);
    }

    /**
     * Calculates the arena origin point coordinates in WCS.
     * The origin correspond to the centroid of the square delimited by the corners.
     */
    #estimateArenaOrigin() {
        const x = this.#calculateCentroid(this.corners.map(p => p.position.x));
        const y = this.#calculateCentroid(this.corners.map(p => p.position.y));
        const z = this.#calculateCentroid(this.corners.map(p => p.position.z));

        this.origin = new THREE.Vector3(x, y, z);
        this.isOriginOk = true;

        this.arena.position.set(this.origin.x, this.origin.y, this.origin.z);
    }

    /**
     * Calculates the arena local axis to place robot inside.
     * To find the x-axis and y-axis, calculates the vector between two corners
     * and normalizes the result.
     * 
     * This is not generic, in fact it needs to know every corner relative location
     * (for example which one is the top left corner, which one is the top right corner and so on)
     */
    #estimateArenaAxis() {
        const topLeft = this.#getCornerFromLocation(Location.TOP_LEFT);
        const topRight = this.#getCornerFromLocation(Location.TOP_RIGHT);
        const xaxis = new THREE.Vector3().subVectors(topRight.position, topLeft.position).normalize();

        const botLeft = this.#getCornerFromLocation(Location.BOT_LEFT);
        const yaxis = new THREE.Vector3().subVectors(topLeft.position, botLeft.position).normalize();

        this.axes = new ArenaAxis(xaxis, yaxis);
        this.isAxisOk = true;
    }

    /**
     * Calculates the average value of the given array.
     * 
     * @param {Array<number>} points Array of numbers.
     * @returns {number | undefined} The average of all points or undefined if the points are empty
     */
    #calculateCentroid(points) {
        if (points === undefined || points.length === 0) {
            console.error("[ERROR] points cannot be empty");
            return undefined;
        }
        if (points.length == 1) return points[0];

        // https://en.wikipedia.org/wiki/Centroid#Of_a_finite_set_of_points
        return points.reduce((acc, val, _) => acc + val) / points.length;
    }

    /**
     * Calculates the point position from WCS in arena relative coordinates.
     * All results are relative to the arena origin point.
     * 
     * @param {THREE.Vector3} point The position to evaluate.
     * @returns The point position relative to arena origin.
     */
    #calcRelativePosition(point) {
        // calculates arena origin if needed
        if (!this.isOriginOk) this.#estimateArenaOrigin();

        // calculates arena axes if needed
        if (!this.isAxisOk) this.#estimateArenaAxis();

        // robot position start from arena origin point
        const robotPos = new THREE.Vector3().copy(this.origin);

        // calculate final position using the given relative position
        const relx = new THREE.Vector3().copy(this.axes.x).multiplyScalar(point.x)
        const rely = new THREE.Vector3().copy(this.axes.y).multiplyScalar(point.y)

        return robotPos.add(relx).add(rely);
    }

    /**
     * Calculates the vector representing an offset along arena axes.
     * 
     * @param {THREE.Vector3} offset The offset vector.
     * @returns The offset vector along arena axes.
     */
    #calcRelativeOffset(offset) {
        // calculates arena axes if needed
        if (!this.isAxisOk) this.#estimateArenaAxis();

        const relOffset = new THREE.Vector3();
        const relx = new THREE.Vector3().copy(this.axes.x).multiplyScalar(offset.x)
        const rely = new THREE.Vector3().copy(this.axes.y).multiplyScalar(offset.y)

        return relOffset.add(relx).add(rely);
    }
}

export {
    Location,
    Corner,
    Arena
}