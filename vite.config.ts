import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno desde .env y el sistema
  const env = loadEnv(mode, (process as any).cwd(), '');
  const processEnv = { ...process.env, ...env };

  return {
    plugins: [react()],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve((process as any).cwd(), '.') }
      ],
    },
    define: {
      // Polyfill para que process.env funcione en el navegador
      'process.env': JSON.stringify(processEnv),
    },
    server: {
      host: '0.0.0.0',
      port: process.env.PORT ? Number(process.env.PORT) : 3000,
      strictPort: true,
      hmr: {
        clientPort: 443,
      },
    },
  };
});