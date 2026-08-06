## What does this PR do?
Resolves #1496. Extracted ProjectCard and ProjectDetailModal into separate memoized components with React.memo and implemented React.lazy() for the modal to fix the Portfolio builder lag and prevent slow React reconciliation when rendering a large number of projects.

Fixes #1496

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
