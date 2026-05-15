import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:9090',
      '/graphql': 'http://localhost:9090',
      '/socket.io': {
        target: 'http://localhost:9090',
        ws: true
      }
    }
  }
});
