import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { navigationModel } from '../services/markovNavigationModel';

export const usePredictivePrefetch = () => {
  const location = useLocation();
  const [prefetchedRoutes, setPrefetchedRoutes] = useState(new Set());

  useEffect(() => {
    // Predict where the user is likely to go next based on current path
    const predictedRoute = navigationModel.predictNextRoute(location.pathname, 0.6);

    if (predictedRoute && !prefetchedRoutes.has(predictedRoute)) {
      // In a real Next.js or Vite app, we would resolve the JS chunk URL here.
      // For this demo, we simulate the prefetch.
      console.log(`🧠 [ML Predictor] User is on ${location.pathname}. 
      High probability of navigating to ${predictedRoute}. Prefetching bundle...`);
      
      const link = document.createElement('link');
      link.rel = 'prefetch';
      // In reality, this would be the Webpack chunk URL, e.g. /static/js/Analytics.chunk.js
      link.href = `${predictedRoute}-chunk.js`; 
      document.head.appendChild(link);

      setPrefetchedRoutes(prev => new Set(prev).add(predictedRoute));
    }
  }, [location.pathname, prefetchedRoutes]);
};
