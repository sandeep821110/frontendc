import { createApiClient } from './apiClient';

const reviewsApi = createApiClient('/api/reviews');

// Server stores image paths as /uploads/<filename>. The review service serves
// them from its own uploads folder, so map those to the /review-uploads proxy.
export const toReviewImageUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith('/uploads/')) return `/review-uploads${path}`;
  return path;
};

export const getProductReviewsAPI = async (productId, { page = 1, limit = 10, sortBy = 'newest' } = {}) => {
  const res = await reviewsApi.get(`/product/${productId}`, { params: { page, limit, sortBy } });
  return {
    success: res.data.success !== false,
    reviews: res.data.reviews || res.data.data?.reviews || [],
    summary: res.data.summary || res.data.data?.summary || { average: 0, total: 0, ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    pagination: res.data.pagination || res.data.data?.pagination || { page: 1, limit, total: 0, totalPages: 0 },
  };
};

export const getMyReviewsAPI = async () => {
  const res = await reviewsApi.get('/my');
  return {
    success: res.data.success !== false,
    reviews: res.data.reviews || res.data.data?.reviews || [],
    pagination: res.data.pagination || res.data.data?.pagination || null,
  };
};

export const createReviewAPI = async (payload) => {
  const body = buildReviewFormData(payload);
  const res = await reviewsApi.post('/', body);
  return {
    success: res.data.success !== false,
    review: res.data.data || res.data.review || null,
    message: res.data.message || 'Review submitted successfully',
  };
};

export const updateReviewAPI = async (reviewId, payload) => {
  const body = buildReviewFormData(payload);
  const res = await reviewsApi.put(`/${reviewId}`, body);
  return {
    success: res.data.success !== false,
    review: res.data.data || res.data.review || null,
    message: res.data.message || 'Review updated successfully',
  };
};

export const deleteReviewAPI = async (reviewId) => {
  const res = await reviewsApi.delete(`/${reviewId}`);
  return {
    success: res.data.success !== false,
    message: res.data.message || 'Review deleted',
  };
};

// Multipart form: files are sent as "images", existing image paths (that must
// start with /uploads/) are sent as a JSON string in "existingImages".
const buildReviewFormData = (payload) => {
  const fd = new FormData();
  const { rating, title, comment, images, existingImages, productId, orderId, userName } = payload;

  if (productId !== undefined) fd.append('productId', String(productId));
  if (orderId !== undefined) fd.append('orderId', String(orderId));
  if (rating !== undefined) fd.append('rating', String(rating));
  if (title !== undefined) fd.append('title', String(title));
  if (comment !== undefined) fd.append('comment', String(comment));
  if (userName !== undefined) fd.append('userName', String(userName));

  if (Array.isArray(images)) {
    images.forEach((file) => {
      if (file && typeof file === 'object' && file.size !== undefined) {
        fd.append('images', file);
      }
    });
  }

  if (Array.isArray(existingImages) && existingImages.length > 0) {
    fd.append('existingImages', JSON.stringify(existingImages));
  }

  return fd;
};
