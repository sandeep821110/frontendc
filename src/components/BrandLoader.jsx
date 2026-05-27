import { Sparkles } from 'lucide-react';

const BrandLoader = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-6">
    <div className="relative">
      <div className="w-20 h-20 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="text-indigo-600 animate-pulse" size={24} />
      </div>
    </div>
    <div className="flex flex-col items-center gap-1">
      <p className="text-indigo-700 font-bold tracking-[0.2em] text-sm animate-pulse">CHOOSEMOOD</p>
      <p className="text-gray-400 text-xs">{text}</p>
    </div>
  </div>
);

export default BrandLoader;
