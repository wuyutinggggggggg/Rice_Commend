
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { RiceProduct } from '../types';

interface AnalysisChartProps {
  products: RiceProduct[];
}

const AnalysisChart: React.FC<AnalysisChartProps> = ({ products }) => {
  const topProducts = products.slice(0, 3);

  const getTasteScore = (
    product: RiceProduct | undefined,
    tasteIds: string[],
    indicatorNames: string[],
    fallbackToFirst: boolean = false
  ) => {
    if (!product) return 0;
    const normalizeId = (id: unknown) => {
      const str = String(id ?? '');
      const digits = str.replace(/\D/g, '');
      return digits ? Number(digits) : null;
    };

    const targetNums = tasteIds
      .map(id => normalizeId(id))
      .filter((v): v is number => Number.isFinite(v as number));

    const found = product.tastes?.find(t =>
      tasteIds.includes(String(t.tasteId)) ||
      (normalizeId(t.tasteId) != null && targetNums.includes(normalizeId(t.tasteId)!)) ||
      (t.tasteProfile?.id != null && (
        tasteIds.includes(String(t.tasteProfile.id)) ||
        (normalizeId(t.tasteProfile.id) != null && targetNums.includes(normalizeId(t.tasteProfile.id)!))
      ))
    ) || product.tastes?.find(t => {
      const name = String(t.tasteProfile?.indicatorName || '').trim();
      return indicatorNames.some(ind => name.includes(ind));
    });

    if (!found && fallbackToFirst && product.tastes && product.tastes.length > 0) {
      const fallback = product.tastes.find(t => Number.isFinite(Number(t.score))) || product.tastes[0];
      const rawFallback = Number(fallback?.score);
      if (Number.isFinite(rawFallback)) {
        const percent = rawFallback * 10;
        return Math.max(0, Math.min(100, Math.round(percent)));
      }
      return 0;
    }
    const raw = Number(found?.score);
    if (!Number.isFinite(raw)) return 0;
    const percent = raw * 10;
    return Math.max(0, Math.min(100, Math.round(percent)));
  };

  
  const chartData = [
    { subject: '软糯度', A: getTasteScore(topProducts[0], ['T001', '1', '01'], ['软糯度']) || 0, B: getTasteScore(topProducts[1], ['T001', '1', '01'], ['软糯度']) || 0, C: getTasteScore(topProducts[2], ['T001', '1', '01'], ['软糯度']) || 0, fullMark: 100 },
    { subject: '米香值', A: getTasteScore(topProducts[0], ['T002', '2', '02'], ['米香值', '米香浓度', '香气浓郁']) || 0, B: getTasteScore(topProducts[1], ['T002', '2', '02'], ['米香值', '米香浓度', '香气浓郁']) || 0, C: getTasteScore(topProducts[2], ['T002', '2', '02'], ['米香值', '米香浓度', '香气浓郁']) || 0, fullMark: 100 },
    { subject: '回甘度', A: getTasteScore(topProducts[0], ['T003', '3', '03'], ['回甘度', '甜度'], true) || 0, B: getTasteScore(topProducts[1], ['T003', '3', '03'], ['回甘度', '甜度'], true) || 0, C: getTasteScore(topProducts[2], ['T003', '3', '03'], ['回甘度', '甜度'], true) || 0, fullMark: 100 },
    { subject: '性价比', A: topProducts[0] ? Math.min(100, 1000 / topProducts[0].price) : 0, B: topProducts[1] ? Math.min(100, 1000 / topProducts[1].price) : 0, C: topProducts[2] ? Math.min(100, 1000 / topProducts[2].price) : 0, fullMark: 100 },
    { subject: '营养成分', A: 85, B: 80, C: 92, fullMark: 100 },
  ];

  console.log('[AnalysisChart] chartData', chartData, {
    sampleTastes: topProducts.map(p => p?.tastes?.slice(0, 3))
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center">
      <div className="flex-1 w-full">
         <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">多模态特征分析图</h3>
         <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                
                {topProducts.map((p, idx) => (
                    <Radar
                        key={p.id}
                        name={p.name}
                        dataKey={idx === 0 ? "A" : idx === 1 ? "B" : "C"}
                        stroke={idx === 0 ? "#059669" : idx === 1 ? "#0ea5e9" : "#d97706"}
                        strokeWidth={2}
                        fill={idx === 0 ? "#059669" : idx === 1 ? "#0ea5e9" : "#d97706"}
                        fillOpacity={0.1}
                    />
                ))}
                <Tooltip 
                    formatter={(value: any, name: any) => [value, name]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
            </RadarChart>
            </ResponsiveContainer>
         </div>
      </div>
      
      <div className="md:w-1/3 w-full mt-4 md:mt-0 md:pl-6 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0">
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">瀵规瘮浜у搧鍒楄〃</h4>
            {topProducts.map((p, idx) => (
                <div key={p.id} className="flex items-center text-xs font-medium text-gray-600">
                    <span className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${idx === 0 ? 'bg-emerald-600' : idx === 1 ? 'bg-sky-500' : 'bg-amber-500'}`}></span>
                    <span className="truncate">{p.name}</span>
                </div>
            ))}
          </div>
      </div>
    </div>
  );
};

export default AnalysisChart;



