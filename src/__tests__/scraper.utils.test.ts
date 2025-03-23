import { extractDomain, getRandomUserAgent } from '../utils/scraper.utils';

describe('Scraper Utilities', () => {
  describe('extractDomain', () => {
    test('should extract domain from a valid URL', () => {
      expect(extractDomain('https://example.com')).toBe('example.com');
      expect(extractDomain('https://subdomain.example.com/path')).toBe(
        'subdomain.example.com'
      );
      expect(extractDomain('http://example.com:8080')).toBe('example.com');
      expect(extractDomain('https://www.example.co.uk/path?query=string')).toBe(
        'www.example.co.uk'
      );
    });

    test('should handle invalid URLs gracefully', () => {
      expect(extractDomain('invalid-url')).toBe('');
      expect(extractDomain('')).toBe('');
    });
  });

  describe('getRandomUserAgent', () => {
    test('should return a non-empty string', () => {
      const userAgent = getRandomUserAgent();
      expect(typeof userAgent).toBe('string');
      expect(userAgent.length).toBeGreaterThan(0);
    });

    test('should return a user agent from the predefined list', () => {
      // Mock Math.random to return a predictable value
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0);

      try {
        const userAgent = getRandomUserAgent();
        // This should be the first user agent in the list
        expect(userAgent).toContain('Mozilla/5.0');
        expect(userAgent).toContain('Windows NT 10.0');
      } finally {
        // Restore original Math.random
        Math.random = originalRandom;
      }
    });

    test('should return different user agents based on random selection', () => {
      // Get a sample of user agents
      const samples = new Set();
      for (let i = 0; i < 100; i++) {
        samples.add(getRandomUserAgent());
      }

      // There should be multiple different user agents in our sample
      // (unless we're extremely unlucky with Math.random)
      expect(samples.size).toBeGreaterThan(1);
    });
  });
});
