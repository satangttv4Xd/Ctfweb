import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
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
      }, 500);
    } else {
      setError('Token ไม่ถูกต้อง! โปรดตรวจสอบ Static Token หรือสร้าง Token ใหม่ด้วย npm run gen-token:satang');
    }
  };

  return (
    <div className="cyber-bg" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundColor: 'rgba(2, 6, 23, 0.95)',
      backdropFilter: 'blur(16px)'
    }}>
      <div style={{
        backgroundColor: '#0b1120',
        border: '1px solid #1e293b',
        borderRadius: '1rem',
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(2, 132, 199, 0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header Banner */}
        <div style={{
          padding: '1.75rem 1.5rem',
          borderBottom: '1px solid #1e293b',
          textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(11, 17, 32, 0.9) 100%)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)'
          }}>
            <Lock size={28} color="#38bdf8" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
            Access Verification
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.375rem', marginBottom: 0 }}>
            กรุณากรอก <span style={{ color: '#38bdf8', fontWeight: 600 }}>Static Access Token</span> เพื่อเข้าสู่ระบบ
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} autoComplete="off" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.875rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fda4af',
              fontSize: '0.8125rem',
              lineHeight: 1.4
            }}>
              <ShieldAlert size={18} color="#f43f5e" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#6ee7b7',
              fontSize: '0.8125rem'
            }}>
              <CheckCircle2 size={18} color="#10b981" />
              <span>ยืนยัน Token สำเร็จ กำลังเข้าสู่ระบบ...</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1' }}>
              Static Access Token
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: '0.875rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <KeyRound size={16} color="#0284c7" />
              </div>
              
              <input
                type="text"
                name="static_access_token_no_autofill"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-1p-ignore="true"
                data-lpignore="true"
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="วาง Static Token ยาวที่นี่ (satang_...)"
                style={{
                  width: '100%',
                  padding: '0.75rem 5rem 0.75rem 2.6rem',
                  borderRadius: '0.75rem',
                  backgroundColor: '#020617',
                  border: '1px solid #334155',
                  color: '#38bdf8',
                  fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                  fontSize: '0.8125rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  WebkitTextSecurity: showToken ? 'none' : 'disc'
                } as React.CSSProperties}
                disabled={isSuccess}
              />

              <div style={{ position: 'absolute', right: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  title={showToken ? 'ซ่อน Token' : 'แสดง Token'}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '0.375rem',
                    borderRadius: '0.375rem',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSuccess}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}
          >
            <span>{isSuccess ? 'Verified Access...' : 'ปลดล็อกเข้าใช้งานระบบ'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

      </div>
    </div>
  );
};
