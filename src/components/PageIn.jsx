import { useState, useEffect } from 'react';

export default function PageIn({ children, k }) {
  const [r, setR] = useState(false);
  useEffect(() => {
    setR(false);
    const t = setTimeout(() => setR(true), 10);
    return () => clearTimeout(t);
  }, [k]);
  return (
    <div style={{
      opacity: r ? 1 : 0,
      transform: r ? 'none' : 'translateY(10px)',
      transition: 'opacity .5s ease, transform .5s ease',
      willChange: 'opacity, transform'
    }}>
      {children}
    </div>
  );
}
