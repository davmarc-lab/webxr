import * as THREE from 'three';

import { AR } from 'js-aruco2'

import * as Utils from './utils.js'

function log(message) {
    fetch(`/log?${encodeURI(message)}`);
}

const FOV = 75;
const NEAR = 0.1;
const FAR = 100;

const maxPixelCount = 3840 * 2160;

const video = document.getElementById("video");
video.hidden = true;

// get user camera stream if available
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            facingMode: "environment"
        }
    }).then(stream => {
        video.srcObject = stream;
        video.play();
        video.onplay = _ => {
            video.classList.add("visible");
        };
    });
}

// aruco detector
const detector = new AR.Detector({
    dictionaryName: "ARUCO"
});

// threejs context
const canvas = document.getElementById("scene");

const renderer = new THREE.WebGLRenderer({ antialias: false, canvas: canvas });

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR, FAR);
camera.position.z = 5;

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

function render(time) {
    // render the webcam video as scene background
    const videoImage = Utils.videoSnapshot(video);
    scene.background = videoImage;
    scene.background.needsUpdate = true;

    if (renderer.info.render.frame % 100 == 0) {
        // retrieve the current render target
        const oldRt = renderer.getRenderTarget();
        // retrieve the image data of the current scene state
        // render on a different render target the scene content (camera as background)
        const imageData = Utils.snapshot(renderer, camera, scene);
        // restore the old render target
        renderer.setRenderTarget(oldRt);

        // detect aruco markers
        var markers = detector.detect(imageData);
        console.log("Markers found: " + markers.length);
        log("Markers found: " + markers.length);

        markers.forEach(m => {
            const corners = m.corners;
            corners.forEach(c => log(c.x + ", " + c.y));
        });
    }

    // render scene
    renderer.render(scene, camera);
}

function loop(time) {
    time *= 0.001;
    render(time);
}

renderer.setAnimationLoop(loop);
