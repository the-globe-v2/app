import { Router } from 'express';
import { ArticleModel } from '../database/models/article';

const router = Router();

router.get('/', async (req, res) => {
    const { origin_country, date_start, date_end } = req.query;

    if (!origin_country || !date_start || !date_end) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }

    try {
        const articles = await ArticleModel.find({
            origin_country: origin_country,
            date_published: {
                $gt: new Date(date_start as string),
                $lt: new Date(date_end as string)
            }
        }).sort({ date_published: -1 });

        res.json(articles);
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;