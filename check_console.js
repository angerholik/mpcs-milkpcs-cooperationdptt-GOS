const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`PAGE LOG [${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });

  try {
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle2' });
    console.log("Page loaded.");
    await new Promise(r => setTimeout(r, 2000));
  } catch(e) {
    console.log("Nav err", e);
  }
  await browser.close();
})();
