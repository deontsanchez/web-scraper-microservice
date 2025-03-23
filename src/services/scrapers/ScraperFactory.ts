import { ISource } from '../../models/Source';
import { BaseScraper } from './BaseScraper';
import { CheerioScraper } from './CheerioScraper';
import { PuppeteerScraper } from './PuppeteerScraper';
import config from '../../config';

/**
 * Factory class to create the appropriate scraper based on the source
 */
export class ScraperFactory {
  /**
   * Get a scraper instance for the given source
   */
  static getScraper(source: ISource): BaseScraper {
    const options = {
      maxConcurrency: config.scraper.maxConcurrency,
      timeout: config.scraper.timeout,
      userAgent: config.scraper.userAgent,
      rateLimit: config.scraper.rateLimit,
    };

    // Use Puppeteer for JavaScript-rendered sites, Cheerio for static sites
    if (source.requiresJavaScript) {
      return new PuppeteerScraper(source, options);
    } else {
      return new CheerioScraper(source, options);
    }
  }
}
