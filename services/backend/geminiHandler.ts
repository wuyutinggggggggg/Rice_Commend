import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from 'openai';
import { UserPreferences, RecommendationResponse, RiceProduct, RiceTexture, RiceGrainLength } from "../../types.ts";

const cache = new Map<string, any>();

const getCacheKey = (type: string, prefs: any, inventory: RiceProduct[]) => {
  const prefsStr = JSON.stringify(prefs);
  const inventoryIds = inventory.map(p => p.id).sort().join(',');
  return `${type}:${prefsStr}:${inventoryIds}`;
};

const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined');
  }
  return new GoogleGenAI({ apiKey });
};

const getDeepSeekClient = () => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not defined');
  }
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  });
};

const recommendationSchema = {
  type: Type.OBJECT,
  properties: {
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          matchReason: { type: Type.STRING, description: "推荐理由" }
        },
        required: ["id", "matchReason"],
      },
    },
    analysis: { type: Type.STRING, description: "简短分析理由" },
  },
  required: ["recommendations", "analysis"],
};

const normalizeText = (value: unknown) => String(value ?? '').trim().toLowerCase();

const hasSpecialScene = (prefs: UserPreferences) => normalizeText(prefs.specialScene).length > 0;

const getTasteScore = (product: RiceProduct, keywords: string[]) => {
  const matched = product.tastes?.find(t => {
    const indicatorName = String(t.tasteProfile?.indicatorName || '');
    return keywords.some(keyword => indicatorName.includes(keyword));
  });
  return Number(matched?.score || 0);
};

const formatInventoryForPrompt = (inventory: RiceProduct[]) => {
  return inventory.map(p => {
    const tastes = p.tastes?.map(t => `${t.tasteProfile?.indicatorName}:${t.score}`).join(',');
    return `编号:${p.id}|名称:${p.name}|品牌:${p.brand}|品种:${p.variety?.name || ''}|产地:${p.origin?.province || ''}|土壤:${p.origin?.soilType || ''}|价格:${p.price}元/kg|口感:${tastes || ''}|烹饪方式:${p.cookingMethod?.methodName || ''}`;
  }).join('\n');
};

const getLocalRecommendationResult = (
  prefs: UserPreferences,
  inventory: RiceProduct[],
  analysis = "未输入特殊场景，已按本地数据库参数为您推荐稻米。"
): RecommendationResponse => {
  const originQuery = normalizeText(prefs.origin);
  const requirementQuery = normalizeText(prefs.requirements);
  const minPrice = Number.isFinite(Number(prefs.minPrice)) ? Number(prefs.minPrice) : 0;
  const maxPrice = Number.isFinite(Number(prefs.maxPrice)) && Number(prefs.maxPrice) > 0
    ? Number(prefs.maxPrice)
    : Number.POSITIVE_INFINITY;

  const scored = inventory.map(product => {
    let score = 0;
    const province = normalizeText(product.origin?.province);
    const varietyName = normalizeText(product.variety?.name || product.varietyName);
    const name = normalizeText(product.name);
    const description = normalizeText(product.description);
    const tags = (product.tags || []).map(normalizeText);
    const textureScore = getTasteScore(product, ['软糯', '软', '柔']);
    const aromaScore = getTasteScore(product, ['米香', '香气', '香']);

    if (product.price >= minPrice && product.price <= maxPrice) {
      score += 35;
      if (Number.isFinite(maxPrice) && maxPrice > minPrice) {
        const middle = (minPrice + maxPrice) / 2;
        score += Math.max(0, 15 - Math.abs(product.price - middle) * 2);
      }
    } else if (product.price <= maxPrice * 1.15 && product.price >= Math.max(0, minPrice * 0.85)) {
      score += 12;
    } else {
      score -= 20;
    }

    if (!originQuery) {
      score += 10;
    } else if (province.includes(originQuery) || name.includes(originQuery)) {
      score += 22;
    }

    if (prefs.texture === RiceTexture.SOFT) {
      score += textureScore || (product.textureScore || 0);
    } else if (prefs.texture === RiceTexture.FIRM) {
      const raw = textureScore || (product.textureScore || 0);
      score += Math.max(0, 100 - raw);
    } else {
      const raw = textureScore || (product.textureScore || 60);
      score += Math.max(0, 30 - Math.abs(raw - 60));
    }

    if (prefs.aroma) {
      score += (aromaScore || product.aromaScore || 0) * 0.5;
    } else {
      score += 8;
    }

    if (prefs.grainLength === RiceGrainLength.LONG) {
      if (varietyName.includes('长') || name.includes('长') || varietyName.includes('籼')) score += 18;
    } else if (prefs.grainLength === RiceGrainLength.SHORT) {
      if (varietyName.includes('圆') || name.includes('圆') || varietyName.includes('粳')) score += 18;
    } else if (prefs.grainLength === RiceGrainLength.MEDIUM) {
      score += 10;
    }

    if (requirementQuery) {
      const textBlob = `${name} ${varietyName} ${province} ${description} ${tags.join(' ')}`;
      if (textBlob.includes(requirementQuery)) {
        score += 15;
      }
    }

    return { product, score };
  });

  const recommendations = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ product }) => ({
      ...product,
      matchReason:
        product.matchReason ||
        `已按${prefs.origin ? '产地、' : ''}预算、口感${prefs.aroma ? '和香气' : ''}等参数从本地数据库筛选，匹配度较高。`
    }));

  return {
    recommendations: recommendations.length > 0 ? recommendations : inventory.slice(0, 3),
    analysis,
  };
};

