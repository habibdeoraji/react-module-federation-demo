import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Prod build gets served nested under /child-app/ on the shared host,
  // so its own asset URLs need that prefix baked in. Dev keeps serving
  // from its own root since it runs on its own dev server/port.
  base: mode === 'production' ? '/child-app/' : '/',
  plugins: [
    react(),
    federation({
      name: 'child_app',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.jsx',
      },
      shared: ['react', 'react-dom'],
      dts: false,
    }),
  ],
  build: {
    outDir: 'build',
  },
  server: {
    port: 5174,
    strictPort: true,
    origin: 'http://localhost:5174',
    cors: true,
  },
  preview: {
    port: 5174,
    strictPort: true,
    cors: true,
  },
}))
