import React, { useRef, useState } from 'react';
import type { AgentConfig, AgentId, AttachedFile } from '../types';
import { analyzeUploadedFile } from '../services/fileAnalyzer';
import { FileInspector } from './FileInspector';
import {
  Rocket,
  ImageIcon,
  FileCode,
  X,
  Sparkles,
  Globe,
  KeyRound,
  Search,
  Cpu,
  ShieldAlert,
  Compass,
  Puzzle,
  Smartphone,
  Flag,
  RotateCcw,
  UploadCloud,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface ChallengeInputProps {
  challengeText: string;
  onChallengeTextChange: (text: string) => void;
  imageBase64?: string;
  onImageChange: (base64?: string, previewUrl?: string) => void;
  imagePreviewUrl?: string;
  attachedFiles: AttachedFile[];
  onAddAttachedFile: (file: AttachedFile) => void;
  onRemoveAttachedFile: (fileId: string) => void;
  agents: AgentConfig[];
  selectedAgentIds: AgentId[];
  onToggleAgent: (id: AgentId) => void;
  onSelectAllAgents: () => void;
  onSelectCategory: (category: string) => void;
  onSelectRecommendedAgents?: (agentIds: AgentId[]) => void;
  onLaunchSwarm: () => void;
  isAnalyzing: boolean;
  onAbortAnalysis: () => void;
  onOpenPresetsModal: () => void;
}

export const ChallengeInput: React.FC<ChallengeInputProps> = ({
  challengeText,
  onChallengeTextChange,
  imageBase64,
  onImageChange,
  imagePreviewUrl,
  attachedFiles,
  onAddAttachedFile,
  onRemoveAttachedFile,
  agents,
  selectedAgentIds,
  onToggleAgent,
  onSelectAllAgents,
  onSelectCategory,
  onSelectRecommendedAgents,
  onLaunchSwarm,
  isAnalyzing,
  onAbortAnalysis,
  onOpenPresetsModal
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessingFile(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const analyzed = await analyzeUploadedFile(file, { challengeText });
        onAddAttachedFile(analyzed);

        if (analyzed.imageBase64 && !imageBase64) {
          onImageChange(analyzed.imageBase64, analyzed.imageBase64);
        }

        if (analyzed.recommendedAgentIds.length > 0 && onSelectRecommendedAgents) {
          onSelectRecommendedAgents(analyzed.recommendedAgentIds);
        }
      }
    } catch (err) {
      console.error('Failed to parse file:', err);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const getAgentIcon = (id: AgentId) => {
    switch (id) {
      case 'webx': return <Globe size={14} />;
      case 'cryptobreaker': return <KeyRound size={14} />;
      case 'forensicx': return <Search size={14} />;
      case 'steghunter': return <ImageIcon size={14} />;
      case 'reveng': return <Cpu size={14} />;
      case 'pwnmaster': return <ShieldAlert size={14} />;
      case 'shadowtrace': return <Compass size={14} />;
      case 'puzzlemind': return <Puzzle size={14} />;
      case 'mobilex': return <Smartphone size={14} />;
      case 'flagassembler': return <Flag size={14} />;
    }
  };

  const specialistAgents = agents.filter(a => !a.isCoordinator);
  const isReadyToLaunch = selectedAgentIds.length > 0 && (challengeText.trim().length > 0 || imageBase64 || attachedFiles.length > 0);

  return (
    <div style={{
      backgroundColor: '#0b1120',
      border: '1px solid #1e293b',
      borderRadius: '1rem',
      padding: '1.25rem 1.5rem',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      marginBottom: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* 1. Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileCode size={18} color="#38bdf8" />
          </div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            รายละเอียดโจทย์ CTF
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={onOpenPresetsModal}
            className="btn-secondary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
          >
            <Sparkles size={14} color="#38bdf8" />
            <span>โจทย์ตัวอย่าง</span>
          </button>

          {challengeText && (
            <button
              type="button"
              onClick={() => onChallengeTextChange('')}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem', color: '#94a3b8' }}
              title="ล้างข้อความ"
            >
              <RotateCcw size={14} />
              <span>ล้าง</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Clean Input & Drag-Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          borderRadius: '0.75rem',
          border: isDragging ? '2px dashed #38bdf8' : '1px solid #334155',
          backgroundColor: isDragging ? 'rgba(56, 189, 248, 0.08)' : '#020617',
          transition: 'all 0.15s ease',
          overflow: 'hidden'
        }}
      >
        <textarea
          value={challengeText}
          onChange={(e) => onChallengeTextChange(e.target.value)}
          placeholder="วางรายละเอียดโจทย์ CTF ที่นี่ (ซอร์สโค้ด, Ciphertext, Log, URL หรือลากวางไฟล์)..."
          rows={4}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '1rem',
            color: '#f8fafc',
            fontSize: '0.875rem',
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            resize: 'vertical',
            lineHeight: 1.5,
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />

        {/* Upload Action Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.625rem 1rem',
          borderTop: '1px solid #1e293b',
          backgroundColor: 'rgba(15, 23, 42, 0.6)'
        }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="*,.pcap,.pcapng,.cap,.apk,.dex,.elf,.bin,.exe,.so,.dll,.zip,.tar,.gz,.png,.jpg,.jpeg,.gif,.bmp,.webp,.txt,.c,.cpp,.py,.js,.json,.log"
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingFile}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
            >
              {isProcessingFile ? (
                <Loader2 size={14} className="animate-spin" color="#38bdf8" />
              ) : (
                <UploadCloud size={14} color="#38bdf8" />
              )}
              <span>{isProcessingFile ? 'กำลังอ่านไฟล์...' : 'แนบไฟล์ (PCAP, APK, ELF, ภาพ, ZIP)'}</span>
            </button>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>หรือ Drag & Drop ลากไฟล์วางที่นี่</span>
          </div>

          {imagePreviewUrl && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.2rem 0.5rem',
              backgroundColor: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '0.375rem'
            }}>
              <img
                src={imagePreviewUrl}
                alt="Preview"
                style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 500 }}>Multimodal Image</span>
              <button
                type="button"
                onClick={() => onImageChange(undefined, undefined)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Attached Files Inspector Component */}
      <FileInspector
        files={attachedFiles}
        onRemoveFile={onRemoveAttachedFile}
        onSelectRecommendedAgents={onSelectRecommendedAgents}
      />

      {/* 3. Agent Selection Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
            เลือก Specialist Agents ({selectedAgentIds.length}/{specialistAgents.length})
          </div>

          {/* Quick Select Preset Category Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            <button
              type="button"
              onClick={onSelectAllAgents}
              style={{
                background: selectedAgentIds.length === specialistAgents.length ? '#0284c7' : '#0f172a',
                color: selectedAgentIds.length === specialistAgents.length ? '#ffffff' : '#94a3b8',
                border: '1px solid #1e293b',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              ทั้งหมด (9)
            </button>
            <button
              type="button"
              onClick={() => onSelectCategory('Web')}
              style={{
                background: '#0f172a',
                color: '#94a3b8',
                border: '1px solid #1e293b',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Web
            </button>
            <button
              type="button"
              onClick={() => onSelectCategory('Crypto')}
              style={{
                background: '#0f172a',
                color: '#94a3b8',
                border: '1px solid #1e293b',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Crypto & Misc
            </button>
            <button
              type="button"
              onClick={() => onSelectCategory('Stego')}
              style={{
                background: '#0f172a',
                color: '#94a3b8',
                border: '1px solid #1e293b',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Stego & Forensics
            </button>
            <button
              type="button"
              onClick={() => onSelectCategory('Binary')}
              style={{
                background: '#0f172a',
                color: '#94a3b8',
                border: '1px solid #1e293b',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Reverse & PWN
            </button>
          </div>
        </div>

        {/* Agent Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: '0.5rem'
        }}>
          {specialistAgents.map((agent) => {
            const isSelected = selectedAgentIds.includes(agent.id);
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => onToggleAgent(agent.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: isSelected ? `1px solid ${agent.accentColor}` : '1px solid #1e293b',
                  backgroundColor: isSelected ? 'rgba(15, 23, 42, 0.9)' : '#020617',
                  color: isSelected ? '#ffffff' : '#64748b',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ color: isSelected ? agent.accentColor : '#64748b', display: 'flex', alignItems: 'center' }}>
                  {getAgentIcon(agent.id)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: isSelected ? '#f8fafc' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {agent.name}
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 size={14} color={agent.accentColor} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Footer Submit Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid #1e293b'
      }}>
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
          <span>* ผลลัพธ์จะถูกส่งต่อไปยัง </span>
          <strong style={{ color: '#10b981' }}>FlagAssembler</strong>
          <span> เพื่อรวมคำตอบหา Flag อัตโนมัติ</span>
        </div>

        {isAnalyzing ? (
          <button
            type="button"
            onClick={onAbortAnalysis}
            className="btn-danger"
            style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
          >
            <span>หยุดการทำงาน (Abort)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onLaunchSwarm}
            disabled={!isReadyToLaunch}
            className="btn-emerald"
            style={{
              padding: '0.65rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: isReadyToLaunch ? 1 : 0.5,
              cursor: isReadyToLaunch ? 'pointer' : 'not-allowed'
            }}
          >
            <Rocket size={16} />
            <span>ปล่อยฝูงบิน AI วิเคราะห์โจทย์</span>
          </button>
        )}
      </div>
    </div>
  );
};
