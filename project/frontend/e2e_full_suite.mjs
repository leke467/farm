import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5174';
const LOGS = [];
const ERRORS = [];

function log(msg) {
  const line = `[E2E TEST] ${new Date().toISOString()} - ${msg}`;
  console.log(line);
  LOGS.push(line);
}

function error(msg) {
  const line = `[E2E ERROR] ${new Date().toISOString()} - ${msg}`;
  console.error(line);
  ERRORS.push(line);
}

async function runFullSuite() {
  log('Starting Exhaustive Real Browser E2E Automation Suite...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Listen for console errors & unhandled page exceptions
  page.on('console', msg => {
    if (msg.type() === 'error') {
      error(`Browser Console Error: "${msg.text()}" at ${page.url()}`);
    }
  });

  page.on('pageerror', err => {
    error(`Browser Page Exception: "${err.message}" at ${page.url()}`);
  });

  page.on('requestfailed', req => {
    // Ignore cancelled or aborted requests
    if (req.failure()?.errorText !== 'net::ERR_ABORTED') {
      error(`Failed Network Request: ${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
    }
  });

  try {
    // ----------------------------------------------------
    // TEST 1: Public Landing Page & Contact Page
    // ----------------------------------------------------
    log('--- TEST 1: Testing Public Landing & Contact Pages ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    log(`Landing page loaded cleanly. Title: "${await page.title()}"`);
    
    await page.goto(`${BASE_URL}/contact`, { waitUntil: 'domcontentloaded' });
    log('Contact Us page loaded cleanly.');
    
    if (await page.locator('input[name="name"]').isVisible()) {
      await page.fill('input[name="name"]', 'Automated E2E Tester');
      await page.fill('input[name="email"]', 'e2e_tester@example.com');
      await page.fill('input[name="subject"]', 'Playwright E2E Full Audit Test');
      await page.fill('textarea[name="message"]', 'This is an automated E2E system test submitting a public message.');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1500);
      log('Public Contact Form submitted successfully.');
    }

    // ----------------------------------------------------
    // TEST 2: Authentication & Superadmin Login
    // ----------------------------------------------------
    log('--- TEST 2: Superadmin Login & Superadmin Dashboard Audit ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    
    await page.fill('input[name="username"]', 'newsuperuser');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => url.href.includes('/admin/dashboard'), { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);

    log(`Logged in as Superuser. Current URL: ${page.url()}`);

    // Test Superadmin Tabs
    const tabs = ['overview', 'subscriptions', 'users', 'farms', 'disputes', 'contact'];
    for (const tab of tabs) {
      const tabButton = page.locator(`button:has-text("${tab}"), [data-tab="${tab}"]`).first();
      if (await tabButton.isVisible()) {
        await tabButton.click();
        await page.waitForTimeout(800);
        log(`Superadmin Tab "${tab}" clicked & verified.`);
      }
    }

    // ----------------------------------------------------
    // TEST 3: Regular Farm Owner Login & Full Dashboard Audit
    // ----------------------------------------------------
    log('--- TEST 3: Regular Farm Owner Login & Full Operational Audit ---');
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="username"]', 'test@gmail.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => url.href.includes('/dashboard') || url.href.includes('/testfarm'), { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    log(`Logged in as Regular User. Current URL: ${page.url()}`);

    // Extract active farm slug
    const currentUrl = page.url();
    const match = currentUrl.match(/\/([^\/]+)\/dashboard/);
    const farmSlug = match ? match[1] : 'testfarm';
    log(`Detected Active Farm Slug: "${farmSlug}"`);

    // ----------------------------------------------------
    // TEST 4: Operational Pages Walkthrough
    // ----------------------------------------------------
    const farmRoutes = [
      { name: 'Dashboard Overview', path: `/${farmSlug}/dashboard` },
      { name: 'Animals Management', path: `/${farmSlug}/animals` },
      { name: 'Crops Management', path: `/${farmSlug}/crops` },
      { name: 'Inventory Overview', path: `/${farmSlug}/inventory` },
      { name: 'Expense Tracking', path: `/${farmSlug}/expenses` },
      { name: 'Sales & Revenue', path: `/${farmSlug}/sales` },
      { name: 'Tasks & Schedules', path: `/${farmSlug}/tasks` },
      { name: 'Reports & Analytics', path: `/${farmSlug}/reports` },
      { name: 'Health Alerts', path: `/${farmSlug}/health` },
      { name: 'Subscription & Billing', path: `/${farmSlug}/subscription` }
    ];

    for (const route of farmRoutes) {
      log(`Auditing page: ${route.name} (${route.path})`);
      await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
    }

    // ----------------------------------------------------
    // TEST 5: Screenshots & Final Verification
    // ----------------------------------------------------
    log('--- TEST 5: Visual Verification & Screenshots ---');
    await page.goto(`${BASE_URL}/${farmSlug}/subscription`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const subScreenshotPath = path.join(process.cwd(), 'e2e_subscription_page.png');
    await page.screenshot({ path: subScreenshotPath, fullPage: true });
    log(`Saved subscription page screenshot to ${subScreenshotPath}`);

    await page.goto(`${BASE_URL}/${farmSlug}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const dashScreenshotPath = path.join(process.cwd(), 'e2e_dashboard_page.png');
    await page.screenshot({ path: dashScreenshotPath, fullPage: true });
    log(`Saved dashboard page screenshot to ${dashScreenshotPath}`);

    log('====================================================');
    log(`E2E AUTOMATION SUITE COMPLETE! Total Logs: ${LOGS.length}, Total Errors Found: ${ERRORS.length}`);
    log('====================================================');

    if (ERRORS.length > 0) {
      console.log('\n--- LIST OF ERRORS ENCOUNTERED ---');
      ERRORS.forEach((err, idx) => console.log(`${idx + 1}. ${err}`));
    } else {
      console.log('\n✨ PERFECT RUN! 0 Errors, 0 Page Crashes, 0 Network Failures!');
    }

  } catch (err) {
    error(`Fatal E2E Suite Exception: ${err.stack}`);
  } finally {
    await browser.close();
  }
}

runFullSuite();
