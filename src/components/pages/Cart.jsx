import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BrandLoader from '../BrandLoader';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../ui/Toast';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '../../utils/orderBreakdown';
import { 
  fetchCartItems, 
  updateCartQuantity, 
  removeCartItem,
  clearAllCart,
  selectCartItems,
  selectCartLoading,
  selectCartTotal
} from '../../features/cart/cartSlice';

const Cart = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const cartItems = useSelector(selectCartItems);
    const loading = useSelector(selectCartLoading);
    const error = useSelector(state => state.cart.error);
    const token = useSelector(state => state.auth.token);

    useEffect(() => {
        if (!token) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        dispatch(fetchCartItems());
    }, [dispatch, token, navigate]);

    const handleUpdateQuantity = (productId, newQuantity, size) => {
        if (newQuantity < 0) return; // Prevent negative quantity
        dispatch(updateCartQuantity({ productId, quantity: newQuantity, size })).then(() => {
            dispatch(fetchCartItems());
        });
    };

    const handleRemoveFromCart = (productId, size) => {
        dispatch(removeCartItem({ productId, size })).then(() => {
            dispatch(fetchCartItems());
        });
    };

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            toast.warning('Your cart is empty');
            return;
        }

        const invalidItems = cartItems.filter(item => 
            !item.productId || !item.quantity || item.quantity < 1
        );
        
        if (invalidItems.length > 0) {
            toast.error('Invalid items in cart. Please check your cart items.');
            return;
        }

        // Navigate to checkout page
        navigate('/checkout');
    };

    const subtotal = Math.round(cartItems.reduce((acc, item) => {
        const price = item.productId?.price || 0;
        const discount = item.productId?.discount || 0;
        const finalPrice = discount ? (price * (1 - discount / 100)) : price;
        return acc + (finalPrice * item.quantity);
    }, 0));
  const deliveryFee = subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const platformFee = 0;
  const total = subtotal + deliveryFee + platformFee;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <BrandLoader text="Loading cart..." />
        </div>
    );

  return (
    <div className="min-h-screen page-bg py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-700 flex items-center justify-center shadow-lg shadow-pink-500/30">
                    <ShoppingCart className="text-white w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900">Your Cart</h1>
                    <span className="chip bg-gradient-to-r from-rose-100 to-pink-100 text-pink-700 font-bold mt-1">
                        {cartItems.length} Items
                    </span>
                </div>
            </div>
            <button 
                onClick={() => dispatch(fetchCartItems())}
                className="px-4 py-2 bg-white text-pink-600 rounded-xl font-semibold border border-pink-100 shadow-sm hover:bg-pink-50 transition text-sm"
            >
                Refresh
            </button>
        </div>

        {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6">
                <p className="text-rose-700 font-semibold">Error: {error}</p>
            </div>
        )}

        {cartItems.length === 0 ? (
            <div className="card p-6 sm:p-12 text-center">
                <div className="bg-gradient-to-br from-rose-100 via-pink-100 to-pink-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner">
                    <ShoppingBag className="text-pink-600 w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">Looks like you haven't added anything to your cart yet.</p>
                <Link to="/" className="btn-gradient text-sm sm:text-base px-8 py-3">
                    Start Shopping <ArrowRight size={16} />
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items List */}
                <div className="lg:col-span-2 space-y-4">
                    {cartItems.map((item) => {
                        // Find the available stock for the specific size of the cart item
                        const sizeInfo = item.productId?.size?.find(s => s.size === item.size);
                        const maxQuantity = sizeInfo ? sizeInfo.quantity : 0;

                        return (
                        <div key={`${item.productId?._id}-${item.size}`} className="card card-hover p-3 sm:p-4 flex gap-3 sm:gap-4 items-center">
                            <Link
                                to={`/product/${item.productId?._id || item.productId?.id}`}
                                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 ring-1 ring-slate-100 block"
                            >
                                <img
                                    src={Array.isArray(item.productId?.image) ? (item.productId.image[0]?.url || item.productId.image[0]) : item.productId?.image}
                                    alt={item.productId?.name} 
                                    className="w-full h-full object-cover"
                                />
                            </Link>
                            
                            <div className="flex-1 min-w-0">
                                <Link to={`/product/${item.productId?._id || item.productId?.id}`} className="block">
                                    <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate hover:text-pink-600 transition">{item.productId?.name}</h3>
                                </Link>
                                <p className="text-gray-500 text-xs sm:text-sm mb-1 sm:mb-2">Size: {item.size || 'N/A'}</p>
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
                                        <button 
                                            onClick={() => handleUpdateQuantity(item.productId?._id, item.quantity - 1, item.size)}
                                            className="p-2 hover:bg-pink-50 text-slate-600 transition"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="px-2 sm:px-3 font-semibold text-xs sm:text-sm">{item.quantity}</span>
                                        <button 
                                            onClick={() => handleUpdateQuantity(item.productId?._id, item.quantity + 1, item.size)}
                                            className="p-2 hover:bg-pink-50 text-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={sizeInfo && item.quantity >= maxQuantity}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveFromCart(item.productId?._id, item.size)}
                                        className="text-rose-500 hover:text-rose-600 transition p-1.5 hover:bg-rose-50 rounded-lg"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                                <p className="font-extrabold gradient-text text-sm sm:text-base">
                                    ₹{Math.round((item.productId?.discount 
                                        ? (item.productId.price * (1 - item.productId.discount / 100)) 
                                        : (item.productId?.price || 0)) * item.quantity)}
                                </p>
                                <p className="text-[10px] sm:text-xs text-gray-400">
                                    ₹{Math.round(item.productId?.discount ? (item.productId.price * (1 - item.productId.discount / 100)) : Number(item.productId?.price || 0))} each
                                </p>
                            </div>
                        </div>
                        );
                    })}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="card p-4 sm:p-6 sticky top-24 border-pink-50">
                        <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 inline-block" />
                            Order Summary
                        </h2>
                        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                            <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                                <span>Subtotal</span>
                                <span className="font-semibold text-gray-900">₹{subtotal}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                                <span>Delivery Fee</span>
                                <span className="font-semibold text-gray-900">{deliveryFee > 0 ? `₹${deliveryFee}` : 'FREE'}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                                <span>Platform Fee</span>
                                <span className="font-semibold text-gray-900">{platformFee > 0 ? `₹${platformFee}` : 'FREE'}</span>
                            </div>
                            <div className="border-t border-slate-100 pt-3 sm:pt-4 flex justify-between items-center">
                                <span className="text-base sm:text-lg font-extrabold text-gray-900">Total</span>
                                <span className="text-xl sm:text-2xl font-extrabold gradient-text">₹{total}</span>
                            </div>
                        </div>
                        <button 
                            onClick={handleCheckout}
                            disabled={loading}
                            className="btn-gradient w-full !py-3.5 !text-base mb-3"
                        >
                            {loading ? (
                                <><Loader2 className="animate-spin" size={20} /> Processing...</>
                            ) : (
                                <>Checkout Now <ArrowRight size={20} /></>
                            )}
                        </button>
                        <button 
                            onClick={() => {
                                if (window.confirm('Are you sure you want to clear your cart?')) {
                                    dispatch(clearAllCart()).then(() => {
                                        dispatch(fetchCartItems());
                                    });
                                }
                            }}
                            className="w-full bg-rose-50 text-rose-600 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold hover:bg-rose-100 transition text-sm"
                        >
                            Clear Cart
                        </button>
                        <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-3 sm:mt-4">
                            Delivery fee ₹{DELIVERY_FEE} applies on orders up to ₹{FREE_DELIVERY_THRESHOLD}. Free delivery on orders above ₹{FREE_DELIVERY_THRESHOLD}!
                        </p>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  )
}

export default Cart
