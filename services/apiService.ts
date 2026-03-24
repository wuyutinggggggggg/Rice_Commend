
import { UserPreferences, RecommendationResponse, RiceProduct, UserProfile } from '../types.ts';
import { handleTextRecommendationRequest, handleImageAnalysisRequest, handleDailySelectionRequest } from './backend/geminiHandler.ts';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3002/api';

const mockFetch = async <T,>(apiAction: () => Promise<T>): Promise<T> => {
  console.log("%c[Network Request] Sending to /api/...", "color: #0ea5e9; font-weight: bold;");
  // await new Promise(res => setTimeout(res, 800)); // 移除模拟延迟
  const result = await apiAction();
  return result;
};

export const RiceApi = {
  fetchProducts: async (): Promise<RiceProduct[]> => {
    const response = await fetch(`${API_BASE}/products`);
    if (!response.ok) throw new Error('API error');
    const products = await response.json();
    return products.map((p: any) => ({
      ...p,
      id: String(p.id),
      varietyId: p.varietyId != null ? String(p.varietyId) : p.varietyId,
      originId: p.originId != null ? String(p.originId) : p.originId,
      cookingMethodId: p.cookingMethodId != null ? String(p.cookingMethodId) : p.cookingMethodId,
      images: p.paramImageUrl ? [p.packagingImage, p.paramImageUrl].filter(Boolean) : [p.packagingImage].filter(Boolean),
      variety: p.varietyName ? { id: String(p.varietyId), name: p.varietyName, description: p.varietyDesc } : undefined,
      origin: p.province ? {
        id: String(p.originId),
        province: p.province,
        coordinates: typeof p.coordinates === 'string' ? JSON.parse(p.coordinates || '{}') : (p.coordinates || {}),
        soilType: p.soilType
      } : undefined,
      cookingMethod: p.methodName ? { id: String(p.cookingMethodId), methodName: p.methodName, description: p.cookingDesc } : undefined,
      tastes: p.tastes?.map((t: any) => ({
        riceId: String(t.riceId),
        tasteId: String(t.tasteId),
        score: t.score,
        tasteProfile: { id: String(t.tasteId), indicatorName: t.indicatorName, description: t.tasteDesc }
      })) || [],
      cookings: p.cookings?.map((c: any) => ({
        riceId: String(c.riceId),
        cookingId: String(c.cookingId),
        score: c.score,
        cookingMethod: { id: String(c.cookingId), methodName: c.methodName, description: c.cookingDesc }
      })) || []
    }));
  },

  saveProduct: async (product: RiceProduct): Promise<RiceProduct> => {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!response.ok) throw new Error('API error');
    return await response.json();
  },

  fetchUsers: async (): Promise<UserProfile[]> => {
    const response = await fetch(`${API_BASE}/users`);
    if (!response.ok) throw new Error('API error');
    const users = await response.json();
    return users.map((u: any) => ({
      ...u,
      favorites: JSON.parse(u.favorites || '[]')
    }));
  },

  syncUser: async (user: UserProfile): Promise<UserProfile> => {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!response.ok) throw new Error('API error');
    return await response.json();
  },

  register: async (user: UserProfile): Promise<UserProfile> => {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!response.ok) throw new Error('API error');
    return await response.json();
  },

  getRecommendations: async (prefs: UserPreferences): Promise<RecommendationResponse> => {
    const inventory = await RiceApi.fetchProducts();
    return mockFetch(() => handleTextRecommendationRequest(prefs, inventory));
  },

  analyzeImage: async (base64: string): Promise<RecommendationResponse> => {
    const inventory = await RiceApi.fetchProducts();
    return mockFetch(() => handleImageAnalysisRequest(base64, inventory));
  },

  generateSmartSpecs: async (productInfo: any): Promise<any> => {
    const { handleSmartSpecsRequest } = await import('./backend/geminiHandler.ts');
    return mockFetch(() => handleSmartSpecsRequest(productInfo));
  },

  generateBatchSmartSpecs: async (products: any[]): Promise<any[]> => {
    const { handleBatchSmartSpecsRequest } = await import('./backend/geminiHandler.ts');
    return mockFetch(() => handleBatchSmartSpecsRequest(products));
  },

  getDailySelection: async (favorites: RiceProduct[]): Promise<RecommendationResponse> => {
    const inventory = await RiceApi.fetchProducts();
    return mockFetch(() => handleDailySelectionRequest(favorites, inventory));
  }
};
