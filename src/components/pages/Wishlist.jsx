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
    <div className="min-h-screen page-bg py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-700 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Heart className="text-white w-6 h-6" size={28} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900">My Wishlist</h1>
              <span className="chip bg-gradient-to-r from-rose-100 to-pink-100 text-pink-700 font-bold mt-1">
                {wishlistItems.length} Items
              </span>
            </div>
          </div>
          {wishlistItems.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-rose-100 transition disabled:opacity-50"
            >
              {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Clear All
            </button>
          )}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl mb-6 text-sm">
            {error}
          </div>
        )}

        {wishlistItems.length === 0 ? (
            <div className="card p-6 sm:p-12 text-center">
                <div className="bg-gradient-to-br from-rose-100 via-rose-100 to-pink-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner">
                    <Heart className="text-rose-500 w-6 h-6 sm:w-8 sm:h-8" size={32} />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">Your wishlist is empty</h2>
                <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">Save items you love here to keep track of them.</p>
                <Link to="/" className="btn-gradient !px-8 !py-3 !text-sm sm:!text-base">
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

