import { useState, useEffect, useCallback} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || 'relevance';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const pageFromUrl = parseInt(searchParams.get('page'), 10) || 1;

  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ categories: [], subCategories: [], priceRange: { min: 0, max: 10000 } });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [page, setPage] = useState(pageFromUrl);

  useEffect(() => {
    setPage(pageFromUrl);
  }, [pageFromUrl]);

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
    } catch (err) {

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
    setPage(1);
  };

  const handleSort = (value) => updateUrlParam('sortBy', value);

  const handleCategoryFilter = (cat) => {
    const params = new URLSearchParams(searchParams);
    if (params.get('category') === cat) params.delete('category');
    else params.set('category', cat);
    params.set('page', '1');
    setSearchParams(params);
    setPage(1);
  };

  const handlePriceChange = (type, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(type, value);
    else params.delete(type);
    params.set('page', '1');
    setSearchParams(params);
    setPage(1);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    setSearchParams(params);
    setPage(1);
  };

  const hasActiveFilters = category || minPrice || maxPrice;

  const FilterSidebar = () => (
    <div className="bg-white rounded-xl border p-4 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Categories</h3>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-indigo-600 hover:underline">Clear all</button>
          )}
        </div>
        <div className="space-y-1">
          {filters.categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryFilter(cat)}
              className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition ${
                category === cat
                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
          {filters.categories.length === 0 && (
            <p className="text-sm text-gray-400">No categories available</p>
          )}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => handlePriceChange('minPrice', e.target.value)}
            className="w-full px-2 py-1.5 border rounded text-sm"
            min="0"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
            className="w-full px-2 py-1.5 border rounded text-sm"
            min="0"
          />
        </div>
      </div>
    </div>
  );

  if (!query) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-10">
            <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover Products</h2>
            <p className="text-gray-500">Search for what you love or browse our trending products</p>
          </div>
          <section>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Trending Products</h3>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-all">
              Results for &quot;{query}&quot;
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
              )}
            </button>
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className="px-3 py-2 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
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
              <FilterSidebar />
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="font-semibold text-gray-900">Filters</h2>
                  <button onClick={() => setShowMobileFilters(false)} className="p-1 hover:bg-gray-100 rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  <FilterSidebar />
                </div>
              </div>
            </div>
          )}

          <main className="flex-1 min-w-0">
            {loading ? (
              <BrandLoader text="Searching..." />
            ) : results.length === 0 ? (
              <div className="text-center py-20">
                <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-600 mb-2">No products found</h2>
                <p className="text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {category && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                        {category}
                        <button onClick={() => handleCategoryFilter(category)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {(minPrice || maxPrice) && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
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
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-2 bg-white border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
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
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium ${
                            p === page
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages}
                      className="px-3 py-2 bg-white border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
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

