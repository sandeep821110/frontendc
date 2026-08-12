import React, { lazy, Suspense, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import NavBar from './components/pages/NavBar'
import Footer from './components/pages/Footer'
import RequireAuth from './components/auth/RequireAuth'
import BrandLoader from './components/BrandLoader'

const HomePage = lazy(() => import('./components/pages/HomePage'))
const About = lazy(() => import('./components/pages/About'))
const Contact = lazy(() => import('./components/pages/Contact'))
const ProductDetails = lazy(() => import('./components/product/ProductDetails'))
const Login = lazy(() => import('./components/auth/Login'))
const SignUp = lazy(() => import('./components/auth/SignUp'))
const Profile = lazy(() => import('./components/auth/Profile'))
const Cart = lazy(() => import('./components/pages/Cart'))
const Wishlist = lazy(() => import('./components/pages/Wishlist'))
const CheckOut = lazy(() => import('./components/pages/CheckOut'))
const Orders = lazy(() => import('./components/pages/Orders'))
const OrderSuccess = lazy(() => import('./components/pages/OrderSuccess'))
const Address = lazy(() => import('./components/pages/Address'))
const SearchResults = lazy(() => import('./components/pages/SearchResults'))
const AllProducts = lazy(() => import('./components/pages/AllProducts'))
const MyQueries = lazy(() => import('./components/pages/MyQueries'))
const WalletPage = lazy(() => import('./components/pages/Wallet'))

import { bootstrapAuth, logout } from './features/auth/authSlice'
import { setOnUnauthorized } from './services/apiClient'

const PrivacyPolicy = lazy(() => import('./components/pages/PrivacyPolicy'))
const RefundPolicy = lazy(() => import('./components/pages/RefundPolicy'))
const TermsOfService = lazy(() => import('./components/pages/TermsOfService'))
const NotFound = lazy(() => import('./components/pages/NotFound'))
const DevToken = lazy(() => import('./components/auth/DevToken'))

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

  // Bootstrap the session from the httpOnly refreshToken cookie on startup
  useEffect(() => {
    dispatch(bootstrapAuth())
  }, [dispatch])
  return (
    <div>
      <NavBar />

      <Suspense fallback={<BrandLoader />}>
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
        <Route path="/wallet" element={
          <RequireAuth>
            <WalletPage />
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
    </Suspense>
    <Footer />
    </div>
  )
}

export default App
