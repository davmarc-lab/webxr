import WebXRPolyfill from 'webxr-polyfill';

function initXr(navigator) {
    if (navigator === undefined) return undefined;

    // polyfill fallback
    if (navigator.xr == undefined)
        new WebXRPolyfill();
}

async function isSupported(xr, type) {
    return await xr.isSessionSupported(type);
}

export {
    initXr,
    isSupported
}
