import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения (включая VITE_API_URL на Vercel)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          // На компе будет работать localhost:3001, в интернете — ссылка от Railway
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  }
})