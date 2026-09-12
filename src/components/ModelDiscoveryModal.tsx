import React, { useState, useRef } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Zap,
  Check,
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import type { ProviderSettings, AIProvider, AgentConfig } from '../types';
import { scanForWorkingModel, type ModelTestLog, type ModelDiscoveryResult } from '../services/modelDiscovery';

interface ModelDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProviderSettings;
  onSaveSettings: (settings: ProviderSettings) => void;
  agents: AgentConfig[];
  onUpdateAllAgentsModel: (newModel: string) => void;
}

export const ModelDiscoveryModal: React.FC<ModelDiscoveryModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  agents,
  onUpdateAllAgentsModel
}) => {
  const [targetProvider, setTargetProvider] = useState<AIProvider>(settings.activeProvider || 'gemini');
  const [isScanning, setIsScanning] = useState(false);
  const [currentTestingModel, setCurrentTestingModel] = useState<string>('');
  const [progressInfo, setProgressInfo] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [logs, setLogs] = useState<ModelTestLog[]>([]);
  const [discoveryResult, setDiscoveryResult] = useState<ModelDiscoveryResult | null>(null);
  const [appliedToast, setAppliedToast] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  if (!isOpen) return null;

  const currentApiKey = targetProvider === 'gemini'
    ? settings.geminiApiKey
    : (settings.openRouterApiKey || settings.apiKey || '');

  const handleStartScan = async () => {
    if (!currentApiKey || currentApiKey.trim() === '') {
      setDiscoveryResult({
        success: false,
        provider: targetProvider,
        testedCount: 0,
        logs: [],
        error: `กรุณากรอก API Key ของ ${targetProvider === 'gemini' ? 'Google Gemini' : 'OpenRouter'} ในหน้าการตั้งค่าก่อนทำการทดสอบ`
      });
      return;
    }

    setIsScanning(true);
    setLogs([]);
    setDiscoveryResult(null);
    setCurrentTestingModel('');
    setProgressInfo({ current: 0, total: 0 });

    abortControllerRef.current = new AbortController();

    const result = await scanForWorkingModel(
      targetProvider,
      currentApiKey,
      (log, currentIdx, total) => {
        setCurrentTestingModel(log.model);
        setProgressInfo({ current: currentIdx, total });
        setLogs(prev => {
          const filtered = prev.filter(l => l.model !== log.model);
          return [...filtered, log];
        });
      },
      abortControllerRef.current.signal
    );

    setDiscoveryResult(result);
    setIsScanning(false);
    setCurrentTestingModel('');
  };

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsScanning(false);
  };

  const handleApplyModel = (model: string) => {
    if (targetProvider === 'gemini') {
      onSaveSettings({
        ...settings,
        activeProvider: 'gemini',
        geminiDefaultModel: model
      });
    } else {
      onSaveSettings({
        ...settings,
        activeProvider: 'openrouter'
      });
    }

    // Apply to all specialist agents
    onUpdateAllAgentsModel(model);

    setAppliedToast(true);
    setTimeout(() => {
      setAppliedToast(false);
      onClose();
    }, 1200);
  };

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
      zIndex: 55,
      padding: '1.25rem'
    }}>
      <div style={{
        backgroundColor: '#0b1120',
        border: '1px solid var(--border-subtle)',
        borderRadius: '1rem',
        maxWidth: '640px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.7)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8'
            }}>
              <Search size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                ทดสอบการเชื่อมต่อ & ค้นหาโมเดลที่ใช้งานได้ (Model Auto-Discovery)
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                ส่งคำสั่งทดสอบจริงและสแกนค้นหาโมเดลที่ตอบกลับสำเร็จอัตโนมัติ
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
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Provider Selection */}
          <div style={{
            backgroundColor: '#020617',
            border: '1px solid var(--border-subtle)',
            borderRadius: '0.5rem',
            padding: '0.875rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                เลือกผู้ให้บริการที่ต้องการสแกน:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setTargetProvider('gemini');
                    setDiscoveryResult(null);
                    setLogs([]);
                  }}
                  disabled={isScanning}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    border: targetProvider === 'gemini' ? '1px solid #a855f7' : '1px solid var(--border-subtle)',
                    backgroundColor: targetProvider === 'gemini' ? 'rgba(168, 85, 247, 0.15)' : '#0b1120',
                    color: targetProvider === 'gemini' ? '#c084fc' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Google Gemini API
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetProvider('openrouter');
                    setDiscoveryResult(null);
                    setLogs([]);
                  }}
                  disabled={isScanning}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    border: targetProvider === 'openrouter' ? '1px solid #0284c7' : '1px solid var(--border-subtle)',
                    backgroundColor: targetProvider === 'openrouter' ? 'rgba(56, 189, 248, 0.15)' : '#0b1120',
                    color: targetProvider === 'openrouter' ? '#38bdf8' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  🌐 OpenRouter API
                </button>
              </div>
            </div>

            {/* Start / Abort Button */}
            <div>
              {isScanning ? (
                <button
                  type="button"
                  onClick={handleAbort}
                  className="btn-danger"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                >
                  <X size={15} />
                  <span>หยุดการสแกน</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartScan}
                  className="btn-emerald"
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem' }}
                >
                  <RotateCw size={15} />
                  <span>เริ่มสแกนหาโมเดลที่ใช้ได้</span>
                </button>
              )}
            </div>
          </div>

          {/* Current scanning indicator */}
          {isScanning && (
            <div style={{
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '0.5rem',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem'
            }}>
              <Loader2 size={22} className="animate-spin" color="#38bdf8" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
                  กำลังทดสอบโมเดล ({progressInfo.current}/{progressInfo.total}):
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#38bdf8', fontFamily: 'var(--font-mono, monospace)', marginTop: '0.15rem' }}>
                  {currentTestingModel}
                </div>
              </div>
            </div>
          )}

          {/* Discovery Result Banner */}
          {discoveryResult && (
            <div>
              {discoveryResult.success && discoveryResult.workingModel ? (
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      color: '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        FOUND WORKING MODEL! (ตอบกลับสำเร็จใน {discoveryResult.latencyMs}ms)
                      </div>
                      <div style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: '#f8fafc',
                        fontFamily: 'var(--font-mono, monospace)',
                        marginTop: '0.2rem'
                      }}>
                        {discoveryResult.workingModel}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyModel(discoveryResult.workingModel!)}
                    className="btn-emerald"
                    style={{ padding: '0.55rem 1.125rem', fontSize: '0.8125rem' }}
                  >
                    {appliedToast ? <Check size={16} /> : <Zap size={16} />}
                    <span>{appliedToast ? 'นำไปใช้แล้ว!' : `นำไปใช้กับทั้ง ${agents.length} Agent ทันที`}</span>
                  </button>
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  color: '#fda4af',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  <AlertTriangle size={20} color="#fb7185" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      ไม่พบโมเดลที่ตอบกลับสำเร็จ
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94a3b8' }}>
                      {discoveryResult.error}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Test Logs Stream */}
          {logs.length > 0 && (
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                บันทึกการทดสอบรายโมเดล (Test Probe Logs):
              </span>
              <div style={{
                backgroundColor: '#020617',
                border: '1px solid var(--border-subtle)',
                borderRadius: '0.5rem',
                maxHeight: '260px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                padding: '0.5rem'
              }}>
                {logs.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      backgroundColor: log.status === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                      border: log.status === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.03)',
                      fontSize: '0.8125rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                      {log.status === 'testing' && <Loader2 size={14} className="animate-spin" color="#38bdf8" />}
                      {log.status === 'success' && <CheckCircle2 size={14} color="#34d399" />}
                      {log.status === 'failed' && <X size={14} color="#fb7185" />}
                      <span style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        color: log.status === 'success' ? '#34d399' : '#e2e8f0',
                        fontWeight: log.status === 'success' ? 600 : 400
                      }}>
                        {log.model}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                      {log.latencyMs !== undefined && (
                        <span style={{ color: '#64748b' }}>{log.latencyMs}ms</span>
                      )}
                      {log.status === 'success' && (
                        <span style={{ color: '#34d399', fontWeight: 600 }}>สำเร็จ (OK)</span>
                      )}
                      {log.status === 'failed' && (
                        <span style={{ color: '#fb7185', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.error}>
                          {log.error || 'ล้มเหลว'}
                        </span>
                      )}
                      {log.status === 'success' && (
                        <button
                          type="button"
                          onClick={() => handleApplyModel(log.model)}
                          style={{
                            background: '#047857',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.2rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.6875rem'
                          }}
                        >
                          ใช้โมเดลนี้
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guide info */}
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '0.5rem',
            padding: '0.875rem 1rem',
            fontSize: '0.75rem',
            color: '#94a3b8',
            lineHeight: 1.5,
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f8fafc', fontWeight: 600, marginBottom: '0.25rem' }}>
              <ShieldCheck size={14} color="#38bdf8" />
              <span>หลักการทำงานของ Auto-Discovery:</span>
            </div>
            <span>
              ระบบจะยิง Ping Payload สั้นๆ ทดสอบโมเดลตามลำดับ (ทั้งโมเดลฟรีและโมเดลแนะนำ) จนกว่าจะพบโมเดลที่ตอบกลับสำเร็จ 
              ช่วยแก้ปัญหาการระบุ Model ID ผิด, โมเดลที่ติดโควตา หรือโมเดลที่ถูกยกเลิกการให้บริการ (Deprecated)
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(15, 23, 42, 0.7)'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '0.5rem 1.25rem' }}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
