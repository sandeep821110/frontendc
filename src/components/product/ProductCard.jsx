import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Share2, ChevronLeft, ChevronRight, Loader2, Trash2, ShoppingBag } from 'lucide-react';
import { addToWishlist, removeFromWishlist } from '../../features/wishlist/wishlistSlice';
import { addToCart } from '../../features/cart/cartSlice';
import { useToast } from '../ui/Toast';
import { optimizeImage } from '../../utils/cloudinary';

const ProductCard = ({ product, fromWishlist = false, wishlistItemId = null }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingCart, setIsAddingCart] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  
  // Consistently get product ID
  const productId = String(product._id || product.id);
  
  const wishlistItems = useSelector(state => state.wishlist.items);
  const isWishlisted = wishlistItems.some(item => {
    // Ensure we are comparing against the nested product ID in the wishlist item
    return String(item.productId?._id) === productId;
  });
  const token = useSelector(state => state.auth.token);

  // Ensure `images` is always an array of URL strings.
  // Handles cases where product.image is a single string, an array of strings,
  // an array of objects with a `url` property, or null/undefined. The API may provide `images` or `image`.
  const images = [].concat(product.images || product.image || [])
    .map(img => (img && typeof img === 'object' ? img.url : img))
    .filter(Boolean)
    .map(img => optimizeImage(img, { width: 600 }));

  // The API provides `size` as an array of objects like [{ size: 'M', quantity: 10 }].
  const sizesData = Array.isArray(product.size) ? product.size : (Array.isArray(product.sizes) ? product.sizes.map(s => typeof s === 'string' ? { size: s, quantity: undefined } : s) : []);
  const displaySizes = sizesData.map(s => s.size);

  const sizeQuantities = sizesData.map(s => s.quantity).filter(q => q !== undefined && q !== null);
  const hasStockInfo = sizesData.length > 0 && sizeQuantities.length === sizesData.length;
  const computedTotalStock = sizeQuantities.reduce((sum, q) => sum + (Number(q) || 0), 0);
  const totalStock = typeof product.totalStock === 'number' && product.totalStock >= 0 ? product.totalStock : computedTotalStock;
  const isOutOfStock = hasStockInfo && totalStock === 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }
    if (displaySizes.length > 0 && !selectedSize) {
      toast.warning('Please select a size first');
      return;
    }
    setIsAddingCart(true);
    dispatch(addToCart({ 
      productId: productId, 
      quantity: 1, 
      size: selectedSize || 'default' 
    })).then((result) => {
      setIsAddingCart(false);
      if (!result.error) {
        toast.success('Added to cart!');
      } else {
        toast.error('Failed to add to cart: ' + (result.payload || result.error.message));
      }
    }).catch((err) => {
      setIsAddingCart(false);
      toast.error('Error adding to cart: ' + err);
    });
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }
    if (displaySizes.length > 0 && !selectedSize) {
      toast.warning('Please select a size first');
      return;
    }
    setIsAddingCart(true);
    dispatch(addToCart({ 
      productId: productId, 
      quantity: 1, 
      size: selectedSize || 'default' 
    })).then((result) => {
      setIsAddingCart(false);
      if (!result.error) {
        navigate('/cart');
      } else {
        toast.error('Failed to add to cart: ' + (result.payload || result.error.message));
      }
    }).catch((err) => {
      setIsAddingCart(false);
      toast.error('Error: ' + err);
    });
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (!token) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }
    if (isWishlisted) {
      // Use the specific wishlist item ID if available (from wishlist page),
      // otherwise fall back to the product ID (e.g., from product details page).
      const idToRemove = wishlistItemId || productId;
      dispatch(removeFromWishlist(idToRemove));
    } else {
      dispatch(addToWishlist(product));
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    if (navigator.share) {
      navigator.share({
        title: `Check out this ${product.name}`,
        text: `${product.name} - ${product.description}`,
        url: `${window.location.origin}/product/${productId}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/product/${productId}`);
      toast.success('Link copied to clipboard!');
    }
  };

  const nextImage = (e) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Auto-scrolling behavior for images
  React.useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div 
      onClick={() => navigate(`/product/${productId}`)}
      className="group card card-hover overflow-hidden relative cursor-pointer animate-fade-in-up"
    >
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <button 
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`p-2 rounded-full shadow-md backdrop-blur-sm hover:scale-110 transition ${isWishlisted ? 'bg-gradient-to-br from-rose-500 to-red-500 shadow-rose-400/40' : 'bg-white/85 hover:bg-white'}`}
        >
          <Heart size={18} className={isWishlisted ? "fill-white text-white" : "text-slate-600"} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleShare(e); }}
          aria-label="Share product"
          className="p-2 bg-white/85 backdrop-blur-sm rounded-full shadow-md hover:bg-white hover:scale-110 transition"
        >
          <Share2 size={18} className="text-slate-600" />
        </button>
      </div>
      {product.discount && (
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md shadow-rose-400/30">
          {product.discount}% OFF
        </div>
      )}
      {isOutOfStock && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-slate-900/90 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-sm">
          Out of Stock
        </div>
      )}
      <div className="relative h-36 sm:h-44 md:h-48 w-full overflow-hidden bg-slate-100">
        {images.map((img, index) => (
          <img 
            key={index}
            src={img} 
            alt={`${product.name} ${index}`} 
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-105 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`} 
          />
        ))}
        
        {images.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); prevImage(e); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/70 hover:bg-white rounded-full shadow transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextImage(e); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/70 hover:bg-white rounded-full shadow transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <div key={i} className={`h-1 w-3 rounded-full transition-colors ${i === currentImageIndex ? 'bg-gradient-to-r from-rose-500 to-pink-600' : 'bg-white/60'}`} />
            ))}
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 truncate">{product.name}</h3>
          {product.rating && (
            <span className="text-xs sm:text-sm font-bold text-amber-500 flex items-center">
              ★ {product.rating}
            </span>
          )}
        </div>
        {displaySizes.length > 0 && (
          <div className="mb-2 sm:mb-3">
            <p className="text-[10px] sm:text-xs text-slate-500 mb-1">Size:</p>
            <div className="flex flex-wrap gap-1">
              {sizesData.map((s) => {
                const isOut = s.quantity === 0;
                return (
                <button
                  key={s.size}
                  onClick={(e) => { if (!isOut) { e.stopPropagation(); e.preventDefault(); setSelectedSize(s.size); } }}
                  disabled={isOut}
                  className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 border rounded-lg transition flex flex-col items-center ${
                    selectedSize === s.size ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white border-transparent shadow-md shadow-pink-500/30' : isOut ? 'text-slate-300 border-slate-100' : 'text-slate-600 border-slate-200 hover:border-pink-500'
                  } disabled:cursor-not-allowed`}
                >
                  <span>{s.size}</span>
                  {isOut && <span className="text-[7px] leading-none mt-0.5">out</span>}
                </button>
                );
              })}
            </div>
          </div>
        )}
        <p className="text-slate-500 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-1 sm:line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span className="text-base sm:text-lg md:text-xl font-extrabold gradient-text">
              ₹{product.discount ? Math.round(product.price * (1 - product.discount / 100)) : Math.round(Number(product.price) || 0)}
            </span>
            {product.discount && (
              <span className="text-[10px] sm:text-sm text-slate-400 line-through">₹{Math.round(Number(product.price) || 0)}</span>
            )}
          </div>
        </div>

        {fromWishlist ? (
          <button
            onClick={handleWishlist}
            className="w-full bg-rose-50 text-rose-600 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-rose-100 transition flex items-center justify-center gap-2"
          >
            <Trash2 size={14} /> Remove
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <button onClick={(e) => { e.stopPropagation(); handleAddToCart(e); }} disabled={isAddingCart || isOutOfStock} className="btn-gradient !py-1.5 sm:!py-2 !text-[10px] sm:!text-xs !rounded-xl">
              {isAddingCart ? <Loader2 size={12} className="animate-spin" /> : <ShoppingBag size={12} />}
              {isAddingCart ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleBuyNow(e); }} disabled={isAddingCart || isOutOfStock} className="btn-dark !py-1.5 sm:!py-2 !text-[10px] sm:!text-xs !rounded-xl">
              {isAddingCart ? <Loader2 size={12} className="animate-spin" /> : null}
              {isAddingCart ? 'Loading...' : isOutOfStock ? 'Out of Stock' : 'Buy Now'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
