import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard';

const SimilarProduct = ({ category, subCategory, currentProductId }) => {
  const [similarProducts, setSimilarProducts] = useState([]);

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      try {
        const res = await axios.get('/api/products', { params: { limit: 100 } });
        const products = res.data.success && Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        const filtered = products.filter((product) => {
          const id = String(product._id || product.id);
          if (id === String(currentProductId)) return false;
          return product.category === category || product.subCategory === subCategory;
        });

        // Limit to 4 products
        setSimilarProducts(filtered.slice(0, 4));
      } catch {
        setSimilarProducts([]);
      }
    };

    if (category || subCategory) {
      fetchSimilarProducts();
    }
  }, [category, subCategory, currentProductId]);

  if (similarProducts.length === 0) return null;

  return (
    <div className="mt-8 sm:mt-16 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start gap-2 mb-4 sm:mb-8">
        <span className="section-badge">You may also like</span>
        <h2 className="text-xl sm:text-2xl font-bold section-title gradient-text">Similar Products</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
        {similarProducts.map(product => (
          <ProductCard key={product._id || product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default SimilarProduct;

