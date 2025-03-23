import Source, { ISource } from '../models/Source';
import { logger } from '../utils/logger';
import { ScraperFactory } from './scrapers/ScraperFactory';
import { KafkaService } from './kafka/KafkaService';

export class SourceService {
  private kafkaService: KafkaService;

  constructor(kafkaService: KafkaService) {
    this.kafkaService = kafkaService;
  }

  /**
   * Get all sources
   */
  async getAllSources(): Promise<ISource[]> {
    try {
      return await Source.find({ enabled: true });
    } catch (error) {
      logger.error('Error getting all sources:', error);
      return [];
    }
  }

  /**
   * Get source by ID
   */
  async getSourceById(id: string): Promise<ISource | null> {
    try {
      return await Source.findById(id);
    } catch (error) {
      logger.error(`Error getting source by ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Create a new source
   */
  async createSource(sourceData: Partial<ISource>): Promise<ISource | null> {
    try {
      const source = new Source(sourceData);
      await source.save();
      logger.info(`Created new source: ${source.name}`);
      return source;
    } catch (error) {
      logger.error('Error creating source:', error);
      return null;
    }
  }

  /**
   * Update a source
   */
  async updateSource(
    id: string,
    sourceData: Partial<ISource>
  ): Promise<ISource | null> {
    try {
      const source = await Source.findByIdAndUpdate(id, sourceData, {
        new: true,
      });
      if (source) {
        logger.info(`Updated source: ${source.name}`);
      }
      return source;
    } catch (error) {
      logger.error(`Error updating source ${id}:`, error);
      return null;
    }
  }

  /**
   * Delete a source
   */
  async deleteSource(id: string): Promise<boolean> {
    try {
      const result = await Source.findByIdAndDelete(id);
      if (result) {
        logger.info(`Deleted source: ${result.name}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error deleting source ${id}:`, error);
      return false;
    }
  }

  /**
   * Scrape a source and send results to Kafka
   */
  async scrapeSource(sourceId: string): Promise<number> {
    try {
      const source = await this.getSourceById(sourceId);

      if (!source || !source.enabled) {
        logger.warn(`Source ${sourceId} not found or disabled`);
        return 0;
      }

      // Get the appropriate scraper for this source
      const scraper = ScraperFactory.getScraper(source);

      // Scrape the site
      const results = await scraper.scrape();

      if (results.length === 0) {
        logger.warn(`No articles found for source: ${source.name}`);
        return 0;
      }

      // Send results to Kafka
      await this.kafkaService.sendScraperResults(results);

      // Update the last scraped timestamp
      await this.updateSource(sourceId, { lastScraped: new Date() });

      return results.length;
    } catch (error) {
      logger.error(`Error scraping source ${sourceId}:`, error);
      return 0;
    }
  }

  /**
   * Scrape all enabled sources
   */
  async scrapeAllSources(): Promise<number> {
    try {
      const sources = await this.getAllSources();
      let totalArticles = 0;

      for (const source of sources) {
        try {
          const count = await this.scrapeSource(source.id);
          totalArticles += count;
        } catch (error) {
          logger.error(`Error scraping source ${source.name}:`, error);
          // Continue with next source
        }
      }

      return totalArticles;
    } catch (error) {
      logger.error('Error scraping all sources:', error);
      return 0;
    }
  }
}
