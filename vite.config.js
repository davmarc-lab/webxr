import { defineConfig } from 'vite'
import { loggerPlugin } from './loggerPlugin'

import fs from 'fs'

export default defineConfig({
    root: ".",
    server: {
        allowedHosts: true,
        // https: {
        //     key: fs.readFileSync("./localhost-key.pem"),
        //     cert: fs.readFileSync("./localhost.pem")
        // }
    },
    plugins: [
        loggerPlugin()
    ]
})
