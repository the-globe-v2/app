import { Article } from '../models/article';
import { ObjectId } from 'mongodb';

export const sampleArticles: Article[] = [
    {
        _id: new ObjectId(),
        title: "Global Climate Summit Reaches Landmark Agreement",
        url: "https://example.com/climate-summit-agreement",
        description: "World leaders agree on ambitious targets to reduce carbon emissions by 2030.",
        date_published: new Date("2024-08-15T14:30:00Z"),
        provider: "Global News Network",
        language: "en",
        content: "In a historic move, representatives from 195 countries have reached a consensus on...",
        origin_country: "CH",
        keywords: ["climate change", "global warming", "carbon emissions", "international agreement"],
        source_api: "GlobalNewsScraper",
        schema_version: "1.1",
        date_scraped: new Date("2024-08-15T18:45:00Z"),
        category: "ENVIRONMENT",
        authors: ["Jane Doe", "John Smith"],
        related_countries: ["US", "CN", "IN", "BR"],
        image_url: "https://example.com/images/climate-summit.jpg",
        post_processed: true
    },
    {
        _id: new ObjectId(),
        title: "Tech Giant Unveils Revolutionary AI Assistant",
        url: "https://example.com/ai-assistant-launch",
        description: "Silicon Valley's latest AI creation promises to transform daily life.",
        date_published: new Date("2024-08-14T10:00:00Z"),
        provider: "Tech Insider",
        language: "en",
        content: "In a dazzling presentation that left the audience in awe, TechCorp unveiled its latest...",
        origin_country: "US",
        keywords: ["artificial intelligence", "technology", "AI assistant", "Silicon Valley"],
        source_api: "GlobalNewsScraper",
        schema_version: "1.1",
        date_scraped: new Date("2024-08-14T15:30:00Z"),
        category: "TECHNOLOGY",
        authors: ["Alice Johnson"],
        related_countries: ["US", "JP", "KR"],
        image_url: "https://example.com/images/ai-assistant.jpg",
        post_processed: true
    }
];