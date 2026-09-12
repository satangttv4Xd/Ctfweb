import React, { useState } from 'react';
import type { AgentConfig, AgentId } from '../types';
import { POPULAR_MODELS } from '../data/agents';
import { GEMINI_MODELS } from '../services/gemini';
import {
  RotateCcw,
  Save,
  Check,
  Globe,
  KeyRound,
  Search,
  Image as ImageIcon,
  Cpu,
  ShieldAlert,
  Compass,
  Puzzle,
  Smartphone,
  Flag,
  FileText
} from 'lucide-react';

interface PromptManagerProps {
  agents: AgentConfig[];
  onUpdateAgent: (agentId: AgentId, updates: Partial<AgentConfig>) => void;
  onResetAgentPrompt: (agentId: AgentId) => void;
  onResetAllAgents: () => void;
}

export const PromptManager: React.FC<PromptManagerProps> = ({
  agents,
  onUpdateAgent,
  onResetAgentPrompt,
  onResetAllAgents
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId>('webx');
  const [saveToast, setSaveToast] = useState(false);

  const activeAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  const handlePromptChange = (val: string) => {
    onUpdateAgent(activeAgent.id, { prompt: val });
  };

  const handleModelChange = (model: string) => {
    onUpdateAgent(activeAgent.id, { currentModel: model });
  };

  const handleTemperatureChange = (temp: number) => {
    onUpdateAgent(activeAgent.id, { temperature: temp });
  };

  const handleMaxTokensChange = (tokens: number) => {
    onUpdateAgent(activeAgent.id, { maxTokens: tokens });
  };

  const handleSave = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const getAgentIcon = (id: AgentId) => {
    switch (id) {
      case 'webx': return <Globe size={18} />;
      case 'cryptobreaker': return <KeyRound size={18} />;
      case 'forensicx': return <Search size={18} />;
      case 'steghunter': return <ImageIcon size={18} />;
      case 'reveng': return <Cpu size={18} />;
      case 'pwnmaster': return <ShieldAlert size={18} />;
      case 'shadowtrace': return <Compass size={18} />;
      case 'puzzlemind': return <Puzzle size={18} />;
      case 'mobilex': return <Smartphone size={18} />;
      case 'flagassembler': return <Flag size={18} />;
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      gap: '1.25rem'
    }}>
      {/* Sidebar: Agent List */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '0.875rem',
        padding: '0.875rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem'
      }}>
        <div style={{ padding: '0.5rem 0.625rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
          เลือก Agent ที่จะปรับแต่ง
        </div>

        {agents.map(agent => {
          const isSelected = agent.id === selectedAgentId;
          const isModified = agent.prompt !== agent.defaultPrompt || agent.currentModel !== agent.recommendedModel;

          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => setSelectedAgentId(agent.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem 0.75rem',
                borderRadius: '0.5rem',
                border: isSelected ? `1px solid ${agent.accentColor}` : '1px solid transparent',
                backgroundColor: isSelected ? 'rgba(15, 23, 42, 0.95)' : 'transparent',
                color: isSelected ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative'
              }}
            >
              <div style={{ color: isSelected ? agent.accentColor : '#64748b' }}>
                {getAgentIcon(agent.id)}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: isSelected ? '#f8fafc' : '#cbd5e1' }}>
                  {agent.name}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                  {agent.category}
                </div>
              </div>
              {isModified && (
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#f59e0b'
                }} title="มีการแก้ไขจากค่าเริ่มต้น" />
              )}
            </button>
          );
        })}

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            onClick={onResetAllAgents}
            className="btn-secondary"
            style={{ width: '100%', fontSize: '0.75rem', padding: '0.45rem' }}
          >
            <RotateCcw size={13} />
            <span>คืนค่าเริ่มต้นทุก Agent</span>
          </button>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '0.875rem',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        {/* Header of Active Agent */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: `${activeAgent.accentColor}20`,
              color: activeAgent.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${activeAgent.accentColor}40`
            }}>
              {getAgentIcon(activeAgent.id)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                  {activeAgent.name}
                </h3>
                <span className="badge" style={{ backgroundColor: `${activeAgent.accentColor}20`, color: activeAgent.accentColor }}>
                  {activeAgent.category}
                </span>
                {activeAgent.isCoordinator && (
                  <span className="badge badge-emerald">
                    Coordinator Agent
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                {activeAgent.thaiName}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => onResetAgentPrompt(activeAgent.id)}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.45rem 0.75rem' }}
              title="คืนค่า System Prompt เป็นค่าดั้งเดิม"
            >
              <RotateCcw size={13} />
              <span>คืนค่าเดิม</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary"
              style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem' }}
            >
              {saveToast ? <Check size={13} /> : <Save size={13} />}
              <span>{saveToast ? 'บันทึกแล้ว!' : 'บันทึก'}</span>
            </button>
          </div>
        </div>

        {/* Model Selection Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          padding: '1rem',
          backgroundColor: '#020617',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.35rem' }}>
              โมเดลที่ใช้งาน (Gemini หรือ OpenRouter Model ID)
            </label>
            <select
              value={activeAgent.currentModel}
              onChange={(e) => handleModelChange(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0b1120',
                border: '1px solid var(--border-subtle)',
                borderRadius: '0.375rem',
                padding: '0.5rem',
                color: '#f8fafc',
                fontSize: '0.8125rem',
                outline: 'none',
                marginBottom: '0.35rem'
              }}
            >
              <optgroup label="⚡ Google Gemini API">
                {GEMINI_MODELS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.note})
                  </option>
                ))}
              </optgroup>
              <optgroup label="🌐 OpenRouter Models">
                {POPULAR_MODELS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.id === activeAgent.recommendedModel ? '★ แนะนำ' : ''}
                  </option>
                ))}
              </optgroup>
            </select>
            <input
              type="text"
              value={activeAgent.currentModel}
              onChange={(e) => handleModelChange(e.target.value)}
              placeholder="หรือพิมพ์ชื่อ Model ID ที่ต้องการเอง เช่น provider/model-name"
              style={{
                width: '100%',
                backgroundColor: '#0b1120',
                border: '1px solid var(--border-subtle)',
                borderRadius: '0.375rem',
                padding: '0.4rem 0.5rem',
                color: '#94a3b8',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono, monospace)',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#e2e8f0', marginBottom: '0.25rem' }}>
                <span>Temperature (ความคิดสร้างสรรค์ vs ความแม่นยำ)</span>
                <strong style={{ color: '#38bdf8' }}>{activeAgent.temperature}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={activeAgent.temperature}
                onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#e2e8f0', marginBottom: '0.25rem' }}>
                <span>Max Tokens (จำนวนโทเค็นสูงสุด)</span>
                <strong style={{ color: '#38bdf8' }}>{activeAgent.maxTokens}</strong>
              </div>
              <input
                type="range"
                min="1000"
                max="8000"
                step="500"
                value={activeAgent.maxTokens}
                onChange={(e) => handleMaxTokensChange(parseInt(e.target.value, 10))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* System Prompt Textarea */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <FileText size={15} color="#38bdf8" />
              <span>System Message / Agent Instructions</span>
            </label>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {activeAgent.prompt.length} ตัวอักษร
            </span>
          </div>

          <textarea
            value={activeAgent.prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            rows={18}
            style={{
              width: '100%',
              flex: 1,
              backgroundColor: '#020617',
              border: '1px solid var(--border-subtle)',
              borderRadius: '0.5rem',
              padding: '0.875rem',
              color: '#f8fafc',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-mono, monospace)',
              lineHeight: 1.5,
              resize: 'vertical',
              outline: 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
};
