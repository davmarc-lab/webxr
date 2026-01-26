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

    getBestPosition() { return new THREE.Vector3(this.#pose.bestTranslation[0], this.#pose.bestTranslation[1], this.#pose.bestTranslation[2]); }

    getAlternativePosition() { return new THREE.Vector3(this.#pose.alternativeTranslation[0], this.#pose.alternativeTranslation[1], this.#pose.alternativeTranslation[2]); }
}

export {
    Marker
}