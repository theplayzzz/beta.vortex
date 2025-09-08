'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pending-user-first-visit';

export function useFirstVisitHighlight() {
  const [shouldHighlight, setShouldHighlight] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Check if this is the first visit
    const hasVisited = localStorage.getItem(STORAGE_KEY);
    
    if (!hasVisited) {
      setShouldHighlight(true);
    } else {
      setShouldHighlight(false);
    }
  }, []);

  const markAsInteracted = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShouldHighlight(false);
    setHasInteracted(true);
  };

  const resetHighlight = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShouldHighlight(true);
    setHasInteracted(false);
  };

  return {
    shouldHighlight: shouldHighlight && !hasInteracted,
    markAsInteracted,
    resetHighlight
  };
}