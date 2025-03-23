import { ISource } from '../models/Source';

/**
 * Sample sources for demonstration
 */
export const sampleSources: Partial<ISource>[] = [
  {
    name: 'The New York Times - Technology',
    url: 'https://www.nytimes.com/section/technology',
    selectors: {
      article: 'div.css-1l4w6pd',
      title: 'h2',
      content: 'p.css-1echdzn',
      author: 'span.css-1n7hynb',
      publishedAt: 'time',
      image: 'img',
      summary: 'p.css-1echdzn',
    },
    category: 'Technology',
    requiresJavaScript: true,
    scrapingFrequency: 60,
    enabled: true,
  },
  {
    name: 'BBC News - Technology',
    url: 'https://www.bbc.com/news/technology',
    selectors: {
      article: 'div.gs-c-promo',
      title: 'h3.gs-c-promo-heading__title',
      content: 'p.gs-c-promo-summary',
      image: 'img.gs-c-promo-image',
      summary: 'p.gs-c-promo-summary',
    },
    category: 'Technology',
    requiresJavaScript: false,
    scrapingFrequency: 120,
    enabled: true,
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/',
    selectors: {
      article: 'article.post-block',
      title: 'h2 a',
      content: 'div.post-block__content',
      author: 'span.river-byline__authors',
      publishedAt: 'time',
      image: 'img.post-block__media',
      summary: 'div.post-block__content',
    },
    category: 'Technology',
    requiresJavaScript: true,
    scrapingFrequency: 90,
    enabled: true,
  },
];
