/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativo permite publicar no GitHub Pages sem configurar o nome do repo
export default defineConfig({
  base: './',
  plugins: [react()],
  // o teste de variáveis CSS lê os .css como texto; sem isso o Vitest os entrega vazios
  test: { css: true },
});
