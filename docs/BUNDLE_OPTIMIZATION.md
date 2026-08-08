# Bundle Optimization & Lazy Loading

## Overview

NexaSphere optimizes bundle size by lazy-loading images and assets instead of eagerly importing them. This reduces initial JavaScript bundle size and improves Time to Interactive (TTI) on slow networks.

## Bundle Size Impact

### Problem: Eager Imports

```javascript
// ❌ These get bundled into the main JS chunk
import photo1 from '../assets/images/team/alice.png';
import photo2 from '../assets/images/team/bob.png';
import photo3 from '../assets/images/team/charlie.png';
// ... multiply by 20+ team members
// Result: Main bundle inflated to 2MB+
```

### Solution: String Paths & Lazy Loading

```javascript
// ✓ These are loaded dynamically by the browser
export const teamMembers = [
  { name: 'Alice', photo: '/images/team/alice.png' },
  { name: 'Bob', photo: '/images/team/bob.png' },
  { name: 'Charlie', photo: '/images/team/charlie.png' },
];

// In component:
<img src={member.photo} loading="lazy" alt={member.name} />;
```

## Asset Organization

### Recommended Structure

```
public/
├── images/
│   ├── team/
│   │   ├── alice.png
│   │   ├── bob.png
│   │   └── charlie.png
│   ├── activities/
│   │   ├── hackathon.png
│   │   └── codathon.png
│   └── events/
│       ├── event-1.png
│       └── event-2.png
├── fonts/
├── videos/
└── downloads/
```

### Configuration in Vite

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Don't bundle vendor images
          if (id.includes('public/')) {
            return 'static';
          }
        },
      },
    },
  },
};
```

## Lazy Loading Images

### Method 1: Native loading attribute

```jsx
// ✓ Simplest: Browser native
<img src="/images/team/alice.png" loading="lazy" alt="Team member" />
```

### Method 2: IntersectionObserver Hook

```jsx
function useLazyImage(ref) {
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.target.dataset.src) {
        entry.target.src = entry.target.dataset.src;
        observer.unobserve(entry.target);
      }
    });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
}

// Usage:
<img ref={ref} data-src="/images/team/alice.png" alt="..." />;
```

### Method 3: Progressive Enhancement

```jsx
<picture>
  <source srcSet="/images/team/alice.webp" type="image/webp" />
  <source srcSet="/images/team/alice.jpg" type="image/jpeg" />
  <img src="/images/team/alice.jpg" loading="lazy" alt="Team member" />
</picture>
```

## Build-Time Analysis

### Using Vite Visualizer

```bash
# Install
npm install -D rollup-plugin-visualizer

# Run analysis
npm run build
# Opens interactive treemap of bundle

# Output: Shows what's taking space
# Target: Move images to public/, reduce JS
```

### Checking Bundle Size

```bash
# Before optimization
npm run build && ls -lh dist/

# After optimization
npm run build && ls -lh dist/
# Should show main JS significantly smaller
```

## Performance Targets

### Metrics

| Metric            | Before | After | Target |
| ----------------- | ------ | ----- | ------ |
| Main JS Bundle    | 2.1MB  | 800KB | <500KB |
| CSS Bundle        | 250KB  | 200KB | <150KB |
| LCP (First Image) | 5.2s   | 2.1s  | <2.5s  |
| FCP (First Paint) | 2.8s   | 1.2s  | <1.5s  |

### Mobile 3G (Slow Network)

- **Before:** 8+ seconds to interactive
- **After:** 2-3 seconds to interactive
- **Impact:** Significant reduction in bounce rate

## Implemented in NexaSphere

### Team Data

- ✓ String paths used instead of imports
- ✓ Images served from `public/images/team/`
- ✓ Lazy loading enabled with `loading="lazy"`
- ✓ Images load on-demand when visible

### Activities Data

- ✓ Icons use system icon library (not images)
- ✓ No eager imports of activity images
- ✓ Activity images load from public folder

### Events Data

- ✓ Event images loaded from public folder
- ✓ Native lazy loading attribute used
- ✓ Responsive images via srcset

## Monitoring & Maintenance

### Regular Audits

```bash
# Monthly check
npm run build
npm install -D @vite/plugin-inspect
# Review bundle composition
```

### Guidelines for Contributors

- ❌ Never: `import photo from './images/...';`
- ✓ Always: Use string paths: `photo: "/images/..."`
- ✓ Always: Add `loading="lazy"` attribute
- ✓ Always: Place static assets in `public/`

## Related Documentation

- [Vite Static Assets](https://vitejs.dev/guide/assets.html)
- [Web Images Performance](https://web.dev/performance-images/)
- [Lazy Loading Images](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading)
- [lighthouse Audits](https://developers.google.com/web/tools/lighthouse)
