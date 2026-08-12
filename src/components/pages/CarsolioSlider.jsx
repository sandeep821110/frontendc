import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLoader from '../BrandLoader';
import { apiClient } from '../../services/apiClient';

const CarsolioSlider = () => {
  const navigate = useNavigate();
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const { data } = await apiClient.get('/carousel');
        if (data.success && Array.isArray(data.data)) {
          const activeSlides = data.data
            .filter((s) => s.active !== false && s.images?.length > 0)
            .flatMap((s) =>
              s.images.map((url) => ({
                url,
                title: s.title,
                id: s._id,
              }))
            );
          setSlides(activeSlides);
        }
      } catch {
        setSlides([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (!isHovering && slides.length > 1) {
      const timer = setInterval(nextSlide, 5000);
      return () => clearInterval(timer);
    }
  }, [nextSlide, isHovering, slides.length]);

  if (loading) {
    return (
      <div className="aspect-[4/2] sm:aspect-[16/5] md:aspect-[21/8] flex items-center justify-center bg-gradient-to-br from-slate-100 via-pink-50 to-slate-100">
        <BrandLoader text="Loading banner..." />
      </div>
    );
  }

  if (slides.length === 0) return null;

  return (
    <div
      className="relative w-full aspect-[4/2] sm:aspect-[16/5] md:aspect-[21/8] overflow-hidden group bg-slate-950 rounded-none shadow-2xl shadow-pink-200/60 ring-1 ring-slate-900/5"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id || index}
            className="relative min-w-full h-full cursor-pointer flex items-center justify-center bg-slate-950"
            onClick={() => navigate('/products')}
          >
            <img
              src={slide.url}
              alt={slide.title}
              className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute top-1/2 -translate-y-1/2 left-2 sm:left-4 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110 opacity-0 md:group-hover:opacity-100 flex items-center justify-center"
            aria-label="Previous slide"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-4 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110 opacity-0 md:group-hover:opacity-100 flex items-center justify-center"
            aria-label="Next slide"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  currentSlide === i
                    ? 'w-6 sm:w-8 h-2 bg-gradient-to-r from-rose-400 to-pink-500 shadow-md'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CarsolioSlider;
