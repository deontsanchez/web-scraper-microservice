import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',

  // MongoDB configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/news_scraper',
  },

  // Kafka configuration
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'news-scraper',
    groupId: process.env.KAFKA_GROUP_ID || 'news-scraper-group',
    topics: {
      articles: 'raw-articles',
      processedArticles: 'processed-articles',
    },
  },

  // Scraper configuration
  scraper: {
    timeout: parseInt(process.env.SCRAPER_TIMEOUT || '30000', 10),
    userAgent:
      process.env.SCRAPER_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    maxConcurrency: parseInt(process.env.SCRAPER_MAX_CONCURRENCY || '5', 10),
    rateLimit: parseInt(process.env.SCRAPER_RATE_LIMIT || '1000', 10),
  },

  // Auth configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
};

export default config;
