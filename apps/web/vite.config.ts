import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@chess/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@chess/chess': path.resolve(__dirname, '../../packages/chess/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    host: true,
    cors: true,
    allowedHosts: true as any,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
