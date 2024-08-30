import express, {Request, Response} from 'express';
import config from './config';
import {connectToDatabase} from './database/connection';
import articleRoutes from './routes/articles';

const app = express();
const PORT = config.port;

app.use(express.json());

// Connect to MongoDB
connectToDatabase().then();

// Use the article routes
app.use('/api/articles', articleRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response) => {
    console.error(err.stack); // Log the error stack trace
    res.status(500).json({
        message: 'Something went wrong!',
        error: err.message
    });
});

// 404 handler for any unmatched routes
app.use((req: Request, res: Response) => {
    res.status(404).json({
        message: 'Route not found.'
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;