## What does this PR do?
Resolves #4309. Introduced stringUtils.js which provides shared string utilities (like slugify, maskString, maskEmail, stripHtml, truncate, capitalize, escapeHtml, unescapeHtml) for the admin dashboard. Also included a comprehensive test suite via Vitest which confirms all edge cases are passing.

Fixes #4309

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring / optimization

## How Has This Been Tested?
- [x] Tested locally
- [x] Verified UI/UX responsiveness
- [x] Checked for console warnings and errors
- [x] Added unit tests

## Checklist
- [x] My code follows the style guidelines of this project
- [x] I have performed a self-review of my own code
- [x] I have commented my code, particularly in hard-to-understand areas
- [x] My changes generate no new warnings
- [x] I have checked my code and corrected any misspellings
