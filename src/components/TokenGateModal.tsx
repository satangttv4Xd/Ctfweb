import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, ShieldAlert, CheckCircle2 } from 'lucide-react';
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
      setError('กรุณากรอก Access Token');
      return;
    }

    if (verifyToken(trimmed)) {
      saveAuthToken(trimmed);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 400);
    } else {
      setError('Token ไม่ถูกต้อง โปรดตรวจสอบอีกครั้ง');
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
      padding: '1.25rem',
      backgroundColor: 'rgba(2, 6, 23, 0.95)',
      backdropFilter: 'blur(16px)'
    }}>
      <div style={{
        backgroundColor: '#0b1120',
        border: '1px solid #1e293b',
        borderRadius: '1rem',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header Section */}
        <div style={{
          padding: '1.75rem 1.5rem 1.25rem 1.5rem',
          textAlign: 'center',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#0f172a'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.875rem auto'
          }}>
            <KeyRound size={24} color="#38bdf8" />
          </div>

          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#f8fafc',
            margin: 0
          }}>
            Access Token
          </h2>
          <p style={{
            fontSize: '0.8125rem',
            color: '#94a3b8',
            marginTop: '0.35rem',
            marginBottom: 0
          }}>
            กรอก Access Token เพื่อเข้าใช้งาน
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} autoComplete="off" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.75rem 0.875rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fda4af',
              fontSize: '0.8125rem'
            }}>
              <ShieldAlert size={16} color="#f43f5e" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.75rem 0.875rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#6ee7b7',
              fontSize: '0.8125rem'
            }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>ยืนยันสำเร็จ กำลังเข้าสู่ระบบ...</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1' }}>
              Token
            </label>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                name="token"
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
                placeholder="กรอก Token..."
                style={{
                  width: '100%',
                  padding: '0.75rem 2.5rem 0.75rem 0.875rem',
                  borderRadius: '0.5rem',
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

              <div style={{ position: 'absolute', right: '0.375rem', display: 'flex', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  title={showToken ? 'ซ่อน Token' : 'แสดง Token'}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '0.375rem',
                    borderRadius: '0.375rem',
                    color: '#64748b',
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
              padding: '0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '0.25rem'
            }}
          >
            <span>{isSuccess ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
          </button>
        </form>

      </div>
    </div>
  );
};
