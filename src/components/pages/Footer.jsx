import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../ui/Toast';
import { Mail, Phone, Camera, AtSign, Send } from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const toast = useToast();

  const handleSubscribe = (e) => {
    e.preventDefault();
    toast.success(`Thank you for subscribing with ${email}!`);
    setEmail('');
  };

  const linkClass = 'text-slate-400 hover:text-white transition-all duration-200 hover:translate-x-0.5 inline-block';

  return (
    <footer className="relative bg-slate-950 text-white pt-16 pb-8 overflow-hidden">
      {/* Decorative gradient glows */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-pink-700/15 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10 mb-10">
          {/* Brand Section */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 via-pink-600 to-pink-700 flex items-center justify-center shadow-lg shadow-pink-600/40">
                <span className="text-white font-black text-lg">C</span>
              </span>
              <span className="text-xl sm:text-2xl font-bold tracking-tight gradient-text-animated">
                ChooseMood
              </span>
            </Link>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              Express your personality through our curated collections. We believe every mood deserves a unique style.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-4 text-slate-200">Shop</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className={linkClass}>New Arrivals</Link></li>
              <li><Link to="/" className={linkClass}>Best Sellers</Link></li>
              <li><Link to="/" className={linkClass}>Sale</Link></li>
              <li><Link to="/" className={linkClass}>Collections</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-4 text-slate-200">Support</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/contact" className={linkClass}>Contact Us</Link></li>
              <li><Link to="/my-queries" className={linkClass}>My Queries</Link></li>
              <li><Link to="/about" className={linkClass}>About Us</Link></li>
              <li><Link to="/refund-policy" className={linkClass}>Refund & Return Policy</Link></li>
            </ul>
            <div className="mt-5 space-y-2.5 text-sm text-slate-400">
              <p className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-pink-500" />
                <a href="tel:+919570523147" className="hover:text-white transition">+91 9570523147</a>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-pink-500" />
                <a href="mailto:choosemood34@gmail.com" className="hover:text-white transition">choosemood34@gmail.com</a>
              </p>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-4 text-slate-200">Legal</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/privacy-policy" className={linkClass}>Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className={linkClass}>Terms of Service</Link></li>
              <li><Link to="/refund-policy" className={linkClass}>Refund Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-4 text-slate-200">Stay Connected</h3>
            <p className="text-slate-400 text-sm mb-4">Subscribe to get special offers and first look at new arrivals.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col space-y-2.5">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition"
                  required
                />
              </div>
              <button type="submit" className="btn-gradient w-full py-2.5 text-sm">
                <Send className="w-4 h-4" /> Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-7 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-xs">
            &copy; {new Date().getFullYear()} ChooseMood Inc. All rights reserved.
          </p>
          <div className="flex space-x-3">
            <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-gradient-to-br hover:from-rose-500 hover:to-pink-700 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-300">
              <Camera className="w-4.5 h-4.5" />
            </a>
            <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-gradient-to-br hover:from-rose-500 hover:to-pink-700 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-300">
              <AtSign className="w-4.5 h-4.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
