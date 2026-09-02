import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// 게이트웨이(:8080)로 프록시 — 템플릿 프론트와 동일한 경로 집합
const gateway = { target: 'http://localhost:8080', changeOrigin: true, secure: false }

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: Number(process.env.PORT) || 3000,
    strictPort: false,
    proxy: {
      '/api': gateway,
      '/oauth2': gateway,
      '/login': gateway,
      '/logout': gateway,
      '/userinfo': gateway,
    },
  },
})
