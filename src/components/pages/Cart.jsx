import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BrandLoader from '../BrandLoader';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../ui/Toast';
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
  const shipping = 0;
  const total = subtotal;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <BrandLoader text="Loading cart..." />
        </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
                <ShoppingCart className="text-indigo-600 w-6 h-6 sm:w-8 sm:h-8" size={32} />
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Cart</h1>
                    <span className="bg-indigo-100 text-indigo-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold">
                        {cartItems.length} Items
                    </span>
                </div>
            </div>
            <button 
                onClick={() => dispatch(fetchCartItems())}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-100 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-200 transition text-sm"
            >
                Refresh
            </button>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                <p className="text-red-700 font-semibold">Error: {error}</p>
            </div>
        )}

        {cartItems.length === 0 ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center shadow-sm border border-gray-100">
                <div className="bg-indigo-50 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <ShoppingBag className="text-indigo-600 w-6 h-6 sm:w-8 sm:h-8" size={32} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">Looks like you haven't added anything to your cart yet.</p>
                <Link to="/" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-sm sm:text-base">
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
                        <div key={`${item.productId?._id}-${item.size}`} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 flex gap-3 sm:gap-4 items-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg sm:rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                                <img
                                    src={Array.isArray(item.productId?.image) ? (item.productId.image[0]?.url || item.productId.image[0]) : item.productId?.image}
                                    alt={item.productId?.name} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{item.productId?.name}</h3>
                                <p className="text-gray-500 text-xs sm:text-sm mb-1 sm:mb-2">Size: {item.size || 'N/A'}</p>
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <div className="flex items-center border rounded-lg">
                                        <button 
                                            onClick={() => handleUpdateQuantity(item.productId?._id, item.quantity - 1, item.size)}
                                            className="p-1 hover:bg-gray-100 transition"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="px-2 sm:px-3 font-medium text-xs sm:text-sm">{item.quantity}</span>
                                        <button 
                                            onClick={() => handleUpdateQuantity(item.productId?._id, item.quantity + 1, item.size)}
                                            className="p-1 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={sizeInfo && item.quantity >= maxQuantity}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveFromCart(item.productId?._id, item.size)}
                                        className="text-red-500 hover:text-red-600 transition p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                                <p className="font-bold text-indigo-600 text-sm sm:text-base">
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
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 sticky top-24">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Order Summary</h2>
                        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                            <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                                <span>Subtotal</span>
                                <span className="font-semibold text-gray-900">₹{subtotal}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                                <span>Shipping</span>
                                <span className="font-semibold text-gray-900">FREE</span>
                            </div>
                            <div className="border-t pt-3 sm:pt-4 flex justify-between items-center">
                                <span className="text-base sm:text-lg font-bold text-gray-900">Total</span>
                                <span className="text-xl sm:text-2xl font-bold text-indigo-600">₹{total}</span>
                            </div>
                        </div>
                        <button 
                            onClick={handleCheckout}
                            disabled={loading}
                            className="w-full bg-gray-900 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:bg-black transition flex items-center justify-center gap-2 mb-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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
                            className="w-full bg-red-50 text-red-600 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold hover:bg-red-100 transition text-sm"
                        >
                            Clear Cart
                        </button>
                        <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-3 sm:mt-4">
                            Free shipping on all orders
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
