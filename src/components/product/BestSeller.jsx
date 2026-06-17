import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import BrandLoader from '../BrandLoader';
import { Sparkles } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const BestSeller = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const res = await apiClient.get('/products?bestseller=true&limit=8');
        const data = res.data;
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
        } else if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      }
      setLoading(false);
    };
    fetchBestSellers();
  }, []);

  if (loading) return <BrandLoader text="Loading best sellers..." />;

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
        <Sparkles className="text-yellow-500" size={28} />
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Best Sellers</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
        {products.map(product => (
          <ProductCard key={product._id || product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default BestSeller;
