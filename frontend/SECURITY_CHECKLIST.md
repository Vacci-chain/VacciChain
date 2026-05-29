# Frontend Security Checklist

Use this checklist when developing or reviewing code to ensure XSS protection is maintained.

## ✅ Before Committing Code

### Data Rendering
- [ ] All user-supplied data is rendered using React's default escaping (JSX)
- [ ] No use of `dangerouslySetInnerHTML` with unsanitized data
- [ ] No direct manipulation of `innerHTML`, `outerHTML`, or `insertAdjacentHTML`
- [ ] No use of `document.write()` or `document.writeln()`

### Component Development
- [ ] New components that display user data have XSS tests
- [ ] Props containing user data are rendered as text, not HTML
- [ ] Event handlers don't execute user-supplied code
- [ ] No `eval()` or `Function()` constructor with user input

### API Integration
- [ ] API responses are treated as untrusted data
- [ ] Data from API is not passed to dangerous functions
- [ ] Error messages from API are safely displayed
- [ ] API data is validated before rendering

### Form Handling
- [ ] Form inputs accept but don't execute scripts
- [ ] Input validation is performed (but doesn't rely on it for XSS protection)
- [ ] Form data is safely displayed after submission
- [ ] File uploads are properly validated and sanitized

### URL Handling
- [ ] Query parameters are safely extracted and displayed
- [ ] URL fragments are not executed as code
- [ ] `window.location` is not set to user input without validation
- [ ] Links with `javascript:` protocol are blocked or sanitized

## ✅ Before Deploying

### Testing
- [ ] All XSS tests pass: `npm run test:xss`
- [ ] Tests run on all browsers (Chromium, Firefox, WebKit)
- [ ] No console errors or warnings in browser
- [ ] Manual testing with XSS payloads completed

### Security Headers
- [ ] Content-Security-Policy header is configured
- [ ] X-Content-Type-Options: nosniff is set
- [ ] X-Frame-Options is configured
- [ ] Referrer-Policy is set appropriately

### Dependencies
- [ ] All npm packages are up to date
- [ ] No known vulnerabilities: `npm audit`
- [ ] Dependencies are from trusted sources
- [ ] Lock file is committed

### Code Review
- [ ] Security-focused code review completed
- [ ] No hardcoded secrets or API keys
- [ ] Logging doesn't expose sensitive data
- [ ] Error messages don't reveal system details

## ✅ When Adding New Features

### New Component Checklist
```javascript
// ✅ GOOD - React's default escaping
function VaccineCard({ vaccine }) {
  return <div>{vaccine.name}</div>;
}

// ❌ BAD - dangerouslySetInnerHTML
function VaccineCard({ vaccine }) {
  return <div dangerouslySetInnerHTML={{ __html: vaccine.name }} />;
}

// ❌ BAD - innerHTML
function VaccineCard({ vaccine }) {
  const ref = useRef();
  useEffect(() => {
    ref.current.innerHTML = vaccine.name;
  }, [vaccine.name]);
  return <div ref={ref} />;
}
```

### New API Endpoint Checklist
- [ ] Response data is typed/validated
- [ ] Error responses are safely handled
- [ ] No sensitive data in error messages
- [ ] Rate limiting is implemented
- [ ] Authentication is required where appropriate

### New Form Checklist
- [ ] Input validation on client and server
- [ ] CSRF protection is implemented
- [ ] Form data is sanitized on server
- [ ] Success/error messages are safely displayed
- [ ] File uploads are validated and scanned

## ✅ Common XSS Vulnerabilities to Avoid

### 1. dangerouslySetInnerHTML
```javascript
// ❌ NEVER DO THIS
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ DO THIS INSTEAD
<div>{userInput}</div>
```

### 2. innerHTML
```javascript
// ❌ NEVER DO THIS
element.innerHTML = userInput;

// ✅ DO THIS INSTEAD
element.textContent = userInput;
```

### 3. eval() and Function()
```javascript
// ❌ NEVER DO THIS
eval(userInput);
new Function(userInput)();

// ✅ DO THIS INSTEAD
// Use JSON.parse for data, or avoid dynamic code execution
```

### 4. javascript: URLs
```javascript
// ❌ NEVER DO THIS
<a href={`javascript:${userInput}`}>Click</a>

// ✅ DO THIS INSTEAD
<a href={sanitizeUrl(userInput)}>Click</a>
```

### 5. Event Handlers from User Input
```javascript
// ❌ NEVER DO THIS
<div onClick={eval(userInput)}>Click</div>

// ✅ DO THIS INSTEAD
<div onClick={handleClick}>Click</div>
```

## ✅ Testing Checklist

### Manual Testing
- [ ] Test with `<script>alert('XSS')</script>` in all inputs
- [ ] Test with `<img src=x onerror=alert('XSS')>` in all inputs
- [ ] Test with HTML entities in all inputs
- [ ] Test with very long inputs (1000+ characters)
- [ ] Test with Unicode and special characters

### Automated Testing
- [ ] Run XSS test suite: `npm run test:xss`
- [ ] Run in UI mode to debug: `npm run test:ui`
- [ ] Check test coverage for new components
- [ ] Review test report: `npm run test:report`

### Browser Testing
- [ ] Test in Chrome/Chromium
- [ ] Test in Firefox
- [ ] Test in Safari/WebKit
- [ ] Test on mobile devices
- [ ] Test with browser extensions disabled

## ✅ Security Tools

### Recommended Tools
- [ ] **Playwright**: Automated XSS testing (already configured)
- [ ] **npm audit**: Check for vulnerable dependencies
- [ ] **ESLint**: Static code analysis with security rules
- [ ] **OWASP ZAP**: Dynamic application security testing
- [ ] **Snyk**: Continuous security monitoring

### Running Security Scans
```bash
# Check for vulnerable dependencies
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Run XSS tests
npm run test:xss

# Run linter with security rules
npm run lint
```

## ✅ Incident Response

### If XSS Vulnerability is Found

1. **Immediate Actions**
   - [ ] Document the vulnerability
   - [ ] Assess the impact and severity
   - [ ] Notify the security team
   - [ ] Create a hotfix branch

2. **Fix Development**
   - [ ] Write a failing test that reproduces the issue
   - [ ] Implement the fix
   - [ ] Verify the test now passes
   - [ ] Add additional tests for similar scenarios

3. **Deployment**
   - [ ] Deploy fix to production ASAP
   - [ ] Monitor for any issues
   - [ ] Verify fix in production
   - [ ] Update security documentation

4. **Post-Incident**
   - [ ] Conduct root cause analysis
   - [ ] Update security checklist
   - [ ] Add new test cases
   - [ ] Train team on lessons learned

## ✅ Resources

### Documentation
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [React Security Best Practices](https://react.dev/learn/writing-markup-with-jsx)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Playwright Testing Docs](https://playwright.dev/docs/intro)

### Internal Documentation
- `frontend/tests/README.md` - Detailed test documentation
- `frontend/tests/QUICKSTART.md` - Quick start guide
- `frontend/tests/ACCEPTANCE_CRITERIA.md` - Acceptance criteria verification

### Training
- Complete OWASP Top 10 training
- Review XSS attack examples
- Practice with intentionally vulnerable apps (e.g., DVWA)
- Participate in security code reviews

## ✅ Regular Maintenance

### Weekly
- [ ] Review CI/CD test results
- [ ] Check for failed security tests
- [ ] Monitor security alerts from GitHub

### Monthly
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review and update XSS test payloads
- [ ] Check for new security best practices
- [ ] Update dependencies

### Quarterly
- [ ] Security audit of new features
- [ ] Review and update security documentation
- [ ] Team security training session
- [ ] Penetration testing (if applicable)

### Annually
- [ ] Full security review and assessment
- [ ] Update security policies
- [ ] Review and update all security tests
- [ ] External security audit (recommended)

## ✅ Team Responsibilities

### Developers
- Write secure code by default
- Add XSS tests for new features
- Review security checklist before committing
- Participate in security code reviews

### Code Reviewers
- Verify security checklist is followed
- Check for XSS vulnerabilities
- Ensure tests are comprehensive
- Approve only secure code

### Security Team
- Maintain security documentation
- Conduct security audits
- Respond to security incidents
- Provide security training

### DevOps
- Configure security headers
- Monitor security alerts
- Maintain CI/CD security checks
- Manage secrets and credentials

---

## Quick Reference Card

### ✅ Safe Practices
```javascript
// Rendering user data
<div>{userData}</div>

// Setting text content
element.textContent = userData;

// Creating elements
const div = document.createElement('div');
div.textContent = userData;

// URL handling
const url = new URL(userInput, window.location.origin);
```

### ❌ Unsafe Practices
```javascript
// NEVER use these with user input
dangerouslySetInnerHTML={{ __html: userData }}
element.innerHTML = userData;
eval(userData);
new Function(userData)();
<a href={`javascript:${userData}`}>
```

---

**Remember**: Security is everyone's responsibility. When in doubt, ask for a security review!

**Last Updated**: 2026-05-28  
**Version**: 1.0
