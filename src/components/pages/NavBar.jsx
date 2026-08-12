import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Heart, ShoppingBag, ClipboardList, Wallet, User, Menu, X } from 'lucide-react';
import { selectCartCount, fetchCartItems } from '../../features/cart/cartSlice';
import { selectWishlistItems, fetchWishlistItems } from '../../features/wishlist/wishlistSlice';
import SearchBar from '../search/SearchBar';

const NavBar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const cartItemCount = useSelector(selectCartCount);
  const wishlistItems = useSelector(selectWishlistItems) || [];
  const token = useSelector(state => state.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(fetchCartItems());
      dispatch(fetchWishlistItems());
    }
  }, [token, dispatch]);

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
      isActive ? 'text-white' : 'text-slate-300 hover:text-white'
    }`;

  const activeUnderline = ({ isActive }) =>
    isActive ? 'after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-rose-400 after:via-pink-500 after:to-pink-500' : '';

  const navLinkClass = ({ isActive }) => `${linkClass({ isActive })} ${activeUnderline({ isActive })}`;

  const iconLink = 'relative p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-200';

  const badge = (count) =>
    count > 0 ? (
      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-pink-600 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md shadow-pink-500/40">
        {count > 99 ? '99+' : count}
      </span>
    ) : null;

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-pink-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-2">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 via-pink-600 to-pink-700 flex items-center justify-center shadow-lg shadow-pink-600/40 group-hover:rotate-6 transition-transform duration-300">
                <span className="text-white font-black text-lg">C</span>
              </span>
              <span className="text-white font-bold text-lg sm:text-xl tracking-tight gradient-text-animated">
                ChooseMood
              </span>
            </Link>
          </div>

          {/* Search Bar - responsive: icon on mobile, full on desktop */}
          <div className="md:flex-1 md:max-w-lg md:mx-auto">
            <SearchBar />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink to="/" className={navLinkClass}>Home</NavLink>
            <NavLink to="/products" className={navLinkClass}>Collections</NavLink>
            <NavLink to="/about" className={navLinkClass}>About</NavLink>
            <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-0.5 sm:space-x-1">
            <Link to="/wishlist" className={iconLink} aria-label="Wishlist">
              <Heart className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
              {badge(wishlistItems.length)}
            </Link>
            <Link to="/cart" className={iconLink} aria-label="Cart">
              <ShoppingBag className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
              {badge(cartItemCount)}
            </Link>
            <Link to="/orders" className={`${iconLink} hidden sm:inline-flex`} aria-label="Orders">
              <ClipboardList className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
            </Link>
            <Link to="/wallet" className={`${iconLink} hidden sm:inline-flex`} aria-label="Wallet">
              <Wallet className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
            </Link>
            <Link to="/profile" className={`${iconLink} hidden sm:inline-flex`} aria-label="Profile">
              <User className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
            </Link>
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden text-slate-100 hover:text-white p-2 rounded-lg hover:bg-white/10 transition"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-[420px]' : 'max-h-0'}`}>
        <div className="px-4 pb-3 space-y-1 border-t border-white/10 bg-slate-950/90">
          {[
            { to: '/', label: 'Home' },
            { to: '/products', label: 'Shop All' },
            { to: '/about', label: 'About' },
            { to: '/contact', label: 'Contact' },
            { to: '/profile', label: 'Profile' },
            { to: '/orders', label: 'Orders' },
            { to: '/wallet', label: 'Wallet' },
            { to: '/wishlist', label: 'Wishlist' },
            { to: '/cart', label: 'Cart' },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="block text-slate-200 hover:text-white hover:bg-white/5 px-3 py-2.5 rounded-lg text-base font-medium transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
