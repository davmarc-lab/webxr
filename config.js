const publicRoot = "public/";
const viewRoot = "public/view";

function sendPage(handler, publicUrl, code = 200) {
    handler.status(code).sendFile(publicUrl, { root: viewRoot });
}

const config = {
    sendPage,
    viewRoot,
    publicRoot
}

export default config;

