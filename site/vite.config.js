import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), {
    name: 'entrada-admin',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname === '/admin' || url.pathname === '/admin/') {
          req.url = '/admin/index.html' + url.search;
        }
        next();
      });
    }
  }],
})
