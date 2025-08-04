import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        proxy: {
          //  PROXY SIMPLES - SÓ PARA RESOLVER CORS
          '/api': {
            target: 'https://staging.option7.ai',
            changeOrigin: true,
            secure: true,
            configure: (proxy, options) => {
              proxy.on('proxyReq', (proxyReq, req, res) => {
                // Simular origem correta
                proxyReq.setHeader('Origin', 'https://m.option7.ai');
                proxyReq.setHeader('Referer', 'https://m.option7.ai/');
              });
            },
          }
        }
      }
    };
});
