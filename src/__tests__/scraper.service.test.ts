import puppeteer from 'puppeteer';
import { scrapeUrl } from '../services/scraper.service';
import { getRandomUserAgent, extractDomain } from '../utils/scraper.utils';

// Mock puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn(),
}));

// Mock scraper.utils
jest.mock('../utils/scraper.utils', () => ({
  getRandomUserAgent: jest.fn().mockReturnValue('Mozilla/5.0 Test User Agent'),
  extractDomain: jest.fn().mockImplementation(url => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }),
}));

describe('Scraper Service', () => {
  // Mock browser and page objects
  const mockPage = {
    setUserAgent: jest.fn().mockResolvedValue(undefined),
    setViewport: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    goto: jest.fn().mockResolvedValue(undefined),
    $: jest.fn().mockResolvedValue(null),
    click: jest.fn().mockResolvedValue(undefined),
    title: jest.fn().mockResolvedValue('Test Page Title'),
    content: jest
      .fn()
      .mockResolvedValue('<html><body>Test content</body></html>'),
    evaluate: jest.fn(),
    waitForTimeout: jest.fn().mockResolvedValue(undefined),
  };

  const mockBrowser = {
    newPage: jest.fn().mockResolvedValue(mockPage),
    close: jest.fn().mockResolvedValue(undefined),
  };

  let mockDialogHandler: ((dialog: any) => Promise<void>) | undefined =
    undefined;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Set up the default mock implementation
    (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);

    // Store the dialog handler when set
    mockPage.on.mockImplementation((event, handler) => {
      if (event === 'dialog') {
        mockDialogHandler = handler;
      }
    });

    // Setup different evaluate implementations based on the call
    mockPage.evaluate.mockImplementation(fn => {
      // Handle dialog handler setting
      if (typeof fn === 'function') {
        // Paywall detection - first call to evaluate after dialog setup
        if (
          fn.toString().includes('bodyText') ||
          fn.toString().includes('paywallPhrases')
        ) {
          return false; // No paywall by default
        }

        // Text content extraction
        if (fn.toString().includes('document.body.innerText')) {
          return 'Test page text content';
        }

        // Links extraction
        if (fn.toString().includes("document.querySelectorAll('a')")) {
          return [
            { text: 'Link 1', href: 'https://example.com/link1' },
            { text: 'Link 2', href: 'https://example.com/link2' },
          ];
        }

        // Meta tags extraction
        if (fn.toString().includes("document.querySelectorAll('meta')")) {
          return [
            {
              name: 'description',
              property: null,
              content: 'Test description',
            },
            { name: null, property: 'og:title', content: 'Test OG Title' },
          ];
        }

        // Images extraction
        if (fn.toString().includes("document.querySelectorAll('img')")) {
          return [
            {
              src: 'https://example.com/image1.jpg',
              alt: 'Image 1',
              width: 100,
              height: 100,
            },
            {
              src: 'https://example.com/image2.jpg',
              alt: 'Image 2',
              width: 200,
              height: 200,
            },
          ];
        }
      }

      return null;
    });
  });

  test('should scrape a URL successfully', async () => {
    const result = await scrapeUrl('https://example.com');

    // Check that puppeteer was launched
    expect(puppeteer.launch).toHaveBeenCalledWith({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Check page setup
    expect(mockPage.setUserAgent).toHaveBeenCalledWith(
      'Mozilla/5.0 Test User Agent'
    );
    expect(mockPage.setViewport).toHaveBeenCalledWith({
      width: 1280,
      height: 800,
    });

    // Check URL navigation
    expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
      waitUntil: 'networkidle2',
    });

    // Verify results
    expect(result).toEqual({
      title: 'Test Page Title',
      url: 'https://example.com',
      domain: 'example.com',
      textContent: 'Test page text content',
      links: [
        { text: 'Link 1', href: 'https://example.com/link1' },
        { text: 'Link 2', href: 'https://example.com/link2' },
      ],
      metaTags: [
        { name: 'description', property: null, content: 'Test description' },
        { name: null, property: 'og:title', content: 'Test OG Title' },
      ],
      images: [
        {
          src: 'https://example.com/image1.jpg',
          alt: 'Image 1',
          width: 100,
          height: 100,
        },
        {
          src: 'https://example.com/image2.jpg',
          alt: 'Image 2',
          width: 200,
          height: 200,
        },
      ],
      htmlContent: '<html><body>Test content</body></html>',
    });

    // Check browser was closed
    expect(mockBrowser.close).toHaveBeenCalled();
  });

  test('should handle JavaScript dialogs', async () => {
    // Start the scraping process
    const scrapePromise = scrapeUrl('https://example.com');

    // Simulate a dialog
    const mockDialog = {
      type: jest.fn().mockReturnValue('alert'),
      message: jest.fn().mockReturnValue('Test alert message'),
      dismiss: jest.fn().mockResolvedValue(undefined),
    };

    // Call the dialog handler with the mock dialog
    if (mockDialogHandler) {
      await mockDialogHandler(mockDialog);
    }

    // Wait for scraping to complete
    await scrapePromise;

    // Verify dialog handler was set up
    expect(mockPage.on).toHaveBeenCalledWith('dialog', expect.any(Function));

    // Verify dialog was dismissed
    expect(mockDialog.dismiss).toHaveBeenCalled();
  });

  test('should handle cookie consent banners', async () => {
    // Mock finding a cookie consent button for the first selector
    mockPage.$.mockImplementation(selector => {
      if (selector.includes('cookie')) {
        return Promise.resolve({}); // Return a non-null value for the first selector
      }
      return Promise.resolve(null);
    });

    await scrapeUrl('https://example.com');

    // Verify click was attempted
    expect(mockPage.click).toHaveBeenCalled();
  });

  test('should detect paywalls and stop scraping', async () => {
    // Override the default evaluate mock for this test only
    mockPage.evaluate.mockImplementation(fn => {
      // Return true for the paywall detection call
      if (
        typeof fn === 'function' &&
        (fn.toString().includes('bodyText') ||
          fn.toString().includes('paywallPhrases'))
      ) {
        return true; // Indicate paywall detected
      }

      // Don't execute the rest of the evaluate calls (content extraction)
      return null;
    });

    const result = await scrapeUrl('https://example.com');

    // Verify paywall detection result
    expect(result).toEqual({
      url: 'https://example.com',
      domain: 'example.com',
      paywallDetected: true,
      message: 'Scraping stopped due to paywall detection',
    });

    // Verify title (content extraction) wasn't called since we detected a paywall
    expect(mockPage.title).not.toHaveBeenCalled();
  });

  test('should handle errors during scraping', async () => {
    // Force an error during navigation
    mockPage.goto.mockRejectedValueOnce(new Error('Navigation failed'));

    await expect(scrapeUrl('https://example.com')).rejects.toThrow(
      'Failed to scrape https://example.com: Navigation failed'
    );

    // Verify browser was still closed despite error
    expect(mockBrowser.close).toHaveBeenCalled();
  });

  test('should close browser even if extraction fails', async () => {
    // Force an error during content extraction
    mockPage.title.mockRejectedValueOnce(new Error('Failed to get title'));

    await expect(scrapeUrl('https://example.com')).rejects.toThrow();

    // Verify browser was closed
    expect(mockBrowser.close).toHaveBeenCalled();
  });
});
