# News Scraper Microservice

A proof-of-concept news scraper microservice that can scrape articles from various news sources, process them through a Kafka pipeline, and store them in MongoDB.

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js with Express
- **Database**: MongoDB
- **Message Broker**: Kafka
- **Scraping**: Cheerio (static sites) and Puppeteer (JavaScript-rendered sites)

## Features

- **Flexible Scraper Module**

  - Scrapes both static and JS-rendered websites
  - Configurable selectors for different news sources
  - Rate limiting and request throttling

- **Kafka-based Data Pipeline**

  - Producer/consumer pattern
  - Deduplication of articles
  - Scalable message processing

- **RESTful API**

  - JWT-based authentication
  - Filtering by source, date, and category
  - Full CRUD operations for sources and articles

- **Monitoring**
  - Structured logging with Winston
  - Error handling and reporting

## Prerequisites

- Node.js 16 or higher
- MongoDB (local or remote)
- Kafka (local or remote)

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/news-scraper-microservice.git
   cd news-scraper-microservice
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Configure environment variables:

   ```
   cp .env.example .env
   ```

   Then edit the `.env` file with your configuration.

4. Build the project:
   ```
   npm run build
   ```

## Usage

### Development Mode

```
npm run dev
```

### Production Mode

```
npm start
```

### Seeding the Database

To seed the database with sample news sources:

```
npx ts-node src/scripts/seedSources.ts
```

## API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in and get JWT token
- `GET /api/auth/me` - Get current user info

### Articles

- `GET /api/articles` - Get articles with filtering
- `GET /api/articles/:id` - Get article by ID
- `GET /api/articles/url?url=<article-url>` - Get article by URL

### Sources

- `GET /api/sources` - Get all sources
- `GET /api/sources/:id` - Get source by ID
- `POST /api/sources` - Create a new source (admin only)
- `PUT /api/sources/:id` - Update a source (admin only)
- `DELETE /api/sources/:id` - Delete a source (admin only)
- `POST /api/sources/:id/scrape` - Scrape a specific source (admin only)
- `POST /api/sources/scrape-all` - Scrape all sources (admin only)

## Architecture

The microservice follows a clean architecture pattern:

```
src/
├── api/                  # API layer
│   ├── controllers/      # Request handlers
│   ├── middlewares/      # Express middlewares
│   └── routes/           # API routes
├── config/               # Configuration
├── data/                 # Sample data
├── models/               # Database models
├── services/             # Business logic
│   ├── consumers/        # Kafka consumers
│   ├── kafka/            # Kafka integration
│   └── scrapers/         # Web scrapers
├── scripts/              # Utility scripts
└── utils/                # Utility functions
```

## Known Limitations and Future Improvements

- Add test coverage with Jest
- Implement caching with Redis
- Add Docker containerization
- Implement more advanced content extraction
- Add sentiment analysis for articles

## License

MIT