export const handleTextRecommendationRequest = async (prefs: UserPreferences, inventory: RiceProduct[]): Promise<RecommendationResponse> => {
  const cacheKey = getCacheKey('text', prefs, inventory);
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  if (!hasSpecialScene(prefs)) {
    const result = getLocalRecommendationResult(prefs, inventory);
    cache.set(cacheKey, result);
    return result;
  }

  const inventoryStr = formatInventoryForPrompt(inventory);
  const prompt = `
    你是稻米推荐专家，请结合用户给出的特殊场景，从库存中挑选最适合的产品。
    用户偏好与约束：
    - 预算范围：${prefs.minPrice || 0} 到 ${prefs.maxPrice || '不限'} 元/kg
    - 产地要求：${prefs.origin || '不限'}
    - 口感偏好：${prefs.texture || '不限'}
    - 米粒形态：${prefs.grainLength || '不限'}
    - 特殊场景：${prefs.specialScene || '无'}
    - 其他补充需求：${prefs.requirements || '无'}

    现有库存数据：
    ${inventoryStr}

    要求：
    1. 只返回库存中存在的产品 ID。
    2. 返回 JSON：{"recommendations":[{"id":"产品ID","matchReason":"推荐理由"}],"analysis":"简短分析"}。
    3. 不要包含 URL，不要引导用户点击购买。
    4. 分析聚焦在场景与稻米本身的匹配逻辑。
  `;

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recommendationSchema,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const recommendations = (parsed.recommendations || [])
      .map((rec: any) => {
        const product = inventory.find(p => p.id === rec.id);
        return product ? { ...product, matchReason: rec.matchReason } : null;
      })
      .filter((item: any) => item !== null);

    const result = {
      recommendations: recommendations.length > 0 ? recommendations : getLocalRecommendationResult(prefs, inventory).recommendations,
      analysis: parsed.analysis || "已结合特殊场景为您完成场景化推荐。",
    };
    cache.set(cacheKey, result);
    return result;
  } catch (geminiError) {
    console.warn('Gemini API unavailable, switching to DeepSeek:', geminiError);

    try {
      const deepseek = getDeepSeekClient();
      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      const recommendations = (parsed.recommendations || [])
        .map((rec: any) => {
          const product = inventory.find(p => p.id === rec.id);
          return product ? { ...product, matchReason: rec.matchReason } : null;
        })
        .filter((item: any) => item !== null);

      const result = {
        recommendations: recommendations.length > 0 ? recommendations : getLocalRecommendationResult(prefs, inventory).recommendations,
        analysis: parsed.analysis || "已结合特殊场景为您完成场景化推荐。",
      };
      cache.set(cacheKey, result);
      return result;
    } catch (deepseekError) {
      console.error('Both Gemini and DeepSeek APIs failed:', deepseekError);
      const result = getLocalRecommendationResult(
        prefs,
        inventory,
        "特殊场景分析服务暂时不可用，已切换为本地数据库参数匹配结果。"
      );
      cache.set(cacheKey, result);
      return result;
    }
  }
};

