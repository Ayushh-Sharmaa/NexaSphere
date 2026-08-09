import React, { lazy, Suspense } from 'react';
import ErrorBoundary from '../components/common/ErrorBoundary';

export default function dynamic(importFunc, options = {}) {
  const LazyComponent = lazy(importFunc);

  return function DynamicComponent(props) {
    const fallback = options.loading ? options.loading() : null;
    return (
      <ErrorBoundary>
        <Suspense fallback={fallback}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}
