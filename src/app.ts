import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRoutes from './api/routes';
import { logger } from './utils/logger';
import config from './config';

const app: Application = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS handling
app.use(express.json()); // JSON parser
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(
  morgan('dev', {
    stream: {
      write: message => {
        logger.http(message.trim());
      },
    },
  })
);

// API routes
app.use('/api', apiRoutes);

// Default route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'News Scraper Microservice API',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message,
    stack: config.env === 'development' ? err.stack : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Resource not found' });
});

export default app;
