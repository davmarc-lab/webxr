import * as THREE from 'three';

import { CASTER_SCALE, ROB_SCALE, createCube, createRobot, createAxis } from "./helper";

class Arena {
    constructor(corners) {
        if (corners === undefined) throw new Error("Missing arena corners");
        if (corners.length != 4) throw new Error("Corners must be of size 4 -> given `" + corners.length + "`");

        this.corners = corners;
        this.casters = [];
        this.arena = new THREE.Object3D();

        this.origin = new THREE.Vector3(0, 0, 0);
        this.isOriginOk = false;

        this.robots = [];
    }

    // casters are cube meshes on the area corners
    createCasters() {
        this.corners.forEach(c => this.casters.push(createCube(c, CASTER_SCALE)));
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
        if (!this.isOriginOk) return this.estimateArenaOrigin();

        return this.origin;
    }

    getRobots() { return this.robots; }

    estimateArenaOrigin() {
        if (this.isOriginOk) return this.origin;

        const x = this.#calculateCentroid(this.corners.map(p => p.x));
        const y = this.#calculateCentroid(this.corners.map(p => p.y));
        const z = this.#calculateCentroid(this.corners.map(p => p.z));

        this.origin = new THREE.Vector3(x, y, z);
        this.isOriginOk = true;
        this.arena.position.set(this.origin.x, this.origin.y, this.origin.z);

        return this.origin;
    }

    getArenaRotationMatrix(camera, width, height) {
    }

    addRobot(position, color) {
        if (position === undefined) {
            console.error("[ERROR] position cannot be empty");
            return;
        }

        // get arena origin point
        if (!this.isOriginOk) this.estimateArenaOrigin();

        // calc robot position
        const robotPos = new THREE.Vector3().addVectors(this.origin, position);

        const r = createRobot(position, ROB_SCALE);
        if (color !== undefined) {
            r.material.color = color;
        }
        r.add(createAxis());
        this.robots.push(r);

        this.arena.add(r);
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
    Arena
}