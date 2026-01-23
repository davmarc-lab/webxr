import * as THREE from 'three';

import { Robot } from './robot'

import { CASTER_SCALE, createCube, createRobotMesh, createAxis, getScreenCoords } from "./helper";

class Location {
    static TOP_LEFT = "Top Left";
    static TOP_RIGHT = "Top Right";
    static BOT_LEFT = "Bot Left";
    static BOT_RIGHT = "Bot Right";

    static isValid(location) {
        return [this.TOP_LEFT, this.TOP_RIGHT, this.BOT_LEFT, this.BOT_RIGHT].includes(location);
    }
};

class Corner {
    constructor(position, location) {
        if (!position.isVector3) throw new Error("The given position must be a `THREE.Vector3`");
        this.position = position;

        if (!Location.isValid(location)) throw new Error("The given location is not valid (it must be of type `Location`)");
        this.location = location;
    }
}

class Arena {
    constructor(corners) {
        if (corners === undefined) throw new Error("Missing arena corners");
        if (corners.length != 4) throw new Error("Corners must be of size 4 -> given `" + corners.length + "`");

        this.corners = corners;
        this.casters = [];
        this.arena = new THREE.Object3D();

        this.origin = new THREE.Vector3(0, 0, 0);
        this.isOriginOk = false;

        this.axis = {};
        this.isAxisOk = false;

        this.robots = [];
        this.robotId = 0;
    }

    // casters are cube meshes on the area corners
    createCasters() {
        this.corners.forEach(c => this.casters.push(createCube(c.position, CASTER_SCALE)));
        this.casters.forEach(c => this.arena.add(c));
        this.casters.forEach(e => e.add(createAxis()));
    }

    getCasters() {
        if (this.casters === undefined) {
            console.error("Casters are not initialized, call `createCasters()`");
        }
        return this.casters;
    }

    getCorners() { return this.corners; }

    getArena() { return this.arena; }

    getArenaOrigin() {
        if (!this.isOriginOk) return this.#estimateArenaOrigin();

        return this.origin;
    }

    getRobots() { return this.robots; }

    /**
     * Calculates the arena local axis to place robot inside.
     * To find the x-axis and y-axis, calculates the distance vector between two corners
     * and normalizes the result.
     * 
     * This is not generic, in fact it needs to know whic is the left corner or
     * 
     * @param {*} camera 
     * @param {*} width 
     * @param {*} height 
     * @returns 
     */
    getArenaAxis(camera, width, height) {
        if (this.isAxisOk) return this.axis;

        this.#estimateArenaAxis();
        return this.axis;
    }

    async addRobot(position, color) {
        if (position === undefined) {
            console.error("[ERROR] position cannot be empty");
            return;
        }

        // get arena origin point
        if (!this.isOriginOk) this.#estimateArenaOrigin();

        if (!this.isAxisOk) this.#estimateArenaAxis();

        // robot position start from arena origin point
        const robotPos = new THREE.Vector3().copy(this.origin);

        // calculate final position using the given relative position
        const relx = new THREE.Vector3().copy(this.axis.x).multiplyScalar(position.x)
        const rely = new THREE.Vector3().copy(this.axis.y).multiplyScalar(position.y)
        robotPos.add(relx).add(rely);

        const r = await createRobotMesh(robotPos);
        if (r === undefined) {
            console.error("Cannot create robot");
            return;
        }

        this.robots.push(new Robot(this.robotId, r));

        this.arena.add(r);
    }

    #getCornerFromLocation(location) {
        if (!Location.isValid(location)) return undefined;

        return this.corners.find(c => c.location == location);
    }

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

        this.axis = {
            x: xaxis,
            y: yaxis
        };
        this.isAxisOk = true;
    }

    #calculateCentroid(points) {
        if (points.length < 0) {
            console.error("[ERROR] points cannot be empty");
            return undefined;
        }
        if (points.length == 1) return points[0];

        // https://en.wikipedia.org/wiki/Centroid#Of_a_finite_set_of_points
        return points.reduce((acc, val, _) => acc + val) / points.length;
    }
}

export {
    Location,
    Corner,
    Arena
}