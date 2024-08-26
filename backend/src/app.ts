import express from 'express';
import path from 'path';
import { sampleArticles } from './data/sampleArticles';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API routes should come first
app.get('/api/articles', (req, res) => {
    res.json(sampleArticles);
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