import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
    plugins: [vue()],
    test: {
        root: path.resolve(__dirname),
        globals: true,
        environment: 'happy-dom',
        coverage: {
            exclude: ['**/Globe.ts', '**/src/main.ts', '*config.*', '**/*.d.ts', '**/*.test.ts']
        }
    },
    resolve: {
        alias: {
            'three': 'three',
            '@': '/src'
        }
    },
    build: {
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['vue', 'three', 'gsap']
                }
            }
        }
    }
})