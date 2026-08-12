import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLoader from '../BrandLoader';
import {
  Wallet, Coins, Trophy, Clock, ChevronLeft, ChevronRight, RefreshCw, Sparkles, AlertCircle, PartyPopper
} from 'lucide-react';
import {
  getWalletBalance,
  getWalletTransactions,
  checkSpinAvailable,
  creditSpinWin,
} from '../../services/walletAPI';

const WHEEL_SEGMENTS = [
  { label: '₹5', sub: 'Cashback', color: '#db2777' },
  { label: '₹7', sub: 'Cashback', color: '#f43f5e' },
  { label: '₹9', sub: 'Cashback', color: '#ec4899' },
  { label: '₹10', sub: 'Cashback', color: '#f59e0b' },
  { label: 'FREE', sub: 'Delivery', color: '#16a34a' },
  { label: 'TRY', sub: 'Next time', color: '#94a3b8' },
];
const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;

const SOURCE_LABELS = {
  order: 'Order Cashback',
  spin_win: 'Spin & Win',
  redeem: 'Redeemed',
  admin: 'Admin Credit',
};

const SOURCE_ICONS = {
  order: Coins,
  spin_win: Trophy,
  redeem: RefreshCw,
  admin: Sparkles,
};

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const WalletPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState({ entries: [], total: 0, page: 1, pages: 1 });
  const [canSpin, setCanSpin] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const wheelRef = useRef(0);
  const wheelElRef = useRef(null);
  const timerRef = useRef(null);

  const refreshData = useCallback(async () => {
    try {
      const [balRes, txnRes, spinRes] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions(1, 20),
        checkSpinAvailable(),
      ]);
      setBalance(balRes.data);
      setTransactions(txnRes.data);
      setCanSpin(spinRes.data?.canSpin ?? true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshData();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [refreshData]);

  const loadPage = async (page) => {
    try {
      const res = await getWalletTransactions(page, 20);
      setTransactions(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    }
  };

  const handleSpin = async () => {
    if (spinning || !canSpin) return;
    setError('');
    setResult(null);
    setSpinning(true);

    const targetIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const targetLand = (360 - (targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2) + 360) % 360;
    const delta = ((targetLand - (wheelRef.current % 360)) + 360) % 360;
    wheelRef.current += 6 * 360 + delta;

    const wheelEl = wheelElRef.current;
    if (wheelEl) {
      wheelEl.style.transition = 'transform 4.5s cubic-bezier(0.15, 0.85, 0.25, 1)';
      wheelEl.style.transform = `rotate(${wheelRef.current}deg)`;
    }

    timerRef.current = setTimeout(async () => {
      try {
        const res = await creditSpinWin(targetIndex);
        const prize = res.data?.prize || { type: 'none' };
        setResult({ prize, balance: res.data?.balance });
        setCanSpin(false);
        await refreshData();
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to claim your prize. Try again.';
        setError(msg);
        if (msg.toLowerCase().includes('already')) setCanSpin(false);
      } finally {
        setSpinning(false);
      }
    }, 4700);
  };

  const renderWheel = () => {
    return (
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto select-none">
        <div
          ref={wheelElRef}
          className="absolute inset-0 rounded-full shadow-2xl ring-8 ring-white"
          style={{
            transform: `rotate(${wheelRef.current}deg)`,
            transition: 'none',
          }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, ${WHEEL_SEGMENTS.map((s, i) => `${s.color} ${i * SEGMENT_ANGLE}deg ${(i + 1) * SEGMENT_ANGLE}deg`).join(', ')})`,
            }}
          />
          <div className="absolute inset-0">
            {WHEEL_SEGMENTS.map((segment, i) => {
              const angle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
              return (
                <div
                  key={segment.label}
                  className="absolute inset-0 flex items-center justify-center font-bold text-white"
                  style={{ transform: `rotate(${angle}deg) translateY(-6.2rem) rotate(${-angle}deg)` }}
                >
                  <div className="text-center leading-none pointer-events-none">
                    <div className="text-lg sm:text-xl drop-shadow">{segment.label}</div>
                    <div className="text-[10px] uppercase tracking-wide opacity-90 drop-shadow">{segment.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-4xl drop-shadow text-pink-600 z-10">▼</div>
        <button
          type="button"
          onClick={handleSpin}
          disabled={spinning || !canSpin}
          className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-white shadow-xl flex flex-col items-center justify-center font-extrabold text-pink-600 hover:bg-pink-50 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Sparkles size={20} />
          <span className="text-sm">{spinning ? '...' : 'SPIN'}</span>
        </button>
      </div>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><BrandLoader text="Loading wallet..." /></div>;
  }

  return (
    <div className="min-h-screen page-bg py-6 sm:py-12 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-pink-700 text-white flex items-center justify-center shadow-lg shadow-pink-500/30"><Wallet size={24} /></div>
            <div>
              <h1 className="text-2xl font-extrabold gradient-text">My Wallet</h1>
              <p className="text-sm text-gray-500">Earn cashback, spin daily and win prizes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm text-pink-600 font-bold hover:underline"
          >
            Continue shopping
          </button>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2">
            <AlertCircle className="text-rose-500 shrink-0" size={20} />
            <span className="text-rose-700 text-sm">{error}</span>
          </div>
        )}

        {result && (
          <div className="mb-5 p-6 bg-gradient-to-r from-amber-400 to-pink-500 rounded-2xl shadow-lg text-white flex items-center gap-4">
            <PartyPopper size={36} className="shrink-0" />
            <div>
              {result.prize?.type === 'free_delivery' ? (
                <>
                  <p className="text-lg font-extrabold">Congratulations! You won FREE DELIVERY</p>
                  <p className="text-sm text-white/90">Free delivery coupon added to your account. Apply it at checkout.</p>
                </>
              ) : result.prize?.type === 'cash' ? (
                <>
                  <p className="text-lg font-extrabold">Congratulations! You won ₹{result.prize.amount} cashback</p>
                  <p className="text-sm text-white/90">Amount added to your wallet. New balance: {formatINR(result.balance)}</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-extrabold">Better luck next time!</p>
                  <p className="text-sm text-white/90">Come back tomorrow for another spin.</p>
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-rose-500 via-pink-600 to-pink-700 text-white p-5 rounded-2xl shadow-xl shadow-pink-500/30">
            <p className="text-sm text-pink-200 font-semibold uppercase tracking-wide">Wallet Balance</p>
            <p className="text-3xl font-extrabold mt-1">{formatINR(balance?.balance)}</p>
            <p className="text-xs text-pink-200 mt-1">{balance?.entryCount || 0} active entries</p>
          </div>
          <div className="card !p-5">
            <p className="text-sm text-gray-400 font-semibold uppercase tracking-wide">Total Earned</p>
            <p className="text-2xl font-extrabold mt-1 gradient-text">{formatINR(balance?.totalEarned)}</p>
          </div>
          <div className="card !p-5">
            <p className="text-sm text-gray-400 font-semibold uppercase tracking-wide">Total Redeemed</p>
            <p className="text-2xl font-extrabold mt-1 gradient-text">{formatINR(balance?.totalRedeemed)}</p>
          </div>
        </div>

        <div className="card !p-6 sm:!p-8 mb-6 border-pink-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 p-2.5 rounded-xl"><Trophy size={20} /></div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Spin &amp; Win</h2>
              <p className="text-sm text-gray-500">One free spin every day. Win ₹5, ₹7, ₹9, ₹10 cashback, FREE delivery or a lucky break.</p>
            </div>
          </div>

          <div className="mt-6">{renderWheel()}</div>

          <div className="mt-6 text-center">
            {canSpin ? (
              <p className="text-sm text-gray-500">
                Tap <span className="font-extrabold gradient-text">SPIN</span> to try your luck today
              </p>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-100 to-pink-100 text-pink-700 rounded-full text-sm font-bold">
                <Clock size={16} /> You have already spun today. Come back tomorrow!
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">Cashback expires after 7 days. Free delivery valid for 30 days.</p>
          </div>
        </div>

        <div className="card !p-6 sm:!p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-rose-100 to-pink-100 text-pink-600 p-2.5 rounded-xl"><Coins size={20} /></div>
              <h2 className="text-xl font-extrabold text-gray-900">Transactions</h2>
            </div>
            <span className="text-sm text-gray-400">{transactions.total} total</span>
          </div>

          {transactions.entries.length === 0 ? (
            <p className="text-center text-gray-400 py-10">No transactions yet. Earn cashback on every order!</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.entries.map((entry) => {
                const Icon = SOURCE_ICONS[entry.source] || Coins;
                const isPrizeWin = entry.source === 'spin_win' && entry.prizeType && entry.prizeType !== 'cash';
                const prizeLabel = entry.prizeType === 'free_delivery'
                  ? 'FREE DELIVERY'
                  : entry.prizeType === 'none'
                    ? 'TRY AGAIN NEXT TIME'
                    : null;
                return (
                  <div key={entry._id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${entry.source === 'redeem' ? 'bg-rose-50 text-rose-500' : 'bg-green-50 text-green-600'}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{SOURCE_LABELS[entry.source] || entry.source}</p>
                        <p className="text-xs text-gray-400">
                          {prizeLabel ? `${prizeLabel} · ` : ''}
                          {formatDate(entry.createdAt)}
                          {entry.expired ? ' · Expired' : ` · Expires ${formatDate(entry.expiresAt)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-extrabold ${entry.source === 'redeem' ? 'text-rose-500' : 'text-green-600'}`}>
                        {isPrizeWin
                          ? (entry.prizeType === 'free_delivery' ? 'FREE' : '—')
                          : `${entry.source === 'redeem' ? '−' : '+'}₹${entry.amount}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {entry.prizeType === 'free_delivery'
                          ? (entry.used ? 'Used' : 'Active')
                          : isPrizeWin
                            ? ''
                            : `Remaining: ₹${entry.remainingAmount}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {transactions.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                type="button"
                disabled={transactions.page <= 1}
                onClick={() => loadPage(transactions.page - 1)}
                className="btn-outline !p-2 !px-3 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold text-gray-700">
                Page {transactions.page} of {transactions.pages}
              </span>
              <button
                type="button"
                disabled={transactions.page >= transactions.pages}
                onClick={() => loadPage(transactions.page + 1)}
                className="btn-outline !p-2 !px-3 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
