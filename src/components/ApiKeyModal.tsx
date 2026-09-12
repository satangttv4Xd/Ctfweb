import React, { useState } from 'react';
import { X, Key, Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink, Loader2, ShieldCheck, Sparkles, Search } from 'lucide-react';
import type { ProviderSettings, AIProvider } from '../types';
import { testOpenRouterKey } from '../services/openrouter';
import { testGeminiKey, GEMINI_MODELS } from '../services/gemini';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProviderSettings;
  onSaveSettings: (settings: ProviderSettings) => void;
  onOpenDiscoveryModal?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onOpenDiscoveryModal
}) => {
  const [activeTab, setActiveTab] = useState<AIProvider>(settings.activeProvider || 'openrouter');
  const [activeProvider, setActiveProvider] = useState<AIProvider>(settings.activeProvider || 'openrouter');
  
  const [openRouterKey, setOpenRouterKey] = useState(settings.openRouterApiKey || settings.apiKey || '');
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [geminiModel, setGeminiModel] = useState(settings.geminiDefaultModel || 'gemini-2.5-flash');

  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    details?: string;
  }>({ status: 'idle', message: '' });

  if (!isOpen) return null;

  const handleTestOpenRouter = async () => {
    if (!openRouterKey.trim()) {
      setTestResult({ status: 'error', message: 'กรุณากรอก OpenRouter API Key ก่อนทดสอบ' });
      return;
    }
    setIsTesting(true);
    setTestResult({ status: 'idle', message: '' });
    const res = await testOpenRouterKey(openRouterKey.trim());
    setIsTesting(false);
    if (res.valid) {
      setTestResult({
        status: 'success',
        message: 'เชื่อมต่อ OpenRouter สำเร็จ!',
        details: `Key: ${res.label || 'Active'}${res.usage !== undefined ? ` | Usage: $${res.usage.toFixed(4)}` : ''}`
      });
    } else {
      setTestResult({ status: 'error', message: 'การเชื่อมต่อ OpenRouter ล้มเหลว', details: res.error });
    }
  };

  const handleTestGemini = async () => {
    if (!geminiKey.trim()) {
      setTestResult({ status: 'error', message: 'กรุณากรอก Google Gemini API Key ก่อนทดสอบ' });
      return;
    }
    setIsTesting(true);
    setTestResult({ status: 'idle', message: '' });
    const res = await testGeminiKey(geminiKey.trim());
    setIsTesting(false);
    if (res.valid) {
      setTestResult({
        status: 'success',
        message: 'เชื่อมต่อ Google Gemini API สำเร็จ!',
        details: `พร้อมใช้งาน | ตรวจพบ ${res.modelsCount || 0} โมเดลในบัญชีของคุณ`
      });
    } else {
      setTestResult({ status: 'error', message: 'การเชื่อมต่อ Google Gemini ล้มเหลว', details: res.error });
    }
  };

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      activeProvider,
      openRouterApiKey: openRouterKey.trim(),
      apiKey: openRouterKey.trim(),
      geminiApiKey: geminiKey.trim(),
      geminiDefaultModel: geminiModel
    });
    onClose();
  };

  const hasOpenRouter = Boolean(openRouterKey.trim());
  const hasGemini = Boolean(geminiKey.trim());

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(2, 6, 23, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#0b1120',
        border: '1px solid var(--border-subtle)',
        borderRadius: '1rem',
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              <Key size={18} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                ตั้งค่า AI Provider (OpenRouter & Google Gemini)
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                กำหนดคีย์เชื่อมต่อและเลือกผู้ให้บริการหลักสำหรับฝูงบิน AI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Provider Switcher Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: '#020617'
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('openrouter');
              setTestResult({ status: 'idle', message: '' });
            }}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              border: 'none',
              borderBottom: activeTab === 'openrouter' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: activeTab === 'openrouter' ? '#0b1120' : 'transparent',
              color: activeTab === 'openrouter' ? '#38bdf8' : '#64748b',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            <span>🌐 OpenRouter API</span>
            {hasOpenRouter && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('gemini');
              setTestResult({ status: 'idle', message: '' });
            }}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              border: 'none',
              borderBottom: activeTab === 'gemini' ? '2px solid #a855f7' : '2px solid transparent',
              backgroundColor: activeTab === 'gemini' ? '#0b1120' : 'transparent',
              color: activeTab === 'gemini' ? '#c084fc' : '#64748b',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
          >
            <span>⚡ Google Gemini API</span>
            {hasGemini && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />}
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* Active Provider Selector */}
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#020617',
            border: '1px solid var(--border-subtle)',
            borderRadius: '0.5rem',
            marginBottom: '1.25rem'
          }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
              ผู้ให้บริการ AI หลักที่ใช้งานในขณะนี้:
            </span>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.8125rem',
                color: activeProvider === 'openrouter' ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                fontWeight: activeProvider === 'openrouter' ? 600 : 400
              }}>
                <input
                  type="radio"
                  name="activeProvider"
                  checked={activeProvider === 'openrouter'}
                  onChange={() => setActiveProvider('openrouter')}
                />
                <span>OpenRouter (Claude, OpenAI, Llama)</span>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.8125rem',
                color: activeProvider === 'gemini' ? '#c084fc' : '#94a3b8',
                cursor: 'pointer',
                fontWeight: activeProvider === 'gemini' ? 600 : 400
              }}>
                <input
                  type="radio"
                  name="activeProvider"
                  checked={activeProvider === 'gemini'}
                  onChange={() => setActiveProvider('gemini')}
                />
                <span>Google Gemini (โดยตรง)</span>
              </label>
            </div>
          </div>

          {/* TAB 1: OpenRouter Config */}
          {activeTab === 'openrouter' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: '#e2e8f0',
                  marginBottom: '0.35rem'
                }}>
                  OpenRouter API Key (sk-or-v1-...)
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#020617',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '0.5rem',
                  padding: '0.25rem 0.75rem'
                }}>
                  <input
                    type={showOpenRouterKey ? 'text' : 'password'}
                    value={openRouterKey}
                    onChange={(e) => setOpenRouterKey(e.target.value)}
                    placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxx"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: '#f8fafc',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      padding: '0.5rem 0',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    {showOpenRouterKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Guide Info */}
              <div style={{
                backgroundColor: '#020617',
                borderRadius: '0.5rem',
                padding: '0.875rem 1rem',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8125rem',
                color: '#94a3b8',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0', marginBottom: '0.25rem', fontWeight: 500 }}>
                  <ShieldCheck size={16} color="#38bdf8" />
                  <span>เกี่ยวกับ OpenRouter</span>
                </div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', lineHeight: 1.5 }}>
                  เปิดให้เข้าถึง Claude 3.5/Sonnet 4, OpenAI o4-mini, DeepSeek R1, Llama 3.3 และโมเดลชั้นนำมากมายผ่าน API เดียว
                </p>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: '#38bdf8',
                    textDecoration: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                >
                  <span>รับ OpenRouter Key ที่ openrouter.ai</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: Google Gemini Config */}
          {activeTab === 'gemini' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: '#e2e8f0',
                  marginBottom: '0.35rem'
                }}>
                  Google Gemini API Key (AIzaSy...)
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#020617',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '0.5rem',
                  padding: '0.25rem 0.75rem'
                }}>
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: '#f8fafc',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      padding: '0.5rem 0',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Default Gemini Model Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: '#e2e8f0',
                  marginBottom: '0.35rem'
                }}>
                  โมเดล Gemini เริ่มต้น (Default Model)
                </label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#020617',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    color: '#f8fafc',
                    fontSize: '0.8125rem',
                    outline: 'none'
                  }}
                >
                  {GEMINI_MODELS.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.note})
                    </option>
                  ))}
                </select>
              </div>

              {/* Guide Info */}
              <div style={{
                backgroundColor: '#020617',
                borderRadius: '0.5rem',
                padding: '0.875rem 1rem',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8125rem',
                color: '#94a3b8',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0', marginBottom: '0.25rem', fontWeight: 500 }}>
                  <Sparkles size={16} color="#a855f7" />
                  <span>เกี่ยวกับ Google AI Studio</span>
                </div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', lineHeight: 1.5 }}>
                  รับ API Key ฟรีพร้อมโควตาฟรีสูงจาก Google AI Studio รองรับการวิเคราะห์ภาพ (Multimodal), ตรรกะโค้ด และบริบทขนาด 1,000,000 tokens
                </p>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: '#c084fc',
                    textDecoration: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                >
                  <span>รับ Gemini API Key ฟรีที่ Google AI Studio</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          {/* Test connection result notice */}
          {testResult.status !== 'idle' && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: testResult.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              border: testResult.status === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.625rem'
            }}>
              {testResult.status === 'success' ? (
                <CheckCircle2 size={18} color="#34d399" style={{ marginTop: '2px', flexShrink: 0 }} />
              ) : (
                <AlertCircle size={18} color="#fb7185" style={{ marginTop: '2px', flexShrink: 0 }} />
              )}
              <div style={{ fontSize: '0.8125rem' }}>
                <div style={{ fontWeight: 600, color: testResult.status === 'success' ? '#34d399' : '#fb7185' }}>
                  {testResult.message}
                </div>
                {testResult.details && (
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {testResult.details}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={activeTab === 'openrouter' ? handleTestOpenRouter : handleTestGemini}
              disabled={isTesting}
              className="btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}
            >
              {isTesting && <Loader2 size={14} className="animate-spin" />}
              <span>{isTesting ? 'กำลังทดสอบ...' : `ทดสอบ ${activeTab === 'openrouter' ? 'OpenRouter' : 'Gemini'}`}</span>
            </button>

            {onOpenDiscoveryModal && (
              <button
                type="button"
                onClick={() => {
                  onSaveSettings({
                    ...settings,
                    activeProvider,
                    openRouterApiKey: openRouterKey.trim(),
                    apiKey: openRouterKey.trim(),
                    geminiApiKey: geminiKey.trim(),
                    geminiDefaultModel: geminiModel
                  });
                  onClose();
                  onOpenDiscoveryModal();
                }}
                className="btn-secondary"
                style={{
                  fontSize: '0.8125rem',
                  padding: '0.5rem 0.875rem',
                  color: '#38bdf8',
                  borderColor: 'rgba(56, 189, 248, 0.4)',
                  backgroundColor: 'rgba(56, 189, 248, 0.08)'
                }}
                title="สแกนและค้นหาโมเดลที่ใช้งานได้จริงในบัญชีของคุณอัตโนมัติ"
              >
                <Search size={14} />
                <span>ค้นหาโมเดลอัตโนมัติ</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary"
              style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
