import { chromium } from '@playwright/test';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console errors
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[Browser Console ${type.toUpperCase()}]:`, msg.text());
    }
  });

  page.on('pageerror', (err) => {
    console.error('[Browser PageError]:', err.message, err.stack);
  });

  console.log('Navigating to thong-tin page...');
  await page.goto('https://dienmayelc.com.vn/thong-tin', { waitUntil: 'networkidle' });

  console.log('Clicking the link to "Giới thiệu về Điện máy ELC"...');
  // Find link with href "/gioi-thieu-ve-dien-may-elc" or text "Giới thiệu về Điện máy ELC"
  const link = page.locator('a[href="/gioi-thieu-ve-dien-may-elc"]');
  if (await link.count() > 0) {
    await link.first().click();
    console.log('Clicked link, waiting for 5 seconds to observe errors...');
    await page.waitForTimeout(5000);
  } else {
    console.error('Link not found!');
  }

  await browser.close();
}

run().catch(console.error);
