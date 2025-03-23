# News Scraper Microservice

A microservice that scrapes today's headlines from major news sources:

- The New York Times (nytimes.com)
- BBC News (bbc.com/news)
- Wall Street Journal (wsj.com)

## Features

- Scrapes current news articles from predefined sources
- Filters for today's news only
- Stores articles in MongoDB
- Avoids duplicates using URL and source matching
- Supports both static pages (Cheerio) and JavaScript-rendered pages (Puppeteer)

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables by copying `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
4. Update the `.env` file with your MongoDB connection string and other settings

## Usage

### Seed news sources

Populate the database with pre-defined news sources:

```
npm run seed
```

### Scrape latest news

Run the scraper to fetch today's news from all sources:

```
npm run scrape
```

### Run the API service

Start the web service to expose APIs:

```
npm run dev
```

Or for production:

```
npm run build
npm start
```

## Configuration

The news sources are defined in `src/data/sources.ts`. Each source includes:

- Name
- URL
- CSS selectors for article elements
- Scraping frequency
- JavaScript requirements

You can modify these sources or add new ones as needed.

## Development

- **TypeScript**: The entire project is written in TypeScript
- **Express**: Provides the API interface
- **Puppeteer**: For JavaScript-rendered sites
- **Cheerio**: For static websites
- **MongoDB**: For storing articles and sources

## License

ISC
