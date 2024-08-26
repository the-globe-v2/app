import { Document } from 'mongoose';

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

export interface Article extends Document {
    title: string;
    url: string;
    description: string;
    date_published: Date;
    provider: string;
    language: LanguageAlpha2;
    origin_country: CountryAlpha2;
    keywords: string[];
    category: Category;
    authors?: string[];
    related_countries?: CountryAlpha2[];
    image_url?: string;
}