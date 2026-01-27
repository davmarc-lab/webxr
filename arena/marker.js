import * as THREE from 'three';

class Marker {
    #id;

    #pose;

    constructor(id, pose) {
        if (id === undefined || !pose) throw new Error("Id or Pose cannot be emty");

        this.#id = id;
        this.#pose = pose;
    }

    getId() { return this.#id; }

    getBestPosition() { return new THREE.Vector3(this.#pose.bestTranslation[0], this.#pose.bestTranslation[1], -this.#pose.bestTranslation[2]); }

    getAlternativePosition() { return new THREE.Vector3(this.#pose.alternativeTranslation[0], this.#pose.alternativeTranslation[1], -this.#pose.alternativeTranslation[2]); }

    getBestRotation() {
        const r = this.#pose.bestRotation;
        return new THREE.Vector3(
            -Math.asin(-r[1][2]),
            -Math.atan2(r[0][2], r[2][2]),
            Math.atan2(r[1][0], r[1][1])
        );
    }

    getAlternativeRotation() {
        const r = this.#pose.alternativeRotation;
        return new THREE.Vector3(
            -Math.asin(-r[1][2]),
            -Math.atan2(r[0][2], r[2][2]),
            Math.atan2(r[1][0], r[1][1])
        );
    }
}

export {
    Marker
}