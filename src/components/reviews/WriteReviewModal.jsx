import { useState, useRef, useCallback } from 'react';
import { X, Star, Upload, Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { createReviewAPI, updateReviewAPI, toReviewImageUrl } from '../../services/reviewAPI';

const MAX_IMAGES = 5;

const StarInput = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star`}
          className="focus:outline-none transition-transform hover:scale-110"
          onMouseEnter={() => setHover(star)}
          onClick={() => onChange(star)}
        >
          <Star
            className={`w-8 h-8 ${star <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
};

const WriteReviewModal = ({ open, onClose, product, existingReview, orderId, onSubmitted }) => {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [existingImages, setExistingImages] = useState(existingReview?.images?.filter((p) => p?.startsWith('/uploads/')) || []);
  const [newFiles, setNewFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const close = useCallback(() => {
    if (!submitting) onClose();
  }, [submitting, onClose]);

  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const room = MAX_IMAGES - existingImages.length - newFiles.length;
    if (files.length > room) {
      toast.warning(`You can attach up to ${MAX_IMAGES} images`);
    }
    setNewFiles((prev) => [...prev, ...files.slice(0, Math.max(room, 0))].slice(0, MAX_IMAGES));
    e.target.value = '';
  };

  const removeNewFile = (idx) => setNewFiles((prev) => prev.filter((_, i) => i !== idx));
  const removeExistingImage = (path) => setExistingImages((prev) => prev.filter((p) => p !== path));

  const submit = async () => {
    if (!rating) {
      toast.warning('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      toast.warning('Please write a review comment');
      return;
    }

    setSubmitting(true);
    const payload = {
      rating,
      title: title.trim(),
      comment: comment.trim(),
      productId: product?.productId || product?._id,
      orderId,
      userName: '',
      existingImages,
      images: newFiles,
    };

    try {
      if (existingReview?._id) {
        await updateReviewAPI(existingReview._id, payload);
        toast.success('Review updated successfully!');
      } else {
        await createReviewAPI(payload);
        toast.success('Review submitted successfully!');
      }
      onSubmitted?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl shadow-pink-500/20 ring-1 ring-slate-100">
        <div className="sticky top-0 bg-white/90 backdrop-blur-md flex items-center justify-between px-6 py-4 border-b border-slate-100 rounded-t-3xl">
          <h2 className="text-lg font-bold gradient-text">
            {existingReview?._id ? 'Edit Your Review' : 'Write a Review'}
          </h2>
          <button onClick={close} className="p-1 rounded-lg hover:bg-slate-100 transition" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5">
          {product && (
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-100 shrink-0">
                {product.image?.[0] ? (
                  <img src={product.image[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-slate-300" />
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-800 line-clamp-2">{product.name}</p>
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Rating *</label>
            <StarInput value={rating} onChange={setRating} />
            <p className="text-xs text-gray-400 mt-1">
              {rating ? ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1] : 'Tap a star to rate'}
            </p>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Review Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarise your experience (optional)"
              maxLength={80}
              className="input !py-2.5 !text-sm"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Review Comment *</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about the quality, fit and value of this product..."
              rows={4}
              maxLength={1000}
              className="input !py-2.5 !text-sm resize-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Add Photos ({MAX_IMAGES} max)</label>
            <div className="flex flex-wrap gap-3">
              {existingImages.map((path, i) => (
                <div key={`e-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={toReviewImageUrl(path)} alt="review" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(path)}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {newFiles.map((file, i) => (
                <div key={`n-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewFile(i)}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {existingImages.length + newFiles.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-pink-500 hover:text-pink-500 transition"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Upload</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={onPickFiles} />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={close}
              disabled={submitting}
              className="btn-outline !px-5 !py-2.5 !text-sm disabled:!opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="btn-gradient !px-5 !py-2.5 !text-sm disabled:!opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {existingReview?._id ? 'Update Review' : 'Submit Review'}
            </button>
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Reviews appear after moderation. You can review one or more items from a delivered order.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WriteReviewModal;
