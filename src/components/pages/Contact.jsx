import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { logout } from '../../features/auth/authSlice';

const Contact = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector(state => state.auth.token);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const user = useSelector(state => state.auth.user); // Assuming user object is available in auth state
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check authentication
    if (!isAuthenticated || !token) {
      setError('Please login to send a message');
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await axios.post(
        '/api/queries/user/create', 
        {
          name,
          email,
          phone,
          message
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (res.status === 201 || res.status === 200) {
        setSuccess(true);
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your session expired. Please login again.');
        dispatch(logout());
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to send message. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[180px] sm:h-[220px] md:h-[300px] flex items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&q=80&w=1200" 
          alt="Contact Us" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white mb-2 sm:mb-4">Get In Touch</h1>
          <p className="text-sm sm:text-base md:text-xl text-gray-200 max-w-2xl mx-auto">We're here to help you find your perfect mood.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-600 text-lg">
                Have questions about our collections or your order? Our team is ready to assist you.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Phone</h4>
                  <p className="text-gray-600">+91 9570523147</p>
                  <p className="text-sm text-gray-400">Mon-Sat from 10am to 7pm</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Email</h4>
                  <p className="text-gray-600">choosemood34@gmail.com</p>
                  <p className="text-sm text-gray-400">Online support 24/7</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Office</h4>
                  <p className="text-gray-600">123 Fashion Street, Style District</p>
                  <p className="text-sm text-gray-400">New York, NY 10001</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
            {!isAuthenticated && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="text-blue-600" size={20} />
                <div>
                  <span className="text-blue-700 font-semibold">Login required</span>
                  <p className="text-sm text-blue-600">Please <button onClick={() => navigate('/login')} className="underline font-bold hover:no-underline">login</button> to send a message</p>
                </div>
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-green-700 font-semibold">Message sent successfully! We'll get back to you soon.</span>
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="text-red-600" size={20} />
                <span className="text-red-700 font-semibold">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 relative">
                  <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isAuthenticated}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed" 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2 relative">
                  <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 text-gray-400" size={18} />
                    <input 
                      type="tel" 
                      placeholder="+91 00000 00000" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={!isAuthenticated}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed" 
                      required 
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2 relative">
                <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    placeholder="john@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isAuthenticated}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Message</label>
                <textarea 
                  rows={4} 
                  placeholder="Your message here..." 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!isAuthenticated}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none disabled:bg-gray-100 disabled:cursor-not-allowed" 
                  required
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={loading || !isAuthenticated}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                {loading ? 'Sending...' : !isAuthenticated ? 'Login to Send Message' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
