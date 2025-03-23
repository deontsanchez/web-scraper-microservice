import connectToDatabase from '../utils/database';
import Source from '../models/Source';
import Article from '../models/Article';
import { ScraperFactory } from '../services/scrapers/ScraperFactory';
import { logger } from '../utils/logger';
import { ScraperResult } from '../services/scrapers/BaseScraper';

/**
 * Scrape the latest news from all enabled sources
 */
const scrapeLatestNews = async (): Promise<void> => {
  try {
    // Connect to database
    await connectToDatabase();
    logger.info('Connected to MongoDB. Starting news scraping...');

    // Get all enabled sources
    const sources = await Source.find({ enabled: true });
    logger.info(`Found ${sources.length} enabled sources to scrape`);

    // Track stats
    let totalArticles = 0;
    let newArticles = 0;

    // Get today's date at midnight to filter for today's news
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process each source
    for (const source of sources) {
      try {
        logger.info(`Scraping ${source.name}...`);

        // Create the appropriate scraper for this source
        const scraper = ScraperFactory.getScraper(source);

        // Get the articles
        const results = await scraper.scrape();

        logger.info(`Found ${results.length} articles from ${source.name}`);

        // Filter for articles published today
        const todaysArticles = results.filter((article: ScraperResult) => {
          if (!article.publishedAt) return true; // Include if no date (assume recent)
          return article.publishedAt >= today;
        });

        logger.info(`${todaysArticles.length} articles are from today`);

        // Save articles to database
        for (const articleData of todaysArticles) {
          try {
            // Check if article already exists
            const exists = await Article.findOne({
              url: articleData.url,
              source: articleData.source,
            });

            if (!exists) {
              // Create new article
              await Article.create(articleData);
              newArticles++;
            }

            totalArticles++;
          } catch (error) {
            logger.error(`Error saving article ${articleData.url}:`, error);
          }
        }

        // Update last scraped timestamp
        await Source.findByIdAndUpdate(source._id, {
          lastScraped: new Date(),
        });
      } catch (error) {
        logger.error(`Error scraping ${source.name}:`, error);
      }
    }

    logger.info(
      `Scraping complete! Processed ${totalArticles} articles, added ${newArticles} new articles.`
    );
    process.exit(0);
  } catch (error) {
    logger.error('Error in scraping process:', error);
    process.exit(1);
  }
};

// Run the scraper
scrapeLatestNews();
