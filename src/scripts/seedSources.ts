import connectToDatabase from '../utils/database';
import Source from '../models/Source';
import { sampleSources } from '../data/sources';
import { logger } from '../utils/logger';

/**
 * Seed the database with sample sources
 */
const seedSources = async (): Promise<void> => {
  try {
    // Connect to database
    await connectToDatabase();

    logger.info('Connected to MongoDB. Seeding sources...');

    // Clear existing sources
    await Source.deleteMany({});

    // Insert sample sources
    const sources = await Source.insertMany(sampleSources);

    logger.info(`Successfully seeded ${sources.length} sources:`);
    sources.forEach(source => {
      logger.info(`- ${source.name}`);
    });

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding sources:', error);
    process.exit(1);
  }
};

// Run the seed function
seedSources();
