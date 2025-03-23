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

## API Endpoints

### Scrape a Website

```
POST /api/scraper
```

#### Request Body

```json
{
  "url": "https://example.com"
}
```

#### Response

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

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid URL or missing parameters
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server-side error
