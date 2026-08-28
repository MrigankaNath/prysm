import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // shadcn components are written against "@/..."; this is the alias they
    // assume, and keeping it means a component can be pasted in unedited.
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
