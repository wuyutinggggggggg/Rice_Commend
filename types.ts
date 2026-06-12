export interface UserPreferences {
  origin?: string;
  minPrice?: number;
  maxPrice?: number;
  texture?: RiceTexture;
  grainLength?: RiceGrainLength;
  aroma?: boolean;
  specialScene?: string;
  requirements?: string;
  preferenceScores?: Record<string, number>;
}

export interface RiceProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  weight: number;
  varietyId: string;
  originId: string;
  cookingMethodId: string;
  packagingImage?: string;
  images?: string[];
  description?: string;
  tags?: string[];
  ownerId?: string;
  cookingRatio?: string;
  textureScore?: number;
  aromaScore?: number;
  varietyName?: string;
  waterRatio?: string;
  variety?: RiceVariety;
  origin?: RiceOrigin;
  cookingMethod?: CookingMethod;
  tastes?: TasteMapping[];
  cookings?: CookingMapping[];
  matchReason?: string;
}

export interface RiceVariety {
  id: string;
  name: string;
  description: string;
}

export interface RiceOrigin {
  id: string;
  province: string;
  coordinates: { lat: number; lng: number };
  soilType: string;
}

export interface TasteProfile {
  id: string;
  indicatorName: string;
  description: string;
}

export interface CookingMethod {
  id: string;
  methodName: string;
  description: string;
}

export interface TasteMapping {
  riceId: string;
  tasteId: string;
  score: number;
  tasteProfile?: TasteProfile;
}

export interface CookingMapping {
  riceId: string;
  cookingId: string;
  score: number;
  cookingMethod?: CookingMethod;
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
