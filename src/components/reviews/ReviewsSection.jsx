import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Star, ShieldCheck, Loader2, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { selectIsAuthenticated, selectUser } from '../../features/auth/authSlice';
import {
  getProductReviewsAPI,
  deleteReviewAPI,
  toReviewImageUrl,
} from '../../services/reviewAPI';
import WriteReviewModal from './WriteReviewModal';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Most Recent' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
  { value: 'helpful', label: 'Most Helpful' },
];

const Stars = ({ rating, size = 'w-4 h-4' }) => {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${size} ${s <= rounded ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

const ReviewsSection = ({ productId, productName, productImage }) => {
  const toast = useToast();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ average: 0, total: 0, ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0 });
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const currentUserId = useMemo(() => String(user?._id || user?.id || ''), [user]);

  const loadReviews = useCallback(async (page = 1, append = false) => {
    if (!productId) {
      setLoading(false);
      return;
    }
    if (!append) {
      setPagination({ page: 1, totalPages: 0 });
    }
    if (page === 1) setLoading(true);
    try {
      const res = await getProductReviewsAPI(productId, { page, limit: 8, sortBy });
      setReviews((prev) => (append ? [...prev, ...res.reviews] : res.reviews));
      setSummary(res.summary);
      setPagination(res.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [productId, sortBy]);

  useEffect(() => {
    loadReviews(1, false);
  }, [loadReviews]);

  const openWrite = () => {
    setEditingReview(null);
    setModalOpen(true);
  };

  const openEdit = (review) => {
    setEditingReview(review);
    setModalOpen(true);
  };

  const handleDelete = async (review) => {
    if (!window.confirm('Delete this review?')) return;
    setDeletingId(review._id);
    try {
      await deleteReviewAPI(review._id);
      toast.success('Review deleted');
      loadReviews(1, false);
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to delete review');
    } finally {
      setDeletingId(null);
    }
  };

  const loadMore = () => {
    const next = pagination.page + 1;
    setLoadingMore(true);
    loadReviews(next, true);
  };

  const distribution = useMemo(() => {
    const counts = summary.ratingCounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const total = summary.total || 0;
    return [5, 4, 3, 2, 1].map((r) => ({
      rating: r,
      count: counts[r] || 0,
      pct: total ? Math.round(((counts[r] || 0) / total) * 100) : 0,
    }));
  }, [summary]);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold section-title gradient-text">Ratings &amp; Reviews</h2>
        {isAuthenticated && (
          <button
            onClick={openWrite}
            className="btn-gradient !px-5 !py-2.5 !text-sm"
          >
            <Star className="w-4 h-4" />
            Write a Review
          </button>
        )}
      </div>

      <div className="card rounded-3xl shadow-2xl shadow-pink-200/50 ring-1 ring-pink-100 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
          </div>
        ) : error && reviews.length === 0 ? (
          <div className="text-center py-10 text-sm text-rose-600">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 via-pink-100 to-pink-100 flex items-center justify-center mx-auto mb-3">
              <Star className="w-8 h-8 text-pink-500" />
            </div>
            <p className="text-base font-bold text-gray-900 mb-1">No reviews yet</p>
            <p className="text-sm text-gray-500 mb-5">Be the first to share your experience with this product.</p>
            {isAuthenticated && (
              <button
                onClick={openWrite}
                className="btn-gradient !px-5 !py-2.5 !text-sm"
              >
                Write a Review
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-[240px_1fr] gap-8">
            <div className="md:sticky md:top-24 self-start">
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-extrabold gradient-text">{summary.average?.toFixed?.(1) || '0.0'}</span>
                <div className="pb-1.5">
                  <Stars rating={Math.round(summary.average || 0)} size="w-4 h-4" />
                  <p className="text-xs text-gray-500 mt-1">{summary.total} reviews</p>
                </div>
              </div>
              <div className="space-y-1.5 mb-4">
                {distribution.map(({ rating, count, pct }) => (
                  <div key={rating} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-gray-600 font-medium shrink-0">{rating}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-gray-400 text-right shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {pagination.total || summary.total || reviews.length} reviews
                </p>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none pl-4 pr-9 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/40 cursor-pointer"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-6">
                {reviews.map((review) => {
                  const isMine = currentUserId && String(review.userId) === currentUserId;
                  return (
                    <div key={review._id} className="border-b border-slate-100 last:border-0 pb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 text-pink-700 flex items-center justify-center text-sm font-bold uppercase shrink-0">
                          {(review.userName || 'U').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-gray-900">
                              {review.userName || 'Verified Customer'}
                            </p>
                            {review.orderId && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                                <ShieldCheck className="w-3 h-3" />
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                        </div>
                        {isMine && (
                          <div className="ml-auto flex items-center gap-1">
                            <button
                              onClick={() => openEdit(review)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-pink-600 transition"
                              aria-label="Edit review"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(review)}
                              disabled={deletingId === review._id}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition"
                              aria-label="Delete review"
                            >
                              {deletingId === review._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Stars rating={review.rating} />
                        {review.title && <span className="text-sm font-semibold text-gray-800">{review.title}</span>}
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{review.comment}</p>

                      {review.images?.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {review.images.map((img, i) => (
                            <img
                              key={i}
                              src={toReviewImageUrl(img)}
                              alt="review photo"
                              className="w-16 h-16 rounded-lg object-cover border border-gray-100"
                            />
                          ))}
                        </div>
                      )}

                      {review.helpfulCount > 0 && (
                        <p className="text-xs text-gray-400 mt-3">{review.helpfulCount} people found this helpful</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {pagination.totalPages > pagination.page && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="btn-outline !px-5 !py-2.5 !text-sm disabled:!opacity-50"
                  >
                    {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                    Load More Reviews
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <WriteReviewModal
          key={editingReview?._id || 'new'}
          open
          onClose={() => setModalOpen(false)}
          product={productId ? { productId, name: productName, image: productImage } : null}
          existingReview={editingReview}
          onSubmitted={() => loadReviews(1, false)}
        />
      )}
    </section>
  );
};

export default ReviewsSection;
