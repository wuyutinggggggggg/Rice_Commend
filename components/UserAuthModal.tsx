
import React, { useState } from 'react';
import { X, UserPlus, LogIn, AlertCircle, Loader2, MapPin } from 'lucide-react';

interface UserAuthModalProps {
  initialMode?: 'login' | 'register';
  initialRole: 'User' | 'Admin';
  onClose: () => void;
  onLogin: (username: string, password?: string) => Promise<void>;
  onRegister: (username: string, password?: string, role?: 'User' | 'Admin') => Promise<void>;
}

const UserAuthModal: React.FC<UserAuthModalProps> = ({ initialMode = 'login', initialRole, onClose, onLogin, onRegister }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const themeStyles = {
    Admin: { color: 'amber', label: '系统管理总台', btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200', bg: 'bg-amber-50' },
    User: { color: 'emerald', label: '用户门户', btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200', bg: 'bg-emerald-50' }
  };

  const theme = themeStyles[initialRole];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("请输入完整的账号和密码");
      return;
    }

    setError('');
    
    // 注册模式下的密码校验
    if (mode === 'register') {
      if (password.length < 6 || password.length > 13) {
        setError("密码长度需在 6 到 13 位之间");
        return;
      }
      
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasPunctuation = /[!@#$%^&*(),.?":{}|<>[\]\\/`~_+\-=]/.test(password);
      
      const typesCount = [hasLetter, hasNumber, hasPunctuation].filter(Boolean).length;
      if (typesCount < 2) {
        setError("密码需包含字母、数字、标点中的至少两种");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await onLogin(username, password);
      } else {
        await onRegister(username, password, initialRole);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "过程中发生错误，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`px-6 py-5 border-b border-gray-100 flex justify-between items-center ${theme.bg}`}>
          <div className="flex flex-col">
            <h3 className="font-bold text-gray-900 leading-tight">
              {mode === 'login' ? '账户登录' : '新账户注册'}
            </h3>
            <span className={`text-[10px] font-black uppercase tracking-widest mt-0.5 text-${theme.color}-600`}>
                {theme.label}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors bg-white/50 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">用户名</label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
              placeholder="请输入您的账号"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">密码</label>
            <input
              type="password"
              required
              disabled={isSubmitting}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
              placeholder="请输入您的密码"
            />
            {mode === 'register' && (
              <p className="mt-1.5 text-[10px] text-gray-400 font-medium leading-relaxed">
                要求 6~13 位，包含字母、数字、标点中的至少两种
              </p>
            )}
          </div>



          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100 animate-in shake duration-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white py-4 rounded-2xl font-bold transition-all flex justify-center items-center gap-2 shadow-xl active:scale-95 disabled:opacity-70 ${theme.btn}`}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" /> 确认登录
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> 立即注册
              </>
            )}
          </button>

          {initialRole !== 'Admin' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setError('');
                  }}
                  className={`text-xs font-bold transition-colors text-${theme.color}-600 hover:text-${theme.color}-700`}
                >
                  {mode === 'login' ? '还没有账号？前往注册' : '已有账号？前往登录'}
                </button>
              </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UserAuthModal;
