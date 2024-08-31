# The Globe - Interactive News Visualization

The Globe is an interactive web application that visualizes global news trends on a 3D globe. Users can explore news articles from various countries, see connections between nations, and track trending topics across different regions.

![The Globe landing page](https://i.imgur.com/4e0Mu96.png)

## Features

- Interactive 3D globe visualization using Three.js
- Lets you see what countries are being talked about and by whom.
- Trending news data fetching and display
- Country selection and highlighting
- Date range selection for news articles
- Responsive design for various screen sizes
- Article summaries and related country connections

### [Try it out!](https://globe.mavial.de)

## Technology Stack

### Frontend
- Vue.js 3
- TypeScript
- Three.js for 3D globe rendering
- TailwindCSS for styling
- Vite as the build tool

### Backend
- Node.js with Express.js
- TypeScript
- MongoDB for data storage
- Mongoose as the ODM

### DevOps
- Docker for containerization
- GitHub Actions for CI/CD

## Project Structure

The project is organized into two main directories:

- `frontend/`: Contains the Vue.js application
- `backend/`: Contains the Express.js API server

## Getting Started

### Prerequisites

- Node.js (v20.17.x)
- npm or yarn
- MongoDB populated with data from:
  - [Globe News Scraper](https://github.com/the-globe-v2/news-scraper)
  - [Globe News Post Processor](https://github.com/the-globe-v2/post-processor) 

### Development Setup

1. Clone the repository:
```sh
git clone https://github.com/the-globe-v2/app
cd the-globe
```

2. Install dependencies:
```sh
npm install
```

3. Set up environment variables:
   - Create a `.env` file in the `backend/` directory
   - Add the following variables:
```yaml
PORT=3000
MONGODB_URI=mongodb://localhost:27017/globe_news_scraper
```

### Running the Application

1. Start the backend and frontend server:
```sh
npm run dev
```

2. Open your browser and navigate to `http://localhost:5173`

## Docker Deployment

To deploy the application using Docker:

1. Ensure Docker and Docker Compose are installed on your system.

2. Build and run the containers:
Set up the `docker-compose.yml` template file to your liking.
```sh
docker-compose up --build
```
3. The application will be available at `http://localhost:80`

## Technical Overview

### Frontend

The frontend is built with Vue.js 3 and uses the Composition API. It leverages Three.js for rendering the 3D globe and handling user interactions. The main components are:

- `App.vue`: The root component that orchestrates the application
- `Globe.ts`: Manages the 3D globe rendering and interactions
- `ArticleSidePanel.vue`: Displays news articles and related information
- `DateRangeSelector.vue`: Allows users to select date ranges for news articles
- `CountrySelector.vue`: Provides a dropdown for country selection

The application uses Vite for fast development and optimized production builds.

### Backend

The backend is an Express.js server written in TypeScript. It provides API endpoints for fetching news data and article summaries. Key features include:

- MongoDB integration using Mongoose for data modeling and querying
- RESTful API endpoints for article collections and individual articles
- Date range validation and query optimization

### Data Flow

1. User interacts with the globe or selects a country/date range
2. Frontend sends API requests to the backend
3. Backend queries the MongoDB database for relevant data
4. Data is sent back to the frontend and displayed on the globe or in the side panel

### Documentation
For more detailed information, please refer to the [Wiki](https://mavial.notion.site/README-2ebadd3879524291a08ca10f799f41ad?pvs=4).