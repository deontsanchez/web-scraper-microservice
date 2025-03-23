import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper, ScraperResult } from './BaseScraper';
import { ISource } from '../../models/Source';
import { logger } from '../../utils/logger';

export class CheerioScraper extends BaseScraper {
  constructor(source: ISource, options?: any) {
    super(source, options);
  }

  async scrape(): Promise<ScraperResult[]> {
    try {
      logger.info(
        `Starting to scrape ${this.source.name} (${this.source.url})`
      );

      // Fetch the HTML content
      const response = await axios.get(this.source.url, {
        headers: {
          'User-Agent': this.options.userAgent,
        },
        timeout: this.options.timeout,
      });

      // Load the HTML into cheerio
      const $ = cheerio.load(response.data);
      const results: ScraperResult[] = [];

      // Get all articles based on the provided selector
      const articleSelector = this.source.selectors.article || 'article';

      // If there's no specific article selector, we'll scrape the entire page as one article
      if (!this.source.selectors.article) {
        const result = this.extractArticleData($, $('body'), this.source.url);
        if (result) {
          results.push(result);
        }
      } else {
        // Process each article
        $(articleSelector).each((i, element) => {
          // Extract link to the full article if this is a list page
          const linkElement = $(element).find('a').first();
          const articleUrl = linkElement.attr('href');

          // If there's a link and it's a relative URL, make it absolute
          const fullUrl = articleUrl
            ? articleUrl.startsWith('http')
              ? articleUrl
              : new URL(articleUrl, this.source.url).toString()
            : this.source.url;

          const result = this.extractArticleData($, $(element), fullUrl);
          if (result) {
            results.push(result);
          }
        });
      }

      logger.info(
        `Successfully scraped ${results.length} articles from ${this.source.name}`
      );
      return results;
    } catch (error) {
      logger.error(`Error scraping ${this.source.name}:`, error);
      return [];
    }
  }

  private extractArticleData(
    $: cheerio.CheerioAPI,
    element: cheerio.Cheerio<any>,
    url: string
  ): ScraperResult | null {
    try {
      // Extract data using the provided selectors
      const title = this.cleanContent(
        $(element).find(this.source.selectors.title).text()
      );
      const content = this.cleanContent(
        $(element).find(this.source.selectors.content).text()
      );

      // Skip if we couldn't find the required fields
      if (!title || !content) {
        return null;
      }

      // Get optional fields if selectors are provided
      let author = undefined;
      if (this.source.selectors.author) {
        author =
          $(element).find(this.source.selectors.author).text().trim() ||
          undefined;
      }

      let publishedAt = undefined;
      if (this.source.selectors.publishedAt) {
        const dateText = $(element)
          .find(this.source.selectors.publishedAt)
          .text()
          .trim();
        publishedAt = this.extractDate(dateText);
      }

      let imageUrl = undefined;
      if (this.source.selectors.image) {
        const imgElement = $(element).find(this.source.selectors.image);
        imageUrl =
          imgElement.attr('src') || imgElement.attr('data-src') || undefined;

        // Make relative URLs absolute
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = new URL(imageUrl, this.source.url).toString();
        }
      }

      let summary = undefined;
      if (this.source.selectors.summary) {
        summary =
          $(element).find(this.source.selectors.summary).text().trim() ||
          undefined;
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
      logger.error(`Error extracting article data:`, error);
      return null;
    }
  }
}
