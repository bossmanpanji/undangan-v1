import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        editor: resolve(__dirname, 'editor/index.html'),
        login: resolve(__dirname, 'login/index.html'),
        theme_v1: resolve(__dirname, 'themes/v1/index.html'),
        notfound: resolve(__dirname, '404.html'),
      },
    },
  },
  // Mengizinkan file statis di root tetap bisa diakses
  publicDir: 'public', 
});
