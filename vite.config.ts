/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Rutas relativas: funciona en GitHub Pages (usuario.github.io/Gastos/) y en cualquier hosting.
  base: './',
  plugins: [react(), tailwindcss()],
  // Firebase va en un chunk aparte que sólo se descarga si está configurado.
  build: { chunkSizeWarningLimit: 600 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
