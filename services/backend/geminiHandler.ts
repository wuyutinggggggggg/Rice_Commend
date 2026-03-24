import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from 'openai';
import { UserPreferences, RecommendationResponse, RiceProduct } from "../../types.ts";

// 简单的内存缓存，避免重复AI调用
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
    apiKey: apiKey,
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
    analysis: { type: Type.STRING, description: "简短的分析理由，字数控制在50字以内" },
  },
  required: ["recommendations", "analysis"],
};

export const handleTextRecommendationRequest = async (prefs: UserPreferences, inventory: RiceProduct[]): Promise<RecommendationResponse> => {
  const cacheKey = getCacheKey('text', prefs, inventory);
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const inventoryStr = inventory.map(p => {
    const tastes = p.tastes?.map(t => `${t.tasteProfile?.indicatorName}:${t.score}`).join(',');
    return `编号:${p.id}|名称:${p.name}|品牌:${p.brand}|品种:${p.variety?.name}|产地:${p.origin?.province}|土壤:${p.origin?.soilType}|价格:${p.price}元/kg|口感:${tastes}|烹饪方式:${p.cookingMethod?.methodName}`;
  }).join('\n');

  const prompt = `
    作为稻米专家，请从以下库中匹配最适合的产品。

    用户偏好与约束：
    - 预算范围：${prefs.minPrice || 0} 到 ${prefs.maxPrice || '不限'} 元/kg
    - 产地要求：${prefs.origin || '不限'}
    - 口感偏好：${prefs.texture || '不限'}
    - 米粒形态：${prefs.grainLength || '不限'}
    - 其他补充需求：${prefs.requirements || '无'}

    现有库数据：
    ${inventoryStr}

    要求：
    1. 严禁在生成的文本中包含任何 URL 链接。
    2. 在 analysis 字段提供一段极其简短的分析理由（50字以内）。
    3. 严禁提示用户"点击购买"、"跳转选购"，应引导用户根据推荐的品牌和产品全名自行了解。
    4. 报告应聚焦于稻米本身的特质。

    请以JSON格式返回：{"recommendations": [{"id": "产品ID", "matchReason": "推荐理由"}], "analysis": "简短分析"}
  `;

  // 尝试使用Gemini
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
      analysis: parsed.analysis || "根据您的偏好，我们为您挑选了口感最为契合的稻米品种。您可以根据产品详情了解它们的特色。"
    };
    cache.set(cacheKey, result);
    return result;
  } catch (geminiError) {
    console.warn('Gemini API unavailable, switching to DeepSeek:', geminiError);

    // 切换到DeepSeek
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
        analysis: parsed.analysis || "根据您的偏好，我们为您挑选了口感最为契合的稻米品种。您可以根据产品详情了解它们的特色。"
      };
      cache.set(cacheKey, result);
      return result;
    } catch (deepseekError) {
      console.error('Both Gemini and DeepSeek APIs failed:', deepseekError);
      // 返回默认推荐
      const result = {
        recommendations: inventory.slice(0, 3),
        analysis: "AI服务暂时不可用，已为您推荐热门产品。"
      };
      cache.set(cacheKey, result);
      return result;
    }
  }
};

