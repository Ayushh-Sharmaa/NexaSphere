## What does this PR do?
Resolves #1503. Fixed Real-time Analytics Dashboard lag by adding a 5-minute request caching layer to nalyticsAPI.js and memoizing Recharts data arrays using useMemo. This prevents unnecessary re-renders of heavy chart components and drastically reduces network payload for repetitive loads, helping it load well under 1.5s.

Fixes #1503

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [x] Code refactoring / optimization

## How Has This Been Tested?
- [x] Tested locally
- [x] Verified UI/UX responsiveness
- [x] Checked for console warnings and errors

## Checklist
- [x] My code follows the style guidelines of this project
- [x] I have performed a self-review of my own code
- [x] I have commented my code, particularly in hard-to-understand areas
- [x] My changes generate no new warnings
- [x] I have checked my code and corrected any misspellings
