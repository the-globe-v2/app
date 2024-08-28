import axios from 'axios';

export const fetchArticleCollections = async (startDate: string, endDate: string) => {
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


export const fetchArticles = async (urls: string[]) => {
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
}
