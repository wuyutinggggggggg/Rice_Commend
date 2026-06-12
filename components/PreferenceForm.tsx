import React, { useState, ChangeEvent } from 'react';
import { UserPreferences, RiceTexture, RiceGrainLength } from '../types';
import { Sliders, Camera, UploadCloud, Loader2, Check, FileCheck, Coins, MapPin, Sparkles, Utensils } from 'lucide-react';

interface PreferenceFormProps {
  onSubmitPreferences: (prefs: UserPreferences) => void;
  onSubmitImage: (base64: string) => void;
  isLoading: boolean;
}

const PreferenceForm: React.FC<PreferenceFormProps> = ({ onSubmitPreferences, onSubmitImage, isLoading }) => {
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [formData, setFormData] = useState<UserPreferences>({
    minPrice: 0,
    maxPrice: 30,
    specialScene: '',
    requirements: '',
    texture: RiceTexture.BALANCED,
    grainLength: RiceGrainLength.SHORT,
    aroma: false,
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTextureSelect = (val: RiceTexture) => {
    setFormData(prev => ({ ...prev, texture: val }));
  };

  const handleGrainSelect = (val: RiceGrainLength) => {
    setFormData(prev => ({ ...prev, grainLength: val }));
  };

  const toggleAroma = () => {
    setFormData(prev => ({ ...prev, aroma: !prev.aroma }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'text') {
      onSubmitPreferences(formData);
    } else if (selectedImage) {
      const base64Data = selectedImage.split(',')[1];
      onSubmitImage(base64Data);
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl shadow-gray-200/50 border border-gray-100 animate-in zoom-in-95 duration-500">
      <div className="flex justify-center mb-6 sm:mb-10">
        <div className="bg-gray-100 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl inline-flex shadow-inner w-full sm:w-auto">
          <button
            className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 sm:gap-3 ${mode === 'text' ? 'bg-white text-emerald-700 shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setMode('text')}
          >
            <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            参数匹配
          </button>
          <button
            className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 sm:gap-3 ${mode === 'image' ? 'bg-white text-emerald-700 shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setMode('image')}
          >
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            视觉配米
          </button>
        </div>
      </div>

      {mode === 'text' ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <MapPin className="w-3 h-3" /> 指定产地
              </label>
              <input
                type="text"
                name="origin"
                placeholder="搜索产地，如：黑龙江、泰国"
                className="w-full bg-gray-50 border-transparent rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
                value={formData.origin || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <Coins className="w-3 h-3" /> 价格区间 (元/公斤)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  name="minPrice"
                  placeholder="最低价"
                  className="w-full bg-gray-50 border-transparent rounded-2xl px-4 py-4 text-sm font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm text-center"
                  value={formData.minPrice}
                  onChange={handleInputChange}
                />
                <span className="text-gray-300 font-black">/</span>
                <input
                  type="number"
                  name="maxPrice"
                  placeholder="最高价"
                  className="w-full bg-gray-50 border-transparent rounded-2xl px-4 py-4 text-sm font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm text-center"
                  value={formData.maxPrice}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> 口感硬度偏好
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { val: RiceTexture.SOFT, label: '绵软软糯' },
                  { val: RiceTexture.BALANCED, label: '软硬适中' },
                  { val: RiceTexture.FIRM, label: 'Q弹有嚼劲' }
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => handleTextureSelect(opt.val)}
                    className={`py-3 px-4 rounded-xl sm:rounded-2xl text-xs font-black border-2 transition-all ${formData.texture === opt.val ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md shadow-emerald-50' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">米粒形态偏好</label>
                <div className="flex bg-gray-100 p-1 rounded-2xl">
                  {[
                    { val: RiceGrainLength.SHORT, label: '圆粒型' },
                    { val: RiceGrainLength.MEDIUM, label: '中粒型' },
                    { val: RiceGrainLength.LONG, label: '长粒型' }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => handleGrainSelect(opt.val)}
                      className={`flex-1 py-3 text-[10px] rounded-xl font-black transition-all ${formData.grainLength === opt.val ? 'bg-white shadow-lg text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">香气偏好</label>
                <button
                  type="button"
                  onClick={toggleAroma}
                  className={`w-full py-3.5 px-6 rounded-2xl border-2 text-xs font-black flex items-center justify-between transition-all ${formData.aroma ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-md shadow-amber-50' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                >
                  <span className="flex items-center gap-2">
                    {formData.aroma ? <Sparkles className="w-3.5 h-3.5" /> : null}
                    希望米香更明显
                  </span>
                  {formData.aroma && <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Utensils className="w-3 h-3" /> 特殊场景
              </label>
              <textarea
                name="specialScene"
                rows={2}
                placeholder="例如：煲仔饭、寿司、炒饭、宝宝煮粥。留空则直接按本地数据库参数推荐。"
                className="w-full bg-gray-50 border-transparent rounded-2xl px-5 py-4 text-sm font-medium text-gray-900 placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all resize-none shadow-sm"
                value={formData.specialScene || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Utensils className="w-3 h-3" /> 附加说明
              </label>
              <textarea
                name="requirements"
                rows={3}
                placeholder="例如：更看重性价比、希望日常囤货、偏向家庭常吃。"
                className="w-full bg-gray-50 border-transparent rounded-2xl px-5 py-4 text-sm font-medium text-gray-900 placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all resize-none shadow-sm"
                value={formData.requirements || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 flex justify-center items-center shadow-xl shadow-emerald-200 mt-4 active:scale-95"
          >
            {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-3" /> : null}
            {isLoading ? '正在计算推荐结果...' : '开始智能参数匹配'}
          </button>
        </form>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="text-center mb-6">
            <h3 className="text-xl font-black text-gray-900">视觉口味分析引擎</h3>
            <p className="text-gray-400 text-xs font-medium mt-1">上传菜肴图片后，系统将分析风味并推荐适合搭配的稻米</p>
          </div>

          <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center w-full h-48 sm:h-64 border-4 border-dashed rounded-2xl sm:rounded-3xl cursor-pointer transition-all ${selectedImage ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-100 bg-gray-50 hover:border-emerald-200 hover:bg-emerald-50/10'}`}
          >
            {selectedImage ? (
              <div className="flex flex-col items-center justify-center p-4">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-emerald-500 mb-3 sm:mb-4 shadow-xl">
                  <img src={selectedImage} alt="预览" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-black text-xs sm:text-sm">
                  <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" /> 图片已就绪
                </div>
                <p className="text-[9px] sm:text-[10px] font-bold text-emerald-600 mt-1 opacity-60">点击区域可重新上传</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 p-4 sm:p-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-center mb-3 sm:mb-4 border border-gray-100">
                  <UploadCloud className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
                </div>
                <p className="text-xs sm:text-sm font-black text-gray-700">将菜肴照片拖到此处</p>
                <p className="text-[9px] sm:text-[10px] font-bold mt-2 tracking-wide uppercase">支持 JPEG, PNG 格式</p>
              </div>
            )}
            <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedImage}
            className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 flex justify-center items-center shadow-xl shadow-emerald-200 active:scale-95"
          >
            {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-3" /> : <Camera className="w-5 h-5 mr-3" />}
            {isLoading ? '正在分析菜肴图片...' : '提交图像分析匹配'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PreferenceForm;
