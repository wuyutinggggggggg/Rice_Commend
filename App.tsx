
import React, { useState, useEffect } from 'react';
import { UserPreferences, RecommendationResponse, UserRole, RiceProduct, UserProfile, RiceTexture, RiceGrainLength } from './types.ts';
import { RiceApi } from './services/apiService.ts';
import PreferenceForm from './components/PreferenceForm.tsx';
import ResultsGrid, { ProductDetailModal } from './components/ResultsGrid.tsx';
import AnalysisChart from './components/AnalysisChart.tsx';
import Login from './components/Login.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import UserAuthModal from './components/UserAuthModal.tsx';
import { 
  RotateCcw, 
  LogOut, 
  Heart, 
  Search, 
  Loader2, 
  Sparkles, 
  Compass,
  Sprout,
  Bell,
  MapPin,
  Scale,
  Droplets,
  Info,
  X,
  Menu
} from 'lucide-react';

// 导航项组件
const NavItem: React.FC<{ icon: any; label: string; active: boolean; onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
      active 
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
        : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
    <span className="text-sm font-bold tracking-tight">{label}</span>
  </button>
);

// 预览面板
const toTastePercent = (score: unknown) => {
  const raw = Number(score);
  if (!Number.isFinite(raw)) return 0;
  // 数据库中的score已经是0-100的值，直接使用
  return Math.max(0, Math.min(100, Math.round(raw)));
};

const getTastePercent = (
  product: RiceProduct | null,
  indicatorNames: string[],
  tasteIds: string[] = []
) => {
  if (!product?.tastes?.length) return 0;
  const normalizeId = (id: unknown) => {
    const str = String(id ?? '');
    const digits = str.replace(/\D/g, '');
    return digits ? Number(digits) : null;
  };
  const targetNums = tasteIds
    .map(id => normalizeId(id))
    .filter((v): v is number => Number.isFinite(v as number));

  const byName = product.tastes.find(t => {
    const name = String(t.tasteProfile?.indicatorName || '').trim();
    return indicatorNames.some(ind => name.includes(ind));
  });
  if (byName) return toTastePercent(byName.score);
  const byId = product.tastes.find(t =>
    tasteIds.includes(String(t.tasteId)) ||
    (normalizeId(t.tasteId) != null && targetNums.includes(normalizeId(t.tasteId)!)) ||
    (t.tasteProfile?.id != null && (
      tasteIds.includes(String(t.tasteProfile.id)) ||
      (normalizeId(t.tasteProfile.id) != null && targetNums.includes(normalizeId(t.tasteProfile.id)!))
    ))
  );
  if (byId) return toTastePercent(byId.score);
  return 0;
};

