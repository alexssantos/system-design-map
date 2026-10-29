import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativo permite publicar no GitHub Pages sem configurar o nome do repo
export default defineConfig({
  base: './',
  plugins: [react()],
});
