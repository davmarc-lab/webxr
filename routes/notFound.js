import config from "../config.js";

import express from 'express';
var router = express.Router();

/* GET not found page. */
router.get('/*', function(_req, res) {
    config.sendPage(res, "notFound.html", 404);
});

export default router;
