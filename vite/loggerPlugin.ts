import type { Plugin, ResolvedConfig } from "vite";

import { parseURL } from "ufo"

export function loggerPlugin(): Plugin {
    let config: ResolvedConfig;
    return {
        name: "logger",
        configResolved(_config) {
            config = _config;
        },
        configureServer(server) {
            server.middlewares.use("/log", (req, res) => {
                const { search } = parseURL(req.url);
                console.log(`${decodeURI(search.slice(1))}`);
                res.end();
            });
        }
    };
}
