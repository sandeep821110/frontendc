import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import BrandLoader from '../BrandLoader';
import { apiClient } from '../../services/apiClient';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiClient.get('/products');
        const data = res.data;
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
        } else {
          throw new Error(data.message || 'API response is not in the expected format.');
        }
        setError(null);
      } catch (err) {

        setProducts([]);
        setError(err.message);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  if (loading) return <BrandLoader text="Loading products..." />;
  if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
      {products.map(product => (
        <ProductCard key={product._id || product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductList;
