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
  
  // Inject mock data for Agent Test Milk PCS
  await page.evaluate(() => {
    localStorage.setItem('@milk_data_Agent Test Milk PCS_AUG 2024_operations', JSON.stringify({ litres: "999.9", withdrawal: "88888", balance: "0" }));
    localStorage.setItem('@milk_data_Agent Test Milk PCS_AUG 2024_evidence', JSON.stringify({ status: 'CAPTURED' }));
  });
  
  await page.reload();
  await page.waitForTimeout(2000);
  
  console.log("Logging in...");
  await page.getByText('SIGN IN', { exact: true }).first().click();
  await page.waitForTimeout(500);
  await page.getByPlaceholder('officer@sikkim.gov.in').fill('inspector@sikkim.gov.in');
  await page.getByPlaceholder('Enter your password').fill('admin123');
  await page.getByText('SIGN IN TO PORTAL', { exact: true }).click();
  await page.waitForTimeout(2000);
  
  // Now we are logged in. Let's just bypass the UI and call generatePDF directly if we can!
  // But generatePDF is scoped inside App component. We can't reach it.
  // We can just ask Playwright to click the specific section and fill it!
  
  await browser.close();
})();
