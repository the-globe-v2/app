import dotenv from 'dotenv';

dotenv.config({path:__dirname+'/../.env'})

const config = {
    port: process.env.PORT || 3000,
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/globe_news_scraper',
    environment: process.env.NODE_ENV || 'development',
};

export default config;