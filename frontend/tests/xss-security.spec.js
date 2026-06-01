/**
 * XSS Security Tests
 * 
 * Tests verify that user-supplied data (vaccine names, wallet addresses) 
 * is properly sanitized and rendered as text, not executed as code.
 */

import { test, expect } from '@playwright/test';

// XSS payloads to test
const XSS_PAYLOADS = {
  script: '<script>alert("XSS")</script>',
  img: '<img src=x onerror=alert("XSS")>',
  svg: '<svg onload=alert("XSS")>',
  iframe: '<iframe src="javascript:alert(\'XSS\')">',
  eventHandler: '<div onclick="alert(\'XSS\')">Click</div>',
  javascript: 'javascript:alert("XSS")',
  dataUri: 'data:text/html,<script>alert("XSS")</script>',
};

const HTML_ENTITIES = {
  basic: '&lt;script&gt;alert("XSS")&lt;/script&gt;',
  quotes: '&quot;&apos;&amp;',
  mixed: 'Test &lt;b&gt;bold&lt;/b&gt; &amp; &quot;quotes&quot;',
};

// Mock API responses
const createMockRecord = (vaccineName, issuer = 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ234567') => ({
  token_id: '1',
  vaccine_name: vaccineName,
  date_administered: '2024-01-15',
  issuer: issuer,
  patient: 'GPATIENT1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ23456',
});

