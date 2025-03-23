import { ISource } from '../models/Source';

/**
 * News sources for today's headlines from major outlets
 */
export const sampleSources: Partial<ISource>[] = [
  {
    name: 'The New York Times - Today',
    url: 'https://www.nytimes.com',
    selectors: {
      article: 'article[data-testid="block-layout-renderer"]',
      title: 'h3, h2',
      content: 'p, div.summary, span.css-1echdzn',
      author: 'span[itemprop="name"]',
      publishedAt: 'time',
      image: 'img',
      summary: 'p, div.summary',
    },
    category: 'News',
    requiresJavaScript: true,
    scrapingFrequency: 30, // Check every 30 minutes
    enabled: true,
  },
  {
    name: 'BBC News - Headlines',
    url: 'https://www.bbc.com/news',
    selectors: {
      article: 'div.gs-c-promo',
      title: 'h3.gs-c-promo-heading__title',
      content: 'p.gs-c-promo-summary',
      publishedAt: 'time',
      image: 'img.gs-c-promo-image',
      summary: 'p.gs-c-promo-summary',
    },
    category: 'News',
    requiresJavaScript: false,
    scrapingFrequency: 30,
    enabled: true,
  },
  {
    name: 'Wall Street Journal - Today',
    url: 'https://www.wsj.com',
    selectors: {
      article:
        'article, div.article-wrap, div.WSJTheme--story, div[data-module-zone="article"]',
      title: 'h1, h2, h3, .article-name, .WSJTheme--headline, .headline',
      content: 'p, .article-summary, .snippet, .summary, .WSJTheme--summary',
      author: 'div.byline, .author, span[itemprop="author"]',
      publishedAt: 'time, .timestamp, .date-stamp, [datetime]',
      image: 'img, picture source',
      summary: 'p, .summary, .snippet',
    },
    category: 'News',
    requiresJavaScript: true,
    scrapingFrequency: 30,
    enabled: true,
  },
];
