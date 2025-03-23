import { Request, Response } from 'express';
import { SourceService } from '../../services/SourceService';
import { KafkaService } from '../../services/kafka/KafkaService';
import { logger } from '../../utils/logger';

// Initialize services
const kafkaService = new KafkaService();
const sourceService = new SourceService(kafkaService);

/**
 * Get all sources
 */
export const getAllSources = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const sources = await sourceService.getAllSources();
    res.status(200).json({ sources });
  } catch (error) {
    logger.error('Error getting all sources:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get source by ID
 */
export const getSourceById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const sourceId = req.params.id;

    const source = await sourceService.getSourceById(sourceId);

    if (!source) {
      res.status(404).json({ message: 'Source not found' });
      return;
    }

    res.status(200).json({ source });
  } catch (error) {
    logger.error(`Error getting source by ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new source
 */
export const createSource = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const sourceData = req.body;

    // Basic validation
    if (!sourceData.name || !sourceData.url || !sourceData.selectors) {
      res
        .status(400)
        .json({ message: 'Name, URL, and selectors are required' });
      return;
    }

    const source = await sourceService.createSource(sourceData);

    if (!source) {
      res.status(400).json({ message: 'Failed to create source' });
      return;
    }

    res.status(201).json({ message: 'Source created successfully', source });
  } catch (error) {
    logger.error('Error creating source:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a source
 */
export const updateSource = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const sourceId = req.params.id;
    const sourceData = req.body;

    const source = await sourceService.updateSource(sourceId, sourceData);

    if (!source) {
      res.status(404).json({ message: 'Source not found' });
      return;
    }

    res.status(200).json({ message: 'Source updated successfully', source });
  } catch (error) {
    logger.error(`Error updating source ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a source
 */
export const deleteSource = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const sourceId = req.params.id;

    const result = await sourceService.deleteSource(sourceId);

    if (!result) {
      res.status(404).json({ message: 'Source not found' });
      return;
    }

    res.status(200).json({ message: 'Source deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting source ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Scrape a source immediately
 */
export const scrapeSource = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const sourceId = req.params.id;

    // Check if source exists
    const source = await sourceService.getSourceById(sourceId);

    if (!source) {
      res.status(404).json({ message: 'Source not found' });
      return;
    }

    // Start the scraping process asynchronously
    res.status(202).json({ message: 'Scraping process started' });

    // Continue with the scraping after responding to the client
    const count = await sourceService.scrapeSource(sourceId);

    logger.info(`Scraped ${count} articles from source ${source.name}`);
  } catch (error) {
    logger.error(`Error scraping source ${req.params.id}:`, error);
    // No need to respond here as we've already sent a response
  }
};

/**
 * Scrape all sources
 */
export const scrapeAllSources = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Start the scraping process asynchronously
    res
      .status(202)
      .json({ message: 'Scraping process started for all sources' });

    // Continue with the scraping after responding to the client
    const count = await sourceService.scrapeAllSources();

    logger.info(`Scraped ${count} articles from all sources`);
  } catch (error) {
    logger.error('Error scraping all sources:', error);
    // No need to respond here as we've already sent a response
  }
};
