const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('dynamic survey visibility', () => {
  test('shows the hobby follow-up only when q_3 is Yes', async ({ page }) => {
    await page.goto(`file://${path.resolve(__dirname, '../fixtures/dynamic-form.html')}`);
    const followUp = page.getByRole('textbox', { name: 'What is your hobby?' });

    await expect(followUp).toBeHidden();
    await page.getByLabel('Do you have a hobby?').selectOption('Yes');
    await expect(followUp).toBeVisible();

    await page.getByLabel('Do you have a hobby?').selectOption('No');
    await expect(followUp).toBeHidden();
  });
});
