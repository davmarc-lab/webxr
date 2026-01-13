import * as THREE from 'three';

import { ARButton } from 'three/addons/webxr/ARButton.js';

import { AR } from 'js-aruco2'

import * as Utils from './utils.js'

function log(message) {
    fetch(`/log?${encodeURI(message)}`);
}

class RMarker {
    constructor(meshId, marker) {
        this.id = meshId;
        this.marker = marker;
    }
}

const FOV = 75;
const NEAR = 0.1;
const FAR = 100;

const maxPixelCount = 3840 * 2160;

// aruco detector
const detector = new AR.Detector({
    dictionaryName: "ARUCO"
});
let tracked = [];

// threejs context
const canvas = document.getElementById("scene");

const renderer = new THREE.WebGLRenderer({ antialias: false, canvas: canvas });
renderer.xr.enabled = true;
let xrBinding = null;

document.body.appendChild(ARButton.createButton(renderer, {
    requiredFeatures: ["camera-access"]
}));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR, FAR);
camera.position.z = 5;

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
cube.position.z = -3;
scene.add(cube);

canvas.addEventListener('resize', resizeRenderer());

function resizeRenderer() {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    let width = Math.floor(canvas.clientWidth * pixelRatio);
    let height = Math.floor(canvas.clientHeight * pixelRatio);
    const pixelCount = width * height;

    let renderScale = 1;
    if (pixelCount > maxPixelCount) {
        renderScale = Math.sqrt(maxPixelCount / pixelCount);
    }

    width = Math.floor(width * renderScale);
    height = Math.floor(height * renderScale);

    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
    }
}

const cameraScene = new THREE.Scene();
const cameraMat = new THREE.SpriteMaterial({ color: 0x00ff00 });
const cameraSprite = new THREE.Sprite(cameraMat);
cameraSprite.scale.x = 3;
cameraSprite.scale.y = 3;
cameraScene.add(cameraSprite);

let first = true;
function render(time) {
    // render scene
    renderer.render(scene, camera);

    if (renderer.info.render.frame % 100 == 0) {
        if (first) {
            first = false;
            return;
        }
        // update camera sprite texture
        let texture;
        const frame = renderer.xr.getFrame();
        const rf = renderer.xr.getReferenceSpace();
        if (frame && rf) {
            const viewPose = frame.getViewerPose(rf);
            if (viewPose) {
                const view = viewPose.views[0].camera;
                texture = renderer.xr.getCameraTexture(view);
                cameraSprite.material.map = texture;
                cameraSprite.material.needsUpdate = true;

                //-------ERROR-------
                // texture is ok, there could be a problem when rendering on another render target
                // (maybe sprite size is too small)
                // - try render only the camera scene

                // retrieve the current render target
                const oldRt = renderer.getRenderTarget();
                // retrieve the image data of the current scene state
                // render on a different render target the scene content (camera as background)
                const imageData = Utils.snapshot(renderer, camera, cameraScene);
                // restore the old render target
                renderer.setRenderTarget(oldRt);

                // detect aruco markers
                if (texture !== undefined) {
                    // debug camera image
                    cube.material.map = texture;
                    cube.material.needsUpdate = true;

                    const markers = detector.detect(imageData);
                    log("Markers found: " + markers.length);
                } else {
                    log("SKIPPING")
                }
            }
        }

    }
}

function loop(time) {
    time *= 0.001;
    render(time);
}

renderer.setAnimationLoop(loop);
