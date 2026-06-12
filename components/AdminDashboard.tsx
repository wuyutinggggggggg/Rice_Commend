
import React, { useState } from 'react';
import { Database, Users, LogOut, Plus, X, Save, Pencil, Search, ShieldAlert, CheckCircle, Ban, UserPlus, Image as ImageIcon, Activity, Droplets, ShieldCheck, UserCircle, HelpCircle, Trash2, Upload, Sparkles, Loader2 } from 'lucide-react';
import { RiceProduct, UserProfile } from '../types.ts';
import { RiceApi } from '../services/apiService.ts';

interface AdminDashboardProps {
  onLogout: () => void;
  inventory: RiceProduct[];
  onAddProduct: (product: RiceProduct) => void | Promise<void>;
  onUpdateProduct: (product: RiceProduct) => void | Promise<void>;
  users: UserProfile[];
  onUpdateUsers: (users: UserProfile[]) => void;
  currentUser: UserProfile | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, inventory, onAddProduct, onUpdateProduct, users, onUpdateUsers, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'data' | 'users'>('data');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [userSearch, setUserSearch] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [userForm, setUserForm] = useState<Partial<UserProfile>>({
    username: '',
    role: 'User',
    status: 'Active'
  });

const isAdmin = true;
  const themeColorClass = 'amber';

  const myInventory = inventory;
  const normalizeProductText = (value: string | undefined) => String(value || '').replace(/\s+/g, '').trim().toLowerCase();
  const getProductDedupKey = (product: Partial<RiceProduct>) => {
    return `${normalizeProductText(product.name)}|${normalizeProductText(product.brand)}`;
  };

  const [newProduct, setNewProduct] = useState<Partial<RiceProduct>>({
    name: '',
    brand: '',
    varietyId: 'V1',
    originId: 'O1',
    cookingMethodId: 'C1',
    price: 0,
    weight: 5,
    cookingRatio: '1:1.2',
    description: '',
    images: []
  });

  const varieties = [
    { id: 'V1', name: '五常稻花香', description: '产自黑龙江五常市，以香、甜、软、糯闻名。' },
    { id: 'V2', name: '泰国香米', description: '长粒型大米，具有独特的茉莉花香。' },
    { id: 'V3', name: '东北大米', description: '口感筋道，米粒饱满，适合日常食用。' },
  ];

  const origins = [
    { id: 'O1', province: '黑龙江', coordinates: { lat: 45.75, lng: 126.63 }, soilType: '黑土地' },
    { id: 'O2', province: '泰国', coordinates: { lat: 15.87, lng: 100.99 }, soilType: '沙壤土' },
    { id: 'O3', province: '辽宁', coordinates: { lat: 41.80, lng: 123.43 }, soilType: '棕壤' },
  ];

