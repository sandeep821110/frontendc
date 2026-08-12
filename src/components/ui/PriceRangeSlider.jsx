import { useState, useEffect } from 'react';

const PriceRangeSlider = ({ min = 0, max = 10000, valueMin, valueMax, onCommit }) => {
  const safe = (v, fallback) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

  const [range, setRange] = useState({ min: safe(valueMin, min), max: safe(valueMax, max) });

  useEffect(() => {
    setRange({ min: safe(valueMin, min), max: safe(valueMax, max) });
  }, [valueMin, valueMax, min, max]);

  const clamp = (v) => Math.min(Math.max(v, min), max);

  const span = max - min;
  const pct = (v) => (span > 0 ? ((clamp(v) - min) / span) * 100 : 0);

  const handleMinChange = (e) => {
    const next = Math.min(Number(e.target.value), range.max);
    setRange((r) => ({ ...r, min: next }));
  };

  const handleMaxChange = (e) => {
    const next = Math.max(Number(e.target.value), range.min);
    setRange((r) => ({ ...r, max: next }));
  };

  const commit = () => {
    const nextMin = clamp(range.min);
    const nextMax = clamp(range.max);
    setRange({ min: nextMin, max: nextMax });
    if (onCommit) onCommit(nextMin, nextMax);
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-3">
        <span className="font-semibold text-slate-700">₹{Math.round(range.min)}</span>
        <span className="text-slate-400">-</span>
        <span className="font-semibold text-slate-700">₹{Math.round(range.max)}</span>
      </div>
      <div className="range-slider">
        <div className="range-slider-track">
          <div
            className="range-slider-fill"
            style={{ left: `${pct(range.min)}%`, right: `${100 - pct(range.max)}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={range.min}
          onChange={handleMinChange}
          onPointerUp={commit}
          onTouchEnd={commit}
          onKeyUp={commit}
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={range.max}
          onChange={handleMaxChange}
          onPointerUp={commit}
          onTouchEnd={commit}
          onKeyUp={commit}
          aria-label="Maximum price"
        />
      </div>
    </div>
  );
};

export default PriceRangeSlider;
