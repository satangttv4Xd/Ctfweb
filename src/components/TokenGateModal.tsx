import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldAlert, CheckCircle, Terminal, ArrowRight, Clipboard } from 'lucide-react';
import { verifyToken, saveAuthToken } from '../config/tokenConfig';

interface TokenGateModalProps {
  onSuccess: () => void;
}

export const TokenGateModal: React.FC<TokenGateModalProps> = ({ onSuccess }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = tokenInput.trim();
    if (!trimmed) {
      setError('โปรดระบุ Static Token ก่อนเข้าใช้งานระบบ');
      return;
    }

    if (verifyToken(trimmed)) {
      saveAuthToken(trimmed);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 600);
    } else {
      setError('Token ไม่ถูกต้อง! โปรดตรวจสอบ Static Token หรือสร้าง Token ใหม่ด้วย script gen-token');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTokenInput(text.trim());
        setError(null);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 cyber-bg bg-opacity-95 backdrop-blur-xl">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/90 shadow-2xl shadow-cyan-950/40 transition-all duration-300">
        
        {/* Top Header Banner */}
        <div className="relative border-b border-slate-800 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 p-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/20">
            <Lock className="h-7 w-7 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Access Verification
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            ระบบต้องการ <span className="font-semibold text-cyan-400">Static Token Access Key</span> ในการเข้าใช้งาน
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
              <span>ยืนยัน Token สำเร็จกำลังเข้าสู่ระบบ...</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Static Access Token
            </label>
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-3.5 text-slate-500">
                <KeyRound className="h-4 w-4 text-cyan-500/70" />
              </div>
              <input
                type={showToken ? 'text' : 'password'}
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="วาง Static Token ยาวที่นี่ (ctf_swarm_sec_...)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-10 pr-20 text-xs font-mono text-cyan-300 placeholder-slate-600 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                disabled={isSuccess}
              />
              <div className="absolute right-2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={handlePaste}
                  title="วางจาก คลิปบอร์ด"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                >
                  <Clipboard className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  title={showToken ? 'ซ่อน Token' : 'แสดง Token'}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSuccess}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-cyan-600/25 transition hover:from-cyan-500 hover:to-blue-500 active:scale-[0.99] disabled:opacity-50"
          >
            <span>{isSuccess ? 'Verified Access...' : 'ปลดล็อกเข้าใช้งานเว็บไซต์'}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        {/* Footer info box */}
        <div className="border-t border-slate-800/80 bg-slate-950/60 p-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            <span>คำสั่งสร้าง Token ใหม่ใน Terminal:</span>
          </div>
          <div className="mt-2 rounded-lg border border-slate-800 bg-slate-900 p-2 font-mono text-[11px] text-cyan-400">
            npm run gen-token
          </div>
        </div>

      </div>
    </div>
  );
};
