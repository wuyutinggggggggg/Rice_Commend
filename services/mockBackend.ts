
import { 
  RiceProduct, 
  UserProfile, 
  RiceVariety, 
  RiceOrigin, 
  TasteProfile, 
  CookingMethod, 
  TasteMapping 
} from '../types.ts';

const DB_KEYS = {
  PRODUCTS: 'rice_db_products',
  VARIETIES: 'rice_db_varieties',
  ORIGINS: 'rice_db_origins',
  TASTE_PROFILES: 'rice_db_taste_profiles',
  COOKING_METHODS: 'rice_db_cooking_methods',
  TASTE_MAPPINGS: 'rice_db_taste_mappings',
  USERS: 'rice_db_users'
};

const RICE_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1590483734724-38fa19dd7b3c?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1626071494507-dc79630ccb9c?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1501166243542-a7f457193963?auto=format&fit=crop&q=80&w=800",
];

const PROVINCES = ['黑龙江', '吉林', '辽宁', '江苏', '浙江', '安徽', '湖北', '湖南', '江西', '广东', '广西', '泰国', '日本', '越南'];
const SOIL_TYPES = ['黑土地', '红壤', '水稻土', '沙质土', '粘土'];
const RICE_VARIANTS = ['稻花香', '长粒香', '丝苗米', '越光米', '蟹田米', '珍珠米', '小农占', '茉莉香米', '秋田小町', '玄米', '胚芽米'];
const BRANDS = ['金龙鱼', '福临门', '北大荒', '十月稻田', '柴火大院', '华润五丰', '恒大兴安', '燕之坊'];

const generateInitialData = () => {
  const varieties: RiceVariety[] = RICE_VARIANTS.map((v, i) => ({
    id: `V${i.toString().padStart(3, '0')}`,
    name: v,
    description: `${v}是一种优质的稻米品种。`
  }));

  const origins: RiceOrigin[] = PROVINCES.map((p, i) => ({
    id: `O${i.toString().padStart(3, '0')}`,
    province: p,
    coordinates: { lat: 30 + Math.random() * 10, lng: 110 + Math.random() * 10 },
    soilType: SOIL_TYPES[Math.floor(Math.random() * SOIL_TYPES.length)]
  }));

  const tasteProfiles: TasteProfile[] = [
    { id: 'T001', indicatorName: '软糯度', description: '米饭煮熟后的柔软和粘稠程度' },
    { id: 'T002', indicatorName: '米香浓度', description: '米饭散发出的自然香气强度' },
    { id: 'T003', indicatorName: '回甘度', description: '咀嚼后在口腔中留下的甜味' }
  ];

  const cookingMethods: CookingMethod[] = [
    { id: 'M001', methodName: '电饭煲', description: '最常用的家庭烹饪方式' },
    { id: 'M002', methodName: '木桶蒸', description: '传统方式，米饭更干爽' },
    { id: 'M003', methodName: '煮粥', description: '适合软烂口感' }
  ];

  const products: RiceProduct[] = [];
  const tasteMappings: TasteMapping[] = [];

  for (let i = 1; i <= 50; i++) {
    const id = `R${i.toString().padStart(3, '0')}`;
    const variety = varieties[Math.floor(Math.random() * varieties.length)];
    const origin = origins[Math.floor(Math.random() * origins.length)];
    const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];
    const cookingMethod = cookingMethods[Math.floor(Math.random() * cookingMethods.length)];
    
    const price = Number((Math.random() * 45 + 5).toFixed(1));
    const weight = [1, 2.5, 5, 10][Math.floor(Math.random() * 4)];
    
    const mainImg = RICE_IMAGE_POOL[i % RICE_IMAGE_POOL.length];

    products.push({
      id,
      name: `${brand}${origin.province}${variety.name}`,
      brand,
      price,
      weight,
      varietyId: variety.id,
      originId: origin.id,
      cookingMethodId: cookingMethod.id,
      packagingImage: mainImg,
      images: [mainImg, RICE_IMAGE_POOL[(i + 1) % RICE_IMAGE_POOL.length]],
      description: `精选来自${origin.province}的${variety.name}，生长于${origin.soilType}。`,
      cookingRatio: "1:1.2",
      textureScore: Math.floor(Math.random() * 40 + 60),
      aromaScore: Math.floor(Math.random() * 40 + 60),
    });

    // 生成口感评分
    tasteProfiles.forEach(tp => {
      tasteMappings.push({
        riceId: id,
        tasteId: tp.id,
        score: Math.floor(Math.random() * 70 + 30)
      });
    });
  }

  return { products, varieties, origins, tasteProfiles, cookingMethods, tasteMappings };
};