export const handleImageAnalysisRequest = async (base64Image: string, inventory: RiceProduct[]): Promise<RecommendationResponse> => {
  const cacheKey = getCacheKey('image', { base64Image: base64Image.substring(0, 100) }, inventory); // 简化缓存键
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const inventoryStr = inventory.map(p => {
    const tastes = p.tastes?.map(t => `${t.tasteProfile?.indicatorName}:${t.score}`).join(',');
    return `编号:${p.id}|名称:${p.name}|品牌:${p.brand}|品种:${p.variety?.name}|产地:${p.origin?.province}|价格:${p.price}元/kg|口感:${tastes}`;
  }).join('\n');

  const promptText = `
          分析图中菜肴的口味特征，并从以下稻米库中推荐最适合搭配的米种：
          ${inventoryStr}

          要求：
          1. 严禁提供任何可点击的 URL。
          2. analysis 字段提供一段极其简短的分析理由（50字以内），聚焦于风味搭配。
          3. 不要引导用户跳转，仅说明大米的品种特色。
          4. 语气应自然、生活化。

          请以JSON格式返回：{"recommendations": [{"id": "产品ID", "matchReason": "推荐理由"}], "analysis": "简短分析"}
  `;

  // 尝试使用Gemini（支持图像）
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
      analysis: parsed.analysis || "这款菜肴的味道浓郁，搭配我们为您选出的米种能带来更好的味觉平衡。您可以根据产品全名进一步了解这些品种。"
    };
    cache.set(cacheKey, result);
    return result;
  } catch (geminiError) {
    console.warn('Gemini API unavailable for image analysis:', geminiError);

    // DeepSeek不支持图像，降级到文本推荐
    try {
      const deepseek = getDeepSeekClient();
      const textPrompt = `基于菜肴描述（假设为中式家常菜），推荐适合搭配的稻米：${inventoryStr}`;
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
        analysis: parsed.analysis || "这款菜肴的味道浓郁，搭配我们为您选出的米种能带来更好的味觉平衡。您可以根据产品全名进一步了解这些品种。"
      };
      cache.set(cacheKey, result);
      return result;
    } catch (deepseekError) {
      console.error('Both APIs failed for image analysis:', deepseekError);
      // 返回默认推荐
      const result = {
        recommendations: inventory.slice(0, 3),
        analysis: "图像分析服务暂时不可用，已为您推荐热门米种。"
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

  const inventoryStr = inventory.map(p => {
    const tastes = p.tastes?.map(t => `${t.tasteProfile?.indicatorName}:${t.score}`).join(',');
    return `编号:${p.id}|名称:${p.name}|品牌:${p.brand}|品种:${p.variety?.name}|产地:${p.origin?.province}|价格:${p.price}元/kg|口感:${tastes}`;
  }).join('\n');

  const favoritesStr = favorites.map(p => `${p.name}(${p.variety?.name}, ${p.origin?.province})`).join(', ');

  const prompt = `
    作为稻米专家，请根据用户已收藏的稻米产品，从库中推荐 3-5 款相似或互补的优质稻米作为"每日优选"。

    用户已收藏的产品：
    ${favoritesStr || '暂无收藏（请推荐当前库中最优质、最受欢迎的品种）'}

    现有库数据：
    ${inventoryStr}

    要求：
    1. 严禁在生成的文本中包含任何 URL 链接。
    2. 在 analysis 字段提供一段极其简短的分析理由（50字以内），说明为什么这些是今天的优选。
    3. 推荐理由 matchReason 应说明与用户收藏的关联性或该品种的独特优势。
    4. 严禁提示用户"点击购买"，应引导用户自行了解。

    请以JSON格式返回：{"recommendations": [{"id": "产品ID", "matchReason": "推荐理由"}], "analysis": "简短分析"}
  `;

  // 尝试使用Gemini
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
      analysis: parsed.analysis || "根据您的收藏偏好，我们为您精选了今日最值得尝试的优质稻米。"
    };
    cache.set(cacheKey, result);
    return result;
  } catch (geminiError) {
    console.warn('Gemini API unavailable, switching to DeepSeek:', geminiError);

    // 切换到DeepSeek
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
        analysis: parsed.analysis || "根据您的收藏偏好，我们为您精选了今日最值得尝试的优质稻米。"
      };
      cache.set(cacheKey, result);
      return result;
    } catch (deepseekError) {
      console.error('Both Gemini and DeepSeek APIs failed:', deepseekError);
      // 返回默认推荐
      const result = {
        recommendations: inventory.slice(0, 3),
        analysis: "AI服务暂时不可用，已为您推荐热门产品。"
      };
      cache.set(cacheKey, result);
      return result;
    }
  }
};

export const handleSmartSpecsRequest = async (productInfo: { name: string, variety: string, origin: string, description: string }): Promise<any> => {
  const ai = getAIClient();
  const prompt = `
    作为一名高级评米师，请根据以下大米信息，科学推断其口感指标和烹饪参数。

    产品信息：
    - 名称：${productInfo.name}
    - 品种：${productInfo.variety}
    - 产地：${productInfo.origin}
    - 描述：${productInfo.description}

    请给出：
    1. 软糯度评分 (0-100)
    2. 米香浓度评分 (0-100)
    3. 最佳米水比 (格式如 1:1.2)
    4. 最适合的烹饪方式ID (M001:电饭煲, M002:木桶蒸, M003:煮粥)
    5. 详细口感评分 (T001:软糯度, T002:米香浓度, T003:回甘度)
    6. 专业的商品描述 (100字以内，突出其品种特色和口感)

    要求：
    - 评分应基于品种和产地的科学常识（例如：五常稻花香通常米香极高，软糯度适中偏高）。
    - 描述应专业且吸引人。
    - 严禁包含任何 URL。
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
      description: "优质稻米，口感佳。",
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
    `[${i}] 名称:${p.name}, 品种:${p.variety?.name}, 产地:${p.origin?.province}, 描述:${p.description}`
  ).join('\n');

  const prompt = `
    作为一名高级评米师，请根据以下多款大米的信息，科学推断它们的口感指标和烹饪参数。

    待分析产品列表：
    ${productsStr}

    请为每一款大米给出：
    1. 软糯度评分 (0-100)
    2. 米香浓度评分 (0-100)
    3. 最佳米水比 (格式如 1:1.2)
    4. 最适合的烹饪方式ID (M001:电饭煲, M002:木桶蒸, M003:煮粥)
    5. 详细口感评分 (T001:软糯度, T002:米香浓度, T003:回甘度)
    6. 专业的商品描述 (100字以内，突出其品种特色和口感)

    要求：
    - 严格按照输入的顺序返回一个 JSON 数组。
    - 评分应基于品种和产地的科学常识。
    - 描述应专业且吸引人。
    - 严禁包含任何 URL。
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
      description: "优质稻米，口感佳。",
      tastes: [
        { tasteId: "T001", score: 75 },
        { tasteId: "T002", score: 70 },
        { tasteId: "T003", score: 65 }
      ]
    }));
  }
};
