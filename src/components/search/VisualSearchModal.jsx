import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const VisualSearchModal = ({ isOpen, onClose }) => {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [mode, setMode] = useState('select');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 640, height: 480 } });
      setStream(s);
      setMode('camera');
    } catch {
      setError('Camera access denied. Please use file upload instead.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (mode === 'camera' && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [mode, stream]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  const searchImage = async (blob) => {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', blob, 'search.jpg');
      const { data } = await apiClient.post('/search/visual-search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      if (data.success) {
        setResults(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      setCapturedImage(blob);
      setMode('preview');
      stopCamera();
      searchImage(blob);
    }, 'image/jpeg', 0.9);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedImage(file);
    setMode('preview');
    searchImage(file);
  };

  const handleProductClick = (product) => {
    onClose();
    navigate(`/product/${product.productId || product._id}`);
  };

  const reset = () => {
    setCapturedImage(null);
    setResults([]);
    setError('');
    setMode('select');
    setLoading(false);
  };

  const handleClose = () => {
    stopCamera();
    reset();
    onClose();
  };

  if (!isOpen) return null;

  const previewUrl = capturedImage ? URL.createObjectURL(capturedImage) : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl shadow-pink-500/20 ring-1 ring-slate-100 w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="text-slate-900 font-semibold text-sm flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 via-pink-600 to-pink-700 flex items-center justify-center text-white">
              <Camera className="w-4 h-4" />
            </div>
            Search by Image
          </h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Select mode: camera or upload */}
          {mode === 'select' && (
            <div className="space-y-3">
              <button
                onClick={startCamera}
                className="w-full flex items-center justify-center gap-3 px-4 py-6 bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-dashed border-pink-400 rounded-xl text-pink-600 hover:bg-pink-100/50 transition"
              >
                <Camera className="w-8 h-8" />
                <div className="text-left">
                  <p className="font-medium">Open Camera</p>
                  <p className="text-xs text-slate-400">Take a photo of clothing</p>
                </div>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 px-4 py-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              >
                <Upload className="w-8 h-8" />
                <div className="text-left">
                  <p className="font-medium">Upload Image</p>
                  <p className="text-xs text-slate-400">Choose from gallery</p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {/* Camera mode: live viewfinder */}
          {mode === 'camera' && (
            <div className="space-y-3">
              <div className="relative bg-slate-900 rounded-xl overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { stopCamera(); setMode('select'); }}
                  className="btn-outline flex-1 !py-2.5 !text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  className="btn-gradient flex-1 !py-2.5 !text-sm"
                >
                  Capture & Search
                </button>
              </div>
            </div>
          )}

          {/* Preview mode: analyzing + results */}
          {mode === 'preview' && previewUrl && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-24 h-24 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden ring-1 ring-slate-100">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  {loading ? (
                    <div className="flex items-center gap-2 h-full">
                      <Loader2 className="w-5 h-5 animate-spin text-pink-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-700 font-medium">Analyzing image...</p>
                        <p className="text-xs text-slate-400">Identifying clothing type</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center">
                      <p className="text-sm text-slate-700 font-medium">
                        {results.length} result{results.length !== 1 ? 's' : ''} found
                      </p>
                      <button onClick={reset} className="text-xs text-pink-600 hover:text-pink-500 mt-1 w-fit">
                        Try another image
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="text-center">
                  <p className="text-xs text-rose-500">{error}</p>
                  <button onClick={reset} className="text-xs text-pink-600 hover:text-pink-500 mt-1">
                    Try again
                  </button>
                </div>
              )}

              {results.length > 0 && !loading && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {results.slice(0, 8).map((product) => {
                      const img = Array.isArray(product.images) ? product.images[0] : product.image || null;
                      const price = product.discountPrice || product.price || 0;
                      return (
                        <button
                          key={product._id || product.productId}
                          onClick={() => handleProductClick(product)}
                          className="flex flex-col items-start gap-1 p-2 rounded-xl bg-slate-50 hover:bg-pink-50/50 ring-1 ring-slate-100 transition text-left"
                        >
                          {img && (
                            <img src={img} alt="" className="w-full h-24 rounded-lg object-cover bg-slate-100" loading="lazy" />
                          )}
                          <p className="text-xs font-medium text-slate-700 truncate w-full">{product.name}</p>
                          <p className="text-xs text-pink-600 font-semibold">₹{Math.round(price)}</p>
                        </button>
                      );
                    })}
                  </div>
                  {results.length > 8 && (
                    <p className="text-xs text-slate-400 text-center">+{results.length - 8} more results</p>
                  )}
                </div>
              )}

              {results.length === 0 && !loading && !error && (
                <div className="text-center py-4">
                  <ImageIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">No matching products found</p>
                  <p className="text-xs text-slate-400 mt-1">Try a different angle or clothing item</p>
                  <button onClick={reset} className="mt-3 text-sm text-pink-600 hover:text-pink-500 font-medium">
                    Try another image
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default VisualSearchModal;
