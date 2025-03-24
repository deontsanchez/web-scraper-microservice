import puppeteer from 'puppeteer';
import { getRandomUserAgent, extractDomain } from '../utils/scraper.utils';
import logger from '../utils/logger';
import os from 'os';

// Define interfaces for scraped data
interface ScrapedImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

interface ScrapedData {
  title: string;
  url: string;
  domain: string;
  textContent: string;
  images: ScrapedImage[];
  paywallDetected: boolean;
}

interface ScraperError {
  url: string;
  error: string;
}

interface MultiScrapeResult {
  results: ScrapedData[];
  errors?: ScraperError[];
  totalProcessed: number;
  successCount: number;
  errorCount: number;
}

/**
 * Scrape content from a URL using Puppeteer
 * @param url - The URL to scrape
 * @returns Object containing scraped data
 */
export const scrapeUrl = async (url: string): Promise<ScrapedData> => {
  let browser;
  logger.info(`Starting to scrape URL: ${url}`);

  try {
    // Launch browser
    logger.info(`Launching headless browser`);
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    logger.info(`Browser launched successfully`);

    // Open new page
    logger.info(`Opening new browser page`);
    const page = await browser.newPage();
    logger.info(`Browser page opened successfully`);

    // Set random user agent
    const userAgent = getRandomUserAgent();
    logger.info(`Setting user agent: ${userAgent}`);
    await page.setUserAgent(userAgent);

    // Set viewport
    logger.info(`Setting viewport dimensions: 1280x800`);
    await page.setViewport({ width: 1280, height: 800 });

    // Setup dialog handling (auto-dismiss alerts, confirms, prompts)
    logger.info(`Setting up dialog handler to auto-dismiss dialogs`);
    page.on('dialog', async dialog => {
      logger.info(
        `Dialog detected: ${dialog.type()} with message: ${dialog.message()}`
      );
      await dialog.dismiss();
      logger.info(`Dialog dismissed successfully`);
    });

    // Navigate to URL
    logger.info(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    logger.info(`Navigation to ${url} completed`);

    // Try to handle common cookie banners and popups
    logger.info(`Attempting to handle cookie banners and popups`);
    try {
      // Common cookie consent selectors
      const cookieSelectors = [
        '[id*="cookie"] button',
        '[class*="cookie"] button',
        '[id*="consent"] button',
        '[class*="consent"] button',
        '[id*="gdpr"] button',
        '[class*="gdpr"] button',
        'button[aria-label*="cookie" i]',
        'button[aria-label*="accept" i]',
      ];

      // Try clicking elements that might dismiss popups
      for (const selector of cookieSelectors) {
        if ((await page.$(selector)) !== null) {
          logger.info(`Found cookie banner element with selector: ${selector}`);
          await page
            .click(selector)
            .catch(err =>
              logger.info(`Could not click: ${selector}`, { error: err })
            );
          logger.info(`Clicked cookie banner element: ${selector}`);
          // Wait a short time after clicking
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      logger.info(`Completed cookie banner and popup handling`);
    } catch (error) {
      logger.warn('Error handling cookie banners', { error });
      // Continue execution even if banner handling fails
    }

    // Detect paywalls
    logger.info(`Checking for paywalls`);
    const hasPaywall = await page.evaluate(() => {
      // Text-based detection in body
      const bodyText = document.body.textContent?.toLowerCase() || '';
      const paywallPhrases = [
        'subscribe to continue',
        'subscription required',
        'premium article',
        'subscribe now to read',
        'to continue reading',
        'create an account to',
        'sign up to read',
        'members only',
        'paid subscribers only',
      ];

      if (paywallPhrases.some(phrase => bodyText.includes(phrase))) {
        return true;
      }

      // CSS selector-based detection
      if (
        document.querySelector(
          '.paywall, .subscription-wall, .premium-wall, [data-paywall]'
        )
      ) {
        return true;
      }

      if (
        document.querySelector(
          '.subscribe, .subscription, .create-account, .register'
        )
      ) {
        return true;
      }

      // Overlay detection
      const overlays = Array.from(
        document.querySelectorAll('div, section')
      ).filter(el => {
        const style = window.getComputedStyle(el);
        return (
          (style.position === 'fixed' || style.position === 'absolute') &&
          style.zIndex !== 'auto' &&
          parseInt(style.zIndex, 10) > 1000 &&
          (parseInt(style.width, 10) > window.innerWidth * 0.5 ||
            parseInt(style.height, 10) > window.innerHeight * 0.5)
        );
      });

      for (const overlay of overlays) {
        const text = overlay.textContent?.toLowerCase() || '';
        const paywallTerms = [
          'subscribe',
          'sign up',
          'register',
          'premium',
          'account',
          'continue reading',
        ];

        if (paywallTerms.some(term => text.includes(term))) {
          return true;
        }
      }

      return false;
    });

    if (hasPaywall) {
      logger.info(
        `Paywall detected on ${url}, but continuing to scrape content`
      );
    } else {
      logger.info(`No paywall detected on ${url}`);
    }

    // Get page title
    logger.info(`Extracting page title`);
    const title = await page.title();
    logger.info(`Page title extracted: "${title}"`);

    // Get all text content
    logger.info(`Extracting page text content`);
    const textContent = await page.evaluate(() => document.body.innerText);
    logger.info(`Text content extracted (${textContent.length} characters)`);

    // Get images
    logger.info(`Extracting and filtering images`);
    const images = await page.evaluate(() => {
      // Find all images
      const allImages = Array.from(document.querySelectorAll('img'));

      // Filter out ad images based on common patterns
      const filteredImages = allImages.filter(img => {
        const src = img.src.toLowerCase();
        const alt = (img.alt || '').toLowerCase();
        const classes = img.className.toLowerCase();
        const id = img.id.toLowerCase();

        // Check parent elements for ad-related attributes
        let parent = img.parentElement;
        let isInAdContainer = false;
        let depth = 0;

        // Check up to 3 levels of parent elements for ad containers
        while (parent && depth < 3) {
          const parentClasses = parent.className.toLowerCase();
          const parentId = parent.id.toLowerCase();

          if (
            parentClasses.match(/ad(s|vert|vertisement)?[-_]?/i) ||
            parentId.match(/ad(s|vert|vertisement)?[-_]?/i) ||
            parent.getAttribute('data-ad') ||
            parent.getAttribute('data-advertisement') ||
            parent.getAttribute('data-adunit')
          ) {
            isInAdContainer = true;
            break;
          }

          parent = parent.parentElement;
          depth++;
        }

        // Check if the image is likely an ad
        const isLikelyAd =
          // Image from ad networks or with ad-related URLs
          src.includes('/ads/') ||
          src.includes('/adserver/') ||
          src.includes('/advert') ||
          src.includes('/doubleclick.') ||
          src.includes('pagead') ||
          src.includes('google.com/ads') ||
          src.includes('googleads') ||
          src.includes('cloudfront.net/ads') ||
          // Image with ad-related alt text
          alt.includes('advertisement') ||
          alt.includes('sponsor') ||
          // Image with ad-related classes or IDs
          classes.match(/ad(s|vert|vertisement)?[-_]?/i) ||
          id.match(/ad(s|vert|vertisement)?[-_]?/i) ||
          // Check size for banner-like dimensions
          (img.width > 300 && img.height < 100) ||
          // In an ad container
          isInAdContainer;

        // Keep images that aren't likely ads
        return !isLikelyAd;
      });

      return filteredImages.map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height,
      }));
    });
    logger.info(`Found ${images.length} non-advertisement images`);

    const results = {
      title,
      url,
      domain: extractDomain(url),
      textContent,
      images,
      paywallDetected: hasPaywall,
    };

    logger.info(`Scraping of ${url} completed successfully`, {
      domain: results.domain,
      imageCount: images.length,
      textLength: textContent.length,
      paywallDetected: hasPaywall,
    });

    return results;
  } catch (error) {
    logger.error(`Failed to scrape ${url}`, { error });
    throw new Error(
      `Failed to scrape ${url}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  } finally {
    // Close browser
    if (browser) {
      logger.info(`Closing browser`);
      await browser.close();
      logger.info(`Browser closed successfully`);
    }
  }
};

/**
 * Scrape content from multiple URLs concurrently
 * @param urls - Array of URLs to scrape
 * @returns Array of objects containing scraped data
 */
export const scrapeMultipleUrls = async (
  urls: string[]
): Promise<MultiScrapeResult> => {
  logger.info(`Starting to scrape multiple URLs: ${urls.length} URLs provided`);

  // Calculate optimal concurrency based on available CPU cores
  // Use 75% of available cores to avoid system overload
  const cpuCount = os.cpus().length;
  const concurrencyLimit = Math.max(1, Math.floor(cpuCount * 0.75));
  logger.info(
    `Using concurrency limit of ${concurrencyLimit} based on ${cpuCount} CPU cores`
  );

  // Create batches of URLs to process
  const results: ScrapedData[] = [];
  const errors: ScraperError[] = [];

  // Process URLs in batches with concurrency limit
  for (let i = 0; i < urls.length; i += concurrencyLimit) {
    const batch = urls.slice(i, i + concurrencyLimit);
    logger.info(
      `Processing batch of ${batch.length} URLs (${i + 1} to ${Math.min(
        i + concurrencyLimit,
        urls.length
      )} of ${urls.length})`
    );

    // Process each URL in the batch concurrently
    const batchPromises = batch.map(async batchUrl => {
      try {
        return await scrapeUrl(batchUrl);
      } catch (error) {
        logger.error(
          `Error scraping URL ${batchUrl}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        errors.push({
          url: batchUrl,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return null;
      }
    });

    // Wait for all promises in the batch to resolve
    const batchResults = await Promise.all(batchPromises);

    // Filter out null results (errors) and add to results array
    results.push(...batchResults.filter(result => result !== null));
  }

  logger.info(
    `Completed scraping ${urls.length} URLs. Successfully scraped: ${results.length}, Errors: ${errors.length}`
  );

  return {
    results,
    errors: errors.length > 0 ? errors : undefined,
    totalProcessed: urls.length,
    successCount: results.length,
    errorCount: errors.length,
  };
};
