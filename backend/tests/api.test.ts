import request from 'supertest';
import {describe, it, expect, beforeAll, afterAll, vi, beforeEach} from 'vitest';
import app from '../src/app';
import * as databaseConnection from "../src/database/connection";
import {ArticleCollectionModel} from '../src/database/models/articleCollection';
import {ArticleModel} from '../src/database/models/article';

// Mock the entire database connection module
vi.mock("../src/database/connection", () => ({
    connectToDatabase: vi.fn().mockResolvedValue(undefined),
    closeDatabaseConnection: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../src/database/models/articleCollection', () => ({
    ArticleCollectionModel: {
        aggregate: vi.fn(),
    },
}));

vi.mock('../src/database/models/article', () => ({
    ArticleModel: {
        find: vi.fn(),
    },
}));

describe('Backend API Tests', () => {
    beforeAll(async () => {
        await databaseConnection.connectToDatabase();
    });

    afterAll(async () => {
        await databaseConnection.closeDatabaseConnection();
    });

    beforeEach(() => {
        vi.resetAllMocks();
        vi.resetModules();
    });

    describe('GET /api/articles/collection', () => {
        it('should return article collections for valid date range', async () => {
            const mockSummaries = [
                {
                    date: '2024-03-01',
                    countries: [
                        {
                            country: 'US',
                            count: 10,
                            article_urls: ['https://example.com/article1', 'https://example.com/article2']
                        }
                    ],
                    total_count: 10
                }
            ];

            vi.mocked(ArticleCollectionModel.aggregate).mockResolvedValue(mockSummaries);

            const response = await request(app)
                .get('/api/articles/collection')
                .query({start_date: '2024-03-01', end_date: '2024-03-07'});

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockSummaries);
            expect(ArticleCollectionModel.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
                {$match: expect.any(Object)},
                {$sort: {date: -1}}
            ]));
        });

        it('should return 400 for invalid date range', async () => {
            const response = await request(app)
                .get('/api/articles/collection')
                .query({start_date: '2024-03-01', end_date: '2024-03-10'}); // 9 days apart

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Date range cannot exceed 8 days.');
        });

        it('should return 400 for missing parameters', async () => {
            const response = await request(app)
                .get('/api/articles/collection')
                .query({start_date: '2024-03-01'}); // Missing end_date

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Missing required parameters.');
        });

        it('should handle empty result set', async () => {
            vi.mocked(ArticleCollectionModel.aggregate).mockResolvedValue([]);

            const response = await request(app)
                .get('/api/articles/collection')
                .query({start_date: '2024-03-01', end_date: '2024-03-02'});

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('should return 400 for invalid date format', async () => {
            const response = await request(app)
                .get('/api/articles/collection')
                .query({start_date: 'invalid-date', end_date: '2024-03-02'});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should handle database errors gracefully', async () => {
            vi.mocked(ArticleCollectionModel.aggregate).mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/articles/collection')
                .query({start_date: '2024-03-01', end_date: '2024-03-02'});

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/articles/batch', () => {
        it('should return articles for given URLs', async () => {
            const mockArticles = [
                {
                    title: 'Test Article',
                    url: 'https://example.com/article1',
                    description: 'Test Description',
                    date_published: new Date('2024-03-01').toISOString(),
                    provider: 'Test Provider',
                    language: 'en',
                    origin_country: 'US',
                    keywords: ['test', 'article'],
                    category: 'TECHNOLOGY',
                } as any,
            ];

            vi.mocked(ArticleModel.find).mockResolvedValue(mockArticles);

            const response = await request(app)
                .post('/api/articles/batch')
                .send({ urls: ['https://example.com/article1'] });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockArticles);
            expect(ArticleModel.find).toHaveBeenCalledWith({ url: { $in: ['https://example.com/article1'] } });
        });

        it('should handle empty URL array', async () => {
            vi.mocked(ArticleModel.find).mockResolvedValue([]);

            const response = await request(app)
                .post('/api/articles/batch')
                .send({urls: []});

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('should return 400 for invalid request body', async () => {
            const response = await request(app)
                .post('/api/articles/batch')
                .send({}); // Empty body

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Invalid request. Expected an array of URLs.');
        });

        it('should handle non-existent URLs', async () => {
            vi.mocked(ArticleModel.find).mockResolvedValue([]);

            const response = await request(app)
                .post('/api/articles/batch')
                .send({urls: ['https://example.com/non-existent']});

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('should handle database errors gracefully', async () => {
            vi.mocked(ArticleModel.find).mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/api/articles/batch')
                .send({urls: ['https://example.com/article1']});

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should return 404 for non-existent routes', async () => {
            const response = await request(app).get('/api/non-existent-route');

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Route not found.');
        });

        it('should handle large payload for batch article request', async () => {
            const largeUrlArray = Array(1000).fill('https://example.com/article');

            const response = await request(app)
                .post('/api/articles/batch')
                .send({urls: largeUrlArray});

            expect(response.status).toBe(206);
        });
    });

    describe('Data Integrity and Validation', () => {
        it('should return articles with all required fields', async () => {
            const mockArticle = {
                title: 'Test Article',
                url: 'https://example.com/article1',
                description: 'Test Description',
                date_published: new Date('2024-03-01'),
                provider: 'Test Provider',
                language: 'en',
                origin_country: 'US',
                keywords: ['test', 'article'],
                category: 'TECHNOLOGY',
            };

            vi.mocked(ArticleModel.find).mockResolvedValue([mockArticle]);

            const response = await request(app)
                .post('/api/articles/batch')
                .send({urls: ['https://example.com/article1']});

            expect(response.status).toBe(200);
            expect(response.body[0]).toHaveProperty('title');
            expect(response.body[0]).toHaveProperty('url');
            expect(response.body[0]).toHaveProperty('description');
            expect(response.body[0]).toHaveProperty('date_published');
            expect(response.body[0]).toHaveProperty('provider');
            expect(response.body[0]).toHaveProperty('language');
            expect(response.body[0]).toHaveProperty('origin_country');
            expect(response.body[0]).toHaveProperty('keywords');
            expect(response.body[0]).toHaveProperty('category');
        });
    });

    describe('Performance and Limit Testing', () => {
        it('should handle concurrent requests', async () => {
            const mockArticles = [{title: 'Test Article', url: 'https://example.com/article1'}];
            vi.mocked(ArticleModel.find).mockResolvedValue(mockArticles);

            const requests = Array(10).fill({}).map(() =>
                request(app)
                    .post('/api/articles/batch')
                    .send({urls: ['https://example.com/article1']})
            );

            const responses = await Promise.all(requests);

            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body).toEqual(mockArticles);
            });
        });
    });
});