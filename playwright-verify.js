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
  page.on('pageerror', err => console.log('❌ PAGE ERROR:', err.message));

  await page.goto('http://localhost:8081');
  await page.waitForTimeout(3000);
  
  // KEY FIX: Use the REAL key format (spaces, not underscores!)
  // monthlySyncManager just does .toLowerCase() - NO regex replace for MILK_DATA_PREFIX!
  await page.evaluate(() => {
    const prefix = '@milk_data_';
    // Real key: @milk_data_gyalshing milk center_aug 2024_operations
    localStorage.setItem(`${prefix}gyalshing milk center_aug 2024_operations`, JSON.stringify({
      litres: "500.5", withdrawal: "25000", balance: "1000"
    }));
    localStorage.setItem(`${prefix}gyalshing milk center_aug 2024_evidence`, JSON.stringify({
      imageUri: 'https://example.com/test.jpg', imageBase64: 'fakebase64',
      capturedAt: new Date().toISOString(), reportedBy: 'Inspector DOM Test',
      location: { latitude: 27.3314, longitude: 88.6138 }
    }));
    localStorage.setItem(`${prefix}gyalshing milk center_aug 2024_activities`, JSON.stringify({
      activityList: [{ title: 'Monthly meeting' }], isCompleted: true
    }));
    localStorage.setItem(`${prefix}gyalshing milk center_aug 2024_compliance`, JSON.stringify({
      auditDate: '2024-03-15', auditYear: '2023-24', agmDate: '2024-02-10', hasLoan: false
    }));
    console.log('[TEST] Data injected with CORRECT keys (spaces, not underscores)');
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.includes('milk_data')) console.log('[TEST] KEY:', k);
    }
  });
  
  // Login
  await page.getByText('SIGN IN', { exact: true }).first().click();
  await page.waitForTimeout(500);
  await page.getByPlaceholder('officer@sikkim.gov.in').fill('inspector@sikkim.gov.in');
  await page.getByPlaceholder('Enter your password').fill('admin123');
  await page.getByText('SIGN IN TO PORTAL', { exact: true }).click();
  await page.waitForTimeout(3000);

  // Open Milk PCS dashboard
  const dashboardBtns = await page.getByText('SELECT & OPEN DASHBOARD').all();
  await dashboardBtns[1].click();
  await page.waitForTimeout(3000);
  
  // Check section statuses
  const bodyText = await page.evaluate(() => document.body.innerText);
  const statusLines = bodyText.split('\n').filter(l => l.match(/(COMPLETED|CAPTURED|ENTRIES|NOT STARTED|NOT CAPTURED|Next Step)/));
  console.log('Section statuses:', statusLines.map(l => l.trim()));
  
  // Click Collection & Deposit to verify data loaded
  const collectionCard = page.getByText('Monthly Collection / Deposit');
  if (await collectionCard.count() > 0) {
    await collectionCard.first().click();
    await page.waitForTimeout(1500);
    
    const inputs = await page.locator('input').all();
    for (let i = 0; i < inputs.length; i++) {
      const val = await inputs[i].inputValue();
      const ph = await inputs[i].getAttribute('placeholder');
      console.log(`  Input ${i}: ph="${ph}" val="${val}"`);
    }
    
    // Save & Next to trigger refresh
    const saveNextBtn = page.getByText('SAVE & NEXT');
    if (await saveNextBtn.count() > 0) {
      await saveNextBtn.first().click();
      await page.waitForTimeout(2000);
    }
  }
  
  // After Activities screen (which we should be on now), navigate through remaining sections
  // Let's check what screen we're on
  const currentText = await page.evaluate(() => document.body.innerText.substring(0, 200));
  console.log('Current screen (first 200):', currentText.replace(/\n/g, ' | '));
  
  // Try Save & Next on Activities
  const saveNext2 = page.getByText('SAVE & NEXT');
  if (await saveNext2.count() > 0) {
    await saveNext2.first().click();
    await page.waitForTimeout(2000);
  }
  
  // Try Save & Next on Compliance
  const saveNext3 = page.getByText('SAVE & NEXT');
  if (await saveNext3.count() > 0) {
    await saveNext3.first().click();
    await page.waitForTimeout(2000);
  }
  
  // Now we should be on Review & Submit
  const reviewTitle = page.getByText('Review & Submit Return');
  if (await reviewTitle.count() > 0) {
    console.log('=== ON REVIEW & SUBMIT SCREEN ===');
    
    const sealBtn = page.getByText('COMPILE & SEAL');
    if (await sealBtn.count() > 0) {
      console.log('=== COMPILE & SEAL FOUND! CLICKING ===');
      await sealBtn.click();
      await page.waitForTimeout(15000);
      console.log('=== Done waiting 15s ===');
    } else {
      console.log('COMPILE & SEAL not available');
      const completeBtn = page.getByText('Complete Sections to Submit');
      if (await completeBtn.count() > 0) {
        console.log('Button is disabled: Complete Sections to Submit');
      }
    }
  } else {
    console.log('Not on Review screen');
  }

  console.log('\n=== ALL [CORE] LOGS ===');
  consoleLogs.filter(l => l.includes('[CORE')).forEach(l => console.log('  ', l));
  
  console.log('\n=== TEST COMPLETE ===');
  await browser.close();
})();
