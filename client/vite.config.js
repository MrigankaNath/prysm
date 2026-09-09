import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  /* Honour the port the harness assigns. Vite does not read PORT on its own —
     it defaults to 5173 and increments if that is taken — so without this an
     auto-assigned port is ignored and the server lands somewhere the harness
     is not watching. Falls back to 5173, which is the port the API's CORS
     allows (server.js pins `cors({ origin: CLIENT_ORIGIN })`, defaulting
     there), so nothing changes when 5173 is free. */
  server: { port: Number(process.env.PORT) || 5173 },
  resolve: {
    // shadcn components are written against "@/..."; this is the alias they
    // assume, and keeping it means a component can be pasted in unedited.
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
