import express from 'express';
import path from 'path';
import config from "./config";
import {connectToDatabase} from "./database/connection";
import {ArticleModel} from "./database/models/article";

const app = express();
const PORT = config.port;

app.use(express.json());

// Connect to MongoDB
connectToDatabase().then();

// API routes should come first
app.get('/api/articles', async (req, res) => {
    try {
        const articles = await ArticleModel.find().limit(5);
        res.json(articles);
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// This should be the last route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

export default app;