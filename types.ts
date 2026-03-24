
export interface UserPreferences {
  origin?: string;
  minPrice?: number;
  maxPrice?: number;
  texture?: RiceTexture;
  grainLength?: RiceGrainLength;
  aroma?: boolean;
  requirements?: string;
  preferenceScores?: Record<string, number>; // 用户偏好量化评分
}

// 事实表：核心大米表
export interface RiceProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  weight: number;
  varietyId: string; // 外键：品种
  originId: string;  // 外键：产地
  cookingMethodId: string; // 外键：烹饪方式
  packagingImage?: string;
  images?: string[];
  description?: string;
  tags?: string[];
  ownerId?: string; // 所属商家 ID
  
  // 额外属性 (用于 UI 展示)
  cookingRatio?: string;
  textureScore?: number;
  aromaScore?: number;
  varietyName?: string;
  waterRatio?: string;
  
  // 视图字段 (由后端/服务层填充)
  variety?: RiceVariety;
  origin?: RiceOrigin;
  cookingMethod?: CookingMethod;
  tastes?: TasteMapping[];
  cookings?: CookingMapping[];
  matchReason?: string;
}

// 维度表：品种
export interface RiceVariety {
  id: string;
  name: string; // 如：五常稻花香、泰国香米
  description: string;
}

// 维度表：产地
export interface RiceOrigin {
  id: string;
  province: string;
  coordinates: { lat: number; lng: number }; // 产地坐标
  soilType: string; // 土壤类型
}

// 维度表：口感指标
export interface TasteProfile {
  id: string;
  indicatorName: string; // 如：软糯度、米香浓度
  description: string;
}

// 维度表：适宜烹饪方式
export interface CookingMethod {
  id: string;
  methodName: string; // 如：电饭煲、木桶蒸、煮粥
  description: string;
}

// 关联表：大米-口感多对多
export interface TasteMapping {
  riceId: string;
  tasteId: string;
  score: number; // 口感评分
  tasteProfile?: TasteProfile; // 视图字段
}

// 关联表：大米-烹饪方式多对多
export interface CookingMapping {
  riceId: string;
  cookingId: string;
  score: number; // 烹饪评分
  cookingMethod?: CookingMethod; // 视图字段
}

export interface UserProfile {
  id: string;
  username: string;
  password?: string;
  ip: string;
  role: 'User' | 'Admin';
  status: 'Active' | 'Banned';
  lastActive: string;
  requestCount: number;
  favorites: string[];
}

export interface RecommendationResponse {
  recommendations: RiceProduct[];
  analysis: string;
}

export enum AppState {
  HOME = 'HOME',
  RECOMMEND = 'RECOMMEND',
  ANALYSIS = 'ANALYSIS',
  CHAT = 'CHAT'
}

export enum RiceTexture {
  SOFT = 'soft',
  FIRM = 'firm',
  BALANCED = 'balanced'
}

export enum RiceGrainLength {
  LONG = 'long',
  SHORT = 'short',
  MEDIUM = 'medium'
}

export type UserRole = 'user' | 'admin' | null;
