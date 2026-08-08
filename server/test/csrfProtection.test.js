import assert from "assert";
import { csrfProtection, generateCsrfToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "../middleware/csrfProtection.js";

function runTests() {
  console.log("Running CSRF Protection Middleware Tests...");

  // Test 1: Generate valid token
  const token = generateCsrfToken();
  assert.strictEqual(typeof token, "string");
  assert.strictEqual(token.length, 64);

  // Test 2: Safe HTTP method bypasses validation and sets cookie
  let cookieSet = false;
  const mockReqGet = { method: "GET", cookies: {}, headers: {} };
  const mockResGet = {
    cookie: (name, val, options) => {
      cookieSet = true;
      assert.strictEqual(name, CSRF_COOKIE_NAME);
      assert.strictEqual(options.sameSite, "Strict");
    },
  };
  let nextCalled = false;
  csrfProtection(mockReqGet, mockResGet, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(cookieSet, true);

  // Test 3: POST request with invalid CSRF token returns 403
  const testToken = generateCsrfToken();
  const mockReqPostInvalid = {
    method: "POST",
    cookies: { [CSRF_COOKIE_NAME]: testToken },
    headers: { [CSRF_HEADER_NAME]: "invalid-token-value-12345678901234567890123456789012345678901234567890123456" },
  };
  let statusSet = 0;
  let jsonResult = null;
  const mockResPostInvalid = {
    cookie: () => {},
    status: (code) => {
      statusSet = code;
      return {
        json: (data) => { jsonResult = data; },
      };
    },
  };
  csrfProtection(mockReqPostInvalid, mockResPostInvalid, () => {});
  assert.strictEqual(statusSet, 403);
  assert.strictEqual(jsonResult.error, "Forbidden");

  // Test 4: POST request with valid CSRF token passes
  const mockReqPostValid = {
    method: "POST",
    cookies: { [CSRF_COOKIE_NAME]: testToken },
    headers: { [CSRF_HEADER_NAME]: testToken },
  };
  let postValidPassed = false;
  csrfProtection(mockReqPostValid, { cookie: () => {} }, () => { postValidPassed = true; });
  assert.strictEqual(postValidPassed, true);

  console.log("All CSRF Protection tests passed successfully!");
}

runTests();
