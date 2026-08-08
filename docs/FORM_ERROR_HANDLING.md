# Form Error Handling & Submission Reliability

## Overview

This document outlines the error handling strategy for form submissions in NexaSphere, ensuring users receive clear feedback and no silent failures occur.

## Form Submission Error Handling Pattern

### Standard Pattern

All form submissions in NexaSphere follow this error handling pattern:

```javascript
async function submit() {
  try {
    // 1. Validate local state
    if (!validate()) {
      setErr('Please complete required fields');
      return;
    }

    // 2. Prepare payload
    const payload = {
      /* ... */
    };

    // 3. Send request (with proper error checking)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // 4. Parse response (with fallback for invalid JSON)
    const data = await res.json().catch(() => ({}));

    // 5. Check HTTP status code
    if (!res.ok) {
      throw new Error(data?.error || `Submission failed (${res.status})`);
    }

    // 6. Handle success
    setSuccess(true);
    clearDraft();
  } catch (e) {
    // Always show error to user
    setErr(e?.message || 'Something went wrong. Please try again.');
  } finally {
    setBusy(false);
  }
}
```

## Error Categories

### 1. Validation Errors

- Empty required fields
- Invalid email format
- Duplicate submissions (409 status)

**User Message:** "Please complete the required fields (\*)"

### 2. Network Errors

- Connection timeout
- No response from server
- CORS errors

**User Message:** "Network error. Please check your connection and try again."

### 3. Server Errors

- 5xx errors from backend
- Invalid response format
- Google Apps Script errors

**User Message:** "Submission failed. Please try again later."

### 4. Application Errors

- Missing environment variables
- Invalid configuration
- Unhandled exceptions

**User Message:** "Something went wrong. Please try again."

## Key Principles

### ✓ Never Silent Failures

- Always catch and display errors
- Never assume success without checking `res.ok`
- Never ignore `no-cors` response limitations

### ✓ Clear User Feedback

- Use plain English error messages
- Explain what went wrong and what to do
- Show specific validation errors where possible

### ✓ Proper Response Parsing

- Check HTTP status code, not just network success
- Handle invalid JSON responses gracefully
- Provide fallback error messages

### ✓ Environment Configuration

- Store sensitive URLs in environment variables
- Never hardcode deployment URLs
- Load from `import.meta.env.VITE_*` (Vite)

## Implementation in NexaSphere

### RecruitmentPage.jsx

- Endpoint: `/api/submissions/recruitment`
- Error handler: Shows descriptive error messages
- Duplicate check: 409 status triggers specific message

### MembershipPage.jsx

- Endpoint: `/api/submissions/membership`
- Error handler: Shows descriptive error messages
- Duplicate check: 409 status triggers specific message

## Testing Error Handling

### Manual Testing

1. Submit form with incomplete fields → validation error
2. Disconnect network → network error
3. Submit during server downtime → server error
4. Submit duplicate email → specific error message

### Automated Testing

```javascript
test('shows error when submission fails', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 500,
    json: () => ({ error: 'Server error' }),
  });

  await submitForm();
  expect(screen.getByText('Submission failed')).toBeInTheDocument();
});
```

## Related Security Measures

- **No CORS Mode:** Avoid `mode: 'no-cors'` which hides error status
- **CSRF Protection:** Include origin verification token in submissions
- **Rate Limiting:** Backend enforces rate limits to prevent abuse
- **Input Validation:** Server-side validation for all user inputs

## See Also

- [SECURITY.md](../SECURITY.md) — General security practices
- [.env.example](../.env.example) — Environment variable configuration
- [RecruitmentPage.jsx](../src/pages/recruitment/RecruitmentPage.jsx)
- [MembershipPage.jsx](../src/pages/membership/MembershipPage.jsx)
