/// <reference types="vitest/config" />
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The ballistic tables live in the existing sniper project and are reused as-is.
// Override the location with SNIPER_PATH if the checkout is elsewhere.
const sniperSrc = resolve(process.env.SNIPER_PATH ?? resolve(import.meta.dirname, '../sniper'), 'src')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@sniper': sniperSrc } },
  server: { fs: { allow: ['.', sniperSrc] } },
  test: { include: ['src/**/*.test.ts'] },
})