const PreviewPanel: React.FC<{ 
  product: RiceProduct | null; 
  isFavorite: boolean; 
  onToggleFavorite: (id: string) => void;
  onViewDetails: (product: RiceProduct) => void;
}> = ({ product, isFavorite, onToggleFavorite, onViewDetails }) => {
  if (!product) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
           <Info className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">商品快捷预览</h3>
        <p className="text-xs text-gray-400 font-medium max-w-[180px]">鼠标悬停在卡片上即可在此处查看详情</p>
      </div>
    );
  }

  const softnessPercent = getTastePercent(product, ['软糯度'], ['T001', '1', '01']);
  const aromaPercent = getTastePercent(product, ['米香值', '米香浓度', '香气浓郁'], ['T002', '2', '02']);

  return (
    <div className="h-full bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-right-4 duration-300">
      <div className="relative aspect-video bg-gray-50 overflow-hidden">
        <img src={product.images?.[0] || product.packagingImage} alt={product.name} className="w-full h-full object-cover" />
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={() => onToggleFavorite(product.id)}
            className={`p-2 rounded-full shadow-lg backdrop-blur-md transition-all ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400 hover:text-red-500'}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-12">
          <h3 className="text-white font-black text-lg leading-tight">{product.name}</h3>
        </div>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
        <div className="flex items-center justify-between">
           <span className="text-2xl font-black text-emerald-600">¥{product.price}<span className="text-[10px] text-gray-400 font-bold uppercase ml-1">/公斤</span></span>
           <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
              <Droplets className="w-3 h-3" /> 米水比 {product.cookingRatio}
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-2 border border-gray-100">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-bold text-gray-700 truncate">{product.origin?.province}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-2 border border-gray-100">
            <Scale className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-bold text-gray-700">{product.weight}公斤</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">推荐语</h4>
          <p className="text-xs text-gray-600 leading-relaxed font-medium bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/30 italic">
             “{product.matchReason || (product.description ? product.description.slice(0, 100) + '...' : '暂无详细描述')}”
          </p>
        </div>

        <div className="space-y-3">
           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">属性分析</h4>
           <div className="space-y-2">
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-bold text-gray-500">口感软糯度</span>
                 <span className="text-[10px] font-black text-emerald-600">{softnessPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${softnessPercent}%` }}></div>
              </div>
           </div>
           <div className="space-y-2">
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-bold text-gray-500">米香浓度</span>
                 <span className="text-[10px] font-black text-amber-500">{aromaPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                 <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${aromaPercent}%` }}></div>
              </div>
           </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-100">
        <button 
          onClick={() => product && onViewDetails(product)}
          className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
        >
           查看完整详情
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [inventory, setInventory] = useState<RiceProduct[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataFetching, setIsDataFetching] = useState(true);
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authConfig, setAuthConfig] = useState<{mode: 'login' | 'register', role: 'User' | 'Admin'}>({mode: 'login', role: 'User'});
  const [viewMode, setViewMode] = useState<'search' | 'favorites' | 'daily'>('search');
  const [previewProduct, setPreviewProduct] = useState<RiceProduct | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<RiceProduct | null>(null);
  const [dailyResults, setDailyResults] = useState<RecommendationResponse | null>(null);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        const [products, allUsers] = await Promise.all([
          RiceApi.fetchProducts(),
          RiceApi.fetchUsers()
        ]);
        setInventory(products);
        setUsers(allUsers);
      } catch (err) {
        console.error("系统服务连接异常", err);
      } finally {
        setIsDataFetching(false);
      }
    };
    initApp();
  }, []);

  const handleLoginPortal = (role: UserRole) => {
    setUserRole(role);
    setResults(null); 
    setViewMode('search');
  };

  const handleOpenAuth = (mode: 'login' | 'register', role: 'User' | 'Admin') => {
      setAuthConfig({ mode, role });
      setShowAuthModal(true);
  };

  const handleLogout = () => {
    setUserRole(null);
    setResults(null);
    setCurrentUser(null);
    setViewMode('search');
  };

  const handleAddProduct = async (newProduct: RiceProduct) => {
    const saved = await RiceApi.saveProduct(newProduct);
    setInventory(prev => [saved, ...prev.filter(p => p.id !== saved.id)]);
  };

  const handleUpdateProduct = async (updatedProduct: RiceProduct) => {
    const saved = await RiceApi.saveProduct(updatedProduct);
    setInventory(prev => prev.map(p => p.id === saved.id ? saved : p));
  };
  
  const handleClientRegister = async (username: string, password?: string, role: 'User' | 'Admin' = 'User') => {
    if (password) {
      if (password.length < 6 || password.length > 13) {
        throw new Error("密码长度需在 6 到 13 位之间");
      }
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasPunctuation = /[!@#$%^&*(),.?":{}|<>[\]\\/`~_+\-=]/.test(password);
      const typesCount = [hasLetter, hasNumber, hasPunctuation].filter(Boolean).length;
      if (typesCount < 2) {
        throw new Error("密码需包含字母、数字、标点中的至少两种");
      }
    }

    const newUser: UserProfile = {
      id: `${role === 'Admin' ? 'A' : 'U'}${Date.now()}`,
      username, password, role, status: 'Active',
      ip: '127.0.0.1', lastActive: '刚刚', requestCount: 0, favorites: [],
    };
    const registered = await RiceApi.register(newUser);
    const allUsers = await RiceApi.fetchUsers();
    setUsers(allUsers);
    setCurrentUser(registered);
    setUserRole(role === 'Admin' ? 'admin' : 'user');
    setShowAuthModal(false);
  };

  const handleClientLogin = async (username: string, password?: string) => {
    const allUsers = await RiceApi.fetchUsers();
    const user = allUsers.find(u => u.username === username && u.password === password);
    if (!user) throw new Error("账户名或密码错误，请检查输入。");
    if (user.status !== 'Active') throw new Error("该账号已被系统冻结，请联系管理员。");

    const updatedUser = { ...user, lastActive: '刚刚' };
    const mappedRole: UserRole = 
      (user.role === 'Admin') ? 'admin' : 'user';

    await RiceApi.syncUser(updatedUser);
    setUsers(allUsers.map(u => u.id === user.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setUserRole(mappedRole);
    setShowAuthModal(false);
  };

  const toggleFavorite = async (productId: string) => {
    if (!currentUser) return handleOpenAuth('login', 'User');
    const isFav = currentUser.favorites.includes(productId);
    const updatedUser = {
        ...currentUser,
        favorites: isFav ? currentUser.favorites.filter(id => id !== productId) : [...currentUser.favorites, productId]
    };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    await RiceApi.syncUser(updatedUser);
  };

  const handlePreferenceSubmit = async (prefs: UserPreferences) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await RiceApi.getRecommendations(prefs);
      setResults(data);
    } catch (err) {
      console.error("匹配服务超时", err);
      setError("AI 匹配服务暂时不可用，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSubmit = async (base64: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await RiceApi.analyzeImage(base64);
      setResults(data);
    } catch (err) {
      console.error("AI分析暂时不可用", err);
      setError("图像识别服务异常，请确保图片清晰并重试。");
    } finally {
      setIsLoading(false);
    }
  }

  const handleProductHover = (product: RiceProduct | null) => {
    setPreviewProduct(product);
  }

  const handleHeaderSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const prefs: UserPreferences = {
        minPrice: 0,
        maxPrice: 1000,
        requirements: query,
        texture: RiceTexture.BALANCED,
        grainLength: RiceGrainLength.SHORT,
        aroma: false,
      };
      const data = await RiceApi.getRecommendations(prefs);
      setResults(data);
      setViewMode('search');
      setHeaderSearchQuery(''); // 搜索成功后清空输入框
    } catch (err) {
      console.error("搜索失败", err);
      setError("搜索服务异常，请检查网络连接。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDailySelectionClick = async () => {
    setViewMode('daily');
    if (dailyResults) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const favProducts = inventory.filter(p => currentUser?.favorites.includes(p.id));
      const data = await RiceApi.getDailySelection(favProducts);
      setDailyResults(data);
    } catch (err) {
      console.error("每日优选服务异常", err);
      setError("无法获取每日优选，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  };

  if (isDataFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">稻米系统加载中...</p>
        </div>
      </div>
    );
  }

  // 渲染身份选择或登录界面
  if (!userRole) {
    return (
      <div className="min-h-screen relative">
        <Login onLogin={handleLoginPortal} onOpenAuth={handleOpenAuth} />
        {showAuthModal && (
          <UserAuthModal 
              initialMode={authConfig.mode}
              initialRole={authConfig.role}
              onClose={() => setShowAuthModal(false)} 
              onLogin={handleClientLogin} 
              onRegister={handleClientRegister} 
          />
        )}
      </div>
    );
  }
  
  // 渲染管理后台（系统管理员）
  if (userRole === 'admin' && currentUser?.role === 'Admin') {
    return (
      <div className="min-h-screen relative">
        <AdminDashboard onLogout={handleLogout} inventory={inventory} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} users={users} onUpdateUsers={setUsers} currentUser={currentUser} />
        {showAuthModal && (
          <UserAuthModal 
              initialMode={authConfig.mode}
              initialRole={authConfig.role}
              onClose={() => setShowAuthModal(false)} 
              onLogin={handleClientLogin} 
              onRegister={handleClientRegister} 
          />
        )}
      </div>
    );
  }

  // 渲染主应用界面（普通用户）
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-gray-900 overflow-hidden font-sans relative">
      {/* 手机端侧边栏遮罩 */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 1. 左侧侧边栏 */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-[260px] bg-white border-r border-gray-100 flex flex-col h-screen transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 flex-shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 pb-12 flex items-center justify-between">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
          >
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-black text-xl tracking-tight leading-none italic">稻米<span className="text-emerald-600">中心</span></h1>
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">智慧推荐控制台</span>
            </div>
          </button>
          
          {/* 手机端关闭按钮 */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
          >
            <RotateCcw className="w-5 h-5 rotate-45" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2">功能导航</div>
            <NavItem icon={Compass} label="智能探索" active={viewMode === 'search'} onClick={() => { setViewMode('search'); setIsSidebarOpen(false); }} />
            <NavItem icon={Heart} label="我的收藏" active={viewMode === 'favorites'} onClick={() => { setViewMode('favorites'); setIsSidebarOpen(false); }} />
            <NavItem icon={Sparkles} label="每日优选" active={viewMode === 'daily'} onClick={() => { handleDailySelectionClick(); setIsSidebarOpen(false); }} />
          </div>

          {/* 新米上市倒计时 */}
          <div className="px-4 py-5 bg-amber-50 rounded-2xl border border-amber-100 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Bell className="w-3 h-3 animate-bounce" /> 2026 新米上市倒计时
            </h4>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-amber-600 tabular-nums">
                {Math.max(0, Math.ceil((new Date('2026-10-01').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
              </span>
              <span className="text-xs font-bold text-amber-800/60">天</span>
            </div>
            <p className="text-[9px] font-bold text-amber-700/50 mt-2 leading-tight">
              预计 10 月 1 日开启全国新米采收季，敬请期待那一抹稻香。
            </p>
          </div>

          {/* 选米小技巧 */}
          <div className="px-4 space-y-3">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">识米小技巧</div>
            <div className="space-y-3">
              {[
                { title: '看腹白', desc: '米粒腹部不透明白斑越少，品质通常越佳。' },
                { title: '闻香气', desc: '抓一把米哈气，新鲜米有清淡稻草香。' },
                { title: '观硬度', desc: '硬度高的米蛋白质含量高，口感更筋道。' }
              ].map((tip, i) => (
                <div key={i} className="group cursor-help">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                    <span className="text-[11px] font-black text-gray-700 group-hover:text-emerald-600 transition-colors">{tip.title}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium leading-relaxed pl-3 border-l border-gray-100">
                    {tip.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 mt-auto space-y-2">
          {currentUser && (
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm">
              <LogOut className="w-4 h-4" /> 退出登录
            </button>
          )}
        </div>
      </aside>

      {/* 2. 主工作区 */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <header className="h-20 bg-white/50 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 flex-shrink-0">
           <div className="flex items-center gap-3 sm:gap-4">
              {/* 手机端菜单按钮 */}
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="bg-gray-100 px-3 sm:px-4 py-2 rounded-full flex items-center gap-2 group focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500 transition-all max-w-[160px] sm:max-w-none">
                <Search className="w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="寻找优质稻米..." 
                  className="bg-transparent border-none text-sm focus:ring-0 w-full sm:w-64 placeholder:text-gray-400 font-medium" 
                  value={headerSearchQuery}
                  onChange={(e) => setHeaderSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleHeaderSearch(headerSearchQuery);
                    }
                  }}
                />
                <button 
                  onClick={() => handleHeaderSearch(headerSearchQuery)}
                  className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors hidden sm:block"
                >
                  搜索
                </button>
              </div>
           </div>

           <div className="flex items-center gap-3 sm:gap-6">
              <button className="relative text-gray-400 hover:text-gray-600 hidden sm:block">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              {currentUser ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-black text-gray-900 leading-none">{currentUser.username}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">系统正式用户</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xs sm:text-sm">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <button onClick={() => handleOpenAuth('login', 'User')} className="text-xs font-black text-emerald-600 hover:text-emerald-700 underline underline-offset-4">立即登录</button>
              )}
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 relative">
           {/* 全局加载遮罩 */}
           {isLoading && viewMode === 'search' && results && (
             <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center animate-in fade-in duration-300">
               <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center gap-4">
                 <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                 <p className="text-xs font-black text-gray-400 uppercase tracking-widest">智能分析引擎运行中...</p>
               </div>
             </div>
           )}

           {/* 错误提示 */}
           {error && (
             <div className="max-w-5xl mx-auto mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4">
               <div className="flex items-center gap-3 text-red-700 text-sm font-bold">
                 <RotateCcw className="w-4 h-4" />
                 {error}
               </div>
               <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                 <X className="w-5 h-5" />
               </button>
             </div>
           )}

           {viewMode === 'search' ? (
             <div className="max-w-5xl mx-auto space-y-10">
                {!results ? (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="max-w-xl w-full px-2 sm:px-0">
                       <PreferenceForm onSubmitPreferences={handlePreferenceSubmit} onSubmitImage={handleImageSubmit} isLoading={isLoading} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                       <div>
                          <h2 className="text-2xl font-black text-gray-900">智能匹配结果</h2>
                          <p className="text-sm text-gray-500 font-medium mt-1">系统已为您精选出 {results.recommendations.length} 款符合您口味的稻米</p>
                       </div>
                       <button onClick={() => setResults(null)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-500 hover:text-emerald-600 hover:border-emerald-100 transition-all shadow-sm">
                          <RotateCcw className="w-3.5 h-3.5" /> 重新匹配
                       </button>
                    </div>

                    {isLoading && (
                      <div className="flex flex-col items-center justify-center py-12 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">正在重新分析特征...</p>
                      </div>
                    )}

                    {!isLoading && (
                      <>
                        <AnalysisChart products={results.recommendations} />
                        <ResultsGrid 
                          products={results.recommendations} 
                          analysisText={results.analysis} 
                          favorites={currentUser?.favorites || []} 
                          onToggleFavorite={toggleFavorite} 
                          onProductHover={handleProductHover}
                        />
                      </>
                    )}
                  </div>
                )}
             </div>
           ) : viewMode === 'favorites' ? (
             <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
                <div className="mb-10">
                   <h2 className="text-3xl font-black text-gray-900">我的个人收藏</h2>
                   <p className="text-gray-500 font-medium mt-1">在这里管理您钟爱的稻米品种</p>
                </div>
                <ResultsGrid 
                  products={inventory.filter(p => currentUser?.favorites.includes(p.id))} 
                  analysisText="" 
                  favorites={currentUser?.favorites || []} 
                  onToggleFavorite={toggleFavorite} 
                  showAnalysis={false} 
                  onProductHover={handleProductHover}
                />
             </div>
           ) : (
             <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
                <div className="mb-10 flex items-center justify-between">
                   <div>
                      <h2 className="text-3xl font-black text-gray-900">每日优选</h2>
                      <p className="text-gray-500 font-medium mt-1">基于您的收藏偏好，AI 为您精选的今日好米</p>
                   </div>
                   <button 
                    onClick={() => { setDailyResults(null); handleDailySelectionClick(); }} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                   >
                      <RotateCcw className="w-3.5 h-3.5" /> 刷新优选
                   </button>
                </div>
                
                {isLoading && !dailyResults ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">AI 正在为您精选...</p>
                  </div>
                ) : dailyResults ? (
                  <div className="space-y-8">
                    <AnalysisChart products={dailyResults.recommendations} />
                    <ResultsGrid 
                      products={dailyResults.recommendations} 
                      analysisText={dailyResults.analysis} 
                      favorites={currentUser?.favorites || []} 
                      onToggleFavorite={toggleFavorite} 
                      onProductHover={handleProductHover}
                    />
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Sparkles className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">暂无优选数据，请尝试刷新或添加更多收藏</p>
                  </div>
                )}
             </div>
           )}
        </div>
      </main>

      {/* 3. 右侧预览面板 */}
      <aside className="w-[340px] bg-gray-50/50 p-6 h-screen flex-shrink-0 z-40 hidden xl:block border-l border-gray-100">
        <PreviewPanel 
          product={previewProduct} 
          isFavorite={!!previewProduct && (currentUser?.favorites.includes(previewProduct.id) || false)}
          onToggleFavorite={toggleFavorite}
          onViewDetails={(p) => setSelectedProduct(p)}
        />
      </aside>

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          isFavorite={currentUser?.favorites.includes(selectedProduct.id)}
          onToggleFavorite={toggleFavorite}
          accentColor="bg-emerald-500"
        />
      )}

      {showAuthModal && (
        <UserAuthModal 
            initialMode={authConfig.mode}
            initialRole={authConfig.role}
            onClose={() => setShowAuthModal(false)} 
            onLogin={handleClientLogin} 
            onRegister={handleClientRegister} 
        />
      )}
    </div>
  );
};

export default App;