test.describe('XSS Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console monitoring to detect any script execution
    page.on('console', msg => {
      // Fail test if we see alert or XSS-related console messages
      const text = msg.text();
      if (text.includes('XSS') || text.includes('alert')) {
        throw new Error(`Potential XSS detected in console: ${text}`);
      }
    });

    // Set up dialog monitoring to detect alert() calls
    page.on('dialog', async dialog => {
      throw new Error(`Unexpected dialog (potential XSS): ${dialog.message()}`);
    });
  });

  test.describe('NFTCard Component - Vaccine Name XSS Protection', () => {
    test('should render script tag in vaccine name as text, not execute', async ({ page }) => {
      // Mock API response with XSS payload in vaccine name
      await page.route('**/vaccination/*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            records: [createMockRecord(XSS_PAYLOADS.script)],
          }),
        });
      });

      // Mock auth
      await page.route('**/auth/challenge', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ challenge: 'test-challenge' }),
        });
      });

      await page.goto('http://localhost:3000/patient');

      // Wait for the card to render
      await page.waitForSelector('[role="button"]');

      // Get the vaccine name element
      const vaccineNameElement = page.locator('text=/💉/').first();
      const text = await vaccineNameElement.textContent();

      // Verify the script tag is rendered as text
      expect(text).toContain('<script>');
      expect(text).toContain('alert("XSS")');
      expect(text).toContain('</script>');

      // Verify no script was executed (no alert dialog appeared)
      // This is handled by the dialog listener in beforeEach
    });

    test('should render img onerror payload as text', async ({ page }) => {
      await page.route('**/vaccination/*', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            records: [createMockRecord(XSS_PAYLOADS.img)],
          }),
        });
      });

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      const vaccineNameElement = page.locator('text=/💉/').first();
      const text = await vaccineNameElement.textContent();

      expect(text).toContain('<img src=x onerror=alert("XSS")>');
      
      // Verify no img element was created
      const imgElements = await page.locator('img[src="x"]').count();
      expect(imgElements).toBe(0);
    });

    test('should render SVG onload payload as text', async ({ page }) => {
      await page.route('**/vaccination/*', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            records: [createMockRecord(XSS_PAYLOADS.svg)],
          }),
        });
      });

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      const vaccineNameElement = page.locator('text=/💉/').first();
      const text = await vaccineNameElement.textContent();

      expect(text).toContain('<svg onload=alert("XSS")>');
      
      // Verify no SVG element was created
      const svgElements = await page.locator('svg').count();
      expect(svgElements).toBe(0);
    });

    test('should render iframe payload as text', async ({ page }) => {
      await page.route('**/vaccination/*', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            records: [createMockRecord(XSS_PAYLOADS.iframe)],
          }),
        });
      });

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      const vaccineNameElement = page.locator('text=/💉/').first();
      const text = await vaccineNameElement.textContent();

      expect(text).toContain('<iframe');
      
      // Verify no iframe was created
      const iframeElements = await page.locator('iframe').count();
      expect(iframeElements).toBe(0);
    });

    test('should render event handler payload as text', async ({ page }) => {
      await page.route('**/vaccination/*', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            records: [createMockRecord(XSS_PAYLOADS.eventHandler)],
          }),
        });
      });

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      const vaccineNameElement = page.locator('text=/💉/').first();
      const text = await vaccineNameElement.textContent();

      expect(text).toContain('onclick');
      
      // Try clicking the card - should not trigger the malicious onclick
      const card = page.locator('[role="button"]').first();
      await card.click();
      
      // No alert should appear (handled by dialog listener)
    });
  });

  test.describe('Wallet Address XSS Protection', () => {
    test('should escape HTML entities in wallet addresses correctly', async ({ page }) => {
      const maliciousWallet = 'G' + HTML_ENTITIES.basic.slice(0, 54);
      
      await page.route('**/vaccination/*', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            records: [createMockRecord('COVID-19', maliciousWallet)],
          }),
        });
      });

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      // Check issuer display in card
      const issuerElement = page.locator('text=/Issuer:/').first();
      const text = await issuerElement.textContent();

      // Should display the escaped entities as text
      expect(text).toContain('&lt;');
      expect(text).not.toContain('<script>');
    });

    test('should handle wallet address with quotes and special chars', async ({ page }) => {
      const maliciousWallet = 'G' + HTML_ENTITIES.quotes.slice(0, 54);
      
      await page.route('**/vaccination/*', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            records: [createMockRecord('COVID-19', maliciousWallet)],
          }),
        });
      });

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      const issuerElement = page.locator('text=/Issuer:/').first();
      const text = await issuerElement.textContent();

      // Entities should be displayed as text
      expect(text).toContain('&');
    });

    test('should display full wallet address safely on patient dashboard', async ({ page }) => {
      const maliciousWallet = 'GTEST<script>alert("XSS")</script>1234567890ABCDEF';
      
      await page.route('**/vaccination/*', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ records: [] }),
        });
      });

      // Mock Freighter connection
      await page.addInitScript((wallet) => {
        window.freighter = {
          isConnected: async () => true,
          getPublicKey: async () => wallet,
        };
      }, maliciousWallet);

      await page.goto('http://localhost:3000/patient');
      
      // Wait for wallet display
      await page.waitForSelector('text=/Wallet:/');
      
      const walletDisplay = page.locator('text=/Wallet:/');
      const text = await walletDisplay.textContent();

      // Script tag should be rendered as text
      expect(text).toContain('<script>');
      expect(text).toContain('</script>');
    });
  });

  test.describe('NFTCard - No dangerouslySetInnerHTML', () => {
    test('should verify NFTCard does not use dangerouslySetInnerHTML', async ({ page }) => {
      await page.route('**/vaccination/*', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            records: [createMockRecord('<b>Bold Vaccine</b>')],
          }),
        });
      });

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      // If dangerouslySetInnerHTML was used, the <b> tag would be rendered
      const boldElements = await page.locator('b').count();
      expect(boldElements).toBe(0);

      // The text should contain the literal tags
      const vaccineNameElement = page.locator('text=/💉/').first();
      const text = await vaccineNameElement.textContent();
      expect(text).toContain('<b>');
      expect(text).toContain('</b>');
    });

    test('should render HTML entities without interpretation', async ({ page }) => {
      await page.route('**/vaccination/*', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            records: [createMockRecord(HTML_ENTITIES.mixed)],
          }),
        });
      });

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      const vaccineNameElement = page.locator('text=/💉/').first();
      const text = await vaccineNameElement.textContent();

      // HTML entities should be displayed as-is
      expect(text).toContain('&lt;');
      expect(text).toContain('&gt;');
      expect(text).toContain('&amp;');
      expect(text).toContain('&quot;');
    });
  });

  test.describe('API Response XSS Protection', () => {
    test('should not execute script tags from API response in vaccine name', async ({ page }) => {
      await page.route('**/vaccination/*', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            records: [
              createMockRecord(XSS_PAYLOADS.script),
              createMockRecord(XSS_PAYLOADS.img),
              createMockRecord(XSS_PAYLOADS.svg),
            ],
          }),
        });
      });

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      // Verify all three cards are rendered
      const cards = await page.locator('[role="button"]').count();
      expect(cards).toBe(3);

      // No scripts should have executed (dialog listener would catch it)
    });

    test('should not execute script tags from verify API response', async ({ page }) => {
      const testWallet = 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      
      await page.route(`**/verify/${testWallet}`, async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            vaccinated: true,
            record_count: 1,
            records: [createMockRecord(XSS_PAYLOADS.script)],
          }),
        });
      });

      await page.goto('http://localhost:3000/verify');
      
      // Fill in wallet address and submit
      await page.fill('input[placeholder*="Stellar wallet"]', testWallet);
      await page.click('button[type="submit"]');

      // Wait for results
      await page.waitForSelector('[role="button"]');

      // Verify the script tag is rendered as text
      const vaccineNameElement = page.locator('text=/💉/').first();
      const text = await vaccineNameElement.textContent();
      expect(text).toContain('<script>');
      expect(text).toContain('</script>');
    });

    test('should handle malicious data in date_administered field', async ({ page }) => {
      await page.route('**/vaccination/*', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            records: [{
              ...createMockRecord('COVID-19'),
              date_administered: '<script>alert("XSS")</script>',
            }],
          }),
        });
      });

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      const dateElement = page.locator('text=/Date:/').first();
      const text = await dateElement.textContent();

      // Script should be rendered as text
      expect(text).toContain('<script>');
      expect(text).toContain('</script>');
    });

    test('should handle malicious data in token_id field', async ({ page }) => {
      await page.route('**/vaccination/*', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            records: [{
              ...createMockRecord('COVID-19'),
              token_id: '<img src=x onerror=alert("XSS")>',
            }],
          }),
        });
      });

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      // Token ID is displayed with # prefix
      const tokenElement = page.locator('text=/#/').first();
      const text = await tokenElement.textContent();

      // Should render as text
      expect(text).toContain('<img');
      
      // No img element should be created
      const imgElements = await page.locator('img[src="x"]').count();
      expect(imgElements).toBe(0);
    });
  });

  test.describe('Form Input XSS Protection', () => {
    test('should not execute scripts entered in issuer form vaccine name', async ({ page }) => {
      // Mock issuer authentication
      await page.addInitScript(() => {
        window.freighter = {
          isConnected: async () => true,
          getPublicKey: async () => 'GISSUER1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ2345',
        };
      });

      await page.route('**/auth/challenge', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ challenge: 'test-challenge' }),
        });
      });

      await page.route('**/auth/verify', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            publicKey: 'GISSUER1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ2345',
            role: 'issuer',
          }),
        });
      });

      await page.goto('http://localhost:3000/issuer');
      await page.waitForSelector('form');

      // Fill form with XSS payload
      await page.fill('input[placeholder*="Stellar"]', 'GPATIENT1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ23456');
      await page.fill('input[placeholder*="COVID"]', XSS_PAYLOADS.script);
      await page.fill('input[type="date"]', '2024-01-15');

      // The form should accept the input as text
      const vaccineInput = await page.inputValue('input[placeholder*="COVID"]');
      expect(vaccineInput).toBe(XSS_PAYLOADS.script);

      // No script should execute while typing
    });

    test('should not execute scripts in verify page wallet input', async ({ page }) => {
      await page.goto('http://localhost:3000/verify');

      // Enter XSS payload in wallet input
      await page.fill('input[placeholder*="Stellar wallet"]', XSS_PAYLOADS.script);

      const inputValue = await page.inputValue('input[placeholder*="Stellar wallet"]');
      expect(inputValue).toBe(XSS_PAYLOADS.script);

      // No script should execute
    });
  });

  test.describe('URL Parameter XSS Protection', () => {
    test('should not execute scripts from URL query parameters', async ({ page }) => {
      const maliciousWallet = encodeURIComponent(XSS_PAYLOADS.script);
      
      await page.route('**/verify/*', async route => {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Invalid wallet address' }),
        });
      });

      await page.goto(`http://localhost:3000/verify?wallet=${maliciousWallet}`);

      // Wait for page to load
      await page.waitForSelector('input[placeholder*="Stellar wallet"]');

      // The input should contain the decoded script as text
      const inputValue = await page.inputValue('input[placeholder*="Stellar wallet"]');
      expect(inputValue).toContain('<script>');
      expect(inputValue).toContain('</script>');

      // No script should execute
    });
  });

  test.describe('Multiple XSS Vectors Combined', () => {
    test('should handle multiple XSS payloads in different fields simultaneously', async ({ page }) => {
      await page.route('**/vaccination/*', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            records: [{
              token_id: XSS_PAYLOADS.img,
              vaccine_name: XSS_PAYLOADS.script,
              date_administered: XSS_PAYLOADS.svg,
              issuer: 'G' + XSS_PAYLOADS.eventHandler.slice(0, 54),
              patient: 'GPATIENT1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ23456',
            }],
          }),
        });
      });

      await page.goto('http://localhost:3000/patient');
      await page.waitForSelector('[role="button"]');

      // All payloads should be rendered as text
      const card = page.locator('[role="button"]').first();
      const cardText = await card.textContent();

      expect(cardText).toContain('<script>');
      expect(cardText).toContain('<img');
      expect(cardText).toContain('<svg');

      // No scripts should execute
      // No HTML elements should be created
      const imgCount = await page.locator('img[src="x"]').count();
      const svgCount = await page.locator('svg').count();
      expect(imgCount).toBe(0);
      expect(svgCount).toBe(0);
    });
  });

  test.describe('Content Security Policy Verification', () => {
    test('should have appropriate CSP headers to prevent inline scripts', async ({ page }) => {
      const response = await page.goto('http://localhost:3000');
      const headers = response.headers();

      // Check if CSP header exists (optional but recommended)
      if (headers['content-security-policy']) {
        const csp = headers['content-security-policy'];
        
        // Should not allow unsafe-inline for scripts
        expect(csp).not.toContain("script-src 'unsafe-inline'");
        
        // Should not allow unsafe-eval
        expect(csp).not.toContain("'unsafe-eval'");
      }
    });
  });
});
