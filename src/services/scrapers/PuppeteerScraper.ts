import puppeteer, { Page, ElementHandle } from 'puppeteer';
import { BaseScraper, ScraperResult } from './BaseScraper';
import { ISource } from '../../models/Source';
import { logger } from '../../utils/logger';

export class PuppeteerScraper extends BaseScraper {
  constructor(source: ISource, options?: any) {
    super(source, options);
  }

  async scrape(): Promise<ScraperResult[]> {
    let browser;

    try {
      logger.info(
        `Starting to scrape ${this.source.name} (${this.source.url}) with Puppeteer`
      );

      // Launch a headless browser instance
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });

      // Open a new page
      const page = await browser.newPage();

      // Set viewport and user agent
      await page.setViewport({ width: 1366, height: 768 });
      await page.setUserAgent(this.options.userAgent || '');

      // Set timeout
      await page.setDefaultNavigationTimeout(this.options.timeout || 30000);

      // Navigate to the URL
      await page.goto(this.source.url, { waitUntil: 'networkidle2' });

      // Wait for the content to load
      if (this.source.selectors.article) {
        await page.waitForSelector(this.source.selectors.article, {
          timeout: this.options.timeout || 30000,
        });
      } else {
        await page.waitForSelector(this.source.selectors.title, {
          timeout: this.options.timeout || 30000,
        });
      }

      const results: ScraperResult[] = [];

      // Get all articles based on the provided selector
      const articleSelector = this.source.selectors.article || 'body';

      // Extract data from the page
      const articles = await page.$$(articleSelector);

      // Process each article
      for (const article of articles) {
        let url = this.source.url;

        // If there's a link, try to get it
        if (this.source.selectors.article) {
          const linkHandle = await article.$('a');
          if (linkHandle) {
            const href = await page.evaluate(
              (el: Element) => el.getAttribute('href'),
              linkHandle
            );

            if (href) {
              // If it's a relative URL, make it absolute
              url = href.startsWith('http')
                ? href
                : new URL(href, this.source.url).toString();
            }
          }
        }

        const result = await this.extractArticleData(page, article, url);
        if (result) {
          results.push(result);
        }
      }

      logger.info(
        `Successfully scraped ${results.length} articles from ${this.source.name} with Puppeteer`
      );
      return results;
    } catch (error) {
      logger.error(`Error scraping ${this.source.name} with Puppeteer:`, error);
      return [];
    } finally {
      // Ensure browser is closed
      if (browser) {
        await browser.close();
      }
    }
  }

  private async extractArticleData(
    page: Page,
    element: ElementHandle,
    url: string
  ): Promise<ScraperResult | null> {
    try {
      // Extract the data using the provided selectors
      const title = this.cleanContent(
        await page.evaluate(
          (el: Element, selector: string) => {
            const titleEl = el.querySelector(selector);
            return titleEl ? titleEl.textContent || '' : '';
          },
          element,
          this.source.selectors.title
        )
      );

      const content = this.cleanContent(
        await page.evaluate(
          (el: Element, selector: string) => {
            const contentEl = el.querySelector(selector);
            return contentEl ? contentEl.textContent || '' : '';
          },
          element,
          this.source.selectors.content
        )
      );

      // Skip if we couldn't find the required fields
      if (!title || !content) {
        return null;
      }

      // Get optional fields
      let author = undefined;
      if (this.source.selectors.author) {
        author =
          (await page.evaluate(
            (el: Element, selector: string) => {
              const authorEl = el.querySelector(selector);
              return authorEl ? authorEl.textContent?.trim() || '' : '';
            },
            element,
            this.source.selectors.author
          )) || undefined;
      }

      let publishedAt = undefined;
      if (this.source.selectors.publishedAt) {
        const dateText = await page.evaluate(
          (el: Element, selector: string) => {
            const dateEl = el.querySelector(selector);
            return dateEl ? dateEl.textContent?.trim() || '' : '';
          },
          element,
          this.source.selectors.publishedAt
        );

        publishedAt = this.extractDate(dateText);
      }

      let imageUrl = undefined;
      if (this.source.selectors.image) {
        imageUrl =
          (await page.evaluate(
            (el: Element, selector: string, baseUrl: string) => {
              const imgEl = el.querySelector(selector);
              if (!imgEl) return undefined;

              // Get src or data-src attribute
              let src =
                imgEl.getAttribute('src') || imgEl.getAttribute('data-src');

              // Make relative URLs absolute
              if (src && !src.startsWith('http')) {
                src = new URL(src, baseUrl).toString();
              }

              return src;
            },
            element,
            this.source.selectors.image,
            this.source.url
          )) || undefined;
      }

      let summary = undefined;
      if (this.source.selectors.summary) {
        summary =
          (await page.evaluate(
            (el: Element, selector: string) => {
              const summaryEl = el.querySelector(selector);
              return summaryEl ? summaryEl.textContent?.trim() || '' : '';
            },
            element,
            this.source.selectors.summary
          )) || undefined;
      }

      return {
        title,
        content,
        summary,
        url,
        source: this.source.name,
        author,
        publishedAt,
        imageUrl,
        category: this.source.category,
      };
    } catch (error) {
      logger.error(`Error extracting article data with Puppeteer:`, error);
      return null;
    }
  }
}
