# Performance Optimizations Guide

## Event Listener Cleanup in MotionLayer.jsx

### Overview

MotionLayer.jsx provides interactive motion effects across NexaSphere. All useEffect hooks properly clean up event listeners to prevent memory leaks and performance degradation.

### Pattern: Always Cleanup Event Listeners

#### ✓ Correct Pattern

```jsx
useEffect(() => {
  const onMouseMove = (e) => {
    /* handler */
  };
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  return () => window.removeEventListener('mousemove', onMouseMove);
}, []);
```

#### ✗ Incorrect Pattern (Memory Leak)

```jsx
useEffect(() => {
  // ❌ No cleanup function — listener stays attached after unmount
  window.addEventListener('mousemove', (e) => {
    /* handler */
  });
}, []);
```

## Implemented Optimizations

### 1. useScrollProgress

- **Cleanup:** Removes scroll listener on unmount
- **Passive Flag:** \`{ passive: true }\` for scroll performance
- **Benefit:** No memory leak, smooth scrolling

### 2. useNsReveal

- **IntersectionObserver:** Efficient viewport detection
- **Cleanup:** Calls \`obs.disconnect()\` on unmount
- **Benefit:** No listener accumulation, lower CPU

### 3. useHeroParallax

- **RAF Cleanup:** Properly cancels requestAnimationFrame
- **Pattern:** Stores frameId and cancels in cleanup
- **Benefit:** No invisible animations draining battery

### 4. useNavScrollTint

- **Cleanup:** Removes scroll listener on unmount
- **Passive Flag:** Improves scroll performance
- **Benefit:** No listener accumulation on navigation

### 5. useGlobalMouseParallax

- **Cleanup:** Cancels RAF and removes mousemove listener
- **Mobile Optimized:** Detects hover support
- **Benefit:** Prevents unnecessary effects on touch devices

### 6. useMagneticCards

- **Cleanup:** Removes both mousemove and mouseleave listeners
- **Benefit:** Cards reset properly on unmount, no stale listeners

## Impact: Before vs. After

### Memory Leaks (Before Fix)

```
Navigation Cycle 1:  +1 listener   (total: 1)
Navigation Cycle 2:  +1 listener   (total: 2)
Navigation Cycle 3:  +1 listener   (total: 3)
...
Navigation Cycle N:  +1 listener   (total: N)

Result: Memory grows linearly, performance degrades
```

### Proper Cleanup (After Fix)

```
Navigation Cycle 1:  +1 listener, -1 listener  (total: 0)
Navigation Cycle 2:  +1 listener, -1 listener  (total: 0)
Navigation Cycle 3:  +1 listener, -1 listener  (total: 0)
...
Navigation Cycle N:  +1 listener, -1 listener  (total: 0)

Result: Memory stable, consistent performance
```

## Performance Testing

### Heap Snapshot Analysis

1. Open DevTools → Memory tab
2. Take initial snapshot when app loads
3. Navigate between pages 5+ times
4. Take final snapshot
5. Compare: Should show no growth in listener count

### Performance Profiling

1. Open Performance tab
2. Record mousemove events during effect
3. Check: Event handler fires 1x per event, not N times
4. Verify: No duplicate event listeners in DOM

### Mobile Testing

- **Low-End Device:** Parallax effects disabled (no hover support)
- **Battery Impact:** No invisible animations draining power
- **CPU Usage:** Smooth interactions without jank

## Related Performance Metrics

- **Time to Interactive (TTI):** Improved by preventing listener accumulation
- **Main Thread Work:** Reduced by canceling unused RAF callbacks
- **Memory Usage:** Stable across multiple navigations
- **Frame Rate:** Maintains 60fps on interactions

## See Also

- [MotionLayer.jsx](../src/shared/MotionLayer.jsx) — Implementation
- [ParticleBackground.jsx](../src/shared/ParticleBackground.jsx) — Similar cleanup pattern
- [React Hooks Best Practices](https://react.dev/reference/react/useEffect)
