import Article, { IArticle } from '../models/Article';
import { ScraperResult } from './scrapers/BaseScraper';
import { logger } from '../utils/logger';

export class ArticleService {
  /**
   * Save a single article to the database with deduplication
   */
  async saveArticle(article: ScraperResult): Promise<IArticle | null> {
    try {
      // Check if the article already exists (deduplication)
      const existingArticle = await Article.findOne({ url: article.url });

      if (existingArticle) {
        logger.debug(`Article already exists: ${article.url}`);
        return existingArticle;
      }

      // Create a new article document
      const newArticle = new Article({
        title: article.title,
        content: article.content,
        summary: article.summary,
        url: article.url,
        source: article.source,
        author: article.author,
        publishedAt: article.publishedAt,
        imageUrl: article.imageUrl,
        category: article.category,
        tags: article.tags,
      });

      await newArticle.save();
      logger.info(`Saved new article: ${article.title}`);

      return newArticle;
    } catch (error) {
      logger.error('Error saving article:', error);
      return null;
    }
  }

  /**
   * Save multiple articles with deduplication
   */
  async saveArticles(articles: ScraperResult[]): Promise<IArticle[]> {
    const savedArticles: IArticle[] = [];

    for (const article of articles) {
      const savedArticle = await this.saveArticle(article);
      if (savedArticle) {
        savedArticles.push(savedArticle);
      }
    }

    return savedArticles;
  }

  /**
   * Find articles with filtering
   */
  async findArticles(filter: {
    source?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ articles: IArticle[]; total: number }> {
    try {
      const {
        source,
        category,
        startDate,
        endDate,
        search,
        limit = 10,
        offset = 0,
      } = filter;

      // Build query
      const query: any = {};

      if (source) {
        query.source = source;
      }

      if (category) {
        query.category = category;
      }

      if (startDate || endDate) {
        query.publishedAt = {};

        if (startDate) {
          query.publishedAt.$gte = startDate;
        }

        if (endDate) {
          query.publishedAt.$lte = endDate;
        }
      }

      if (search) {
        query.$text = { $search: search };
      }

      // Execute query
      const articles = await Article.find(query)
        .sort({ publishedAt: -1 })
        .skip(offset)
        .limit(limit);

      const total = await Article.countDocuments(query);

      return { articles, total };
    } catch (error) {
      logger.error('Error finding articles:', error);
      return { articles: [], total: 0 };
    }
  }

  /**
   * Get article by ID
   */
  async getArticleById(id: string): Promise<IArticle | null> {
    try {
      return await Article.findById(id);
    } catch (error) {
      logger.error(`Error getting article by ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Get article by URL
   */
  async getArticleByUrl(url: string): Promise<IArticle | null> {
    try {
      return await Article.findOne({ url });
    } catch (error) {
      logger.error(`Error getting article by URL ${url}:`, error);
      return null;
    }
  }
}
