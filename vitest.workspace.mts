import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
    "./frontend/vite.config.mts",
    "./backend/vitest.config.mts",
]);
