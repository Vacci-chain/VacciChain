/**
 * Simplified XSS Security Tests using helpers
 * 
 * This is a more maintainable version of the XSS tests that uses
 * helper functions for common patterns.
 */

import { test, expect } from '@playwright/test';
import {
  XSS_PAYLOADS,
  HTML_ENTITIES,
  STELLAR_ADDRESSES,
  createMockRecord,
  setupXSSDetection,
  mockFreighterConnection,
  mockAuthEndpoints,
  mockVaccinationRecords,
  mockVerifyEndpoint,
  verifyNoMaliciousElements,
  TEST_PATTERNS,
} from './helpers/xss-payloads.js';

test.describe('XSS Security Tests (Simplified)', () => {
  test.beforeEach(async ({ page }) => {
    setupXSSDetection(page);
  });

  test.describe('Vaccine Name XSS Protection', () => {
    Object.entries(XSS_PAYLOADS).forEach(([name, payload]) => {
      test(`should safely render ${name} payload in vaccine name`, async ({ page }) => {
        const record = createMockRecord({ vaccine_name: payload });
        await mockVaccinationRecords(page, [record]);
        await mockFreighterConnection(page, STELLAR_ADDRESSES.validPatient);
        await mockAuthEndpoints(page, STELLAR_ADDRESSES.validPatient);

        await page.goto('http://localhost:3000/patient');
        await page.waitForSelector('[role="button"]');

        // Verify payload is rendered as text
        const vaccineElement = page.locator('text=/💉/').first();
        const text = await vaccineElement.textContent();
        expect(text).toContain(payload.slice(0, 20)); // Check first 20 chars

        // Verify no malicious elements created
        await verifyNoMaliciousElements(page);
      });
    });
  });

  test.describe('Wallet Address XSS Protection', () => {
    test('should safely display wallet address with HTML entities', async ({ page }) => {
      const maliciousWallet = 'G' + HTML_ENTITIES.basic.slice(0, 54);
      const record = createMockRecord({ issuer: maliciousWallet });
      
      await mockVaccinationRecords(page, [record]);
      await mockFreighterConnection(page, STELLAR_ADDRESSES.validPatient);
      await mockAuthEndpoints(page, STELLAR_ADDRESSES.validPatient);

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      const issuerElement = page.locator('text=/Issuer:/').first();
      const text = await issuerElement.textContent();

      // Should display entities as text
      expect(text).toContain('&lt;');
      expect(text).not.toContain('<script>');
    });

    test('should safely display full wallet address on dashboard', async ({ page }) => {
      const maliciousWallet = 'GTEST<script>alert("XSS")</script>1234567890ABCDEF';
      
      await mockVaccinationRecords(page, []);
      await mockFreighterConnection(page, maliciousWallet);
      await mockAuthEndpoints(page, maliciousWallet);

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('text=/Wallet:/');

      const walletDisplay = page.locator('text=/Wallet:/');
      const text = await walletDisplay.textContent();

      expect(text).toContain('<script>');
      expect(text).toContain('</script>');
    });
  });

  test.describe('API Response XSS Protection', () => {
    test('should handle multiple malicious records from API', async ({ page }) => {
      const records = [
        createMockRecord({ vaccine_name: XSS_PAYLOADS.script }),
        createMockRecord({ vaccine_name: XSS_PAYLOADS.img, token_id: '2' }),
        createMockRecord({ vaccine_name: XSS_PAYLOADS.svg, token_id: '3' }),
      ];

      await mockVaccinationRecords(page, records);
      await mockFreighterConnection(page, STELLAR_ADDRESSES.validPatient);
      await mockAuthEndpoints(page, STELLAR_ADDRESSES.validPatient);

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      const cards = await page.locator('[role="button"]').count();
      expect(cards).toBe(3);

      await verifyNoMaliciousElements(page);
    });

    test('should handle malicious data in all record fields', async ({ page }) => {
      const record = createMockRecord({
        vaccine_name: XSS_PAYLOADS.script,
        date_administered: XSS_PAYLOADS.img,
        token_id: XSS_PAYLOADS.svg,
      });

      await mockVaccinationRecords(page, [record]);
      await mockFreighterConnection(page, STELLAR_ADDRESSES.validPatient);
      await mockAuthEndpoints(page, STELLAR_ADDRESSES.validPatient);

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      const card = page.locator('[role="button"]').first();
      const cardText = await card.textContent();

      // All payloads should be visible as text
      expect(cardText).toContain('<script>');
      expect(cardText).toContain('<img');
      expect(cardText).toContain('<svg');

      await verifyNoMaliciousElements(page);
    });
  });

  test.describe('Verify Page XSS Protection', () => {
    test('should safely render malicious data from verify endpoint', async ({ page }) => {
      const testWallet = STELLAR_ADDRESSES.validPatient;
      const record = createMockRecord({ vaccine_name: XSS_PAYLOADS.script });

      await mockVerifyEndpoint(page, testWallet, [record]);

      await page.goto('http://localhost:3000/verify');
      await page.fill('input[placeholder*="Stellar wallet"]', testWallet);
      await page.click('button[type="submit"]');

      await page.waitForSelector('[role="button"]');

      const vaccineElement = page.locator('text=/💉/').first();
      const text = await vaccineElement.textContent();
      expect(text).toContain('<script>');
      expect(text).toContain('</script>');

      await verifyNoMaliciousElements(page);
    });

    test('should handle XSS in URL query parameters', async ({ page }) => {
      const maliciousWallet = encodeURIComponent(XSS_PAYLOADS.script);

      await page.route('**/verify/*', async route => {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Invalid wallet address' }),
        });
      });

      await page.goto(`http://localhost:3000/verify?wallet=${maliciousWallet}`);
      await page.waitForSelector('input[placeholder*="Stellar wallet"]');

      const inputValue = await page.inputValue('input[placeholder*="Stellar wallet"]');
      expect(inputValue).toContain('<script>');
      expect(inputValue).toContain('</script>');
    });
  });

  test.describe('Form Input XSS Protection', () => {
    test('should accept but not execute XSS in issuer form', async ({ page }) => {
      await mockFreighterConnection(page, STELLAR_ADDRESSES.validIssuer, 'issuer');
      await mockAuthEndpoints(page, STELLAR_ADDRESSES.validIssuer, 'issuer');

      await page.goto('http://localhost:3000/issuer');
      await page.waitForSelector('form');

      await page.fill('input[placeholder*="Stellar"]', STELLAR_ADDRESSES.validPatient);
      await page.fill('input[placeholder*="COVID"]', XSS_PAYLOADS.script);
      await page.fill('input[type="date"]', '2024-01-15');

      const vaccineInput = await page.inputValue('input[placeholder*="COVID"]');
      expect(vaccineInput).toBe(XSS_PAYLOADS.script);

      // No script should execute
      await verifyNoMaliciousElements(page);
    });
  });

  test.describe('No dangerouslySetInnerHTML Usage', () => {
    test('should render HTML tags as text, not interpret them', async ({ page }) => {
      const record = createMockRecord({ vaccine_name: '<b>Bold</b> <i>Italic</i>' });

      await mockVaccinationRecords(page, [record]);
      await mockFreighterConnection(page, STELLAR_ADDRESSES.validPatient);
      await mockAuthEndpoints(page, STELLAR_ADDRESSES.validPatient);

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      // No <b> or <i> elements should be created
      const boldCount = await page.locator('b').count();
      const italicCount = await page.locator('i').count();
      expect(boldCount).toBe(0);
      expect(italicCount).toBe(0);

      // Tags should be visible as text
      const vaccineElement = page.locator('text=/💉/').first();
      const text = await vaccineElement.textContent();
      expect(text).toContain('<b>');
      expect(text).toContain('</b>');
      expect(text).toContain('<i>');
      expect(text).toContain('</i>');
    });

    test('should not interpret HTML entities', async ({ page }) => {
      const record = createMockRecord({ vaccine_name: HTML_ENTITIES.mixed });

      await mockVaccinationRecords(page, [record]);
      await mockFreighterConnection(page, STELLAR_ADDRESSES.validPatient);
      await mockAuthEndpoints(page, STELLAR_ADDRESSES.validPatient);

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      const vaccineElement = page.locator('text=/💉/').first();
      const text = await vaccineElement.textContent();

      expect(text).toContain('&lt;');
      expect(text).toContain('&gt;');
      expect(text).toContain('&amp;');
      expect(text).toContain('&quot;');
    });
  });

  test.describe('Interaction-based XSS', () => {
    test('should not execute onclick handlers when clicking cards', async ({ page }) => {
      const record = createMockRecord({ 
        vaccine_name: '<div onclick="alert(\'XSS\')">Click me</div>' 
      });

      await mockVaccinationRecords(page, [record]);
      await mockFreighterConnection(page, STELLAR_ADDRESSES.validPatient);
      await mockAuthEndpoints(page, STELLAR_ADDRESSES.validPatient);

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      const card = page.locator('[role="button"]').first();
      
      // Click the card multiple times
      await card.click();
      await card.click();
      await card.click();

      // No alert should appear (handled by dialog listener)
      await verifyNoMaliciousElements(page);
    });

    test('should not execute onmouseover handlers when hovering', async ({ page }) => {
      const record = createMockRecord({ 
        vaccine_name: '<div onmouseover="alert(\'XSS\')">Hover me</div>' 
      });

      await mockVaccinationRecords(page, [record]);
      await mockFreighterConnection(page, STELLAR_ADDRESSES.validPatient);
      await mockAuthEndpoints(page, STELLAR_ADDRESSES.validPatient);

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      const card = page.locator('[role="button"]').first();
      
      // Hover over the card
      await card.hover();
      await page.waitForTimeout(500); // Wait for any potential execution

      // No alert should appear
      await verifyNoMaliciousElements(page);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle empty/null values safely', async ({ page }) => {
      const record = createMockRecord({ 
        vaccine_name: '',
        date_administered: null,
      });

      await mockVaccinationRecords(page, [record]);
      await mockFreighterConnection(page, STELLAR_ADDRESSES.validPatient);
      await mockAuthEndpoints(page, STELLAR_ADDRESSES.validPatient);

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      // Should render without errors
      const cards = await page.locator('[role="button"]').count();
      expect(cards).toBe(1);
    });

    test('should handle very long XSS payloads', async ({ page }) => {
      const longPayload = XSS_PAYLOADS.script.repeat(100);
      const record = createMockRecord({ vaccine_name: longPayload });

      await mockVaccinationRecords(page, [record]);
      await mockFreighterConnection(page, STELLAR_ADDRESSES.validPatient);
      await mockAuthEndpoints(page, STELLAR_ADDRESSES.validPatient);

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      // Should render as text without executing
      const vaccineElement = page.locator('text=/💉/').first();
      const text = await vaccineElement.textContent();
      expect(text).toContain('<script>');

      await verifyNoMaliciousElements(page);
    });

    test('should handle Unicode and special characters', async ({ page }) => {
      const unicodePayload = '🚨<script>alert("XSS")</script>💉';
      const record = createMockRecord({ vaccine_name: unicodePayload });

      await mockVaccinationRecords(page, [record]);
      await mockFreighterConnection(page, STELLAR_ADDRESSES.validPatient);
      await mockAuthEndpoints(page, STELLAR_ADDRESSES.validPatient);

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      const vaccineElement = page.locator('text=/💉/').first();
      const text = await vaccineElement.textContent();
      expect(text).toContain('🚨');
      expect(text).toContain('<script>');
      expect(text).toContain('</script>');

      await verifyNoMaliciousElements(page);
    });
  });
});
