import { Sparkles } from 'lucide-react';

const BrandLoader = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-6">
    <div className="relative">
      <div className="w-20 h-20 rounded-full animate-spin border-[3px] border-pink-100 border-t-transparent"
        style={{ borderImage: 'linear-gradient(135deg, #FF3F6C, #db2777, #be185d) 1', background: 'conic-gradient(from 0deg, #FF3F6C, #db2777, #be185d, #FF3F6C)' }} />
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-50">
        <Sparkles className="text-pink-600 animate-pulse" size={24} />
      </div>
    </div>
    <div className="flex flex-col items-center gap-1">
      <p className="gradient-text font-bold tracking-[0.2em] text-sm animate-pulse">CHOOSEMOOD</p>
      <p className="text-slate-400 text-xs">{text}</p>
    </div>
  </div>
);

export default BrandLoader;
