
export interface Article {
    title: string;
    url: string;
    description: string;
    date_published: Date;
    provider: string;
    language: string;
    origin_country: string;
    keywords: string[];
    category: string;
    authors?: string[];
    related_countries: string[];
    image_url?: string;
}