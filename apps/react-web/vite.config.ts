import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    plugins: [
      react(),
      sentryVitePlugin({
        org: 'jsm-x9',
        project: 'javascript-react',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist', // 输出目录
      assetsDir: 'assets', // 静态资源存放目录
      assetsInlineLimit: 4096, // 资源内联阈值
      cssCodeSplit: true, // 开启css拆分
      sourcemap: false, // 开启sourcemap
      minify: 'esbuild', // 压缩工具, terser压缩率更高1%-2%,esbuild压缩更快20-40 倍
    },
    // 配置代理
    server: {
      host: '0.0.0.0',
      port: 5173,
      open: false,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
      cors: true,
    },
    esbuild: {
      /*
    打包生产环境移除 console、debugger
    https://www.cnblogs.com/guangzan/p/16633753.html
  */
      drop: mode === 'prod' ? ['console', 'debugger'] : [],
    },
  };
});
