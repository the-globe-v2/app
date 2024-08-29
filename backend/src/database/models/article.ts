import mongoose, { Schema } from "mongoose";
import { Article } from "../../models/article";

const articleSchema = new Schema<Article>({
    title: {type: String, required: true},
    url: {type: String, required: true, unique: true},
    description: {type: String, required: true},
    date_published: {type: Date, required: true},
    provider: {type: String, required: true},
    language: {type: String, required: true},
    origin_country: {type: String, required: true},
    keywords: {type: [String], required: true},
    category: {
        type: String,
        enum: ['POLITICS', 'ECONOMY', 'TECHNOLOGY', 'SOCIETY', 'CULTURE', 'SPORTS', 'ENVIRONMENT', 'HEALTH'],
        required: true
    },
    authors: {type: [String], required: false},
    related_countries: {type: [String], required: false},
    image_url: {type: String, required: false},
}, {collection: 'filtered_articles'});



export const ArticleModel = mongoose.model<Article>('Article', articleSchema);