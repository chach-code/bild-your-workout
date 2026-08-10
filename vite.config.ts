import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Required for GitHub Pages project site:
  // https://chach-code.github.io/bild-your-workout/
  base: '/bild-your-workout/',
})
