# XSS Security Tests - Quick Start Guide

Get up and running with XSS security tests in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Installation

1. **Install dependencies** (if not already done):
```bash
cd frontend
npm install
```

2. **Install Playwright browsers** (first time only):
```bash
npx playwright install
```

That's it! You're ready to run tests.

## Running Tests

### Quick Test (Recommended for development)

Run XSS tests on Chromium only:
```bash
npm run test:xss -- --project=chromium
```

### Full Test Suite

Run on all browsers (Chromium, Firefox, WebKit):
```bash
npm run test:xss
```

### Interactive Mode (Best for debugging)

```bash
npm run test:ui
```

This opens a UI where you can:
- See tests in real-time
- Debug failures
- Inspect DOM state
- View network requests

### Watch Mode (During development)

```bash
npx playwright test xss-security --watch
```

## Understanding Results

### ✅ All tests pass
```
✓ should render script tag in vaccine name as text, not execute (1.2s)
✓ should render img onerror payload as text (0.8s)
✓ should render SVG onload payload as text (0.9s)
```

Your app is secure against tested XSS vectors!

### ❌ Test fails
```
✗ should render script tag in vaccine name as text, not execute
  Error: Unexpected dialog (potential XSS): XSS
```

This means an XSS payload was executed. Check:
1. The component rendering the data
2. Whether `dangerouslySetInnerHTML` is being used
3. Whether data is properly escaped

## Common Commands

```bash
# Run only XSS tests
npm run test:xss

# Run with visible browser
npm run test:headed

# Run specific test file
npx playwright test xss-security.spec.js

# Run specific test by name
npx playwright test -g "vaccine name"

# Debug a specific test
npx playwright test --debug -g "vaccine name"

# View last test report
npm run test:report
```

## What Gets Tested?

✅ **Vaccine names** - Script tags, HTML, event handlers  
✅ **Wallet addresses** - HTML entities, special characters  
✅ **API responses** - All fields with user data  
✅ **Form inputs** - Issuer and verify forms  
✅ **URL parameters** - Query string XSS  
✅ **Multiple vectors** - Combined attacks  

## Test Files

- `xss-security.spec.js` - Comprehensive test suite (all scenarios)
- `xss-security-simplified.spec.js` - Cleaner version using helpers
- `helpers/xss-payloads.js` - Reusable XSS payloads and utilities

## Debugging Failed Tests

### 1. Run in headed mode
```bash
npm run test:headed -- -g "failing test name"
```

### 2. Use debug mode
```bash
npx playwright test --debug -g "failing test name"
```

### 3. Check screenshots
Failed tests automatically capture screenshots:
```
test-results/
  xss-security-should-render-script-chromium/
    test-failed-1.png
```

### 4. View trace
```bash
npx playwright show-trace test-results/.../trace.zip
```

## Adding New Tests

When you add a component that displays user data:

```javascript
test('should safely render new field', async ({ page }) => {
  const record = createMockRecord({ 
    newField: '<script>alert("XSS")</script>' 
  });
  
  await mockVaccinationRecords(page, [record]);
  await page.goto('http://localhost:3000/page');
  
  const element = page.locator('text=/NewField:/');
  const text = await element.textContent();
  
  expect(text).toContain('<script>');
  await verifyNoMaliciousElements(page);
});
```

## CI/CD Integration

Tests automatically run on:
- Every push to main/develop
- Every pull request
- Daily at 2 AM UTC
- Manual trigger via GitHub Actions

View results in the Actions tab of your repository.

## Performance Tips

### Speed up tests during development

1. **Run single browser**:
```bash
npm run test:xss -- --project=chromium
```

2. **Run specific tests**:
```bash
npx playwright test -g "vaccine name"
```

3. **Use test.only** (temporarily):
```javascript
test.only('should test this one thing', async ({ page }) => {
  // ...
});
```

4. **Disable video/screenshots** (edit playwright.config.js):
```javascript
use: {
  video: 'off',
  screenshot: 'off',
}
```

## Troubleshooting

### "Browser not found"
```bash
npx playwright install
```

### "Port 3000 already in use"
Kill the process using port 3000 or change the port in `vite.config.js`

### "Tests timeout"
Increase timeout in `playwright.config.js`:
```javascript
timeout: 60000, // 60 seconds
```

### "Cannot find module"
```bash
npm install
```

## Best Practices

1. ✅ Run tests before committing
2. ✅ Run full suite before deploying
3. ✅ Add tests for new user-facing features
4. ✅ Review test failures immediately
5. ✅ Keep tests fast (mock API calls)
6. ❌ Don't skip failing tests
7. ❌ Don't disable XSS protection to pass tests

## Getting Help

- Check test output for error messages
- Review `tests/README.md` for detailed documentation
- Check Playwright docs: https://playwright.dev
- Review OWASP XSS guide: https://owasp.org/www-community/attacks/xss/

## Next Steps

1. Run the tests: `npm run test:xss`
2. Review the results
3. Fix any failures
4. Add tests for new features
5. Integrate into your CI/CD pipeline

Happy testing! 🔒
