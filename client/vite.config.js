import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
// Use VITE_API_PROXY_TARGET to override the dev proxy (e.g., http://80.225.221.245:8000).
export default defineConfig(() => {
  const target = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8000';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
        },
      },
    },
  };
});
