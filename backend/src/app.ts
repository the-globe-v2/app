import express, {Request, Response, NextFunction} from 'express';
import config from './config';
import {connectToDatabase} from './database/connection';
import articleRoutes from './routes/articles';

const app = express();
const PORT = config.port;

app.use(express.json());

// Connect to MongoDB
connectToDatabase().then(() => {
    console.log("Connected to the database");
}).catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1); // Exit the application if the database connection fails
});

// Use the article routes
app.use('/api/articles', articleRoutes);

app.use('/error', () => {
    throw new Error('Woopsie!');
});

// 404 handler for any unmatched routes
app.use((req: Request, res: Response) => {
    res.status(404).json({
        message: 'Route not found.',
    });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response) => {
    console.error(err);
    res.status(500).send({errors: [{message: "Something went wrong"}]});
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
