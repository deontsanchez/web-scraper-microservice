# Web Scraper Microservice

A dynamic web scraper microservice built with Node.js and TypeScript that can scrape any website through an API endpoint.

## Features

- RESTful API for web scraping
- Handles dynamic JavaScript-rendered websites
- Rate limiting to prevent abuse
- Error handling and validation
- Returns structured data including:
  - Page title
  - Text content
  - Links
  - Meta tags
  - Images
  - Full HTML content

## Technologies

- Node.js
- TypeScript
- Express.js
- Puppeteer (for browser automation)
- Cors, Helmet (for security)
- Docker for containerization

## Installation

1. Clone the repository:

```
git clone https://github.com/yourusername/web-scraper-microservice.git
cd web-scraper-microservice
```

2. Install dependencies:

```
npm install
```

3. Create a `.env` file in the root directory:

```
PORT=3000
NODE_ENV=development
```

## Usage

### Development

```
npm run dev
```

### Production

```
npm run build
npm start
```

## Docker Deployment

### Using Docker Compose (Recommended)

1. Make sure Docker and Docker Compose are installed on your system
2. Run the application:

```
docker-compose up -d
```

3. To stop the application:

```
docker-compose down
```

### Using Docker

1. Build the Docker image:

```
docker build -t web-scraper-microservice .
```

2. Run the container:

```
docker run -p 3000:3000 -d --name web-scraper web-scraper-microservice
```

3. To stop the container:

```
docker stop web-scraper
```

## API Endpoints

### Scrape a Website

```
POST /api/scraper
```

#### Request Body

For scraping a single URL:

```json
{
  "url": "https://example.com"
}
```

For scraping multiple URLs concurrently:

```json
{
  "urls": ["https://example.com", "https://example.org", "https://example.net"]
}
```

#### Response

For a single URL:

```json
{
  "success": true,
  "data": {
    "title": "Example Domain",
    "url": "https://example.com",
    "domain": "example.com",
    "textContent": "...",
    "links": [
      {
        "text": "More information...",
        "href": "https://www.iana.org/domains/example"
      }
    ],
    "metaTags": [...],
    "images": [...],
    "htmlContent": "..."
  }
}
```

For multiple URLs:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "title": "Example Domain",
        "url": "https://example.com",
        "domain": "example.com",
        "textContent": "...",
        "links": [...],
        "metaTags": [...],
        "images": [...],
        "htmlContent": "..."
      },
      {
        "title": "Example Domain",
        "url": "https://example.org",
        "domain": "example.org",
        "textContent": "...",
        "links": [...],
        "metaTags": [...],
        "images": [...],
        "htmlContent": "..."
      }
    ],
    "errors": [
      {
        "url": "https://invalid-url.com",
        "error": "Failed to navigate to URL: net::ERR_NAME_NOT_RESOLVED"
      }
    ],
    "totalProcessed": 3,
    "successCount": 2,
    "errorCount": 1
  }
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid URL or missing parameters
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server-side error
