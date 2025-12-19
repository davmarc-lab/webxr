import config from "../config.js";

import express from 'express';
var router = express.Router();

/* GET home page. */
router.get('/', function(_req, res) {
    config.sendPage(res, "index.html");
});

export default router;

