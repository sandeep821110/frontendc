import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Truck, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const Pincode = () => {
  const [pincode, setPincode] = useState('');
  const [status, setStatus] = useState(null);
  const [deliveryData, setDeliveryData] = useState(null);
  const [error, setError] = useState('');

  const handlePincodeCheck = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (pincode.length !== 6) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }

    setStatus('loading');
    setError('');
    try {
      const res = await axios.get(`/api/pincodes/${pincode}`);
      setDeliveryData(res.data);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.message || 'Delivery not available for this location');
    }
  }, [pincode]);

  useEffect(() => {
    if (pincode.length === 6) {
      const timeoutId = setTimeout(() => {
        handlePincodeCheck();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [pincode, handlePincodeCheck]);

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100 my-4 sm:my-8 mx-3 sm:mx-auto">
      <div className="flex items-center gap-2 mb-3 sm:mb-4 text-indigo-600">
        <MapPin size={18} />
        <h3 className="font-bold text-sm sm:text-base text-gray-800">Check Delivery</h3>
      </div>

      <form onSubmit={handlePincodeCheck} className="flex gap-2">
        <input
          type="text"
          placeholder="Enter Pincode"
          className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-indigo-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-70"
        >
          {status === 'loading' ? <Loader2 className="animate-spin" size={18} /> : 'Check'}
        </button>
      </form>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
          <XCircle size={16} />
          <p>{error}</p>
        </div>
      )}

      {status === 'success' && deliveryData && (
        <div className="mt-4 space-y-3 bg-green-50 p-4 rounded-xl border border-green-100">
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <CheckCircle2 size={18} />
            <span>Delivery Available!</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600 text-sm">
            <Truck size={16} className="text-indigo-600" />
            <p>Estimated Delivery: <span className="font-bold text-gray-800">{deliveryData.estimatedDays || '3-5'} Days</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
export default Pincode;
