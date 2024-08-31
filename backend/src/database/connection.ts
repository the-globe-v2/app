import config from "../config";
import mongoose from "mongoose";

const MONGODB_URI = config.mongodbUri;

export async function connectToDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

export async function closeDatabaseConnection() {
    await mongoose.connection.close();
}