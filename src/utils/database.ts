import mongoose from 'mongoose';
import config from '../config';
import { logger } from './logger';

const connectToDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri);

    logger.info('Successfully connected to MongoDB');

    // Handle MongoDB connection events
    mongoose.connection.on('error', error => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export default connectToDatabase;
