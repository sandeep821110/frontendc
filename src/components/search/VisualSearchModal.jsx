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
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-400" />
            Search by Image
          </h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Select mode: camera or upload */}
          {mode === 'select' && (
            <div className="space-y-3">
              <button
                onClick={startCamera}
                className="w-full flex items-center justify-center gap-3 px-4 py-6 bg-indigo-600/20 border-2 border-dashed border-indigo-500/50 rounded-xl text-indigo-300 hover:bg-indigo-600/30 transition"
              >
                <Camera className="w-8 h-8" />
                <div className="text-left">
                  <p className="font-medium">Open Camera</p>
                  <p className="text-xs text-gray-400">Take a photo of clothing</p>
                </div>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 px-4 py-6 bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl text-gray-300 hover:bg-gray-750 transition"
              >
                <Upload className="w-8 h-8" />
                <div className="text-left">
                  <p className="font-medium">Upload Image</p>
                  <p className="text-xs text-gray-400">Choose from gallery</p>
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
              <div className="relative bg-black rounded-xl overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { stopCamera(); setMode('select'); }}
                  className="flex-1 px-4 py-2.5 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition"
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
                <div className="w-24 h-24 flex-shrink-0 bg-black rounded-xl overflow-hidden">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  {loading ? (
                    <div className="flex items-center gap-2 h-full">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-200 font-medium">Analyzing image...</p>
                        <p className="text-xs text-gray-500">Identifying clothing type</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center">
                      <p className="text-sm text-gray-200 font-medium">
                        {results.length} result{results.length !== 1 ? 's' : ''} found
                      </p>
                      <button onClick={reset} className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 w-fit">
                        Try another image
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="text-center">
                  <p className="text-xs text-red-400">{error}</p>
                  <button onClick={reset} className="text-xs text-indigo-400 hover:text-indigo-300 mt-1">
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
                          className="flex flex-col items-start gap-1 p-2 rounded-lg bg-gray-800 hover:bg-gray-750 transition text-left"
                        >
                          {img && (
                            <img src={img} alt="" className="w-full h-24 rounded-lg object-cover bg-gray-700" loading="lazy" />
                          )}
                          <p className="text-xs font-medium text-gray-200 truncate w-full">{product.name}</p>
                          <p className="text-xs text-indigo-400 font-semibold">₹{Math.round(price)}</p>
                        </button>
                      );
                    })}
                  </div>
                  {results.length > 8 && (
                    <p className="text-xs text-gray-500 text-center">+{results.length - 8} more results</p>
                  )}
                </div>
              )}

              {results.length === 0 && !loading && !error && (
                <div className="text-center py-4">
                  <ImageIcon className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                  <p className="text-sm text-gray-400">No matching products found</p>
                  <p className="text-xs text-gray-600 mt-1">Try a different angle or clothing item</p>
                  <button onClick={reset} className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 font-medium">
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
