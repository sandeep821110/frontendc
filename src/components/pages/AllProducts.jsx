import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import BrandLoader from '../BrandLoader';
import { Filter, X } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import ProductCard from '../product/ProductCard';
import PriceRangeSlider from '../ui/PriceRangeSlider';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

const SORT_TO_BACKEND = {
  newest: { sortBy: 'createdAt', sortOrder: 'desc' },
  price_asc: { sortBy: 'price', sortOrder: 'asc' },
  price_desc: { sortBy: 'price', sortOrder: 'desc' },
  rating: { sortBy: 'rating', sortOrder: 'desc' },
};

const AllProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const size = searchParams.get('size') || '';
  const sortBy = searchParams.get('sortBy') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const pageFromUrl = parseInt(searchParams.get('page'), 10) || 1;

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [availableFilters, setAvailableFilters] = useState({ categories: [], sizes: [], priceRange: { minPrice: 0, maxPrice: 10000 } });
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [page, setPage] = useState(pageFromUrl);

  useEffect(() => {
    setPage(pageFromUrl);
  }, [pageFromUrl]);

  const buildParams = useCallback((overrides = {}) => {
    const params = new URLSearchParams();
    if (overrides.category || category) params.set('category', overrides.category || category);
    if (overrides.size || size) params.set('size', overrides.size || size);
    const sort = SORT_TO_BACKEND[overrides.sortBy || sortBy] || SORT_TO_BACKEND.newest;
    params.set('sortBy', sort.sortBy);
    params.set('sortOrder', sort.sortOrder);
    if (overrides.minPrice || minPrice) params.set('minPrice', overrides.minPrice || minPrice);
    if (overrides.maxPrice || maxPrice) params.set('maxPrice', overrides.maxPrice || maxPrice);
    params.set('page', String(overrides.page || page));
    params.set('limit', '20');
    return params.toString();
  }, [category, size, sortBy, minPrice, maxPrice, page]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();
      const [productsRes, filtersRes] = await Promise.all([
        apiClient.get(`/products?${params}`),
        apiClient.get('/products/filters'),
      ]);
      if (productsRes.data.success) {
        setProducts(productsRes.data.data);
        setPagination(productsRes.data.pagination);
      }
      if (filtersRes.data.success) {
        setAvailableFilters(filtersRes.data.data);
      }
    } catch (err) {

      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchProducts();
  }, [page, fetchProducts]);

  const updateUrlParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    setSearchParams(params);
    setPage(1);
  };

  const handleSort = (value) => updateUrlParam('sortBy', value);

  const handleSizeFilter = (s) => {
    const params = new URLSearchParams(searchParams);
    if (params.get('size') === s) params.delete('size');
    else params.set('size', s);
    params.set('page', '1');
    setSearchParams(params);
    setPage(1);
  };

  const handleCategoryFilter = (cat) => {
    const params = new URLSearchParams(searchParams);
    if (params.get('category') === cat) params.delete('category');
    else params.set('category', cat);
    params.set('page', '1');
    setSearchParams(params);
    setPage(1);
  };

  const applyPriceRange = (newMin, newMax) => {
    const params = new URLSearchParams(searchParams);
    const minBound = availableFilters.priceRange?.minPrice ?? 0;
    const maxBound = availableFilters.priceRange?.maxPrice ?? 10000;
    if (newMin > minBound) params.set('minPrice', String(newMin));
    else params.delete('minPrice');
    if (newMax < maxBound) params.set('maxPrice', String(newMax));
    else params.delete('maxPrice');
    params.set('page', '1');
    setSearchParams(params);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setPage(1);
  };

  const hasActiveFilters = category || size || minPrice || maxPrice;

  const FilterSidebar = () => (
    <div className="card p-4 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-900">Categories</h3>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-pink-600 hover:underline">Clear all</button>
          )}
        </div>
        <div className="space-y-1">
          {availableFilters.categories.map((cat) => (
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
          {availableFilters.categories.length === 0 && (
            <p className="text-sm text-slate-400">No categories available</p>
          )}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-3">Size</h3>
        <div className="flex flex-wrap gap-2">
          {availableFilters.sizes.map((s) => (
            <button
              key={s}
              onClick={() => handleSizeFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                size === s
                  ? 'btn-gradient !px-3 !py-1.5 !text-sm'
                  : 'text-slate-600 border border-slate-200 bg-white hover:border-pink-500 hover:text-pink-600'
              }`}
            >
              {s}
            </button>
          ))}
          {availableFilters.sizes.length === 0 && (
            <p className="text-sm text-slate-400">No sizes available</p>
          )}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-3">Price Range</h3>
        <PriceRangeSlider
          min={availableFilters.priceRange?.minPrice ?? 0}
          max={availableFilters.priceRange?.maxPrice ?? 10000}
          valueMin={minPrice ? Number(minPrice) : (availableFilters.priceRange?.minPrice ?? 0)}
          valueMax={maxPrice ? Number(maxPrice) : (availableFilters.priceRange?.maxPrice ?? 10000)}
          onCommit={applyPriceRange}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen page-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <span className="section-badge mb-2">Shop the collection</span>
            <h1 className="section-title !text-2xl sm:!text-3xl mt-1">
              All <span className="gradient-text-animated">Products</span>
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
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-20">
              <FilterSidebar />
            </div>
          </aside>

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
                  <FilterSidebar />
                </div>
              </div>
            </div>
          )}

          <main className="flex-1 min-w-0">
            {loading ? (
              <BrandLoader text="Loading products..." />
            ) : products.length === 0 ? (
              <div className="card p-10 text-center">
                <h2 className="text-xl font-bold text-slate-700 mb-2">No products found</h2>
                <p className="text-slate-400 mb-4">Try adjusting your filter criteria</p>
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
                    {size && (
                      <span className="chip bg-rose-100 text-pink-700 font-medium text-sm">
                        Size: {size}
                        <button onClick={() => handleSizeFilter(size)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {(minPrice || maxPrice) && (
                      <span className="chip bg-rose-100 text-pink-700 font-medium text-sm">
                        ₹{minPrice || 0} - ₹{maxPrice || '∞'}
                        <button onClick={() => applyPriceRange(availableFilters.priceRange?.minPrice ?? 0, availableFilters.priceRange?.maxPrice ?? 10000)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {products.map((product) => (
                    <ProductCard key={product._id || product.id} product={product} />
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                          onClick={() => setPage(p)}
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
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
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

export default AllProducts;

