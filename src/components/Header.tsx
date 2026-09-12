import React from 'react';
import { Shield, Terminal, Settings, Database, Play, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import type { OpenRouterSettings } from '../types';

interface HeaderProps {
  currentTab: 'swarm' | 'solo' | 'prompts' | 'history' | 'agent';
  onTabChange: (tab: 'swarm' | 'solo' | 'prompts' | 'history' | 'agent') => void;
  onOpenApiKeyModal: () => void;
  onOpenPresetsModal: () => void;
  onOpenDiscoveryModal: () => void;
  settings: OpenRouterSettings;
  onToggleMockMode: () => void;
  isAnalyzing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenApiKeyModal,
  onOpenPresetsModal,
  onOpenDiscoveryModal,
  settings,
  onToggleMockMode,
  isAnalyzing
}) => {
  const [agentConnected, setAgentConnected] = React.useState<boolean>(false);

  React.useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('http://localhost:7788/health', { cache: 'no-store' });
        setAgentConnected(res.ok);
      } catch {
        setAgentConnected(false);
      }
    };
    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, []);
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'rgba(2, 6, 23, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(2, 132, 199, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Shield size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#f8fafc' }}>
                CTF SWARM AI
              </span>
              <span style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '0.1rem 0.45rem',
                borderRadius: '4px',
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 600
              }}>
                10-AGENT SOC
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
              ระบบวิเคราะห์และถอดรหัสโจทย์ CTF อัจฉริยะ (OpenRouter Powered)
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Thai) */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '0.25rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => onTabChange('swarm')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.875rem',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              border: 'none',
              background: currentTab === 'swarm' ? '#0284c7' : 'transparent',
              color: currentTab === 'swarm' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Play size={15} />
            <span>แดชบอร์ด Swarm</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('solo')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.875rem',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              border: 'none',
              background: currentTab === 'solo' ? '#0284c7' : 'transparent',
              color: currentTab === 'solo' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Terminal size={15} />
            <span>โหมดเดี่ยว Solo</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('prompts')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.875rem',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              border: 'none',
              background: currentTab === 'prompts' ? '#0284c7' : 'transparent',
              color: currentTab === 'prompts' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Settings size={15} />
            <span>จัดการ Agent & Prompts</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('agent')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.875rem',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              border: 'none',
              background: currentTab === 'agent' ? '#10b981' : 'transparent',
              color: currentTab === 'agent' ? '#ffffff' : (agentConnected ? '#34d399' : '#94a3b8'),
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Terminal size={15} />
            <span>Local Python Agent</span>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: agentConnected ? '#34d399' : '#ef4444',
              display: 'inline-block'
            }} />
          </button>
        </nav>

        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {/* Preset Challenge Button */}
          <button
            type="button"
            onClick={onOpenPresetsModal}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
            title="เลือกโจทย์ CTF ตัวอย่าง"
          >
            <Database size={15} color="#38bdf8" />
            <span>โจทย์ตัวอย่าง</span>
          </button>

          {/* Simulation / Mock Mode Switch */}
          <button
            type="button"
            onClick={onToggleMockMode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: settings.mockMode ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
              background: settings.mockMode ? 'rgba(245, 158, 11, 0.12)' : '#0f172a',
              color: settings.mockMode ? '#fbbf24' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
            title={settings.mockMode ? 'โหมดจำลองสถานการณ์เปิดอยู่ (ไม่หักเครดิต OpenRouter)' : 'สลับเป็นโหมดจำลองเพื่อทดสอบโดยไม่ใช้ API Key'}
          >
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: settings.mockMode ? '#f59e0b' : '#64748b'
            }} />
            <span>{settings.mockMode ? 'โหมดจำลอง (Mock)' : 'โหมดปกติ'}</span>
          </button>

          {/* Provider Quick Switcher */}
          <button
            type="button"
            onClick={onOpenApiKeyModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '0.5rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: settings.activeProvider === 'gemini' 
                ? '1px solid rgba(168, 85, 247, 0.4)' 
                : '1px solid rgba(56, 189, 248, 0.4)',
              background: settings.activeProvider === 'gemini' 
                ? 'rgba(168, 85, 247, 0.12)' 
                : 'rgba(56, 189, 248, 0.12)',
              color: settings.activeProvider === 'gemini' ? '#c084fc' : '#38bdf8',
              transition: 'all 0.15s ease'
            }}
            title="คลิกเพื่อเปลี่ยนผู้ให้บริการ AI หรือใส่ API Key"
          >
            <span>{settings.activeProvider === 'gemini' ? '⚡ Google Gemini' : '🌐 OpenRouter'}</span>
            {((settings.activeProvider === 'gemini' && settings.geminiApiKey) || 
              (settings.activeProvider === 'openrouter' && (settings.openRouterApiKey || settings.apiKey))) ? (
              <CheckCircle2 size={13} color="#34d399" />
            ) : (
              <AlertCircle size={13} color="#fbbf24" />
            )}
          </button>

          {/* Localhost Python Agent Bridge Indicator & Download Button */}
          <div
            onClick={() => onTabChange('agent')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: agentConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: agentConnected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
              color: agentConnected ? '#34d399' : '#f87171',
              cursor: 'pointer'
            }}
            title="คลิกเพื่อไปที่หน้าจัดการ Local Python Agent"
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: agentConnected ? '#34d399' : '#ef4444'
            }} />
            <Terminal size={14} color={agentConnected ? '#34d399' : '#f87171'} />
            <span>Local Agent ({agentConnected ? 'Connected' : 'Offline'})</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTabChange('agent');
              }}
              style={{
                fontSize: '0.65rem',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                backgroundColor: '#10b981',
                color: '#020617',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
              title="ดูรายละเอียด & ดาวน์โหลดแอปตัวกลาง Windows Executable (.cmd)"
            >
              <span>ดาวน์โหลด / สถานะ</span>
            </button>
          </div>

          {/* Test Connection & Auto-Find Model Button */}
          <button
            type="button"
            onClick={onOpenDiscoveryModal}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.8rem',
              fontSize: '0.8125rem',
              borderColor: 'rgba(56, 189, 248, 0.4)',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              color: '#38bdf8'
            }}
            title="ทดสอบว่า AI ใช้ได้มั้ย และค้นหาโมเดลที่ใช้งานได้จนกว่าจะเจอ"
          >
            <Search size={14} />
            <span>ทดสอบ AI & ค้นหาโมเดล</span>
          </button>


          {isAnalyzing && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: '0.75rem',
              fontWeight: 500
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                animation: 'pulse 1s infinite'
              }} />
              <span>กำลังประมวลผล...</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
