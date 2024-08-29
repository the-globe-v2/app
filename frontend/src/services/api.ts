import axios from 'axios';

/**
 * Fetches article collections between the specified start and end dates.
 *
 * @param {string} startDate - The start date for the article collections in YYYY-MM-DD format.
 * @param {string} endDate - The end date for the article collections in YYYY-MM-DD format.
 * @returns {Promise<any[]>} A promise that resolves to an array of article collections. Returns an empty array if an error occurs.
 */
export const fetchArticleCollections = async (startDate: string, endDate: string): Promise<any[]> => {
    try {
        const response = await axios.get('/api/articles/collection', {
            params: {
                start_date: startDate,
                end_date: endDate
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching article collections:', error);
        return [];
    }
};

/**
 * Fetches articles based on a list of URLs.
 *
 * @param {string[]} urls - An array of URLs for the articles to be fetched.
 * @returns {Promise<any[]>} A promise that resolves to an array of articles. Returns an empty array if an error occurs or if the response format is unexpected.
 */
export const fetchArticles = async (urls: string[]): Promise<any[]> => {
    try {
        const response = await axios.post('/api/articles/batch', {urls});
        if (!Array.isArray(response.data)) {
            console.error('Unexpected response format:', response.data);
            return [];
        }
        return response.data;
    } catch (error) {
        console.error('Error fetching articles:', error);
        return [];
    }
};