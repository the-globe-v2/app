import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ command, mode }) => {
    const config = {
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
    }

    // Apply the server proxy configuration only in development mode
    if (command === 'serve') {
        config.server = {
            proxy: {
                '/api': {
                    target: 'http://localhost:3000',
                    changeOrigin: true,
                }
            }
        }
    }

    return config
})