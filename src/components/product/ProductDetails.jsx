import axios from 'axios';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import SimilarProduct from './SimilarProduct';
import BrandLoader from '../BrandLoader';
import { MapPin, CheckCircle2, XCircle, Loader2, Heart, Share2, ChevronLeft, ChevronRight, Languages, Crosshair } from 'lucide-react';
import { addToWishlist, removeFromWishlist } from '../../features/wishlist/wishlistSlice';
import { addToCart } from '../../features/cart/cartSlice';
import { useToast } from '../ui/Toast';

const ProductDetails = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  
  const [product, setProduct] = useState(null); 
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [deliveryData, setDeliveryData] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingCart, setIsAddingCart] = useState(false);
  const [hindiDescription, setHindiDescription] = useState('');
  const [translating, setTranslating] = useState(false);
  const [showHindi, setShowHindi] = useState(false);

  const translateToHindi = useCallback(async (text) => {
    if (hindiDescription) { setShowHindi(p => !p); return; }
    setTranslating(true);
    try {
      const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`);
      const translated = res.data[0].map(t => t[0]).join('');
      setHindiDescription(translated);
      setShowHindi(true);
    } catch {
      setHindiDescription('à¤…à¤¨à¥à¤µà¤¾à¤¦ à¤¸à¥‡à¤µà¤¾ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆ'); // Translation service unavailable
      setShowHindi(true);
    } finally {
      setTranslating(false);
    }
  }, [hindiDescription]);

  const handleSelectSize = (size) => {
    setSelectedSize(size);
    setQuantity(1); // Reset quantity when a new size is selected
  };

  // Find the details for the selected size to get the available quantity
  const selectedSizeInfo = product?.displaySizes?.find(s => s.size === selectedSize);
  const maxQuantity = selectedSizeInfo ? selectedSizeInfo.quantity : 0;

  const wishlistItems = useSelector(state => state.wishlist.items);
  const productId = product ? String(product._id || product.id) : null;
  const isWishlisted = productId && wishlistItems.some(item => {
    // Ensure we are comparing against the nested product ID in the wishlist item
    return String(item.productId?._id) === productId;
  });
  const token = useSelector(state => state.auth.token);

  const handleDetectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const address = res.data.address;
          const detectedPincode = address.postcode || address.postal_code;

          if (detectedPincode && detectedPincode.length >= 6) {
            const cleanPincode = detectedPincode.replace(/\D/g, '').slice(0, 6);
            setPincode(cleanPincode);
            toast.success(`Location detected: ${address.city || address.town || address.village || ''} - ${cleanPincode}`);
          } else {
            toast.error('Could not detect pincode from your location');
          }
        } catch {
          toast.error('Failed to detect location. Please enter pincode manually.');
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
        toast.error('Location access denied. Please enter pincode manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [toast]);

  const handlePincodeCheck = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (pincode.length !== 6) return;

    setPincodeStatus('loading');
    try {
      const res = await axios.get(`/api/products/${id}/pincode/${pincode}`);
      const data = res.data.data || res.data;
      setDeliveryData(data);
      setPincodeStatus(data.isServiceable ? 'success' : 'unavailable');
    } catch {
      setPincodeStatus('error');
      setDeliveryData(null);
    }
  }, [pincode, id]);

  useEffect(() => {
    if (pincode.length === 6) {
      const timeoutId = setTimeout(() => {
        handlePincodeCheck();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [pincode, handlePincodeCheck]);

  useEffect(() => {
    if (!product || product.displayImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % product.displayImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [product?.displayImages.length, product]);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await axios.get(`/api/products/${id}`, {
        params: { _t: Date.now() },
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
      });
      const productData = res.data.data || res.data;
      
      const formattedProduct = {
        ...productData,
        id: productData._id || productData.id,
        displayImages: [].concat(productData.images || productData.image || [])
          .map(img => (img && typeof img === 'object' ? img.url : img))
          .filter(Boolean),
        displaySizes: Array.isArray(productData.size) ? productData.size : (Array.isArray(productData.sizes) ? productData.sizes.map(s => ({size: s, quantity: undefined})) : [])
      };

      setProduct(formattedProduct);
      if (formattedProduct.displaySizes?.length > 0) {
        const firstAvailable = formattedProduct.displaySizes.find(s => s.quantity > 0);
        setSelectedSize(firstAvailable ? firstAvailable.size : formattedProduct.displaySizes[0].size);
      }
    } catch {
      setProduct(null);
    }
  }, [id]);

  // Initial fetch on mount / id change - intentional
  useEffect(() => {
    fetchProduct();
  }, [id, fetchProduct]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchProduct();
    };
    const handleFocus = () => fetchProduct();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [id, fetchProduct]);

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }
    if (product.displaySizes.length > 0 && !selectedSize) {
      toast.warning('Please select a size first');
      return;
    }
    if (pincodeStatus !== 'success') {
      toast.warning('Please check delivery pincode first');
      return;
    }
    setIsAddingCart(true);
    dispatch(addToCart({ 
      productId: productId, 
      quantity: quantity, 
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
    if (product.displaySizes.length > 0 && !selectedSize) {
      toast.warning('Please select a size first');
      return;
    }
    if (pincodeStatus !== 'success') {
      toast.warning('Please check delivery pincode first');
      return;
    }
    setIsAddingCart(true);
    dispatch(addToCart({ 
      productId: productId, 
      quantity: quantity, 
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

  const handleWishlist = () => {
    if (!token) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }
    if (isWishlisted) {
      dispatch(removeFromWishlist(productId));
    } else {
      dispatch(addToWishlist(product));
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  if (!product) return <div className="h-screen flex items-center justify-center"><BrandLoader text="Loading product details..." /></div>;

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 md:py-16 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="relative group aspect-square rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden bg-gray-50 border border-gray-100">
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-3">
            <button 
              onClick={handleWishlist}
              className={`p-3 rounded-full shadow-lg hover:scale-110 transition-all transform ${isWishlisted ? 'bg-red-500' : 'bg-white/80 backdrop-blur-md hover:bg-white'}`}
            >
              <Heart size={22} className={isWishlisted ? "fill-white text-white" : "text-gray-600"} />
            </button>
            <button 
              onClick={handleShare} 
              className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all transform hover:scale-110"
            >
              <Share2 size={22} className="text-gray-600" />
            </button>
          </div>
          <div className="w-full h-full flex items-center justify-center relative">
            <img 
              src={product.displayImages[currentImageIndex]} 
              alt={product.name} 
              className="w-full h-full object-cover transition-opacity duration-500" 
            />
          </div>
          
          {product.displayImages.length > 1 && (
            <>
              <button 
                onClick={() => setCurrentImageIndex(prev => (prev - 1 + product.displayImages.length) % product.displayImages.length)}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all opacity-70 hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentImageIndex(prev => (prev + 1) % product.displayImages.length)}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all opacity-70 hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
              >
                <ChevronRight size={24} />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {product.displayImages.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'w-6 bg-indigo-600' : 'w-2 bg-gray-300'}`} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col justify-center">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900">{product.name}</h1>
          </div>
          
          {product.rating && (
            <div className="flex items-center mb-4">
              <span className="text-yellow-400 text-xl">★</span>
              <span className="ml-1 font-semibold">{product.rating}</span>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl md:text-3xl font-bold text-indigo-600">
              ₹{product.discountPrice ?? (product.discount
                ? Math.round(product.price * (1 - product.discount / 100))
                : Math.round(Number(product.price) || 0))}
            </span>
            {product.discount > 0 && (
              <>
                <span className="text-lg md:text-xl text-gray-400 line-through">₹{Math.round(Number(product.price) || 0)}</span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-sm font-bold">
                  {product.discount}% OFF
                </span>
              </>
            )}
          </div>
          
          <div className="border-t border-b py-4 sm:py-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <h3 className="font-semibold text-sm sm:text-base">Description</h3>
              <button
                onClick={() => translateToHindi(product.description)}
                disabled={translating}
                className="flex items-center gap-1.5 text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium transition disabled:opacity-50"
              >
                <Languages size={16} />
                {translating ? 'Translating...' : showHindi ? 'English' : 'Hindi'}
              </button>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed">
              {showHindi && hindiDescription ? hindiDescription : product.description}
            </p>
          </div>

          {product.displaySizes && product.displaySizes.length > 0 && product.displaySizes[0]?.size !== undefined && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Available Sizes</h3>
              <div className="flex flex-wrap gap-3">
                  {product.displaySizes.map((sizeInfo) => (
                  <button 
                    key={sizeInfo.size} 
                    onClick={() => handleSelectSize(sizeInfo.size)}
                    disabled={!sizeInfo.quantity || sizeInfo.quantity === 0}
                    className={`min-w-[80px] px-3 py-2 border-2 rounded-xl font-bold text-sm md:text-base flex flex-col items-center justify-center leading-tight transition-all duration-200 ${selectedSize === sizeInfo.size ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 scale-105' : 'bg-white text-gray-600 border-gray-100 hover:border-indigo-400 hover:shadow-md'} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-100 disabled:hover:shadow-none`}
                  >
                    <span>{sizeInfo.size}</span>
                    <span className={`text-xs font-normal mt-1 ${selectedSize === sizeInfo.size ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {sizeInfo.quantity ? `${sizeInfo.quantity} left` : 'Out'}
                    </span>
                  </button>
                ))}
              </div>

            </div>
          )}

          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2 mb-2 sm:mb-3 text-indigo-600">
              <MapPin size={16} />
              <h3 className="font-bold text-xs sm:text-sm text-gray-800">Check Delivery</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Pincode"
                className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
              <button
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="bg-white text-indigo-600 border border-indigo-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-50 transition flex items-center gap-1"
                title="Detect my location"
              >
                {detectingLocation ? <Loader2 className="animate-spin" size={14} /> : <Crosshair size={14} />}
              </button>
              <button
                onClick={handlePincodeCheck}
                disabled={pincodeStatus === 'loading' || pincode.length !== 6}
                className="bg-indigo-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {pincodeStatus === 'loading' ? <Loader2 className="animate-spin" size={14} /> : 'Check'}
              </button>
            </div>
            <div className="min-h-[24px]">
              {pincodeStatus === 'error' && (
                <div className="mt-2 flex items-center gap-2 text-red-500 text-xs">
                  <XCircle size={14} />
                  <p>Delivery not available here</p>
                </div>
              )}
              {pincodeStatus === 'unavailable' && (
                <div className="mt-2 flex items-center gap-2 text-amber-500 text-xs font-medium">
                  <Loader2 size={14} />
                  <p>Coming Soon to your location</p>
                </div>
              )}
              {pincodeStatus === 'success' && (
                <div className="mt-2 flex items-center gap-2 text-green-600 text-xs font-medium">
                  <CheckCircle2 size={14} />
                  <span>Delivery Available! ({deliveryData?.estimatedDays || '1-2'} days)</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4 sm:mb-8">
            <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Quantity</h3>
            <div className="flex items-center border w-max rounded-lg overflow-hidden bg-white">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-gray-100 border-r transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base" disabled={!selectedSize || maxQuantity === 0}>-</button>
              <span className="px-4 sm:px-6 py-1.5 sm:py-2 font-medium text-sm sm:text-base">{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))} className="px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-gray-100 border-l transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base" disabled={!selectedSize || maxQuantity === 0 || quantity >= maxQuantity}>+</button>
            </div>
            <div className="min-h-[18px] sm:min-h-[24px]">
              {selectedSize && maxQuantity > 0 && (
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">{maxQuantity} pieces available for size {selectedSize}</p>
              )}
              {selectedSize && maxQuantity === 0 && (
                <p className="text-[10px] sm:text-xs text-red-500 mt-1 sm:mt-2">Out of stock for size {selectedSize}</p>
              )}
              {!selectedSize && product.displaySizes.length > 0 && (
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">Please select a size to see stock</p>
              )}
            </div>
          </div>

          <div className="min-h-[24px] sm:min-h-[28px]">
            {selectedSize === null && product.displaySizes.length > 0 && (
              <p className="text-red-500 text-xs sm:text-sm mb-2">Select a size</p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:gap-3">
            <button 
              onClick={handleAddToCart}
              disabled={isAddingCart || !selectedSize || maxQuantity === 0 || pincodeStatus !== 'success'}
              className="bg-indigo-600 text-white w-full py-3 sm:py-3.5 md:py-4 rounded-xl font-bold text-sm sm:text-base md:text-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAddingCart && <Loader2 className="animate-spin" size={18} />}
              {isAddingCart ? 'Adding...' : 'Add to Cart'}
            </button>
            <button 
              onClick={handleBuyNow}
              disabled={isAddingCart || !selectedSize || maxQuantity === 0 || pincodeStatus !== 'success'}
              className="bg-gray-900 text-white w-full py-3 sm:py-3.5 md:py-4 rounded-xl font-bold text-sm sm:text-base md:text-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAddingCart && <Loader2 className="animate-spin" size={18} />}
              {isAddingCart ? 'Processing...' : 'Buy Now'}
            </button>
            <div className="min-h-[16px]">
              {pincodeStatus === null && (
                <p className="text-red-500 text-xs text-center">Check delivery pincode above to continue</p>
              )}
              {pincodeStatus === 'error' && (
                <p className="text-red-500 text-xs text-center">Delivery not available at this pincode</p>
              )}
              {pincodeStatus === 'unavailable' && (
                <p className="text-amber-500 text-xs text-center">Coming soon to this location</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <SimilarProduct category={product?.category} subCategory={product?.subCategory} currentProductId={product?._id || product?.id} />
    </div>
  );
};

export default ProductDetails;
