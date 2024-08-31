import {Router} from 'express';
import {ArticleModel} from '../database/models/article';
import {ArticleCollectionModel} from '../database/models/articleCollection';

const router = Router();

router.get('/collection', async (req, res) => {
    const {start_date, end_date} = req.query;

    if (!start_date || !end_date) {
        return res.status(400).json({error: 'Missing required parameters.'});
    }

    try {
        const startDate = new Date(start_date as string);
        const endDate = new Date(end_date as string);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({error: 'Invalid date format.'});
        }

        // Check if the date range exceeds 8 days
        const diffInTime = endDate.getTime() - startDate.getTime();
        const diffInDays = diffInTime / (1000 * 3600 * 24);

        if (diffInDays > 8) {
            return res.status(400).json({error: 'Date range cannot exceed 8 days.'});
        }

        const match = {
            date: {
                $gte: startDate.toISOString().split('T')[0],
                $lte: endDate.toISOString().split('T')[0]
            }
        };

        const summaries = await ArticleCollectionModel.aggregate([
            {$match: match},
            {$sort: {date: -1}}
        ]);

        res.json(summaries);
    } catch (error) {
        console.error('Error fetching article summaries:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.post('/batch', async (req, res) => {
    const {urls} = req.body;

    if (!urls || !Array.isArray(urls)) {
        return res.status(400).json({error: 'Invalid request. Expected an array of URLs.'});
    }

    const limitedUrls = urls.slice(0, 100);  // Limit batch size to 100 URLs

    try {
        const articles = await ArticleModel.find({url: {$in: limitedUrls}});
        res.status(limitedUrls.length == urls.length ? 200 : 206).json(articles ? articles : []);
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

export default router;