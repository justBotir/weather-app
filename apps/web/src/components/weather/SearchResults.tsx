'use client';

import type { GeoLocation } from '@/types/weather';
import { formatPlace } from '@/lib/geo';

interface SearchResultsProps {
  id: string;
  results: GeoLocation[];
  isSearching: boolean;
  /** -1 when nothing is keyboard-highlighted. */
  activeIndex: number;
  onHighlight: (index: number) => void;
  onSelect: (location: GeoLocation) => void;
}

export function SearchResults({
  id,
  results,
  isSearching,
  activeIndex,
  onHighlight,
  onSelect,
}: SearchResultsProps) {
  return (
    <ul
      id={id}
      role="listbox"
      className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl"
    >
      {isSearching && results.length === 0 && (
        <li className="px-3 py-2 text-sm text-slate-500">Searching…</li>
      )}

      {!isSearching && results.length === 0 && (
        <li className="px-3 py-2 text-sm text-slate-500">No matching cities.</li>
      )}

      {results.map((location, index) => {
        const isActive = index === activeIndex;
        return (
          <li key={location.locationKey}>
            <button
              type="button"
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={isActive}
              // Keep the input focused: blurring it would close the list before
              // the click lands.
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => onHighlight(index)}
              onClick={() => onSelect(location)}
              className={`w-full px-3 py-2 text-left text-sm transition ${
                isActive ? 'bg-slate-800 text-slate-100' : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              {formatPlace(location)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
