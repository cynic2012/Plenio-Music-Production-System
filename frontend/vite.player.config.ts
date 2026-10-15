import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// The Plenio Player: a page of its own, served by `python -m plenio.player` from plenio/player/static.
// Relative paths, so the page works from any host and port.
export default defineConfig({
  root: fileURLToPath(new URL('./src/player', import.meta.url)),
  base: './',
  plugins: [vue()],
  define: {
    __VUE_OPTIONS_API__: 'false',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
  },
  build: {
    outDir: fileURLToPath(new URL('../plenio/player/static', import.meta.url)),
    emptyOutDir: true,
    target: 'es2022',
    minify: true,
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/player-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  server: {
    proxy: { '/api': 'http://127.0.0.1:8765', '/media': 'http://127.0.0.1:8765' }
  }
})
