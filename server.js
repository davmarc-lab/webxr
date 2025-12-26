import app from "./app.js"

import express from "express"

import { createServer as createViteServer } from 'vite'

import fs from 'fs'

import https from 'https'

import indexRouter from './routes/index.js';
import notFoundRouter from './routes/notFound.js';
import logsRouter from './routes/logs.js';

// Create Vite server in middleware mode
const vite = await createViteServer({
    server: {
        middlewareMode: true,
        allowedHosts: true
    },
    // don't include Vite's default HTML handling middlewares
    appType: 'custom',
});

// Use vite's connect instance as middleware
app.use(vite.middlewares);

// app routers
app.use(indexRouter);
app.use(notFoundRouter);
app.use(logsRouter);

app.listen(3000);
console.log("Http opening port: 3000");

const options = {
    key: fs.readFileSync("./localhost-key.pem"),
    cert: fs.readFileSync("./localhost.pem")
}
const server = https.createServer(options, app);
server.listen(8080);
console.log("Https opening port: 8080");
