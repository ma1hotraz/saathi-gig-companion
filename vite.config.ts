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
    build: {
      outDir: 'dist/web',
      sourcemap: false,
      target: 'es2022',
      rolldownOptions: {
        output: {
          // Stable vendor chunks cache across deploys; route chunks stay small and lazy.
          codeSplitting: {
            groups: [
              { name: 'zod-boot', test: /src[\\/]web[\\/]zodConfig/, priority: 50 },
              { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/, priority: 30 },
              { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/, priority: 20 },
              { name: 'radix', test: /node_modules[\\/]@radix-ui[\\/]/, priority: 10 },
              { name: 'zod', test: /node_modules[\\/]zod[\\/]/, priority: 10 },
            ],
          },
        },
      },
    },
    server: { port: 5173, proxy: { '/api': `http://localhost:${env.PORT || 8080}` } },
  };
});
