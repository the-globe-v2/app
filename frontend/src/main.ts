import './style.css'

interface Article {
    _id: string;
    title: string;
    description: string;
    date_published: string;
    category: string;
}

async function fetchArticles(): Promise<Article[]> {
    const response = await fetch('/api/articles');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function displayArticles(articles: Article[]) {
    const appDiv = document.querySelector<HTMLDivElement>('#app')!;

    const articleList = articles.map(article => `
        <div class="article">
            <h2>${article.title}</h2>
            <p>${article.description}</p>
            <p>Category: ${article.category}</p>
            <p>Published: ${new Date(article.date_published).toLocaleDateString()}</p>
        </div>
    `).join('');

    appDiv.innerHTML = `
        <h1>Global News Articles</h1>
        ${articleList}
    `;
}

async function init() {
    try {
        const articles = await fetchArticles();
        displayArticles(articles);
    } catch (error) {
        console.error('Failed to fetch articles:', error);
        document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
            <h1>Error</h1>
            <p>Failed to load articles. Please try again later.</p>
        `;
    }
}

init().catch(error => {
    console.error('Initialization failed:', error);
});