  const cookingMethods = [
    { id: 'C1', methodName: '电饭煲精煮', description: '标准电饭煲煮饭模式，适合大多数大米。' },
    { id: 'C2', methodName: '木桶蒸饭', description: '传统蒸制方法，米粒更具嚼劲。' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ 
        ...prev, 
        [name]: ['price', 'weight'].includes(name)
            ? Math.max(0, Number(value))
            : value 
    }));
  };

  const handleMultipleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files) as File[];
      fileArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewProduct(prev => ({
            ...prev,
            images: [...(prev.images || []), reader.result as string]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewProduct({ 
      name: '', 
      brand: '',
      varietyId: '',
      originId: '',
      cookingMethodId: 'C1',
      price: 0, 
      weight: 5, 
      cookingRatio: '1:1.2',
      description: '', 
      images: [] 
    });
    setShowAddModal(true);
  };

  const openEditModal = (product: RiceProduct) => {
    setEditingId(product.id);
    setNewProduct({ 
      ...product, 
      varietyId: product.varietyId,
      originId: product.originId,
      images: product.images || (product.packagingImage ? [product.packagingImage] : []) 
    });
    setShowAddModal(true);
  };

  const handleAISmartGenerate = async () => {
    if (!newProduct.name || !newProduct.varietyId || !newProduct.originId) {
      alert('请先填写名称、品种和产地，以便 AI 进行分析。');
      return;
    }

    setIsAILoading(true);
    try {
      const selectedVariety = newProduct.varietyId || '';
      const selectedOrigin = newProduct.originId || '';
      
      const specs = await RiceApi.generateSmartSpecs({
        name: newProduct.name,
        variety: selectedVariety,
        origin: selectedOrigin,
        description: newProduct.description || ''
      });

        setNewProduct(prev => ({
        ...prev,
        textureScore: specs.textureScore,
        aromaScore: specs.aromaScore,
        cookingRatio: specs.cookingRatio,
        cookingMethodId: specs.cookingMethodId,
        description: specs.description || prev.description,
        tastes: specs.tastes.map((t: any) => ({
          ...t,
          tasteProfile: [
            { id: 'T001', indicatorName: '软糯度' },
            { id: 'T002', indicatorName: '米香浓度' },
            { id: 'T003', indicatorName: '回甘度' }
          ].find(p => p.id === t.tasteId)
        }))
      }));
    } catch (error) {
      console.error('AI Generate Error:', error);
      alert('AI 生成失败，请检查网络或稍后再试。');
    } finally {
      setIsAILoading(false);
    }
  };

  const handleBatchAISmartGenerate = async () => {
    if (selectedIds.length === 0) return;
    
    const selectedProducts = inventory.filter(p => selectedIds.includes(p.id));
    setIsAILoading(true);
    
    try {
      const results = await RiceApi.generateBatchSmartSpecs(selectedProducts);
      
      const tasteProfiles = [
        { id: 'T001', indicatorName: '软糯度' },
        { id: 'T002', indicatorName: '米香浓度' },
        { id: 'T003', indicatorName: '回甘度' }
      ];

      selectedIds.forEach((id, index) => {
        const product = inventory.find(p => p.id === id);
        if (product && results[index]) {
          const specs = results[index];
          const updatedProduct: RiceProduct = {
            ...product,
            textureScore: specs.textureScore,
            aromaScore: specs.aromaScore,
            cookingRatio: specs.cookingRatio,
            cookingMethodId: specs.cookingMethodId,
            description: specs.description || product.description,
            tastes: specs.tastes.map((t: any) => ({
              ...t,
              tasteProfile: tasteProfiles.find(p => p.id === t.tasteId)
            })),
            cookingMethod: cookingMethods.find(m => m.id === specs.cookingMethodId)
          };
          onUpdateProduct(updatedProduct);
        }
      });
      
      setSelectedIds([]);
      alert(`成功智能补全 ${selectedIds.length} 款大米的参数！`);
    } catch (error) {
      console.error('Batch AI Error:', error);
      alert('批量生成失败，请稍后再试。');
    } finally {
      setIsAILoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInventory.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInventory.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.originId) return;

    const duplicateProduct = inventory.find(product =>
      product.id !== editingId &&
      getProductDedupKey(product) === getProductDedupKey(newProduct)
    );
    if (duplicateProduct) {
      alert(`商品已存在：${duplicateProduct.name}`);
      return;
    }

    const finalImages = newProduct.images || [];
    const mainImg = finalImages.length > 0 ? finalImages[0] : '';

    // 创建视图对象以确保 UI 立即更新
    const selectedOrigin = { 
      id: `O_${Date.now()}`, 
      province: newProduct.originId || '', 
      coordinates: { lat: 0, lng: 0 }, 
      soilType: '未知' 
    };
    const selectedVariety = { 
      id: `V_${Date.now()}`, 
      name: newProduct.varietyId || '', 
      description: '' 
    };
    const selectedMethod = cookingMethods.find(m => m.id === newProduct.cookingMethodId);

  if (editingId) {
        const updatedProduct: RiceProduct = {
            ...newProduct as RiceProduct,
            id: editingId,
            packagingImage: mainImg,
            images: finalImages,
         origin: selectedOrigin,
            variety: selectedVariety,
            cookingMethod: selectedMethod
        };
        await onUpdateProduct(updatedProduct);
    } else {
        const productToAdd: RiceProduct = {
            id: `R${Math.floor(Math.random() * 10000).toString().padStart(3, '0')}`,
            name: newProduct.name!,
            brand: newProduct.brand || '',
            varietyId: newProduct.varietyId || 'V1',
            originId: newProduct.originId || 'O1',
            cookingMethodId: newProduct.cookingMethodId || 'C1',
            price: newProduct.price || 0,
            weight: newProduct.weight || 5,
            cookingRatio: newProduct.cookingRatio || '1:1.2',
            packagingImage: mainImg,
            images: finalImages,
            description: newProduct.description || '暂无描述',
            matchReason: '',
            tags: [],
            textureScore: newProduct.textureScore,
            aromaScore: newProduct.aromaScore,
            tastes: newProduct.tastes,
            origin: selectedOrigin,
            variety: selectedVariety,
            cookingMethod: selectedMethod
        };
        await onAddProduct(productToAdd);
    }

    setShowAddModal(false);
  };

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };

  const openAddUserModal = () => {
    setEditingUserId(null);
    setUserForm({ username: '', role: 'User', status: 'Active' });
    setShowUserModal(true);
  };

  const openEditUserModal = (user: UserProfile) => {
    setEditingUserId(user.id);
    setUserForm({ username: user.username, role: user.role, status: user.status });
    setShowUserModal(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username) return;

    if (editingUserId) {
        onUpdateUsers(users.map(u => u.id === editingUserId ? { ...u, ...userForm } as UserProfile : u));
    } else {
        const newUser: UserProfile = {
            id: `U${Math.floor(Math.random() * 10000)}`,
            username: userForm.username!,
            role: userForm.role as 'User' | 'Admin',
            status: userForm.status as 'Active' | 'Banned',
            ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
            lastActive: '刚刚',
            requestCount: 0,
            favorites: []
        };
        onUpdateUsers([newUser, ...users]);
    }
    setShowUserModal(false);
  };

  const toggleUserStatus = (userId: string) => {
      onUpdateUsers(users.map(user => {
          if (user.id === userId) {
              return { ...user, status: user.status === 'Active' ? 'Banned' : 'Active' };
          }
          return user;
      }));
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.id.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredInventory = myInventory.filter(item => 
    item.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    item.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
    item.id.toLowerCase().includes(productSearch.toLowerCase())
  );
  const dedupedInventory = filteredInventory.filter((item, index, list) =>
    index === list.findIndex(candidate => getProductDedupKey(candidate) === getProductDedupKey(item))
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className={`p-2 -ml-2 text-gray-400 hover:text-amber-600 md:hidden`}
          >
            <Database className="w-5 h-5" />
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity text-left"
          >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-amber-500`}>
                <ShieldCheck className="text-white w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-sm sm:text-lg leading-tight">
                  稻米系统 
                  <span className={`hidden sm:inline-block text-[10px] font-normal text-white px-2 py-0.5 rounded-full ml-1 bg-amber-500`}>
                    系统总控
                  </span>
                </h1>
                <p className="hidden sm:block text-[10px] text-gray-400">
                  全局权限与用户管理中心
                </p>
              </div>
          </button>
        </div>
        <button onClick={onLogout} className="text-xs sm:text-sm text-gray-500 hover:text-red-600 flex items-center gap-1.5 sm:gap-2 transition-colors">
          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">退出管理系统</span>
          <span className="sm:hidden">退出</span>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] md:hidden animate-in fade-in duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside className={`
          fixed inset-y-0 left-0 z-[50] w-64 bg-white border-r border-gray-200 flex-shrink-0 
          transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:z-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between md:hidden">
            <span className={`font-black text-amber-600 text-xs uppercase tracking-widest`}>管理菜单</span>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-4 space-y-1">
            <button
              onClick={() => { setActiveTab('data'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'data' ? `bg-amber-50 text-amber-700` : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Database className="w-4 h-4" />
              全局库存概览
            </button>
            <button
              onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'users' ? `bg-amber-50 text-amber-700` : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Users className="w-4 h-4" />
              全平台用户管理
            </button>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
          {activeTab === 'data' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                 <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      全量库存数据库
                    </h2>
                    <p className="text-sm text-gray-500">
                      管理全平台上架商品，当前显示 {filteredInventory.length} / 总计 {myInventory.length} 条
                    </p>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {selectedIds.length > 0 && (
                      <button
                        onClick={handleBatchAISmartGenerate}
                        disabled={isAILoading}
                        className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-lg animate-in slide-in-from-right-4"
                      >
                        {isAILoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        批量 AI 补全 ({selectedIds.length})
                      </button>
                    )}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="快速检索商品..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className={`w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500`}
                        />
                    </div>
                    <button 
                        onClick={openAddModal}
                        className={`bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap`}
                    >
                        <Plus className="w-4 h-4" />
                        发布新稻米
                    </button>
                 </div>
               </div>

               <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm custom-scrollbar">
                  <table className="w-full text-sm text-left min-w-[600px]">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-6 py-4 w-10">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.length > 0 && selectedIds.length === filteredInventory.length}
                            onChange={toggleSelectAll}
                            className={`rounded border-gray-300 text-amber-600 focus:ring-amber-500`}
                          />
                        </th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider">展示图</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider">商品名称</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-wider">单价/品种</th>
                        <th className="px-6 py-4 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredInventory.map(rice => (
                          <tr key={rice.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(rice.id) ? `bg-amber-50/50` : ''}`}>
                          <td className="px-6 py-4">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(rice.id)}
                              onChange={() => toggleSelect(rice.id)}
                              className={`rounded border-gray-300 text-amber-600 focus:ring-amber-500`}
                            />
                          </td>
                          <td className="px-6 py-4 font-mono text-[10px] text-gray-400">{rice.id}</td>
                          <td className="px-6 py-4">
                              {(rice.images && rice.images.length > 0) || rice.packagingImage ? (
                                <img src={rice.images?.[0] || rice.packagingImage} alt="外观" className="w-10 h-10 object-cover rounded-md border border-gray-100 shadow-sm" />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-300">
                                    <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                              <div className="text-sm">{rice.name}</div>
                              <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{rice.brand} | {rice.origin?.province}</div>
                          </td>

                          <td className="px-6 py-4 text-gray-600">
                              <div className={`font-bold text-sm text-amber-600`}>{rice.variety?.name}</div>
                              <div className="text-[10px] text-gray-400">{rice.weight}kg/¥{rice.price}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                              <button 
                                  onClick={() => openEditModal(rice)}
                                  className={`text-gray-400 hover:text-amber-600 transition-colors p-1`}
                              >
                                  <Pencil className="w-4 h-4" />
                              </button>
                          </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredInventory.length === 0 && (
                    <div className="py-20 text-center text-gray-400">
                        <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">暂无相关稻米数据</p>
                    </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'users' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-xs text-gray-400 uppercase font-semibold mb-1">总注册量</div>
                            <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                        </div>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600`}>
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-xs text-gray-400 uppercase font-semibold mb-1">系统活跃</div>
                            <div className="text-2xl font-bold text-emerald-600">{users.filter(u => u.status === 'Active').length}</div>
                        </div>
                         <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-xs text-gray-400 uppercase font-semibold mb-1">被封禁账号</div>
                            <div className={`text-2xl font-bold text-red-600`}>{users.filter(u => u.status === 'Banned').length}</div>
                        </div>
                         <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-red-50 text-red-600`}>
                            <Ban className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="通过用户名、UID 检索用户..." 
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full bg-gray-50 border-0 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-amber-500" 
                        />
                    </div>
                    <button 
                        onClick={openAddUserModal}
                        className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        手动创建账户
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm custom-scrollbar">
                    <table className="w-full text-sm text-left min-w-[800px]">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">UID</th>
                                <th className="px-6 py-4">账户</th>
                                <th className="px-6 py-4">来源 IP</th>
                                <th className="px-6 py-4">角色</th>
                                <th className="px-6 py-4">状态</th>
                                <th className="px-6 py-4 text-right">管控</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{user.id}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        {user.username}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">{user.ip}</td>
                                    <td className={`px-6 py-4 text-xs font-bold ${user.role === 'Admin' ? 'text-amber-600' : 'text-gray-600'}`}>
                                        {user.role === 'Admin' ? '系统管理员' : '普通用户'}
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                                            user.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                            {user.status === 'Active' ? '活跃中' : '已冻结'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => openEditUserModal(user)}
                                            className="text-gray-400 hover:text-amber-600 transition-colors p-1.5"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        {user.id !== currentUser?.id && (
                                            <button 
                                                onClick={() => toggleUserStatus(user.id)}
                                                className={`transition-colors p-1.5 rounded ${
                                                    user.status === 'Active' ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-green-600'
                                                }`}
                                            >
                                                {user.status === 'Active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
          )}
        </main>
      </div>

      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-full overflow-y-auto">
                  <div className={`px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-amber-50 sticky top-0 z-10`}>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-900">
                          {editingId ? '编辑商品信息' : '发布新稻米'}
                        </h3>
                        <button
                          type="button"
                          onClick={handleAISmartGenerate}
                          disabled={isAILoading}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isAILoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          AI 智能补全参数
                        </button>
                      </div>
                      <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">稻米名称</label>
                              <input required type="text" name="name" value={newProduct.name} onChange={handleInputChange} className={`w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500`} placeholder="如：五常稻花香 1号" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">品牌</label>
                              <input required type="text" name="brand" value={newProduct.brand} onChange={handleInputChange} className={`w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500`} placeholder="如：柴火大院" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">品种</label>
                              <input required type="text" name="varietyId" value={newProduct.varietyId} onChange={handleInputChange} className={`w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500`} placeholder="如：五常稻花香" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">产地</label>
                              <input required type="text" name="originId" value={newProduct.originId} onChange={handleInputChange} className={`w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500`} placeholder="如：黑龙江五常" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">推荐烹饪方式</label>
                              <select name="cookingMethodId" value={newProduct.cookingMethodId} onChange={handleInputChange} className={`w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500`}>
                                  {cookingMethods.map(c => <option key={c.id} value={c.id}>{c.methodName}</option>)}
                              </select>
                          </div>
                          <div className="col-span-2">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">图片展示 (可上传多张)</label>
                              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                  {newProduct.images?.map((img, idx) => (
                                      <div key={idx} className="aspect-square relative group rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                                          <img src={img} alt="" className="w-full h-full object-cover" />
                                          <button 
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                          >
                                              <Trash2 className="w-5 h-5 text-white" />
                                          </button>
                                          {idx === 0 && (
                                              <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 text-white text-[8px] py-0.5 text-center font-bold">主图</div>
                                          )}
                                      </div>
                                  ))}
                                  <label className={`aspect-square border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all text-gray-400 hover:text-amber-500`}>
                                      <Upload className="w-5 h-5 mb-1" />
                                      <span className="text-[10px] font-bold">上传图片</span>
                                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleMultipleImageUpload} />
                                  </label>
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">零售价 (元/kg)</label>
                              <input required type="number" min="0" step="0.1" name="price" value={newProduct.price} onChange={handleInputChange} className={`w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500`} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">单包重量 (kg)</label>
                              <input required type="number" min="0" step="0.1" name="weight" value={newProduct.weight} onChange={handleInputChange} className={`w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500`} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">米水比例</label>
                              <input required type="text" name="cookingRatio" value={newProduct.cookingRatio} onChange={handleInputChange} className={`w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500`} placeholder="如：1:1.2" />
                          </div>
                           <div className="col-span-2">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">产品描述</label>
                              <textarea name="description" value={newProduct.description} onChange={handleInputChange} rows={3} className={`w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 resize-none`} placeholder="详细介绍口感与特色..." />
                          </div>
                      </div>

                      <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
                          <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
                          <button type="submit" className={`px-6 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-2 transition-all shadow-md active:scale-95`}>
                              <Save className="w-4 h-4" />
                              {editingId ? '保存更改' : '确认上架'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-900">
                        {editingUserId ? '修改用户信息' : '创建系统账户'}
                      </h3>
                      <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">账户名称</label>
                          <input required type="text" name="username" value={userForm.username} onChange={handleUserInputChange} className="w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
                      </div>
                      
                      <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">赋予角色</label>
                          <select name="role" value={userForm.role} onChange={handleUserInputChange} className="w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500">
                              <option value="User">普通用户</option>
                              <option value="Admin">管理员</option>
                          </select>
                      </div>

                      <div className="pt-4 flex justify-end gap-3 pb-2">
                          <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">放弃</button>
                          <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center gap-2">
                              <Save className="w-4 h-4" />
                              确认提交
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;
