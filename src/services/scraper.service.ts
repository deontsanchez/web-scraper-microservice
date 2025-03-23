import puppeteer from 'puppeteer';
import { getRandomUserAgent, extractDomain } from '../utils/scraper.utils';

/**
 * Scrape content from a URL using Puppeteer
 * @param url - The URL to scrape
 * @returns Object containing scraped data
 */
export const scrapeUrl = async (url: string) => {
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Open new page
    const page = await browser.newPage();

    // Set random user agent
    await page.setUserAgent(getRandomUserAgent());

    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to URL
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Get page title
    const title = await page.title();

    // Get page content
    const content = await page.content();

    // Get all text content
    const textContent = await page.evaluate(() => document.body.innerText);

    // Get all links
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(link => ({
        text: link.textContent?.trim() || '',
        href: link.href,
      }));
    });

    // Get meta tags
    const metaTags = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('meta')).map(meta => ({
        name: meta.getAttribute('name'),
        property: meta.getAttribute('property'),
        content: meta.getAttribute('content'),
      }));
    });

    // Get images
    const images = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height,
      }));
    });

    return {
      title,
      url,
      domain: extractDomain(url),
      textContent,
      links,
      metaTags,
      images,
      htmlContent: content,
    };
  } catch (error) {
    console.error('Error scraping URL:', error);
    throw new Error(
      `Failed to scrape ${url}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  } finally {
    // Close browser
    if (browser) {
      await browser.close();
    }
  }
};
