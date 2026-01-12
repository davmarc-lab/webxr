import * as THREE from 'three';

const maxPixelCount = 3840 * 2160;

function resizeRenderer(renderer, camera) {
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
function flipImageVertically(image) {
    const { width, height, data } = image;
    const rowSize = width * 4;
    const temp = new Uint8ClampedArray(rowSize);
    for (let y = 0; y < Math.floor(height / 2); y++) {
        const top = y * rowSize;
        const bottom = (height - y - 1) * rowSize;

        temp.set(data.subarray(top, top + rowSize));
        data.copyWithin(top, bottom, bottom + rowSize);
        data.set(temp, bottom);
    }
    return image;
}

function snapshot(renderer, camera, scene) {
    const width = renderer.domElement.width;
    const height = renderer.domElement.height;
    const rt = new THREE.WebGLRenderTarget(width, height);

    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);

    const buffer = new Uint8Array(width * height * 4);
    renderer.readRenderTargetPixels(rt, 0, 0, width, height, buffer);

    return flipImageVertically(new ImageData(
        new Uint8ClampedArray(buffer),
        width,
        height
    ));
}

function videoSnapshot(video) {
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function evaluateMarkers(markers) {
    markers.forEach(m => {
        console.log(m.corners)
    });
}
export {
    resizeRenderer,
    flipImageVertically,
    snapshot,
    videoSnapshot,
    evaluateMarkers
}
