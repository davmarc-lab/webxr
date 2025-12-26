import config from "../config.js";

import util from 'util'

import express from 'express';
var router = express.Router();

/* GET home page. */
router.post('/logs', function(req, res, _) {
    console.log();
    console.log(util.format(req.body.message));
    console.log();
    res.sendStatus(200);
});

export default router;

