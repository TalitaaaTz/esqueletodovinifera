import { useState, useEffect, useCallback, useRef, useDeferredValue, useTransition, memo } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import { routeCacheService } from '@/services/routeCacheService';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

interface SearchPanelProps {
  onSelectDestination: (lat: number, lng: number, name: string) => void;
  onClear: () => void;
  value?: string;
}

// Memoized search result item to prevent re-renders
const SearchResultItem = memo(({ result, onSelect }: { result: SearchResult; onSelect: (r: SearchResult) => void }) => (
  <button
    onClick={() => onSelect(result)}
    className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-start gap-2 border-b last:border-b-0 transition-colors"
  >
    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
    <span className="text-sm line-clamp-2">{result.display_name}</span>
  </button>
));
SearchResultItem.displayName = 'SearchResultItem';

export function SearchPanel({ onSelectDestination, onClear, value = '' }: SearchPanelProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value only when it actually changes
  useEffect(() => {
    if (value !== query && value !== '') {
      setQuery(value);
    }
  }, [value]);

  // Debounced search with cache - uses deferred query
  const searchAddress = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      startTransition(() => setResults([]));
      return;
    }

    // Check cache first - instant return
    const cached = routeCacheService.getSearchResults(searchQuery);
    if (cached) {
      startTransition(() => setResults(cached));
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=br`,
        { signal: abortControllerRef.current.signal }
      );
      
      const data = await response.json();
      const validResults = Array.isArray(data) 
        ? data.filter((r: any) => r?.display_name && r?.lat && r?.lon && r?.place_id).slice(0, 5)
        : [];
      startTransition(() => setResults(validResults));
      
      // Cache results
      routeCacheService.setSearchResults(searchQuery, data);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Search error:', err);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce on deferred query changes - longer debounce for mobile
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (deferredQuery.length >= 3) {
      // 500ms debounce for better mobile performance
      searchTimeoutRef.current = setTimeout(() => {
        searchAddress(deferredQuery);
      }, 500);
    } else {
      startTransition(() => setResults([]));
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [deferredQuery, searchAddress]);

  const handleSelectResult = (result: SearchResult) => {
    const name = result.display_name.split(',').slice(0, 2).join(', ');
    setQuery(name);
    setResults([]);
    onSelectDestination(parseFloat(result.lat), parseFloat(result.lon), name);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    onClear();
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Para onde você vai?"
            value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, 200))}
            maxLength={200}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-9 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results Dropdown - only render when has results */}
      {results.length > 0 && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {results.map((result) => (
            <SearchResultItem 
              key={result.place_id} 
              result={result} 
              onSelect={handleSelectResult} 
            />
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {(isSearching || isPending) && deferredQuery.length >= 3 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 p-3 text-center">
          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
        </div>
      )}
    </div>
  );
}

export default memo(SearchPanel);
