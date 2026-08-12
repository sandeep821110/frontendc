import React from 'react';
import { ShoppingBag, Heart, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen page-bg">
      {/* Hero Section */}
      <div className="relative h-[220px] sm:h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200" 
          alt="ChooseMood Fashion" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-900/80 via-pink-900/70 to-pink-900/80"></div>
        <div className="relative z-10 text-center px-4">
          <span className="section-badge !bg-white/10 !text-white !from-white/10 !to-white/10 mb-4">Our Story</span>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white mb-2 sm:mb-4">About ChooseMood</h1>
          <p className="text-base sm:text-lg md:text-xl text-rose-100 max-w-2xl mx-auto">Redefining fashion through the lens of your emotions.</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold section-title gradient-text">Our Story</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Founded with a passion for self-expression, <span className="font-semibold gradient-text">ChooseMood</span> was created to offer a curated selection of products that let you showcase your personality. We believe that fashion isn't just about clothes; it's about how you feel.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Our mission is to inspire confidence, positivity, and creativity in everyone who wears our brand. Every piece in our collection is selected to match a vibe, a moment, or a mood.
            </p>
          </div>
          <div className="card rounded-3xl p-8 shadow-2xl shadow-pink-200/50 ring-1 ring-pink-100">
            <h3 className="text-2xl font-bold section-title mb-8">Why Choose Us?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 via-pink-600 to-pink-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-500/30"><ShoppingBag size={24} /></div>
                <h4 className="font-bold">Curated Style</h4>
                <p className="text-sm text-gray-500">Handpicked mood-inspired clothing.</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/30"><Heart size={24} /></div>
                <h4 className="font-bold">Customer First</h4>
                <p className="text-sm text-gray-500">Dedicated support for your needs.</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30"><Truck size={24} /></div>
                <h4 className="font-bold">Fast Delivery</h4>
                <p className="text-sm text-gray-500">Reliable and secure shipping.</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-500/30"><ShieldCheck size={24} /></div>
                <h4 className="font-bold">Quality First</h4>
                <p className="text-sm text-gray-500">Commitment to premium materials.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center bg-gradient-to-r from-rose-700 via-pink-600 to-pink-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-white shadow-2xl shadow-pink-500/30">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Ready to find your mood?</h2>
          <p className="mb-6 sm:mb-8 text-pink-100 text-sm sm:text-base">Join the ChooseMood community and express yourself today.</p>
          <Link to="/" className="inline-block bg-white text-pink-600 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold hover:bg-pink-50 transition text-sm sm:text-base">Start Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default About;
