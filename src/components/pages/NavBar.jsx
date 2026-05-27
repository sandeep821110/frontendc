import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
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

  return (
    <nav className="bg-black shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-2">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-white font-bold text-lg sm:text-2xl tracking-tight">ChooseMood</Link>
          </div>

          {/* Search Bar - responsive: icon on mobile, full on desktop */}
          <div className="md:flex-1 md:max-w-lg md:mx-auto">
            <SearchBar />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink to="/" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition ${isActive ? 'text-indigo-400' : 'text-white hover:text-indigo-200'}`}>Home</NavLink>
            <NavLink to="/products" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition ${isActive ? 'text-indigo-400' : 'text-white hover:text-indigo-200'}`}>Collections</NavLink>
            <NavLink to="/about" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition ${isActive ? 'text-indigo-400' : 'text-white hover:text-indigo-200'}`}>About</NavLink>
            <NavLink to="/contact" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition ${isActive ? 'text-indigo-400' : 'text-white hover:text-indigo-200'}`}>Contact</NavLink>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Link to="/wishlist" className="relative text-white hover:text-indigo-200 p-1.5 sm:p-2" aria-label="Wishlist">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.239-4.5-5-4.5-1.657 0-3.156.832-4 2.09C10.156 4.582 8.657 3.75 7 3.75c-2.761 0-5 2.015-5 4.5 0 7.25 10 12.5 10 12.5s10-5.25 10-12.5z" />
              </svg>
              {wishlistItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-600 text-white text-[10px] sm:text-xs font-bold rounded-full px-1 sm:px-1.5 py-0.5">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative text-white hover:text-indigo-200 p-1.5 sm:p-2" aria-label="Cart">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437m0 0A2.25 2.25 0 007.25 7.5h9.5a2.25 2.25 0 002.144-1.727l1.357-5.428A1.125 1.125 0 0019.143 0H4.857a1.125 1.125 0 00-1.108 1.345l1.357 5.428zM6.75 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10.5 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-600 text-white text-[10px] sm:text-xs font-bold rounded-full px-1 sm:px-1.5 py-0.5">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <Link to="/orders" className="hidden sm:inline-flex text-white hover:text-indigo-200 p-2" aria-label="Orders">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </Link>
            <Link to="/profile" className="hidden sm:inline-flex text-white hover:text-indigo-200 p-2" aria-label="Profile">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z" />
              </svg>
            </Link>
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden text-white hover:text-indigo-200 p-2"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      <div className={`md:hidden ${isMobileMenuOpen ? '' : 'hidden'}`}>
        <div className="px-4 pt-2 pb-3 space-y-1 bg-black border-t border-gray-800">
          <Link to="/" className="block text-white hover:text-indigo-200 px-3 py-2 rounded-md text-base font-medium transition" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link to="/products" className="block text-white hover:text-indigo-200 px-3 py-2 rounded-md text-base font-medium transition" onClick={() => setMobileMenuOpen(false)}>Shop All</Link>
          <Link to="/about" className="block text-white hover:text-indigo-200 px-3 py-2 rounded-md text-base font-medium transition" onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link to="/contact" className="block text-white hover:text-indigo-200 px-3 py-2 rounded-md text-base font-medium transition" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          <div className="border-t border-gray-700 my-2" />
          <Link to="/profile" className="block text-white hover:text-indigo-200 px-3 py-2 rounded-md text-base font-medium transition" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
          <Link to="/orders" className="block text-white hover:text-indigo-200 px-3 py-2 rounded-md text-base font-medium transition" onClick={() => setMobileMenuOpen(false)}>Orders</Link>
          <Link to="/wishlist" className="block text-white hover:text-indigo-200 px-3 py-2 rounded-md text-base font-medium transition" onClick={() => setMobileMenuOpen(false)}>Wishlist</Link>
          <Link to="/cart" className="block text-white hover:text-indigo-200 px-3 py-2 rounded-md text-base font-medium transition" onClick={() => setMobileMenuOpen(false)}>Cart</Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
