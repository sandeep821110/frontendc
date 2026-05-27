import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BrandLoader from '../BrandLoader';
import { Heart, ArrowRight, Loader2, Trash2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import {
  fetchWishlistItems,
  clearAllWishlist,
  selectWishlistItems,
  selectWishlistLoading,
  selectWishlistError
} from '../../features/wishlist/wishlistSlice';
import ProductCard from '../product/ProductCard';

const Wishlist = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [clearing, setClearing] = useState(false);
    const wishlistItems = useSelector(selectWishlistItems);
    const loading = useSelector(selectWishlistLoading);
    const error = useSelector(selectWishlistError);
    const token = useSelector(state => state.auth.token);

    useEffect(() => {
        if (!token) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        dispatch(fetchWishlistItems());
    }, [dispatch, token, navigate]);

    const handleClearAll = () => {
      if (!window.confirm('Are you sure you want to remove all items from your wishlist?')) return;
      setClearing(true);
      dispatch(clearAllWishlist()).finally(() => setClearing(false));
    };

    if (loading && wishlistItems.length === 0) return (
        <div className="min-h-screen flex items-center justify-center">
            <BrandLoader text="Loading wishlist..." />
        </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Heart className="text-red-500 fill-red-500 w-6 h-6 sm:w-8 sm:h-8" size={32} />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">My Wishlist</h1>
            <span className="bg-gray-200 text-gray-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold">
                {wishlistItems.length} Items
            </span>
          </div>
          {wishlistItems.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold hover:bg-red-100 transition disabled:opacity-50"
            >
              {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Clear All
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {wishlistItems.length === 0 ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center shadow-sm border border-gray-100">
                <div className="bg-indigo-50 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Heart className="text-indigo-600 w-6 h-6 sm:w-8 sm:h-8" size={32} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
                <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">Save items you love here to keep track of them.</p>
                <Link to="/" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-sm sm:text-base">
                    Start Shopping <ArrowRight size={18} />
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {wishlistItems.map((item) => {
                    const product = item.productId;
                    if (!product?._id) {

                        return null;
                    }
                    return <ProductCard key={item._id || product._id} product={product} fromWishlist wishlistItemId={item._id} />;
                })}
            </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;

