import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    plugins: [
      react(),
      federation({
        name: 'parent_host',
        remotes: {
          child_app: {
            type: 'module',
            name: 'child_app',
            // Prod: served from the same origin, under /child-app/, by the
            // one host that serves both build/ folders together.
            // Dev: child runs on its own dev server/port.
            entry: isProd
              ? '/child-app/remoteEntry.js'
              : 'http://localhost:5174/remoteEntry.js',
            entryGlobalName: 'child_app',
            shareScope: 'default',
          },
        },
        shared: ['react', 'react-dom'],
        dts: false,
      }),
    ],
    build: {
      outDir: 'build',
    },
    server: {
      port: 5173,
      strictPort: true,
      origin: 'http://localhost:5173',
      cors: true,
    },
    preview: {
      port: 5173,
      strictPort: true,
      cors: true,
    },
  }
})
