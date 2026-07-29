import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'parent_host',
      remotes: {
        child_app: {
          type: 'module',
          name: 'child_app',
          entry: 'http://localhost:5174/remoteEntry.js',
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
})
