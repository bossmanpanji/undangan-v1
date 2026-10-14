import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Auto-scan semua folder tema di dalam /themes/*/index.html
function getThemeInputs() {
  const themesDir = resolve(__dirname, 'themes');
  const themeInputs = {};
  if (fs.existsSync(themesDir)) {
    const entries = fs.readdirSync(themesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const indexPath = resolve(themesDir, entry.name, 'index.html');
        if (fs.existsSync(indexPath)) {
          const safeKey = `theme_${entry.name.replace(/[^a-zA-Z0-9_]/g, '_')}`;
          themeInputs[safeKey] = indexPath;
        }
      }
    }
  }
  return themeInputs;
}

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        editor: resolve(__dirname, 'editor/index.html'),
        login: resolve(__dirname, 'login/index.html'),
        notfound: resolve(__dirname, '404.html'),
        theme_velvet_champagne: resolve(__dirname, 'themes/velvet-champagne/index.html'),
        theme_nordic_minimalist: resolve(__dirname, 'themes/nordic-minimalist/index.html'),
        ...getThemeInputs(),
      },
    },
  },
  // Mengizinkan file statis di root tetap bisa diakses
  publicDir: 'public', 
});
