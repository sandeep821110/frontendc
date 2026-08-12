import { useState, useEffect, useCallback} from 'react';
import { useSearchParams } from 'react-router-dom';
import BrandLoader from '../BrandLoader';
import { Search, X, TrendingUp, Filter } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import ProductCard from '../product/ProductCard';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
];

const FilterSidebar = ({ filters, category, minPrice, maxPrice, hasActiveFilters, clearFilters, handleCategoryFilter, handlePriceChange }) => (
  <div className="card p-4 space-y-6">
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900">Categories</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-pink-600 hover:underline">Clear all</button>
        )}
      </div>
      <div className="space-y-1">
        {filters.categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryFilter(cat)}
            className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition ${
              category === cat
                ? 'bg-gradient-to-r from-rose-100 to-pink-100 text-pink-700 font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
        {filters.categories.length === 0 && (
          <p className="text-sm text-slate-400">No categories available</p>
        )}
      </div>
    </div>
    <div>
      <h3 className="font-bold text-slate-900 mb-3">Price Range</h3>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Min"
          value={minPrice}
          onChange={(e) => handlePriceChange('minPrice', e.target.value.replace(/\D/g, ''))}
          className="input !py-1.5 !px-2 !text-sm"
        />
        <span className="text-slate-400">-</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Max"
          value={maxPrice}
          onChange={(e) => handlePriceChange('maxPrice', e.target.value.replace(/\D/g, ''))}
          className="input !py-1.5 !px-2 !text-sm"
        />
      </div>
    </div>
  </div>
);

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || 'relevance';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = parseInt(searchParams.get('page'), 10) || 1;

  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ categories: [], subCategories: [], priceRange: { min: 0, max: 10000 } });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const buildSearchParams = useCallback((overrides = {}) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (overrides.category || category) params.set('category', overrides.category || category);
    if (overrides.sortBy || sortBy) params.set('sortBy', overrides.sortBy || sortBy);
    if (overrides.minPrice || minPrice) params.set('minPrice', overrides.minPrice || minPrice);
    if (overrides.maxPrice || maxPrice) params.set('maxPrice', overrides.maxPrice || maxPrice);
    params.set('page', String(overrides.page || page));
    params.set('limit', '20');
    return params.toString();
  }, [query, category, sortBy, minPrice, maxPrice, page]);

  const fetchResults = useCallback(async () => {
    if (!query) return;
    setLoading(true);
    try {
      const params = buildSearchParams();
      const [searchRes, filtersRes] = await Promise.all([
        apiClient.get(`/search?${params}`),
        apiClient.get('/search/filters'),
      ]);
      if (searchRes.data.success) {
        setResults(searchRes.data.data);
        setPagination(searchRes.data.pagination);
      }
      if (filtersRes.data.success) {
        setFilters(filtersRes.data.data);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [buildSearchParams, query]);

  const fetchRecommendations = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/search/recommendations?limit=12');
      if (data.success) setRecommendations(data.data);
    } catch {
      setRecommendations([]);
    }
  }, []);

  useEffect(() => {
    if (query) {
      fetchResults();
    } else {
      setLoading(false);
      fetchRecommendations();
    }
  }, [query, page, fetchResults, fetchRecommendations]);

  const updateUrlParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSort = (value) => updateUrlParam('sortBy', value);

  const handleCategoryFilter = (cat) => {
    const params = new URLSearchParams(searchParams);
    if (params.get('category') === cat) params.delete('category');
    else params.set('category', cat);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePriceChange = (type, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(type, value);
    else params.delete(type);
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    setSearchParams(params);
  };

  const hasActiveFilters = category || minPrice || maxPrice;

  if (!query) {
    return (
      <div className="min-h-screen page-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-rose-100 via-pink-100 to-pink-100 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-pink-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              Discover <span className="gradient-text-animated">Products</span>
            </h2>
            <p className="text-gray-500">Search for what you love or browse our trending products</p>
          </div>
          <section>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-pink-600" />
              <h3 className="text-lg font-bold text-gray-900">Trending Products</h3>
            </div>
            {recommendations.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {recommendations.map((product) => (
                  <ProductCard key={product._id || product.productId} product={product} />
                ))}
              </div>
            ) : (
              <BrandLoader text="Loading recommendations..." />
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <span className="section-badge mb-2">Search results</span>
            <h1 className="section-title !text-2xl sm:!text-3xl break-all mt-1">
              Results for &quot;<span className="gradient-text-animated">{query}</span>&quot;
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 btn-outline !text-sm"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-pink-600" />
              )}
            </button>
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className="input !py-2 !text-sm w-auto"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-20">
              <FilterSidebar
                filters={filters}
                category={category}
                minPrice={minPrice}
                maxPrice={maxPrice}
                hasActiveFilters={hasActiveFilters}
                clearFilters={clearFilters}
                handleCategoryFilter={handleCategoryFilter}
                handlePriceChange={handlePriceChange}
              />
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900">Filters</h2>
                  <button onClick={() => setShowMobileFilters(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  <FilterSidebar
                    filters={filters}
                    category={category}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    hasActiveFilters={hasActiveFilters}
                    clearFilters={clearFilters}
                    handleCategoryFilter={handleCategoryFilter}
                    handlePriceChange={handlePriceChange}
                  />
                </div>
              </div>
            </div>
          )}

          <main className="flex-1 min-w-0">
            {loading ? (
              <BrandLoader text="Searching..." />
            ) : results.length === 0 ? (
              <div className="card p-10 text-center">
                <Search className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-700 mb-2">No products found</h2>
                <p className="text-slate-400 mb-4">Try adjusting your search or filter criteria</p>
                <button
                  onClick={clearFilters}
                  className="btn-gradient !px-6 !py-2.5"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {category && (
                      <span className="chip bg-rose-100 text-pink-700 font-medium text-sm">
                        {category}
                        <button onClick={() => handleCategoryFilter(category)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {(minPrice || maxPrice) && (
                      <span className="chip bg-rose-100 text-pink-700 font-medium text-sm">
                        ₹{minPrice || 0} - ₹{maxPrice || '∞'}
                        <button onClick={() => handlePriceChange('minPrice', '')}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {results.map((product) => (
                    <ProductCard key={product._id || product.productId} product={product} />
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('page', String(Math.max(1, page - 1)));
                        setSearchParams(params);
                      }}
                      disabled={page <= 1}
                      className="btn-outline !py-2 !px-3 !text-sm disabled:opacity-40"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      const start = Math.max(1, Math.min(page - 2, pagination.totalPages - 4));
                      const p = start + i;
                      if (p > pagination.totalPages || p < 1) return null;
                      return (
                        <button
                          key={p}
                          onClick={() => {
                            const params = new URLSearchParams(searchParams);
                            params.set('page', String(p));
                            setSearchParams(params);
                          }}
                          className={`w-9 h-9 rounded-lg text-sm font-medium ${
                            p === page
                              ? 'btn-gradient !w-9 !h-9 !p-0 !text-sm'
                              : 'btn-outline !w-9 !h-9 !p-0 !text-sm'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('page', String(Math.min(pagination.totalPages, page + 1)));
                        setSearchParams(params);
                      }}
                      disabled={page >= pagination.totalPages}
                      className="btn-outline !py-2 !px-3 !text-sm disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
