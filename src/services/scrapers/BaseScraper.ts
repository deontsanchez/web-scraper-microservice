import { ISource } from '../../models/Source';
import { logger } from '../../utils/logger';
import config from '../../config';

export interface ScraperResult {
  title: string;
  content: string;
  summary?: string;
  url: string;
  source: string;
  author?: string;
  publishedAt?: Date;
  imageUrl?: string;
  category?: string;
  tags?: string[];
}

export interface ScraperOptions {
  maxConcurrency?: number;
  timeout?: number;
  userAgent?: string;
  rateLimit?: number;
}

export abstract class BaseScraper {
  protected source: ISource;
  protected options: ScraperOptions;

  constructor(source: ISource, options?: ScraperOptions) {
    this.source = source;
    this.options = {
      maxConcurrency: options?.maxConcurrency || config.scraper.maxConcurrency,
      timeout: options?.timeout || config.scraper.timeout,
      userAgent: options?.userAgent || config.scraper.userAgent,
      rateLimit: options?.rateLimit || config.scraper.rateLimit,
    };
  }

  /**
   * The main scraping method that must be implemented by subclasses
   */
  abstract scrape(): Promise<ScraperResult[]>;

  /**
   * Extract date from string using various formats
   */
  protected extractDate(dateString: string | null): Date | undefined {
    if (!dateString) return undefined;

    try {
      // Try to parse the date string
      const date = new Date(dateString);

      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        return date;
      }

      return undefined;
    } catch (error) {
      logger.warn(`Failed to parse date: ${dateString}`);
      return undefined;
    }
  }

  /**
   * Sleep function for rate limiting
   */
  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanly format content by removing extra whitespace
   */
  protected cleanContent(content: string): string {
    return content.replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim();
  }
}
