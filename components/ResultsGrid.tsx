
import React, { useState } from 'react';
import { RiceProduct } from '../types';
import { MapPin, ChevronRight, Package, X, Scale, Image as ImageIcon, Sparkles, Heart, Droplets, Info, ChevronLeft } from 'lucide-react';

interface ResultsGridProps {
  products: RiceProduct[];
  analysisText: string;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  showAnalysis?: boolean;
  onProductHover?: (product: RiceProduct | null) => void;
}

const toPercent = (score: unknown) => {
  const raw = Number(score);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(100, Math.round(raw)));
};

interface ProductDetailModalProps {
  product: RiceProduct;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  accentColor: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose, isFavorite, onToggleFavorite, accentColor }) => {
  const images = product.images && product.images.length > 0 ? product.images : (product.packagingImage ? [product.packagingImage] : []);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  const nextImg = () => setCurrentImgIdx((prev) => (prev + 1) % images.length);
  const prevImg = () => setCurrentImgIdx((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
        
        <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
           <div className="flex flex-col min-w-0 pr-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate leading-tight">{product.name}</h2>
           </div>
           <div className="flex items-center gap-2 flex-shrink-0">
              {onToggleFavorite && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.id); }} 
                  className={`p-2 sm:p-2.5 rounded-full transition-all ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-300 hover:text-gray-400'}`}
                >
                  <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}
              <button 
                onClick={onClose} 
                className="p-2 sm:p-2.5 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
           </div>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex flex-col lg:flex-row h-full">
            <div className="w-full lg:w-1/2 bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[250px] sm:min-h-[350px] relative group border-r border-gray-50">
               <div className={`absolute top-0 left-0 w-full h-1.5 ${accentColor}`}></div>
               <div className="relative w-full aspect-square flex items-center justify-center bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-inner border border-gray-100">
                  {images.length > 0 ? (
                      <>
                        <img src={images[currentImgIdx]} alt={product.name} className="w-full h-full object-contain transition-all duration-500" />
                        {images.length > 1 && (
                            <>
                                <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-all backdrop-blur-sm">
                                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                                <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-all backdrop-blur-sm">
                                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </>
                        )}
                      </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-200">
                        <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 mb-2" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">暂无图像</span>
                    </div>
                  )}
               </div>
            </div>

            <div className="w-full lg:w-1/2 p-5 sm:p-8 space-y-5 sm:space-y-6 flex flex-col">
               <div className="flex items-center text-xs sm:text-sm text-gray-500 gap-4 sm:gap-6 flex-wrap">
                  <div className="flex items-center"><MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 text-emerald-500" /> {product.origin?.province}</div>
                  <div className="flex items-center"><Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 text-emerald-500" /> {product.weight}公斤</div>
                  <div className="ml-auto text-xl sm:text-2xl font-black text-emerald-600">¥{product.price}<span className="text-[10px] sm:text-xs font-normal text-gray-400">/公斤</span></div>
               </div>

               <div className="bg-blue-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                     <div className="p-2 sm:p-2.5 bg-blue-500 rounded-lg sm:rounded-xl text-white shadow-lg shadow-blue-100">
                        <Droplets className="w-4 h-4 sm:w-5 sm:h-5" />
                     </div>
                     <div>
                        <h4 className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest">推荐烹饪方式与配比</h4>
                        <div className="text-lg sm:text-xl font-black text-blue-900 leading-none mt-1">
                          {product.cookingMethod?.methodName} 
                          <span className="text-xs sm:text-sm font-bold text-blue-500 ml-1 sm:ml-2">(米水比 {product.cookingRatio})</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-100/50">
                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 智能融合匹配分析
                  </h4>
                  <p className="text-sm text-emerald-900 leading-relaxed font-bold">
                    {product.matchReason || "深度符合您的多维度偏好，系统推荐指数 98%。"}
                  </p>
               </div>

               <div className="space-y-3">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">产品风味与品种</h4>
                  <div className="text-sm text-gray-500 leading-relaxed border-l-4 border-emerald-100 pl-4 space-y-2">
                    <p><span className="font-bold text-gray-700">品种：</span>{product.variety?.name}</p>
                    <p><span className="font-bold text-gray-700">产地详情：</span>{product.origin?.province}</p>
                    <p>{product.description}</p>
                  </div>
               </div>

               <div className="space-y-3">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">口感指标</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {product.tastes?.map(t => {
                      const label = t.tasteProfile?.indicatorName || t.tasteId;
                      return (
                        <div key={t.tasteId} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-gray-500">
                            <span>{label}</span>
                            <span>{toPercent(t.score)}%</span>
                          </div>
                          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${toPercent(t.score)}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
               </div>

               <div className="flex-1"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductCard: React.FC<{ product: RiceProduct; index: number; onClick: () => void; onHover?: (p: RiceProduct | null) => void }> = ({ product, index, onClick, onHover }) => {
    const accentColors = ['bg-emerald-500', 'bg-sky-500', 'bg-amber-500'];
    const accentColor = accentColors[index % 3];

    return (
        <div 
          onClick={onClick} 
          onMouseEnter={() => onHover?.(product)}
          className="group bg-white rounded-2xl border border-gray-200 hover:border-emerald-500 hover:shadow-2xl transition-all duration-500 flex flex-col h-full cursor-pointer overflow-hidden relative animate-in fade-in slide-in-from-bottom-4"
        >
            <div className={`h-1.5 w-full ${accentColor}`}></div>
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-gray-900 font-black text-lg leading-tight group-hover:text-emerald-700 transition-colors line-clamp-2">{product.name}</h3>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xl font-black text-emerald-600">¥{product.price}</span>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">/公斤</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-5 font-bold uppercase tracking-tighter">
                    <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-emerald-500" />{product.origin?.province}</span>
                    <span className="flex items-center"><Package className="w-3.5 h-3.5 mr-1 text-emerald-500" />{product.weight}公斤</span>
                    <span className="flex items-center"><Droplets className="w-3.5 h-3.5 mr-1 text-blue-500" />{product.cookingRatio}</span>
                </div>
                <div className="bg-gray-50/80 rounded-2xl p-4 mb-6 border border-gray-100 flex-1">
                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-3 font-medium italic">
                        {product.matchReason || product.description}
                    </p>
                </div>
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-600 flex items-center gap-1 group-hover:underline">
                        产品概览 <ChevronRight className="w-4 h-4" />
                    </span>
                </div>
            </div>
        </div>
    );
};

const ResultsGrid: React.FC<ResultsGridProps> = ({ products, analysisText, favorites = [], onToggleFavorite, showAnalysis = true, onProductHover }) => {
  const [selectedProduct, setSelectedProduct] = useState<RiceProduct | null>(null);

  return (
    <div className="space-y-6">
      {showAnalysis && analysisText && (
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
           <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> AI 推荐理由
           </h3>
           <p className="text-gray-600 text-sm leading-relaxed font-medium">
             {analysisText}
           </p>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100">
           <ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
           <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">未找到相关稻米品种</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((product, index) => (
               <ProductCard 
                  key={product.id} 
                  product={product} 
                  index={index} 
                  onClick={() => setSelectedProduct(product)} 
                  onHover={onProductHover}
               />
          ))}
        </div>
      )}

      {selectedProduct && (
          <ProductDetailModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            isFavorite={favorites.includes(selectedProduct.id)}
            onToggleFavorite={onToggleFavorite}
            accentColor="bg-emerald-500"
          />
      )}
    </div>
  );
};

export default ResultsGrid;
