const puppeteer = require('puppeteer');

describe('Authentication Flow', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ 
      headless: "new",
      timeout: 30000
    });
    page = await browser.newPage();
    await page.setDefaultTimeout(10000);
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('Successful Login', async () => {
    try {
      await page.goto('http://localhost:5000/login.html', { 
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      
      await page.type('#email', 'mail-tejamallam1233@gmail.com');
      await page.type('#password', 'password-tejamallam1233@gmail.com');
      
      await Promise.all([
        page.waitForNavigation({ 
          waitUntil: 'networkidle2',
          timeout: 15000 
        }),
        page.click('button[type="submit"]')
      ]);

      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();
      expect(page.url()).toContain('mainpage.html');
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  }, 30000);
});
