import app from './app';
import config from './config';
import { logger } from './utils/logger';
import connectToDatabase from './utils/database';
import { ArticleConsumer } from './services/consumers/ArticleConsumer';

// Handles uncaught exceptions
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handles unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Start the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Create variable at function scope level
    let articleConsumer: ArticleConsumer | null = null;

    // Only start Kafka in production
    if (config.env === 'production') {
      articleConsumer = new ArticleConsumer();
      await articleConsumer.start();
    } else {
      logger.info('Kafka disabled in development mode');
    }

    // Start Express server
    const server = app.listen(config.port, () => {
      logger.info(
        `Server running in ${config.env} mode on port ${config.port}`
      );
    });

    // Handle graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('Shutting down server...');

      // Only try to stop Kafka if it was started
      if (articleConsumer) {
        await articleConsumer.stop();
      }

      // Close server
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });

      // Force close if it takes too long
      setTimeout(() => {
        logger.error(
          'Could not close connections in time, forcefully shutting down'
        );
        process.exit(1);
      }, 10000);
    };

    // Listen for shutdown signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
