import { Request, Response } from 'express';
import { ArticleService } from '../../services/ArticleService';
import { logger } from '../../utils/logger';

// Initialize the article service
const articleService = new ArticleService();

/**
 * Get articles with filtering
 */
export const getArticles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      source,
      category,
      startDate,
      endDate,
      search,
      limit = '10',
      offset = '0',
    } = req.query;

    // Parse dates if provided
    let parsedStartDate;
    let parsedEndDate;

    if (startDate && typeof startDate === 'string') {
      parsedStartDate = new Date(startDate);
    }

    if (endDate && typeof endDate === 'string') {
      parsedEndDate = new Date(endDate);
    }

    // Parse pagination parameters
    const parsedLimit = parseInt(limit as string, 10) || 10;
    const parsedOffset = parseInt(offset as string, 10) || 0;

    const result = await articleService.findArticles({
      source: source as string,
      category: category as string,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      search: search as string,
      limit: parsedLimit,
      offset: parsedOffset,
    });

    res.status(200).json({
      articles: result.articles,
      total: result.total,
      limit: parsedLimit,
      offset: parsedOffset,
    });
  } catch (error) {
    logger.error('Error getting articles:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get article by ID
 */
export const getArticleById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const articleId = req.params.id;

    const article = await articleService.getArticleById(articleId);

    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    res.status(200).json({ article });
  } catch (error) {
    logger.error(`Error getting article by ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get article by URL
 */
export const getArticleByUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const url = req.query.url as string;

    if (!url) {
      res.status(400).json({ message: 'URL parameter is required' });
      return;
    }

    const article = await articleService.getArticleByUrl(url);

    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    res.status(200).json({ article });
  } catch (error) {
    logger.error(`Error getting article by URL ${req.query.url}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
};
