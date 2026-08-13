// hooks/useDegradedFetch.js
import { useState, useEffect, useRef } from "react";

export function useDegradedFetch(cacheKey, fetcherFn) {
  const [data, setData] = useState(() => {
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : null;
  });
  const [isDegraded, setIsDegraded] = useState(false);
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);

  // Utilisation d'une ref pour éviter des re-triggers inutiles si fetcherFn est anonyme
  const fetcherRef = useRef(fetcherFn);
  useEffect(() => {
    fetcherRef.current = fetcherFn;
  }, [fetcherFn]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setError(null);
        const freshData = await fetcherRef.current();
        if (isMounted) {
          setData(freshData);
          setIsDegraded(false);
          localStorage.setItem(cacheKey, JSON.stringify(freshData));
        }
      } catch (err) {
        if (isMounted) {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            setData(JSON.parse(cached));
            setIsDegraded(true);
          } else {
            setError(err);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [cacheKey]);

  return { data, loading, isDegraded, error };
}