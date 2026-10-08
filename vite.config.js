import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cpvtsBackendApiPlugin } from './server/apiMiddleware.js';

export default defineConfig({
  plugins: [react(), cpvtsBackendApiPlugin()],
  server: {
    port: 5173,
    host: true
  }
});

