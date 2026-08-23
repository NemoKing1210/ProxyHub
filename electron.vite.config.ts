import { resolve } from 'path'
import { defineConfig, loadEnv } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    main: {
      build: {
        rollupOptions: {
          external: ['electron-store', 'conf']
        }
      },
      define: {
        'process.env.GOOGLE_OAUTH_CLIENT_ID': JSON.stringify(env.GOOGLE_OAUTH_CLIENT_ID ?? '')
      },
      resolve: {
        alias: {
          '@shared': resolve('src/shared')
        }
      }
    },
    preload: {},
    renderer: {
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src'),
          '@shared': resolve('src/shared')
        }
      },
      plugins: [react()]
    }
  }
})
