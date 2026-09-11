'use client';

import { useEffect, useState } from 'react';

/** Holds `value` still for `delay` ms — one upstream geocoding call per pause, not per keystroke. */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
