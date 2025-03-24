import { Request, Response, NextFunction } from 'express';
// Re-importing to refresh TypeScript server
import { scrapeUrl, scrapeMultipleUrls } from '../services/scraper.service';

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
    const { url, urls } = req.body;

    // Check if either URL or URLs is provided
    if (!url && !urls) {
      return res.status(400).json({
        success: false,
        message: 'Either url or urls is required',
      });
    }

    // Handle single URL case
    if (url && !urls) {
      // Validate URL format
      if (!isValidUrl(url)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid URL format',
        });
      }

      // Call scraper service for single URL
      const scrapedData = await scrapeUrl(url);

      return res.status(200).json({
        success: true,
        data: scrapedData,
      });
    }

    // Handle multiple URLs case
    if (urls) {
      // Validate that urls is an array
      if (!Array.isArray(urls)) {
        return res.status(400).json({
          success: false,
          message: 'urls must be an array',
        });
      }

      // Validate each URL in the array
      const invalidUrls = urls.filter(u => !isValidUrl(u));
      if (invalidUrls.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid URL format in urls: ${invalidUrls.join(', ')}`,
        });
      }

      // Call scraper service for multiple URLs
      const scrapedDataArray = await scrapeMultipleUrls(urls);

      return res.status(200).json({
        success: true,
        data: scrapedDataArray,
      });
    }
  } catch (error) {
    next(error);
  }
};