export const handleImageAnalysisRequest = async (base64Image: string, inventory: RiceProduct[]): Promise<RecommendationResponse> => {
  const cacheKey = getCacheKey('image', { base64Image: base64Image.substring(0, 100) }, inventory);
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const inventoryStr = formatInventoryForPrompt(inventory);
  const promptText = `
    分析图片中的菜肴风味特征，并从以下稻米库存中推荐最适合搭配的产品：
    ${inventoryStr}

    要求：
    1. 只返回库存中存在的产品 ID。
    2. 返回 JSON：{"recommendations":[{"id":"产品ID","matchReason":"推荐理由"}],"analysis":"简短分析"}。
    3. 不包含 URL。
  `;

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: promptText }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: recommendationSchema,
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    const recommendations = (parsed.recommendations || [])
      .map((rec: any) => {
        const product = inventory.find(p => p.id === rec.id);
        return product ? { ...product, matchReason: rec.matchReason } : null;
      })
      .filter((item: any) => item !== null);

    const result = {
      recommendations: recommendations.length > 0 ? recommendations : inventory.slice(0, 3),
      analysis: parsed.analysis || "已根据菜肴图像为您完成搭配推荐。",
    };
    cache.set(cacheKey, result);
    return result;
  } catch (geminiError) {
    console.warn('Gemini API unavailable for image analysis:', geminiError);

    try {
      const deepseek = getDeepSeekClient();
      const textPrompt = `假设图片内容为一款常见家常菜，请从以下库存中推荐适合搭配的稻米：\n${inventoryStr}`;
      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: textPrompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      const recommendations = (parsed.recommendations || [])
        .map((rec: any) => {
          const product = inventory.find(p => p.id === rec.id);
          return product ? { ...product, matchReason: rec.matchReason } : null;
        })
        .filter((item: any) => item !== null);

      const result = {
        recommendations: recommendations.length > 0 ? recommendations : inventory.slice(0, 3),
        analysis: parsed.analysis || "图像识别服务降级，已按常见菜肴搭配逻辑为您推荐。",
      };
      cache.set(cacheKey, result);
      return result;
    } catch (deepseekError) {
      console.error('Both APIs failed for image analysis:', deepseekError);
      const result = {
        recommendations: inventory.slice(0, 3),
        analysis: "图像分析服务暂时不可用，已为您展示本地热门稻米。",
      };
      cache.set(cacheKey, result);
      return result;
    }
  }
};

export const handleDailySelectionRequest = async (favorites: RiceProduct[], inventory: RiceProduct[]): Promise<RecommendationResponse> => {
  const cacheKey = getCacheKey('daily', { favorites: favorites.map(f => f.id).sort() }, inventory);
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const inventoryStr = formatInventoryForPrompt(inventory);
  const favoritesStr = favorites.map(p => `${p.name}(${p.variety?.name || ''}, ${p.origin?.province || ''})`).join(', ');
  const prompt = `
    你是稻米推荐专家，请根据用户已收藏的稻米产品，从库存中推荐 3 到 5 款适合作为“每日优选”的产品。
    用户已收藏：${favoritesStr || '暂无收藏，请推荐当前库存中综合表现较好的产品。'}
    库存：
    ${inventoryStr}

    要求：
    1. 只返回库存中存在的产品 ID。
    2. 返回 JSON：{"recommendations":[{"id":"产品ID","matchReason":"推荐理由"}],"analysis":"简短分析"}。
    3. 不要包含 URL。
  `;

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recommendationSchema,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const recommendations = (parsed.recommendations || [])
      .map((rec: any) => {
        const product = inventory.find(p => p.id === rec.id);
        return product ? { ...product, matchReason: rec.matchReason } : null;
      })
      .filter((item: any) => item !== null);

    const result = {
      recommendations: recommendations.length > 0 ? recommendations : inventory.slice(0, 3),
      analysis: parsed.analysis || "已根据您的收藏偏好生成今日优选。",
    };
    cache.set(cacheKey, result);
    return result;
  } catch (geminiError) {
    console.warn('Gemini API unavailable, switching to DeepSeek:', geminiError);

    try {
      const deepseek = getDeepSeekClient();
      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      const recommendations = (parsed.recommendations || [])
        .map((rec: any) => {
          const product = inventory.find(p => p.id === rec.id);
          return product ? { ...product, matchReason: rec.matchReason } : null;
        })
        .filter((item: any) => item !== null);

      const result = {
        recommendations: recommendations.length > 0 ? recommendations : inventory.slice(0, 3),
        analysis: parsed.analysis || "已根据您的收藏偏好生成今日优选。",
      };
      cache.set(cacheKey, result);
      return result;
    } catch (deepseekError) {
      console.error('Both Gemini and DeepSeek APIs failed:', deepseekError);
      const result = {
        recommendations: inventory.slice(0, 3),
        analysis: "每日优选服务暂时不可用，已为您展示本地热门稻米。",
      };
      cache.set(cacheKey, result);
      return result;
    }
  }
};

