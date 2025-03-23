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
      await page.setUserAgent(
        this.options.userAgent ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      // Set timeout - increase for WSJ which can be slower to load
      const timeout = this.source.name.includes('Wall Street Journal')
        ? 60000 // 60 seconds for WSJ
        : this.options.timeout || 30000;

      await page.setDefaultNavigationTimeout(timeout);

      // Navigate to the URL
      await page.goto(this.source.url, { waitUntil: 'networkidle2' });

      // Handle cookie consent dialogs
      await this.handleCookieConsent(page);

      // Handle paywalls if needed
      await this.handlePaywall(page);

      // Wait for the content to load with longer timeout for WSJ
      try {
        if (this.source.selectors.article) {
          await page.waitForSelector(this.source.selectors.article, {
            timeout: timeout,
          });
        } else {
          await page.waitForSelector(this.source.selectors.title, {
            timeout: timeout,
          });
        }
      } catch (error) {
        logger.warn(
          `Selector timeout for ${this.source.name}, proceeding anyway`
        );
        // Continue anyway to try to extract what we can
      }

      const results: ScraperResult[] = [];

      // Get all articles based on the provided selector
      const articleSelector = this.source.selectors.article || 'body';

      // Extract data from the page
      const articles = await page.$$(articleSelector);

      logger.info(
        `Found ${articles.length} article elements on ${this.source.name}`
      );

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

  /**
   * Handle common cookie consent dialogs
   */
  private async handleCookieConsent(page: Page): Promise<void> {
    try {
      // Common cookie consent button selectors
      const consentSelectors = [
        'button[aria-label="Accept all"]',
        'button[aria-label="agree"]',
        'button.accept-cookies-button',
        'button.consent-btn',
        '#onetrust-accept-btn-handler',
        '.accept-cookies',
        '[aria-label="Accept cookies"]',
        'button:has-text("Accept")',
        'button:has-text("Accept All")',
        'button:has-text("I Accept")',
        'button:has-text("OK")',
        'button:has-text("Got it")',
        '.gdpr-agree',
      ];

      for (const selector of consentSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            logger.info('Attempting to click cookie consent button');
            await button.click();
            await this.sleepInPage(page, 1000);
            break;
          }
        } catch (e) {
          // Ignore errors for missing selectors
        }
      }
    } catch (error) {
      logger.warn('Error handling cookie consent, continuing anyway', error);
    }
  }

  /**
   * Handle paywalls for specific sites
   */
  private async handlePaywall(page: Page): Promise<void> {
    try {
      // Special handling for Wall Street Journal
      if (this.source.name.includes('Wall Street Journal')) {
        // Try to dismiss any popup dialogs
        try {
          const closeButtons = [
            '.close-btn',
            '.close-button',
            '[aria-label="Close"]',
            'button.snippet-close',
            '.dialog-close',
            '.paywall-close',
          ];

          for (const selector of closeButtons) {
            const button = await page.$(selector);
            if (button) {
              await button.click();
              await this.sleepInPage(page, 500);
            }
          }

          // Scroll down to trigger lazy loading
          await page.evaluate(() => {
            window.scrollBy(0, 500);
          });

          await this.sleepInPage(page, 2000);
        } catch (e) {
          // Ignore errors
        }
      }
    } catch (error) {
      logger.warn('Error handling paywall, continuing anyway', error);
    }
  }

  /**
   * Sleep helper that works with puppeteer
   */
  private async sleepInPage(page: Page, ms: number): Promise<void> {
    await page.evaluate(timeout => {
      return new Promise(resolve => setTimeout(resolve, timeout));
    }, ms);
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
                imgEl.getAttribute('src') ||
                imgEl.getAttribute('data-src') ||
                imgEl.getAttribute('srcset') ||
                imgEl.getAttribute('data-srcset');

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
