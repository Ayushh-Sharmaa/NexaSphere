import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { usePredictivePrefetch } from '../hooks/usePredictivePrefetch';

const PrefetchListener = ({ children }) => {
  usePredictivePrefetch();
  return <>{children}</>;
};

export const PrefetchProvider = ({ children }) => {
  return (
    <BrowserRouter>
      <PrefetchListener>
        {children}
      </PrefetchListener>
    </BrowserRouter>
  );
};
