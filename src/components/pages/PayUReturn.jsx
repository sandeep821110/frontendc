import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyPayuPaymentAPI } from '../../services/orderPaymentAPI';
import { Loader2 } from 'lucide-react';

const PAYMENT_STATUS_KEY = 'lastOrderSuccess';

const PayUReturn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const txnid = searchParams.get('txnid') || '';
    const mihpayid = searchParams.get('mihpayid') || '';
    const status = searchParams.get('status') || '';
    const hash = searchParams.get('hash') || '';
    const amount = searchParams.get('amount') || '';
    const productinfo = searchParams.get('productinfo') || '';
    const firstname = searchParams.get('firstname') || '';
    const email = searchParams.get('email') || '';
    const udf1 = searchParams.get('udf1') || '';
    const udf2 = searchParams.get('udf2') || '';
    const udf3 = searchParams.get('udf3') || '';
    const udf4 = searchParams.get('udf4') || '';
    const udf5 = searchParams.get('udf5') || '';
    const udf6 = searchParams.get('udf6') || '';
    const udf7 = searchParams.get('udf7') || '';
    const udf8 = searchParams.get('udf8') || '';
    const udf9 = searchParams.get('udf9') || '';
    const udf10 = searchParams.get('udf10') || '';

    const storedData = localStorage.getItem(PAYMENT_STATUS_KEY);
    let orderId = udf1 || '';
    let orderNumber = udf2 || '';

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        orderId = orderId || parsed.orderId || '';
        orderNumber = orderNumber || parsed.orderNumber || '';
      } catch {}
    }

    const verify = async () => {
      try {
        if (!txnid || !status || !hash) {
          navigate('/orders', { replace: true });
          return;
        }

        await verifyPayuPaymentAPI({
          orderId,
          txnid,
          mihpayid,
          status,
          hash,
          amount,
          productinfo,
          firstname,
          email,
          udf1, udf2, udf3, udf4, udf5,
          udf6, udf7, udf8, udf9, udf10,
        });

        const successData = storedData
          ? { ...JSON.parse(storedData), paymentStatus: status === 'success' ? 'PAID' : 'FAILED', orderStatus: status === 'success' ? 'CONFIRMED' : 'PENDING' }
          : { orderId, orderNumber, paymentStatus: status === 'success' ? 'PAID' : 'FAILED' };
        localStorage.setItem(PAYMENT_STATUS_KEY, JSON.stringify(successData));
      } catch {
        if (storedData) {
          const parsed = JSON.parse(storedData);
          parsed.paymentStatus = status === 'success' ? 'PAID' : 'FAILED';
          parsed.orderStatus = status === 'success' ? 'CONFIRMED' : 'PENDING';
          localStorage.setItem(PAYMENT_STATUS_KEY, JSON.stringify(parsed));
        }
      } finally {
        if (status === 'success') {
          navigate('/order-success', { replace: true });
        } else {
          navigate('/orders', { replace: true });
        }
      }
    };

    const timer = setTimeout(verify, 500);
    return () => clearTimeout(timer);
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen page-bg flex items-center justify-center px-4">
      <div className="card rounded-3xl px-8 sm:px-12 py-10 text-center shadow-2xl shadow-pink-200/50 ring-1 ring-pink-100">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-pink-700 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-pink-500/30">
          <Loader2 className="animate-spin text-white" size={30} />
        </div>
        <p className="text-slate-700 font-bold text-lg">Processing payment response...</p>
        <p className="text-slate-400 text-sm mt-1">Please wait, do not refresh the page</p>
      </div>
    </div>
  );
};

export default PayUReturn;
