import { Document } from 'mongoose';
import { CountryAlpha2, ISOLanguage, Category} from "./types";


export interface Article extends Document {
    title: string;
    url: string;
    description: string;
    date_published: Date;
    provider: string;
    language: ISOLanguage;
    origin_country: CountryAlpha2;
    keywords: string[];
    category: Category;
    authors?: string[];
    related_countries?: CountryAlpha2[];
    image_url?: string;
}