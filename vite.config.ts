import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // Bibliothèques lourdes dans des fichiers séparés (mis en cache indépendamment du code de l'app).
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          carte: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
});
