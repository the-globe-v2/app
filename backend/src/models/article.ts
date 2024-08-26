import {ObjectId} from 'mongodb';

export type Category =
    'POLITICS'
    | 'ECONOMY'
    | 'TECHNOLOGY'
    | 'SOCIETY'
    | 'CULTURE'
    | 'SPORTS'
    | 'ENVIRONMENT'
    | 'HEALTH';
export type CountryAlpha2 = string;
export type LanguageAlpha2 = string;

export interface Article {
    _id: ObjectId;
    title: string;
    title_translated?: string;
    url: string;
    description: string;
    description_translated?: string;
    date_published: Date;
    provider: string;
    language?: LanguageAlpha2;
    content: string;
    origin_country: CountryAlpha2;
    keywords: string[];
    source_api: string;
    schema_version: string;
    date_scraped: Date;
    category: Category;
    authors?: string[];
    related_countries?: CountryAlpha2[];
    image_url?: string;
    post_processed: boolean;
}