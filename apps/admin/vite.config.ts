import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    server: {
      port: 5174,
      strictPort: true,
    },
    define: {
      'import.meta.env.VITE_APP_NAME': JSON.stringify(
        env.VITE_APP_NAME?.trim() || 'Furniture Admin',
      ),
    },
  }
})
