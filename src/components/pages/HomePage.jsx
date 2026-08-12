import React from 'react';

import CarsolioSlider from './CarsolioSlider';

import ProductList from '../product/Product';
import BestSeller from '../product/BestSeller';

const HomePage = () => {
  return (
    <div className="min-h-screen page-bg">
      <main className="relative">
        {/* Hero section */}
        <section className="w-full pt-4 sm:pt-8">
          <CarsolioSlider />
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
          <div className="text-center mb-8 sm:mb-10">
            <span className="section-badge mb-3">Shop the collection</span>
            <h2 className="section-title mt-2">
              All <span className="gradient-text-animated">Products</span>
            </h2>
            <p className="mt-3 text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
              Discover pieces crafted for every mood and every moment.
            </p>
          </div>
          <ProductList />
        </section>

        <BestSeller />

        {/* Feature strip */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { emoji: '🚚', title: 'Fast Delivery', desc: 'Express shipping on all orders' },
              { emoji: '💎', title: 'Premium Quality', desc: 'Curated pieces, lasting style' },
              { emoji: '🛡️', title: 'Easy Returns', desc: 'Hassle-free 2-day returns' },
            ].map((f) => (
              <div key={f.title} className="card card-hover p-4 sm:p-5 flex items-center gap-4">
                <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-100 via-pink-100 to-pink-100 flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                  {f.emoji}
                </span>
                <div>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">{f.title}</p>
                  <p className="text-xs sm:text-sm text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
