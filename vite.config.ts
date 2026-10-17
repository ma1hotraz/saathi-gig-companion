import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    root: '.',
    resolve: {
      alias: {
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
        '@': fileURLToPath(new URL('./src/web', import.meta.url)),
      },
    },
    build: { outDir: 'dist/web', sourcemap: false, target: 'es2022' },
    server: { port: 5173, proxy: { '/api': `http://localhost:${env.PORT || 8080}` } },
  };
});
