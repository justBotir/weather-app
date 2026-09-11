'use client';

import { useEffect, useId, useState } from 'react';

import { useCitySearch } from '@/hooks/useCitySearch';
import type { GeoLocation } from '@/types/weather';
import { SearchResults } from './SearchResults';

interface SearchBarProps {
  onSelect: (location: GeoLocation) => void;
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = useId();
  const { results, isSearching } = useCitySearch(query);

  // A stale highlight would point at a different city once results change.
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  const handleSelect = (location: GeoLocation) => {
    onSelect(location);
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!isOpen || results.length === 0) return;

    if (event.key === 'ArrowDown') {
      // Otherwise the caret jumps to the end of the input instead.
      event.preventDefault();
      // -1 means "nothing highlighted", so Down always lands on the first item.
      setActiveIndex((current) => (current >= results.length - 1 ? 0 : current + 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0 && activeIndex < results.length) {
      event.preventDefault();
      handleSelect(results[activeIndex]);
    }
  };

  const showResults = isOpen && query.trim().length >= 2;

  return (
    <div className="relative w-full sm:w-80">
      <input
        type="search"
        value={query}
        placeholder="Search for a city…"
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
        role="combobox"
        aria-expanded={showResults}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 && activeIndex < results.length
            ? `${listId}-option-${activeIndex}`
            : undefined
        }
      />

      {showResults && (
        <SearchResults
          id={listId}
          results={results}
          isSearching={isSearching}
          activeIndex={activeIndex}
          onHighlight={setActiveIndex}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
