import express from 'express';
import path from 'path';
import config from './config';
import { connectToDatabase } from './database/connection';
import articleRoutes from './routes/articles';

const app = express();
const PORT = config.port;

app.use(express.json());

// Connect to MongoDB
connectToDatabase().then();

// Use the article routes
app.use('/api/articles', articleRoutes);

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