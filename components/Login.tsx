
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types.ts';
import { 
  Sprout, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Award, 
  Users, 
  Zap, 
  BookOpen, 
  ChefHat,
  Globe,
  Star,
  Bell,
  CheckCircle2,
  Info
} from 'lucide-react';

interface LoginProps {
  onLogin: (role: UserRole) => void;
  onOpenAuth: (mode: 'login' | 'register', role: 'User' | 'Admin') => void;
}

const FeatureCard: React.FC<{ icon: any; title: string; desc: string; color: string }> = ({ icon: Icon, title, desc, color }) => (
  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 border border-white/20 backdrop-blur-sm hover:bg-white transition-all duration-300 group">
    <div className={`p-2.5 rounded-xl ${color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h3 className="text-sm font-black text-gray-800 mb-1">{title}</h3>
      <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

const KnowledgeCard: React.FC<{ icon: any; title: string; content: string }> = ({ icon: Icon, title, content }) => (
  <div className="p-5 rounded-2xl bg-white/40 border border-white/20 backdrop-blur-sm hover:translate-y-[-4px] transition-all duration-300">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-emerald-600" />
      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{title}</span>
    </div>
    <p className="text-xs text-gray-600 font-bold leading-relaxed italic">“{content}”</p>
  </div>
);

const Login: React.FC<LoginProps> = ({ onLogin, onOpenAuth }) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [activeRole, setActiveRole] = useState<'User' | 'Admin'>('User');

  const tips = [
    "洗米时不要过度揉搓，以免营养流失。",
    "陈米煮饭时加入一小勺橄榄油，口感更佳。",
    "籼米适合炒饭，粳米适合煮粥 and 日常食用。",
    "煮饭前浸泡30分钟，米粒会更加晶莹饱满。",
    "新米水分足，煮饭时水可以稍微少放一点。"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const roleStyles = {
    User: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      activeText: 'text-emerald-700',
      btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
      label: '普通用户',
      desc: '支持个性化搜索与菜肴图片分析推荐，为您匹配最佳口感。'
    },
    Admin: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      activeText: 'text-amber-700',
      btn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
      label: '系统管理员',
      desc: '全系统数据监控，用户权限管理，确保平台运营安全稳定。'
    }
  };

  const style = roleStyles[activeRole];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6 lg:p-12 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] ${style.bg} rounded-full blur-3xl opacity-50 transition-colors duration-700`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] ${style.bg} rounded-full blur-3xl opacity-50 transition-colors duration-700`}></div>

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* 左侧：新米倒计时与识米技巧 (Hidden on mobile/tablet) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-8 animate-in slide-in-from-left-8 duration-700">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">新米上市倒计时</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Rice Harvest Season</p>
          </div>
          
          <div className="p-6 rounded-[32px] bg-amber-50 border border-amber-100 shadow-xl shadow-amber-100/50 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-200/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500 rounded-xl text-white shadow-lg">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">2026 采收季</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-amber-600 tabular-nums tracking-tighter">
                {Math.max(0, Math.ceil((new Date('2026-10-01').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
              </span>
              <span className="text-lg font-black text-amber-800/60">天</span>
            </div>
            <p className="text-[11px] font-bold text-amber-700/60 mt-4 leading-relaxed">
              预计 10 月 1 日开启全国新米采收季，敬请期待那一抹稻香。
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black text-gray-800">识米小技巧</h3>
            </div>
            <div className="space-y-4">
              {[
                { title: '看腹白', desc: '米粒腹部不透明白斑越少，品质通常越佳。', color: 'bg-emerald-500' },
                { title: '闻香气', desc: '抓一把米哈气，新鲜米有清淡稻草香。', color: 'bg-blue-500' },
                { title: '观硬度', desc: '硬度高的米蛋白质含量高，口感更筋道。', color: 'bg-amber-500' }
              ].map((tip, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className={`w-1 h-12 rounded-full ${tip.color} opacity-20 group-hover:opacity-100 transition-opacity`}></div>
                  <div>
                    <h4 className="text-xs font-black text-gray-800 mb-1">{tip.title}</h4>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 中间：登录卡片 */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-100 p-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
              <div className={`inline-flex items-center justify-center p-4 ${style.bg} rounded-3xl mb-6 transition-colors duration-500 shadow-inner`}>
                <Sprout className={`h-10 w-10 ${style.text} transition-colors duration-500`} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">稻米个性化推荐</h1>
              <p className="text-[11px] text-gray-400 mt-2 font-black uppercase tracking-[0.3em]">Smart Rice Portal</p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100/80 rounded-2xl mb-10">
              {(['User', 'Admin'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`py-3 px-1 rounded-xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1.5 ${
                    activeRole === role 
                      ? 'bg-white shadow-lg ' + roleStyles[role].activeText
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {role === 'User' ? <User className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  {roleStyles[role].label}
                </button>
              ))}
            </div>

            <div className="space-y-8">
              <div className={`p-5 rounded-3xl text-[12px] leading-relaxed border transition-all duration-500 ${style.bg} ${style.activeText} border-opacity-50 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  {activeRole === 'User' ? <User className="w-12 h-12" /> : <ShieldCheck className="w-12 h-12" />}
                </div>
                <p className="font-black mb-2 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" /> 功能描述：
                </p>
                <p className="font-bold opacity-90">
                  {style.desc}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-200 border-opacity-20 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-60">{activeRole === 'Admin' ? '受限访问' : '开放注册'}</span>
                    <span className="font-black">{activeRole === 'Admin' ? '请联系后台' : '请先登录'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => onOpenAuth('login', activeRole)}
                  className={`w-full text-white py-5 rounded-2xl font-black transition-all flex justify-center items-center gap-3 shadow-xl active:scale-[0.97] text-sm uppercase tracking-widest ${style.btn}`}
                >
                  账户登录
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                {activeRole !== 'Admin' && (
                  <button
                    onClick={() => onOpenAuth('register', activeRole)}
                    className={`w-full bg-white border-2 border-gray-100 text-gray-600 py-5 rounded-2xl font-black hover:bg-gray-50 hover:border-${style.text.split('-')[1]}-100 hover:${style.text} transition-all flex justify-center items-center gap-2 active:scale-[0.97] text-sm uppercase tracking-widest`}
                  >
                    注册新账号
                  </button>
                )}
              </div>
              
              <div className="text-center">
                <button onClick={() => onLogin('user')} className="group text-[12px] text-gray-400 hover:text-emerald-600 transition-all font-black uppercase tracking-widest">
                    以游客身份继续访问 
                    <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：稻米小百科 (Hidden on mobile/tablet) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 animate-in slide-in-from-right-8 duration-700">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">稻米小百科</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Rice Encyclopedia</p>
          </div>

          <KnowledgeCard 
            icon={ChefHat} 
            title="烹饪秘籍" 
            content={tips[tipIndex]} 
          />

          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">今日科普</span>
            </div>
            <h4 className="text-sm font-black text-gray-800">什么是“回甘”？</h4>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
              优质稻米在咀嚼过程中，淀粉在唾液淀粉酶的作用下分解为麦芽糖，产生的持久清甜感即为“回甘”。
            </p>
            <div className="pt-2">
              <button className="text-[10px] font-black text-emerald-600 hover:underline">了解更多知识点</button>
            </div>
          </div>

          <div className="relative group overflow-hidden rounded-3xl aspect-square">
            <img 
              src="https://picsum.photos/seed/rice-field/400/400" 
              alt="Rice Field" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">产地直击</span>
              <h4 className="text-white font-black text-sm">探访五常核心产区</h4>
              <p className="text-[10px] text-white/70 font-medium mt-1">了解每一粒好米背后的故事</p>
            </div>
          </div>
        </div>

      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-gray-300 font-black uppercase tracking-[0.3em]">
          Computer Science & Technology · Graduation Project
      </div>
    </div>
  );
};

export default Login;
