import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, TrendingUp } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const DEBOUNCE_MS = 300;

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recsLoading, setRecsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [noResults, setNoResults] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimer = useRef(null);

  const fetchSuggestions = useCallback(async (q) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setNoResults(false);
      return;
    }
    setLoading(true);
    setNoResults(false);
    try {
      const { data } = await apiClient.get(`/search/autocomplete?q=${encodeURIComponent(q.trim())}`);
      if (data.success) {
        setSuggestions(data.data);
        setNoResults(data.data.length === 0);
      }
    } catch {
      setSuggestions([]);
      setNoResults(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    setRecsLoading(true);
    try {
      const { data } = await apiClient.get('/search/recommendations?limit=8');
      if (data.success) {
        setRecommendations(data.data);
      }
    } catch {
      setRecommendations([]);
    } finally {
      setRecsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    setShowDropdown(true);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (value.trim().length >= 2) {
      debounceTimer.current = setTimeout(() => fetchSuggestions(value), DEBOUNCE_MS);
    } else {
      setSuggestions([]);
      setNoResults(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    closeDropdown();
    setMobileOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSuggestionClick = (suggestion) => {
    closeDropdown();
    setQuery('');
    setMobileOpen(false);
    navigate(`/product/${suggestion.productId || suggestion._id}`);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedIndex(-1);
    setNoResults(false);
    inputRef.current?.focus();
  };

  const closeDropdown = () => {
    setShowDropdown(false);
    setSelectedIndex(-1);
    setNoResults(false);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      closeDropdown();
      inputRef.current?.blur();
    }
  };

  const handleFocus = () => {
    if (!query.trim()) {
      setShowDropdown(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const hasDropdownContent = suggestions.length > 0
    || (query.trim().length >= 2 && (noResults || loading))
    || (!query.trim() && (recommendations.length > 0 || recsLoading))
    || loading;

  const shouldShowDropdown = showDropdown && hasDropdownContent;

  const searchInput = (extraClasses = '') => (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder="Search products..."
        className={`w-full pl-9 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-full text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${extraClasses}`}
        aria-label="Search"
        autoComplete="off"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
      )}
      {!loading && query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  );

  return (
    <div className="relative">
      {/* Mobile search toggle */}
      <button
        type="button"
        onClick={() => { setMobileOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
        className="md:hidden flex items-center justify-center text-white hover:text-indigo-200 p-1.5"
        aria-label="Open search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Desktop: always visible */}
      <div className="hidden md:block">
        {searchInput()}
      </div>

      {/* Mobile: overlay search */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/80" onClick={() => { setMobileOpen(false); closeDropdown(); }} />
          <div className="relative bg-gray-900 px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                {searchInput('text-base')}
              </div>
              <button
                type="button"
                onClick={() => { setMobileOpen(false); closeDropdown(); }}
                className="text-white text-sm font-medium hover:text-indigo-200 flex-shrink-0"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown */}
      {shouldShowDropdown && (
        <div
          ref={dropdownRef}
          className={`${mobileOpen ? 'fixed left-4 right-4 top-16' : 'absolute top-full left-0 right-0 mt-1'} bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto`}
        >
          {suggestions.length > 0 ? (
            <>
              <div className="px-4 py-2 text-xs text-gray-500 font-medium border-b border-gray-700">
                Product Suggestions
              </div>
              {suggestions.map((suggestion, index) => {
                const img = Array.isArray(suggestion.images)
                  ? suggestion.images[0]
                  : suggestion.image || null;
                const price = suggestion.discount
                  ? Math.round(Number(suggestion.price) * (1 - suggestion.discount / 100))
                  : Math.round(Number(suggestion.price) || 0);
                const originalPrice = suggestion.discount ? Math.round(Number(suggestion.price) || 0) : null;

                return (
                  <button
                    key={suggestion._id || suggestion.productId}
                    onMouseDown={() => handleSuggestionClick(suggestion)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                      index === selectedIndex ? 'bg-indigo-600/20 text-white' : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    {img && (
                      <img
                        src={img}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-700"
                        loading="lazy"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{suggestion.name}</p>
                      <p className="text-xs text-gray-500 truncate">{suggestion.category}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-semibold text-indigo-400">₹{price}</span>
                      {originalPrice && (
                        <span className="text-xs text-gray-500 line-through block">₹{originalPrice}</span>
                      )}
                    </div>
                  </button>
                );
              })}
              <div className="px-4 py-2 border-t border-gray-700">
                <button
                  onMouseDown={handleSubmit}
                  className="w-full text-center text-sm text-indigo-400 hover:text-indigo-300 transition font-medium"
                >
                  See all results for "{query}"
                </button>
              </div>
            </>
          ) : noResults && !loading ? (
            <>
              <div className="px-4 py-6 text-center">
                <Search className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                <p className="text-sm text-gray-400">No products found for "{query}"</p>
                <p className="text-xs text-gray-600 mt-1">Try different keywords or browse our trending products</p>
              </div>
              {recommendations.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs text-gray-500 font-medium border-t border-gray-700 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    Trending Products
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3">
                    {recommendations.slice(0, 6).map((product) => {
                      const img = Array.isArray(product.images)
                        ? product.images[0]
                        : product.image || null;
                      const price = product.discount
                        ? Math.round(Number(product.price) * (1 - product.discount / 100))
                        : Math.round(Number(product.price) || 0);

                      return (
                        <button
                          key={product._id || product.productId}
                          onMouseDown={() => handleSuggestionClick(product)}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition text-left"
                        >
                          {img && (
                            <img
                              src={img}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-700"
                              loading="lazy"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-200 truncate">{product.name}</p>
                            <p className="text-xs text-indigo-400 font-semibold">₹{price}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              <div className="px-4 py-2 border-t border-gray-700">
                <button
                  onMouseDown={handleSubmit}
                  className="w-full text-center text-sm text-indigo-400 hover:text-indigo-300 transition font-medium"
                >
                  Search all products for "{query}"
                </button>
              </div>
            </>
          ) : recommendations.length > 0 && !query.trim() ? (
            <>
              <div className="px-4 py-2 text-xs text-gray-500 font-medium border-b border-gray-700 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                Trending Products
              </div>
              <div className="grid grid-cols-2 gap-2 p-3">
                {recommendations.slice(0, 6).map((product) => {
                  const img = Array.isArray(product.images)
                    ? product.images[0]
                    : product.image || null;
                  const price = product.discount
                    ? Math.round(Number(product.price) * (1 - product.discount / 100))
                    : Math.round(Number(product.price) || 0);

                  return (
                    <button
                      key={product._id || product.productId}
                      onMouseDown={() => handleSuggestionClick(product)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition text-left"
                    >
                      {img && (
                        <img
                          src={img}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-700"
                          loading="lazy"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-200 truncate">{product.name}</p>
                        <p className="text-xs text-indigo-400 font-semibold">₹{price}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-2 border-t border-gray-700">
                <button
                  onMouseDown={() => { closeDropdown(); setMobileOpen(false); navigate('/search'); }}
                  className="w-full text-center text-sm text-indigo-400 hover:text-indigo-300 transition font-medium"
                >
                  Browse all products
                </button>
              </div>
            </>
            ) : recsLoading && !query.trim() ? (
            <div className="flex items-center justify-center py-6 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span className="text-sm text-gray-400">Loading recommendations...</span>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
