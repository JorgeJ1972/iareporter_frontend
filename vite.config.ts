import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from "vite-plugin-wasm"; // Import the plugin
import topLevelAwait from "vite-plugin-top-level-await"; // Optional, but often needed with wasm

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(), // Add the wasm plugin
    topLevelAwait() // Add topLevelAwait plugin (often needed for wasm)
  ],
  // ... other configurations if you have them
})
