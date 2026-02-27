import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Плагин для замены переменных окружения в HTML с дефолтными значениями
function htmlEnvPlugin(defaults: Record<string, string>): Plugin {
  return {
    name: 'html-env-plugin',
    transformIndexHtml(html, ctx) {
      const env = { ...defaults, ...ctx.server?.config.env }
      return html.replace(/%(\w+)%/g, (_, key) => env[key] || '')
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appName = env.VITE_APP_NAME || 'TaskMate'

  return {
    plugins: [
      react(),
      htmlEnvPlugin({ VITE_APP_NAME: appName }),
    ],
    define: {
      'import.meta.env.VITE_APP_NAME': JSON.stringify(appName),
    },
  }
})
