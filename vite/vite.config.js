import { defineConfig } from 'vite'
import { loggerPlugin } from './loggerPlugin'

export default defineConfig({
    root: ".",
    server: {
        allowedHosts: true
    },
    plugins: [
        loggerPlugin()
    ]
})
