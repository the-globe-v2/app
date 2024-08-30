import mongoose, {Schema} from "mongoose";
import {ArticleCollection} from "../../models/articleCollection";

const articleCollectionSchema = new Schema<ArticleCollection>({
    date: {type: String, required: true},
    countries: [{
        country: {type: String, required: true},
        count: {type: Number, required: true},
        article_urls: {type: [String], required: true}
    }],
    total_count: {type: Number, required: true}
}, {collection: 'daily_article_summary_by_country'});

export const ArticleCollectionModel = mongoose.model<ArticleCollection>('ArticleCollection', articleCollectionSchema);