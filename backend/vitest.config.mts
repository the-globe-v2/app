import {defineConfig} from 'vitest/config'
import path from 'path'


export default defineConfig({
    test: {
        root: path.resolve(__dirname),
        include: ['**/*.{test,spec}.{js,ts}'],
        environment: 'node',
        coverage: {
            exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.config.*']
        }
    }
})