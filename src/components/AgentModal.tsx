import React, { useState } from 'react';
import type { AgentConfig, AgentResult } from '../types';
import { X, Copy, Check, Download, Shield } from 'lucide-react';

interface AgentModalProps {
  agent: AgentConfig | null;
  result: AgentResult | null;
  onClose: () => void;
}

export const AgentModal: React.FC<AgentModalProps> = ({
  agent,
  result,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!agent) return null;

  const handleCopy = () => {
    if (result?.output) {
      navigator.clipboard.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!result?.output) return;
    const blob = new Blob([result.output], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agent.name}_Analysis_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
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
      zIndex: 50,
      padding: '1.5rem'
    }}>
      <div style={{
        backgroundColor: '#0b1120',
        border: '1px solid var(--border-subtle)',
        borderRadius: '1rem',
        maxWidth: '840px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: `${agent.accentColor}20`,
              color: agent.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${agent.accentColor}50`
            }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                  {agent.name}
                </h3>
                <span className="badge" style={{ backgroundColor: `${agent.accentColor}20`, color: agent.accentColor }}>
                  {agent.category}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                {agent.thaiName} | โมเดล: {agent.currentModel}
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

        {/* Content Body */}
        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          flex: 1
        }}>
          {result?.error ? (
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '0.5rem',
              color: '#fda4af',
              fontSize: '0.875rem'
            }}>
              <strong>ข้อผิดพลาดระหว่างวิเคราะห์:</strong>
              <p style={{ marginTop: '0.5rem', margin: 0 }}>{result.error}</p>
            </div>
          ) : result?.output ? (
            <div style={{
              backgroundColor: '#020617',
              borderRadius: '0.5rem',
              padding: '1.25rem',
              border: '1px solid var(--border-subtle)'
            }}>
              <pre style={{
                margin: 0,
                color: '#e2e8f0',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-mono, monospace)',
                lineHeight: 1.6
              }}>
                {result.output}
              </pre>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
              <p>ยังไม่มีข้อมูลผลการวิเคราะห์สำหรับ Agent นี้ในการรันครั้งล่าสุด</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.7)'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {result?.executionTimeMs ? `ประมวลผลเสร็จใน ${(result.executionTimeMs / 1000).toFixed(2)} วินาที` : ''}
          </div>

          <div style={{ display: 'flex', gap: '0.625rem' }}>
            {result?.output && (
              <>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn-secondary"
                  style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}
                >
                  {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn-secondary"
                  style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}
                >
                  <Download size={14} />
                  <span>ดาวน์โหลด (.md)</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn-primary"
              style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
