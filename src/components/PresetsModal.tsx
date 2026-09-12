import React from 'react';
import type { ChallengePreset } from '../types';
import { CTF_PRESETS } from '../data/presets';
import { X, Sparkles, Database } from 'lucide-react';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: ChallengePreset) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset
}) => {
  if (!isOpen) return null;

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
        maxHeight: '85vh',
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
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              <Database size={18} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                คลังโจทย์ CTF ตัวอย่าง (Preset Challenges)
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                เลือกโจทย์ตัวอย่างเพื่อทดสอบศักยภาพการวิเคราะห์ของ Swarm AI ได้ทันที
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

        {/* List of Presets */}
        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1rem'
        }}>
          {CTF_PRESETS.map((preset) => (
            <div
              key={preset.id}
              style={{
                backgroundColor: '#020617',
                border: '1px solid var(--border-subtle)',
                borderRadius: '0.75rem',
                padding: '1.125rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0284c7';
                e.currentTarget.style.backgroundColor = '#0b1120';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.backgroundColor = '#020617';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="badge badge-cyan">
                    {preset.category}
                  </span>
                  <span style={{
                    fontSize: '0.6875rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    fontWeight: 600,
                    backgroundColor: preset.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: preset.difficulty === 'Easy' ? '#34d399' : '#fbbf24'
                  }}>
                    {preset.difficulty}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.35rem' }}>
                  {preset.titleThai}
                </h4>

                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.4, marginBottom: '0.875rem' }}>
                  {preset.descriptionThai}
                </p>

                <div style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.6875rem',
                  color: '#64748b',
                  marginBottom: '1rem',
                  fontFamily: 'var(--font-mono, monospace)'
                }}>
                  Agent แนะนำ: {preset.suggestedAgentIds.join(', ')}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className="btn-primary"
                style={{ width: '100%', fontSize: '0.8125rem', padding: '0.5rem' }}
              >
                <Sparkles size={14} />
                <span>โหลดโจทย์นี้เข้าสู่ระบบ</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
