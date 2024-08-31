import {describe, it, expect, vi, beforeEach} from 'vitest';
import {mount, VueWrapper} from '@vue/test-utils';
import ArticleSidePanel from '../src/components/ArticleSidePanel.vue';
import {fetchArticleCollections, fetchArticles} from '../src/services/api';

vi.mock('../src/services/api');

describe('ArticleSidePanel', () => {
    let wrapper: VueWrapper<any>;
    const mockProps = {
        isOpen: true,
        country: 'Germany',
        countryCode: 'DE',
        dateStart: '2024-03-01',
        dateEnd: '2024-03-31',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        wrapper = mount(ArticleSidePanel, {props: mockProps});
    });

    it('renders correctly when open', () => {
        expect(wrapper.find('.fixed').classes()).toContain('translate-x-0');
        expect(wrapper.find('h2').text()).toBe('Trending in Germany');
    });

    it('renders correctly when closed', async () => {
        await wrapper.setProps({isOpen: false});
        expect(wrapper.find('.fixed').classes()).toContain('translate-x-[120%]');
    });

    it('emits close event when close button is clicked', async () => {
        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('displays loading spinner when fetching data', async () => {
        wrapper.vm.loading = true;
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.animate-spin').exists()).toBe(true);
    });

    it('displays error message when there is an error', async () => {
        wrapper.vm.error = 'Error fetching data';

        setTimeout(() => {
            wrapper.vm.loading = false;
        }, 100);

        await waitForLoadingToFinish(wrapper);

        await wrapper.vm.$nextTick();
        expect(wrapper.find('.text-red-600').text()).toBe('Error fetching data');
    });

    it('displays informational message when there is a message', async () => {
        wrapper.vm.message = 'No articles found';
        wrapper.vm.loading = true;

        setTimeout(() => {
            wrapper.vm.loading = false;
        }, 100);

        await waitForLoadingToFinish(wrapper);

        await wrapper.vm.$nextTick();
        expect(wrapper.find('.font-semibold.text-gray-800').text()).toBe('No articles found');
    });

    it('fetches article collections on mount', () => {
        expect(fetchArticleCollections).toHaveBeenCalledWith('2024-03-01', '2024-03-31');
    });

    it('fetches articles for country when country code changes', async () => {
        const mockCollections = [{countries: [{country: 'DE', article_urls: ['url1', 'url2']}]}];
        vi.mocked(fetchArticleCollections).mockResolvedValue(mockCollections);
        vi.mocked(fetchArticles).mockResolvedValue([{url: 'url1', title: 'Article 1'}]);

        await wrapper.vm.updateArticles();
        expect(fetchArticles).toHaveBeenCalledWith(['url1', 'url2']);
        expect(wrapper.vm.loadedArticles).toHaveLength(1);
    });

    it('handles article click correctly', async () => {
        const mockArticle = {url: 'url1', title: 'Article 1', related_countries: ['DE', 'ES']};
        wrapper.vm.loadedArticles = [mockArticle];

        setTimeout(() => {
            wrapper.vm.loading = false;
        }, 100);

        await waitForLoadingToFinish(wrapper);

        await wrapper.vm.$nextTick();

        await wrapper.find('.h-full .flex .flex-col').trigger('click');
        expect(wrapper.emitted('article-selected')).toBeTruthy();
        expect(wrapper.emitted('update-related-countries')).toBeTruthy();
        expect(wrapper.vm.selectedArticleUrl).toBe('url1');

        // Click the same article again to deselect
        await wrapper.find('.h-full .flex .flex-col').trigger('click');
        expect(wrapper.vm.selectedArticleUrl).toBeNull();
    });

    it('handles no articles loading correctly', async () => {
        wrapper.vm.loadedArticles = [];

        setTimeout(() => {
            wrapper.vm.loading = false;
        }, 100);

        await waitForLoadingToFinish(wrapper);
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.text-gray-800.text-center.pt-10').text()).toBe('No articles found for in the selected date range.');

    });

    it('truncates text correctly', () => {
        const longText = 'This is a very long text that needs to be truncated';
        expect(wrapper.vm.truncateText(longText, 20)).toBe('This is a very long...');
        expect(wrapper.vm.truncateText(longText, 20, true)).toBe('This is a very long...');
        expect(wrapper.vm.truncateText('Short text', 20, true)).toBe('Short text');
    });

    it('formats date correctly', () => {
        const date = new Date('2024-03-15');
        expect(wrapper.vm.formatDate(date)).toBe('Mar 15');
    });

    it('gets correct country flag URL', () => {
        expect(wrapper.vm.getCountryFlag('DE')).toBe('https://purecatamphetamine.github.io/country-flag-icons/3x2/DE.svg');
        expect(wrapper.vm.getCountryFlag('')).toBe('/src/assets/planet-earth-flag.jpg');
    });

    /**
     * Utility function to poll `loading` state, since it's artificially longer than the actual article fetching
     *
     * @param {VueWrapper} wrapper - The VueWrapper instance to check
     * @returns {Promise<void>}
     */
    async function waitForLoadingToFinish(wrapper: VueWrapper<any>): Promise<void> {
        while (wrapper.vm.loading) {
            await new Promise(resolve => setTimeout(resolve, 50));
            await wrapper.vm.$nextTick();
        }
    }
});


describe('Article cache functionality', () => {
    let wrapper: VueWrapper<any>;

    const mockProps = {
        isOpen: true,
        country: 'Germany',
        countryCode: 'DE',
        dateStart: '2024-03-01',
        dateEnd: '2024-03-31',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        wrapper = mount(ArticleSidePanel, {
            props: mockProps
        });
    });

    it('fetches articles from API only if not cached', async () => {
        // Mock the API response
        const mockCollections = [{countries: [{country: 'DE', article_urls: ['url1']}]}];
        const mockArticleData = [{
            title: 'Article 1',
            url: 'url1',
            description: 'Description 1',
            date_published: new Date(),
            provider: 'Provider 1',
            language: 'DE',
            origin_country: 'DE',
            keywords: ['key1', 'key2'],
            category: 'Category 1',
            related_countries: ['DE', 'ES'],
            image_url: 'https://example.com/image1.jpg'
        }];
        vi.mocked(fetchArticleCollections).mockResolvedValue(mockCollections);
        vi.mocked(fetchArticles).mockResolvedValue(mockArticleData);

        await wrapper.vm.updateArticles();
        expect(fetchArticles).toHaveBeenCalledWith(['url1']);
        expect(wrapper.vm.loadedArticles).toHaveLength(1);

        // Second fetch with the same URLs - should use the cache
        await wrapper.vm.fetchArticlesForCountry();
        expect(fetchArticles).toHaveBeenCalledTimes(1); // Still only one call overall, no new fetches
    });

    it('updates cache with new articles', async () => {
        // Setup for two sets of articles
        const initialUrls = ['url1', 'url2'];
        const newUrls = ['url3']; // New article not in cache
        const initialArticles = [
            {
                title: 'Article 1',
                url: 'url1',
                description: 'Desc 1',
                date_published: new Date(),
                provider: 'Provider 1',
                language: 'DE',
                origin_country: 'DE',
                keywords: ['key1', 'key2'],
                category: 'SOCIETY',
                related_countries: ['DE'],
                image_url: 'https://example.com/image1.jpg'
            },
            {
                title: 'Article 2',
                url: 'url2',
                description: 'Desc 2',
                date_published: new Date(),
                provider: 'Provider 2',
                language: 'DE',
                origin_country: 'DE',
                keywords: ['key3', 'key4'],
                category: 'POLITICS',
                related_countries: ['DE'],
                image_url: 'https://example.com/image2.jpg'
            }
        ];
        const newArticles = [
            {
                title: 'Article 3',
                url: 'url3',
                description: 'Desc 3',
                date_published: new Date(),
                provider: 'Provider 3',
                language: 'DE',
                origin_country: 'DE',
                keywords: ['key5'],
                category: 'SPORTS',
                related_countries: ['DE'],
                image_url: 'https://example.com/image3.jpg'
            }
        ];

        // Mock the API responses
        const mockCollections = [
            { countries: [{ country: 'DE', article_urls: initialUrls.concat(newUrls) }] }
        ];
        vi.mocked(fetchArticleCollections).mockResolvedValue(mockCollections);
        vi.mocked(fetchArticles).mockResolvedValueOnce(initialArticles);

        // Fetch collections and initial articles
        await wrapper.vm.updateArticles();

        // Access the exposed articleCache
        const articleCache = wrapper.vm.articleCache as Map<string, any>;

        expect(articleCache.size).toBe(2); // Cache should have two articles

        // Subsequent fetch with a new article URL
        vi.mocked(fetchArticles).mockResolvedValueOnce(newArticles);
        await wrapper.vm.fetchArticlesForCountry();

        expect(articleCache.size).toBe(3); // Cache should now include the new article
        expect(fetchArticles).toHaveBeenLastCalledWith(['url3']); // Only fetch the new URL

        // Verify the content of the cache
        expect(articleCache.get('url1')).toEqual(initialArticles[0]);
        expect(articleCache.get('url2')).toEqual(initialArticles[1]);
        expect(articleCache.get('url3')).toEqual(newArticles[0]);
    });
});

