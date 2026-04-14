import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // 'electron' mode: absolute paths so React Router + Express static serving works over WiFi
  // default (GitHub Pages simulation): relative paths so dist works as a static folder
  base: mode === 'electron' ? '/' : './',
  build: {
    outDir: mode === 'electron' ? 'dist-electron' : 'dist',
  },
}))