const INITIAL_USERS: UserProfile[] = [
  { id: 'A001', username: 'admin', password: 'admin', ip: '127.0.0.1', role: 'Admin', status: 'Active', lastActive: '刚刚', requestCount: 0, favorites: [] }
];

const delay = (ms: number = 600) => new Promise(res => setTimeout(res, ms));

export const MockBackend = {
  getInventory: async (): Promise<RiceProduct[]> => {
    await delay();
    let productsRaw = localStorage.getItem(DB_KEYS.PRODUCTS);
    let varieties = JSON.parse(localStorage.getItem(DB_KEYS.VARIETIES) || '[]');
    let origins = JSON.parse(localStorage.getItem(DB_KEYS.ORIGINS) || '[]');
    let cookingMethods = JSON.parse(localStorage.getItem(DB_KEYS.COOKING_METHODS) || '[]');
    let tasteMappings = JSON.parse(localStorage.getItem(DB_KEYS.TASTE_MAPPINGS) || '[]');
    let tasteProfiles = JSON.parse(localStorage.getItem(DB_KEYS.TASTE_PROFILES) || '[]');

    if (!productsRaw) {
      const initial = generateInitialData();
      localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(initial.products));
      localStorage.setItem(DB_KEYS.VARIETIES, JSON.stringify(initial.varieties));
      localStorage.setItem(DB_KEYS.ORIGINS, JSON.stringify(initial.origins));
      localStorage.setItem(DB_KEYS.TASTE_PROFILES, JSON.stringify(initial.tasteProfiles));
      localStorage.setItem(DB_KEYS.COOKING_METHODS, JSON.stringify(initial.cookingMethods));
      localStorage.setItem(DB_KEYS.TASTE_MAPPINGS, JSON.stringify(initial.tasteMappings));
      
      productsRaw = JSON.stringify(initial.products);
      varieties = initial.varieties;
      origins = initial.origins;
      cookingMethods = initial.cookingMethods;
      tasteMappings = initial.tasteMappings;
      tasteProfiles = initial.tasteProfiles;
    }

    const products: RiceProduct[] = JSON.parse(productsRaw);

    // Join data
    return products.map(p => ({
      ...p,
      variety: varieties.find((v: any) => v.id === p.varietyId),
      origin: origins.find((o: any) => o.id === p.originId),
      cookingMethod: cookingMethods.find((m: any) => m.id === p.cookingMethodId),
      tastes: tasteMappings
        .filter((tm: any) => tm.riceId === p.id)
        .map((tm: any) => ({
          ...tm,
          tasteProfile: tasteProfiles.find((tp: any) => tp.id === tm.tasteId)
        }))
    }));
  },

  getUsers: async (): Promise<UserProfile[]> => {
    await delay();
    const data = localStorage.getItem(DB_KEYS.USERS);
    let users: UserProfile[] = data ? JSON.parse(data) : [...INITIAL_USERS];
    
    INITIAL_USERS.forEach(initialUser => {
      if (!users.some(u => u.username === initialUser.username)) {
        users.push(initialUser);
      }
    });

    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    return users;
  },

  saveProduct: async (product: RiceProduct): Promise<RiceProduct> => {
    await delay(800);
    const products = JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]');
    const index = products.findIndex((p: any) => p.id === product.id);
    
    // 移除视图字段后再保存
    const { variety, origin, cookingMethod, tastes, matchReason, ...rawProduct } = product;
    
    if (index > -1) {
      products[index] = rawProduct;
    } else {
      products.push(rawProduct);
    }
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
    return product;
  },

  updateUser: async (user: UserProfile): Promise<UserProfile> => {
    await delay(500);
    const users = await MockBackend.getUsers();
    const updated = users.map(u => u.id === user.id ? user : u);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(updated));
    return user;
  },

  register: async (user: UserProfile): Promise<UserProfile> => {
    await delay(1000);
    const users = await MockBackend.getUsers();
    if (users.some(u => u.username === user.username)) throw new Error("用户名已存在");
    users.push(user);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    return user;
  }
};
