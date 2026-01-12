import * as THREE from 'three';

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

const video = document.getElementById("video");
video.hidden = true;

// get user camera stream if available
const enableVideo = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
// const enableVideo = false;
if (enableVideo) {
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
let tracked = [];

// threejs context
const canvas = document.getElementById("scene");

const renderer = new THREE.WebGLRenderer({ antialias: false, canvas: canvas });

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR, FAR);
camera.position.z = 5;

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
cube.position.z = -2;
cube.position.x = 17.5;
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

function addMarkerToTracked(marker) {
    // add the current marker to tracked markers
    if (tracked.length == 0 && tracked.find(t => t.marker.id === marker.id) === undefined) {
        tracked.push(new RMarker(marker));
    }

    let markerSize = 35.0; //millimeters
    const pos = new POS.Posit(markerSize, canvas.width);
    let corners = marker.corners;

    // center corners
    for (let i = 0; i < corners.length; ++i) {
        let corner = corners[i];

        corners[i].x = corner.x - (canvas.width / 2);
        corners[i].y = (canvas.height / 2) - corner.y;
    }
    const pose = pos.pose(corners);
    const t = pose.bestTranslation;
    const T = pose.alternativeTranslation;
    log(t[0] + ", " + t[1]);
    log(T[0] + ", " + T[1]);

    // const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
    // const points = marker.corners.map(c => new THREE.Vector3(c.x, c.y, 1));
    // const geom = new THREE.BufferGeometry().setFromPoints(points);
    // const line = new THREE.Line(geom, material);
    // scene.add(line);
}

function render(time) {
    // render the webcam video as scene background
    let videoImage;
    if (enableVideo) {
        videoImage = Utils.videoSnapshot(video);
        scene.background = videoImage;
        scene.background.needsUpdate = true;
    } else {
        videoImage = new THREE.TextureLoader().load("marker.png", tex => {
            scene.background = tex;
            scene.background.needsUpdate = true;
        });
    }

    if (renderer.info.render.frame % 100 == 0) {
        // retrieve the current render target
        const oldRt = renderer.getRenderTarget();
        // retrieve the image data of the current scene state
        // render on a different render target the scene content (camera as background)
        const imageData = Utils.snapshot(renderer, camera, scene);
        // restore the old render target
        renderer.setRenderTarget(oldRt);

        // detect aruco markers
        const markers = detector.detect(imageData);
        console.log("Markers found: " + markers.length);
        log("Markers found: " + markers.length);

        markers.forEach(m => addMarkerToTracked(m));
    }

    // render scene
    renderer.render(scene, camera);
}

function loop(time) {
    time *= 0.001;
    render(time);
}

renderer.setAnimationLoop(loop);
