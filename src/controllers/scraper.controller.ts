import { Request, Response, NextFunction } from 'express';
// Re-importing to refresh TypeScript server
import { scrapeUrl } from '../services/scraper.service';

// Validate URL format
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

export const scrapeWebsite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { url } = req.body;

    // Check if URL is provided
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required',
      });
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format',
      });
    }

    // Call scraper service
    const scrapedData = await scrapeUrl(url);

    return res.status(200).json({
      success: true,
      data: scrapedData,
    });
  } catch (error) {
    next(error);
  }
};
