'use client';

import { useEffect, useState } from 'react';

import { searchCities } from '@/lib/api-client';
import type { GeoLocation } from '@/types/weather';
import { useDebouncedValue } from './useDebouncedValue';

/** Debounced, abortable city autocomplete. One network call per typing pause. */
export function useCitySearch(query: string) {
  const debounced = useDebouncedValue(query.trim(), 350);
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);

    searchCities(debounced, controller.signal)
      .then(setResults)
      .catch(() => {
        if (!controller.signal.aborted) setResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsSearching(false);
      });

    return () => controller.abort();
  }, [debounced]);

  return { results, isSearching };
}
