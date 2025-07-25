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
          '/api/wbms': {
            target: 'https://www.wbms.com.br',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/wbms/, '/serv/apiWbms.php'),
            configure: (proxy, options) => {
              proxy.on('error', (err, req, res) => {
                console.log('proxy error', err);
              });
              proxy.on('proxyReq', (proxyReq, req, res) => {
                console.log('Sending Request to the Target:', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req, res) => {
                console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
              });
            },
          },
          // Proxy para API Option7 (resolve CORS em desenvolvimento)
          '/api': {
            target: 'http://localhost:8090',
            changeOrigin: true,
            secure: false,
            configure: (proxy, options) => {
              proxy.on('error', (err, req, res) => {
                console.log('🚨 Option7 API Proxy Error:', err.message);
              });
              proxy.on('proxyReq', (proxyReq, req, res) => {
                console.log('🚀 Option7 API Request:', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req, res) => {
                console.log('✅ Option7 API Response:', proxyRes.statusCode, req.url);
              });
            },
          }
        }
      }
    };
});