export const handleSmartSpecsRequest = async (productInfo: { name: string, variety: string, origin: string, description: string }): Promise<any> => {
  const ai = getAIClient();
  const prompt = `
    你是一名高级评米师，请根据以下大米信息，科学推断其口感指标和烹饪参数。
    产品信息：
    - 名称：${productInfo.name}
    - 品种：${productInfo.variety}
    - 产地：${productInfo.origin}
    - 描述：${productInfo.description}

    请给出：
    1. 软糯度评分 (0-100)
    2. 米香浓度评分 (0-100)
    3. 最佳米水比（格式如 1:1.2）
    4. 最适合的烹饪方式 ID（M001/M002/M003）
    5. 详细口感评分（T001/T002/T003）
    6. 专业商品描述（100字以内）
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            textureScore: { type: Type.INTEGER },
            aromaScore: { type: Type.INTEGER },
            cookingRatio: { type: Type.STRING },
            cookingMethodId: { type: Type.STRING },
            description: { type: Type.STRING },
            tastes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tasteId: { type: Type.STRING },
                  score: { type: Type.INTEGER }
                },
                required: ["tasteId", "score"]
              }
            }
          },
          required: ["textureScore", "aromaScore", "cookingRatio", "cookingMethodId", "description", "tastes"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.warn('Gemini API unavailable for smart specs, using defaults:', error);
    return {
      textureScore: 75,
      aromaScore: 70,
      cookingRatio: "1:1.2",
      cookingMethodId: "M001",
      description: "优质稻米，口感均衡，适合日常家庭食用。",
      tastes: [
        { tasteId: "T001", score: 75 },
        { tasteId: "T002", score: 70 },
        { tasteId: "T003", score: 65 }
      ]
    };
  }
};

export const handleBatchSmartSpecsRequest = async (products: any[]): Promise<any[]> => {
  const ai = getAIClient();
  const productsStr = products.map((p, i) =>
    `[${i}] 名称:${p.name}, 品种:${p.variety?.name || ''}, 产地:${p.origin?.province || ''}, 描述:${p.description || ''}`
  ).join('\n');

  const prompt = `
    你是一名高级评米师，请根据以下多款大米的信息，科学推断它们的口感指标和烹饪参数。
    待分析产品列表：
    ${productsStr}

    请为每款大米返回：
    1. 软糯度评分 (0-100)
    2. 米香浓度评分 (0-100)
    3. 最佳米水比（格式如 1:1.2）
    4. 最适合的烹饪方式 ID（M001/M002/M003）
    5. 详细口感评分（T001/T002/T003）
    6. 专业商品描述（100字以内）
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              textureScore: { type: Type.INTEGER },
              aromaScore: { type: Type.INTEGER },
              cookingRatio: { type: Type.STRING },
              cookingMethodId: { type: Type.STRING },
              description: { type: Type.STRING },
              tastes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    tasteId: { type: Type.STRING },
                    score: { type: Type.INTEGER }
                  },
                  required: ["tasteId", "score"]
                }
              }
            },
            required: ["textureScore", "aromaScore", "cookingRatio", "cookingMethodId", "description", "tastes"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.warn('Gemini API unavailable for batch smart specs, using defaults:', error);
    return products.map(() => ({
      textureScore: 75,
      aromaScore: 70,
      cookingRatio: "1:1.2",
      cookingMethodId: "M001",
      description: "优质稻米，口感均衡，适合日常家庭食用。",
      tastes: [
        { tasteId: "T001", score: 75 },
        { tasteId: "T002", score: 70 },
        { tasteId: "T003", score: 65 }
      ]
    }));
  }
};
