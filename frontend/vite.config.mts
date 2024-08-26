import { defineConfig } from 'vite'

export default defineConfig({
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
            'three': 'three'
        }
    },
    optimizeDeps: {
        include: ['three']
    }
})
