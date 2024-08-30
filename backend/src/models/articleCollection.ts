import { Document } from 'mongoose';
import { CountryAlpha2 } from "./types";

interface ArticlesByCountry extends Document {
    country: CountryAlpha2;
    count: number;
    article_urls: string[];
}

export interface ArticleCollection extends Document {
    date: string; // Formatted as "YYYY-MM-DD"
    countries: ArticlesByCountry[];
    total_count: number;
}

