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
    <div className="card rounded-3xl p-5 sm:p-6 shadow-2xl shadow-pink-200/50 ring-1 ring-pink-100 my-4 sm:my-8 mx-3 sm:mx-auto max-w-md">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 via-pink-600 to-pink-700 flex items-center justify-center text-white shadow-md shadow-pink-500/30">
          <MapPin size={18} />
        </div>
        <h3 className="font-bold text-sm sm:text-base text-gray-800">Check Delivery</h3>
      </div>

      <form onSubmit={handlePincodeCheck} className="flex gap-2">
        <input
          type="text"
          placeholder="Enter Pincode"
          className="input !py-1.5 sm:!py-2 !text-sm"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-gradient !px-4 sm:!px-6 !py-1.5 sm:!py-2 !text-sm"
        >
          {status === 'loading' ? <Loader2 className="animate-spin" size={18} /> : 'Check'}
        </button>
      </form>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-rose-500 text-sm bg-rose-50 border border-rose-100 p-3 rounded-xl">
          <XCircle size={16} />
          <p>{error}</p>
        </div>
      )}

      {status === 'success' && deliveryData && (
        <div className="mt-4 space-y-3 bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-2xl border border-emerald-200">
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <CheckCircle2 size={18} />
            <span>Delivery Available!</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600 text-sm">
            <Truck size={16} className="text-pink-600" />
            <p>Estimated Delivery: <span className="font-bold text-gray-800">{deliveryData.estimatedDays || '3-5'} Days</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
export default Pincode;
