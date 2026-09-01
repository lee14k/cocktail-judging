// Bundles the app for the jsdom test runner (npm test). Not used in production.
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const here = path.dirname(fileURLToPath(import.meta.url))
export default defineConfig({
  root: path.resolve(here, '..'),
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"development"' },
  build: {
    lib: { entry: path.join(here, 'entry.jsx'), formats: ['es'], fileName: 'ui' },
    outDir: path.join(here, 'out'),
    emptyOutDir: true,
    minify: false,
  },
  logLevel: 'warn',
})
