const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('[CORE DEBUG]') || text.includes('[CORE]') || text.includes('[TEST]')) {
      console.log('🔵:', text);
    }
  });

  await page.goto('http://localhost:8081');
  await page.waitForTimeout(3000);
  
  console.log('=== STEP 1: Login ===');
  await page.getByText('SIGN IN', { exact: true }).first().click();
  await page.waitForTimeout(500);
  await page.getByPlaceholder('officer@sikkim.gov.in').fill('inspector@sikkim.gov.in');
  await page.getByPlaceholder('Enter your password').fill('admin123');
  await page.getByText('SIGN IN TO PORTAL', { exact: true }).click();
  await page.waitForTimeout(3000);

  console.log('=== STEP 2: Open Milk PCS dashboard ===');
  const dashboardBtns = await page.getByText('SELECT & OPEN DASHBOARD').all();
  await dashboardBtns[1].click();
  await page.waitForTimeout(3000);
  
  console.log('=== STEP 3: Navigate to Master Data ===');
  const masterDataBtn = page.getByText('Master Data');
  if (await masterDataBtn.count() > 0) {
    await masterDataBtn.first().click();
    await page.waitForTimeout(2000);
    
    // Fill Institutional Profile
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} inputs on Institutional Profile`);
    if (inputs.length > 0) {
      // Just click SAVE & NEXT
      const saveNextBtn = page.getByText('SAVE & NEXT');
      if (await saveNextBtn.count() > 0) {
         console.log('Clicking SAVE & NEXT on Institutional Profile');
         await saveNextBtn.first().click();
         await page.waitForTimeout(3000);
      }
    }
  }

  console.log('\n=== ALL [CORE] LOGS ===');
  consoleLogs.filter(l => l.includes('[CORE')).forEach(l => console.log('  ', l));
  
  await browser.close();
})();
