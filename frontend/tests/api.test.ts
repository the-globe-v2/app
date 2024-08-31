import {describe, it, expect, vi, beforeEach} from 'vitest';
import axios from 'axios';
import {fetchArticleCollections, fetchArticles} from '../src/services/api';

vi.mock('axios');

describe('API functions', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('fetchArticleCollections', () => {
        it('fetches article collections successfully', async () => {
            const mockData = [{id: 1, title: 'Collection 1'}];
            vi.mocked(axios.get).mockResolvedValue({data: mockData});

            const result = await fetchArticleCollections('2024-01-01', '2024-01-31');

            expect(axios.get).toHaveBeenCalledWith('/api/articles/collection', {
                params: {
                    start_date: '2024-01-01',
                    end_date: '2024-01-31'
                }
            });
            expect(result).toEqual(mockData);
        });

        it('returns an empty array on error', async () => {
            vi.mocked(axios.get).mockRejectedValue(new Error('Network error'));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            });
            const result = await fetchArticleCollections('2024-01-01', '2024-01-31');

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching article collections:', expect.any(Error));
            consoleSpy.mockRestore();
        });

        it('handles various date formats correctly', async () => {
            vi.mocked(axios.get).mockResolvedValue({data: []});

            await fetchArticleCollections('2024-1-1', '2024-12-31');
            expect(axios.get).toHaveBeenCalledWith('/api/articles/collection', {
                params: {
                    start_date: '2024-1-1',
                    end_date: '2024-12-31'
                }
            });
        });
    });

    describe('fetchArticles', () => {
        it('fetches articles successfully', async () => {
            const mockData = [
                {id: 1, title: 'Article 1'},
                {id: 2, title: 'Article 2'}
            ];
            vi.mocked(axios.post).mockResolvedValue({data: mockData});

            const urls = ['http://example.com/1', 'http://example.com/2'];
            const result = await fetchArticles(urls);

            expect(axios.post).toHaveBeenCalledWith('/api/articles/batch', {urls});
            expect(result).toEqual(mockData);
        });

        it('returns an empty array on error', async () => {
            vi.mocked(axios.post).mockRejectedValue(new Error('Network error'));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            });
            const urls = ['http://example.com/1'];
            const result = await fetchArticles(urls);

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching articles:', expect.any(Error));
            consoleSpy.mockRestore();
        });

        it('handles unexpected response format', async () => {
            vi.mocked(axios.post).mockResolvedValue({data: 'Not an array'});

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            });
            const urls = ['http://example.com/1'];
            const result = await fetchArticles(urls);

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith('Unexpected response format:', 'Not an array');
            consoleSpy.mockRestore();
        });

        it('handles empty URL array', async () => {
            vi.mocked(axios.post).mockResolvedValue({data: []});

            const result = await fetchArticles([]);

            expect(axios.post).toHaveBeenCalledWith('/api/articles/batch', {urls: []});
            expect(result).toEqual([]);
        });
    });

    describe('Error handling and logging', () => {
        it('logs errors for fetchArticleCollections', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            });
            vi.mocked(axios.get).mockRejectedValue(new Error('Test error'));

            await fetchArticleCollections('2024-01-01', '2024-01-31');

            expect(consoleSpy).toHaveBeenCalledWith('Error fetching article collections:', expect.any(Error));
            consoleSpy.mockRestore();
        });

        it('logs errors for fetchArticles', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            });
            vi.mocked(axios.post).mockRejectedValue(new Error('Test error'));

            await fetchArticles(['http://example.com']);

            expect(consoleSpy).toHaveBeenCalledWith('Error fetching articles:', expect.any(Error));
            consoleSpy.mockRestore();
        });

        it('logs unexpected response format for fetchArticles', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            });
            vi.mocked(axios.post).mockResolvedValue({data: 'Unexpected format'});

            await fetchArticles(['http://example.com']);

            expect(consoleSpy).toHaveBeenCalledWith('Unexpected response format:', 'Unexpected format');
            consoleSpy.mockRestore();
        });
    });
    describe('Extended fetchArticles tests', () => {
        it('handles a large number of URLs', async () => {
            const largeUrlArray = Array(1000).fill('http://example.com');
            const mockData = largeUrlArray.map((url, index) => ({id: index, url}));
            vi.mocked(axios.post).mockResolvedValue({data: mockData});

            const result = await fetchArticles(largeUrlArray);

            expect(axios.post).toHaveBeenCalledWith('/api/articles/batch', {urls: largeUrlArray});
            expect(result).toEqual(mockData);
            expect(result.length).toBe(1000);
        });

        it('handles invalid URLs', async () => {
            const invalidUrls = ['not a url', 'http://.com', 'ftp://invalid.com'];
            vi.mocked(axios.post).mockResolvedValue({data: []});

            const result = await fetchArticles(invalidUrls);

            expect(axios.post).toHaveBeenCalledWith('/api/articles/batch', {urls: invalidUrls});
            expect(result).toEqual([]);
        });
    });

    describe('Extended fetchArticleCollections tests', () => {
        it('handles malformed date strings', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            });
            vi.mocked(axios.get).mockRejectedValue(new Error('Invalid date format'));

            const result = await fetchArticleCollections('not-a-date', '2024-13-32');

            expect(axios.get).toHaveBeenCalledWith('/api/articles/collection', {
                params: {
                    start_date: 'not-a-date',
                    end_date: '2024-13-32'
                }
            });
            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching article collections:', expect.any(Error));
            consoleSpy.mockRestore();
        });

        it('handles very long date ranges', async () => {
            const startDate = '1900-01-01';
            const endDate = '2100-12-31';
            const mockData = [{id: 1, title: 'Very old collection'}, {id: 2, title: 'Future collection'}];
            vi.mocked(axios.get).mockResolvedValue({data: mockData});

            const result = await fetchArticleCollections(startDate, endDate);

            expect(axios.get).toHaveBeenCalledWith('/api/articles/collection', {
                params: {
                    start_date: startDate,
                    end_date: endDate
                }
            });
            expect(result).toEqual(mockData);
        });
    });

    describe('API timeout scenarios', () => {
        it('handles timeout for fetchArticleCollections', async () => {
            vi.mocked(axios.get).mockRejectedValue(new Error('timeout of 5000ms exceeded'));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            });
            const result = await fetchArticleCollections('2024-01-01', '2024-01-31');

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching article collections:', expect.any(Error));
            consoleSpy.mockRestore();
        });

        it('handles timeout for fetchArticles', async () => {
            vi.mocked(axios.post).mockRejectedValue(new Error('timeout of 5000ms exceeded'));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            });
            const result = await fetchArticles(['http://example.com']);

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching articles:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
});