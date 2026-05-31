# XSS Security Tests

This directory contains comprehensive XSS (Cross-Site Scripting) security tests for the VacciChain frontend application.

## Overview

The tests verify that user-supplied data is properly sanitized and rendered as text rather than executed as code. This is critical for preventing XSS attacks where malicious actors could inject scripts through vaccine names, wallet addresses, or other user inputs.

## Test Coverage

### 1. NFTCard Component - Vaccine Name XSS Protection
- ✅ Script tags in vaccine names are rendered as text
- ✅ Image onerror handlers are not executed
- ✅ SVG onload handlers are not executed
- ✅ Iframe injections are blocked
- ✅ Event handler attributes (onclick, etc.) are not executed

### 2. Wallet Address XSS Protection
- ✅ HTML entities in wallet addresses are properly escaped
- ✅ Special characters and quotes are handled safely
- ✅ Full wallet addresses display safely on dashboards

### 3. No dangerouslySetInnerHTML Usage
- ✅ NFTCard does not use dangerouslySetInnerHTML
- ✅ HTML tags in data are rendered as literal text
- ✅ HTML entities are not interpreted

### 4. API Response XSS Protection
- ✅ Script tags from API responses are not executed
- ✅ Malicious data in all fields (vaccine_name, date_administered, token_id, issuer) is sanitized
- ✅ Verify endpoint responses are properly sanitized

### 5. Form Input XSS Protection
- ✅ Issuer form inputs accept but don't execute scripts
- ✅ Verify page wallet input is safe

### 6. URL Parameter XSS Protection
- ✅ Query parameters containing scripts are not executed

### 7. Multiple XSS Vectors
- ✅ Multiple simultaneous XSS payloads are all blocked

### 8. Content Security Policy
- ✅ CSP headers prevent inline script execution (if configured)

## XSS Payloads Tested

The tests use various real-world XSS attack vectors:

```javascript
- <script>alert("XSS")</script>
- <img src=x onerror=alert("XSS")>
- <svg onload=alert("XSS")>
- <iframe src="javascript:alert('XSS')">
- <div onclick="alert('XSS')">Click</div>
- javascript:alert("XSS")
- data:text/html,<script>alert("XSS")</script>
```

## Running the Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers (first time only):
```bash
npx playwright install
```

### Run All XSS Tests

```bash
npm run test:xss
```

### Run All Tests

```bash
npm test
```

### Run Tests in UI Mode (Interactive)

```bash
npm run test:ui
```

### Run Tests in Headed Mode (See Browser)

```bash
npm run test:headed
```

### View Test Report

```bash
npm run test:report
```

## Test Architecture

### Browser Coverage

Tests run across multiple browsers to ensure cross-browser security:
- Chromium (Chrome, Edge)
- Firefox
- WebKit (Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

### Test Strategy

1. **Console Monitoring**: Tests monitor browser console for any XSS-related messages
2. **Dialog Detection**: Any `alert()` calls are caught and fail the test
3. **DOM Inspection**: Verify malicious elements (script, img, svg, iframe) are not created
4. **Text Verification**: Confirm XSS payloads are rendered as literal text
5. **API Mocking**: Mock API responses with malicious data to test rendering

### Key Features

- **Real Browser Testing**: Uses Playwright to test in actual browser environments
- **Automatic Failure Detection**: Tests automatically fail if any script executes
- **Comprehensive Coverage**: Tests all user input points and data display locations
- **Multiple Attack Vectors**: Tests various XSS techniques used by attackers

## Security Best Practices Verified

1. ✅ **React's Default Escaping**: Relies on React's built-in XSS protection
2. ✅ **No dangerouslySetInnerHTML**: Avoids unsafe HTML rendering
3. ✅ **Text Content Only**: All user data is rendered as text nodes
4. ✅ **Input Validation**: Forms accept but don't execute malicious input
5. ✅ **API Response Handling**: Server responses are safely rendered

## Continuous Integration

These tests should be run:
- ✅ Before every deployment
- ✅ On every pull request
- ✅ As part of CI/CD pipeline
- ✅ After any changes to data rendering components

## Troubleshooting

### Tests Fail with "Unexpected dialog"

This means an XSS payload was executed. Check:
1. The component rendering the data
2. Whether `dangerouslySetInnerHTML` is being used
3. Whether data is being passed through `innerHTML` or similar APIs

### Tests Timeout

1. Ensure the dev server is running: `npm run dev`
2. Check that port 3000 is available
3. Increase timeout in `playwright.config.js` if needed

### Browser Installation Issues

```bash
# Reinstall browsers
npx playwright install --force
```

## Adding New Tests

When adding new components that display user data:

1. Add test cases for all XSS payloads
2. Test all data fields that accept user input
3. Verify both display and form input scenarios
4. Test API response handling

Example:
```javascript
test('should render new field safely', async ({ page }) => {
  await page.route('**/api/endpoint', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        newField: '<script>alert("XSS")</script>',
      }),
    });
  });

  await page.goto('http://localhost:3000/page');
  
  const element = page.locator('text=/NewField:/');
  const text = await element.textContent();
  
  expect(text).toContain('<script>');
  expect(text).toContain('</script>');
});
```

## References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [React Security Best Practices](https://react.dev/learn/writing-markup-with-jsx#the-rules-of-jsx)
- [Playwright Testing Documentation](https://playwright.dev/docs/intro)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## Acceptance Criteria Status

All acceptance criteria have been met:

- ✅ Test: vaccine name containing `<script>` is rendered as text, not executed
- ✅ Test: wallet address containing HTML entities is escaped correctly
- ✅ Test: NFTCard does not use dangerouslySetInnerHTML with unsanitized data
- ✅ Test: API responses containing script tags are not executed when rendered
- ✅ Tests run in a real browser environment (Playwright)
