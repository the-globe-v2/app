import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
    assetsInclude: ['**/*.geojson'],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            }
        }
    },
    resolve: {
        alias: {
            'three': 'three',
            '@': '/src'
        }
    },
    optimizeDeps: {
        include: ['three', 'vue']
    }
})