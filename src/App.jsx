import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import HomePage from './components/pages/HomePage'
import About from './components/pages/About'
import Contact from './components/pages/Contact'
import { Route, Routes } from 'react-router-dom'
import ProductDetails from './components/product/ProductDetails'
import Login from './components/auth/Login'
import SignUp from './components/auth/SignUp'
import Profile from './components/auth/Profile'
import RequireAuth from './components/auth/RequireAuth'
import NavBar from './components/pages/NavBar'
import Footer from './components/pages/Footer'
import Cart from './components/pages/Cart'
import Wishlist from './components/pages/Wishlist'
import CheckOut from './components/pages/CheckOut'
import Orders from './components/pages/Orders'
import OrderSuccess from './components/pages/OrderSuccess'

import { restoreAuthFromStorage, logout } from './features/auth/authSlice'
import { setOnUnauthorized } from './services/apiClient'
import Address from './components/pages/Address'
import SearchResults from './components/pages/SearchResults'
import AllProducts from './components/pages/AllProducts'
import DevToken from './components/auth/DevToken'
import MyQueries from './components/pages/MyQueries'

import PrivacyPolicy from './components/pages/PrivacyPolicy'
import RefundPolicy from './components/pages/RefundPolicy'
import TermsOfService from './components/pages/TermsOfService'
import NotFound from './components/pages/NotFound'
import ChatWidget from './components/chat/ChatWidget'

const App = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Set global unauthorized handler for any 401 from API calls
  useEffect(() => {
    let loggingOut = false;
    setOnUnauthorized(async () => {
      if (loggingOut) return;
      loggingOut = true;
      await dispatch(logout())
      window.location.href = '/'
    })
  }, [dispatch, navigate])

  // Restore auth state from localStorage on app startup
  useEffect(() => {
    dispatch(restoreAuthFromStorage())
  }, [dispatch])
  return (
    <div>
      <NavBar />
  
      <Routes>
     
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/products" element={<AllProducts />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        } />
        <Route path="/cart" element={
          <RequireAuth>
            <Cart />
          </RequireAuth>
        } />
        <Route path="/wishlist" element={
          <RequireAuth>
            <Wishlist />
          </RequireAuth>
        } />
        <Route path="/checkout" element={
          <RequireAuth>
            <CheckOut />
          </RequireAuth>
        } />
        <Route path="/addresses" element={
          <RequireAuth>
            <Address />
          </RequireAuth>
        } />
        <Route path="/my-queries" element={
          <RequireAuth>
            <MyQueries />
          </RequireAuth>
        } />
        <Route path="/orders" element={
          <RequireAuth>
            <Orders />
          </RequireAuth>
        } />
        <Route path="/order-success" element={
          <RequireAuth>
            <OrderSuccess />
          </RequireAuth>
        } />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        {import.meta.env.DEV && <Route path="/dev-token" element={<DevToken />} />}
        <Route path="*" element={<NotFound />} />
    
    </Routes>
    <Footer />
    <ChatWidget />
    </div>
  )
}

export default App
