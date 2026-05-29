
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['iLovePDF2-bg-removed.png'],
        manifest: {
          name: "TA'ANG LAND IMG TIQR",
          short_name: "TIQR System",
          description: "Ta'ang Land Immigration Image QR Code System",
          theme_color: '#0f172a',
          background_color: '#000000',
          display: 'standalone',
          icons: [
            {
              src: 'iLovePDF2-bg-removed.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'iLovePDF2-bg-removed.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'iLovePDF2-bg-removed.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          bypass: (req) => {
            if (req.url && req.url.includes('.ts')) {
              return req.url;
            }
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
    }
  };
});
