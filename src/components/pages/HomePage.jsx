import React from 'react';

import CarsolioSlider from './CarsolioSlider';

import ProductList from '../product/Product';
import BestSeller from '../product/BestSeller';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white">
      <main>
        <section className="w-full">
          <CarsolioSlider />
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">All Products</h2>
          <ProductList />
        </section>

        <BestSeller />
      </main>
    </div>
  );
};

export default HomePage;