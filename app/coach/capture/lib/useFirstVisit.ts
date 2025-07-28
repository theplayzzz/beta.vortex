import { useState, useEffect, useCallback } from 'react';

export function useFirstVisit(pageKey: string) {
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const visitKey = `first-visit-${pageKey}`;
    const hasVisited = localStorage.getItem(visitKey);
    
    setIsFirstVisit(!hasVisited);
    setIsLoading(false);
  }, [pageKey]);

  const markAsVisited = useCallback(() => {
    const visitKey = `first-visit-${pageKey}`;
    localStorage.setItem(visitKey, 'true');
    setIsFirstVisit(false);
  }, [pageKey]);

  return { isFirstVisit, isLoading, markAsVisited };
}