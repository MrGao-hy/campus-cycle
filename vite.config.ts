import { defineConfig } from 'vite';
import { resolve } from 'path';
import uni from '@uni-helper/plugin-uni';
import UniPages from '@uni-helper/vite-plugin-uni-pages';
import { useUniPages } from './src/composables';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [UniPages(useUniPages), uni()],
    resolve: {
        alias: {
            // uni-helper 类型包（uni-types / uni-app-types）的 exports 只有
            // types 条件、无运行时入口；本地组件库有非 type 写法的 import 会解析失败，
            // 统一指到空模块（这些 import 实际都是类型用途，运行时不需要导出）
            '@uni-helper/uni-types': resolve(__dirname, 'src/uni-helper-stub.mjs'),
            '@uni-helper/uni-app-types': resolve(
                __dirname,
                'src/uni-helper-stub.mjs'
            ),
            '@': resolve(__dirname, 'src'),
        },
    },
    server: {
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: 'http://localhost:9000',
                changeOrigin: true,
                rewrite: path => path.replace(/^\/api/, ''),
            },
        },
    },
            
});
