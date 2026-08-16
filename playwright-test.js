const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[CORE DEBUG]')) {
      consoleLogs.push(text);
      console.log('BROWSER CONSOLE:', text);
    }
  });

  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2000);
  
  // Inject localStorage to bypass the 4 sections
  await page.evaluate(() => {
    localStorage.setItem('@milk_data_gyalshing milk center_aug 2024_operations', JSON.stringify({ litres: "500.5", withdrawal: "25000", balance: "0" }));
    localStorage.setItem('@milk_section_states_gyalshing milk center', JSON.stringify({
       operations: { status: 'COMPLETED' },
       evidence: { status: 'CAPTURED', validUntil: '2030-12-31T00:00:00Z' },
       activities: { status: 'COMPLETED' },
       compliance: { status: 'COMPLETED' }
    }));
  });
  
  // Reload so the app reads the injected storage
  await page.reload();
  await page.waitForTimeout(2000);
  
  console.log("Logging in...");
  await page.getByText('SIGN IN', { exact: true }).first().click();
  await page.waitForTimeout(500);
  await page.getByPlaceholder('officer@sikkim.gov.in').fill('inspector@sikkim.gov.in');
  await page.getByPlaceholder('Enter your password').fill('admin123');
  await page.getByText('SIGN IN TO PORTAL', { exact: true }).click();
  await page.waitForTimeout(2000);
  
  console.log("Opening Dashboard...");
  await page.getByText('SELECT & OPEN DASHBOARD').nth(1).click();
  await page.waitForTimeout(2000);
  
  console.log("Navigating to Review Submit...");
  // Now the next step should be Review & Submit
  await page.getByText('Next Step: Review & Submit Return').click();
  await page.waitForTimeout(2000);
  
  console.log("Clicking COMPILE & SEAL...");
  await page.getByText('COMPILE & SEAL').click();
  
  // Wait for network request to Supabase to finish and log out the result
  await page.waitForTimeout(5000);
  
  console.log("TEST FINISHED. Captured logs:", consoleLogs.length);
  await page.screenshot({ path: 'test-screenshot-final.png' });
  await browser.close();
})();
