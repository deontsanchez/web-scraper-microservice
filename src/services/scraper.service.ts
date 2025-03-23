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

    // Setup dialog handling (auto-dismiss alerts, confirms, prompts)
    page.on('dialog', async dialog => {
      console.log(
        `Dialog detected: ${dialog.type()} with message: ${dialog.message()}`
      );
      await dialog.dismiss();
    });

    // Navigate to URL
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Try to handle common cookie banners and popups
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
          await page
            .click(selector)
            .catch(() => console.log(`Could not click: ${selector}`));
          // Wait a short time after clicking
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.log('Error handling cookie banners:', error);
      // Continue execution even if banner handling fails
    }

    // Detect paywalls
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
      console.log(`Paywall detected on ${url}`);
      return {
        url,
        domain: extractDomain(url),
        paywallDetected: true,
        message: 'Scraping stopped due to paywall detection',
      };
    }

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
