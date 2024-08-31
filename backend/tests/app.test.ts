// tests/app.test.ts

import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';
import app from '../src/app';

vi.mock("../src/database/connection", () => ({
    connectToDatabase: vi.fn().mockResolvedValue(undefined),
    closeDatabaseConnection: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../src/database/models/article', () => ({
    ArticleModel: {
        find: vi.fn(),
    },
}));

describe('Express App', () => {
    it('should return 404 for an unknown route', async () => {
        const response = await request(app).get('/api/unknown-route');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Route not found.');
    });

    it('should return 200 for a valid article route', async () => {
        const response = await request(app).post('/api/articles/batch').send({urls: []});
        // This assumes that the article route is working and returning a status 200.
        // You may need to adjust this depending on the actual behavior of /api/articles
        expect(response.status).toBe(200);
    });
});