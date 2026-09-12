import React, { useRef, useState } from 'react';
import type { AgentConfig, AgentId, AttachedFile } from '../types';
import { analyzeUploadedFile } from '../services/fileAnalyzer';
import { FileInspector } from './FileInspector';
import {
  Rocket,
  Image as ImageIcon,
  FileCode,
  X,
  Sparkles,
  Layers,
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
  CheckSquare,
  Square,
  UploadCloud,
  Loader2,
  Wifi
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
        const analyzed = await analyzeUploadedFile(file);
        onAddAttachedFile(analyzed);

        // If it's an image and no image is currently set for multimodal preview
        if (analyzed.imageBase64 && !imageBase64) {
          onImageChange(analyzed.imageBase64, analyzed.imageBase64);
        }

        // Auto-recommend relevant agents
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
      case 'webx': return <Globe size={15} />;
      case 'cryptobreaker': return <KeyRound size={15} />;
      case 'forensicx': return <Search size={15} />;
      case 'steghunter': return <ImageIcon size={15} />;
      case 'reveng': return <Cpu size={15} />;
      case 'pwnmaster': return <ShieldAlert size={15} />;
      case 'shadowtrace': return <Compass size={15} />;
      case 'puzzlemind': return <Puzzle size={15} />;
      case 'mobilex': return <Smartphone size={15} />;
      case 'flagassembler': return <Flag size={15} />;
    }
  };

  const specialistAgents = agents.filter(a => !a.isCoordinator);

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '0.875rem',
      padding: '1.25rem',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
      marginBottom: '1.5rem'
    }}>
      {/* Top Header Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '0.875rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileCode size={18} color="#38bdf8" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
            กล่องใส่โจทย์ CTF (Challenge Input)
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            (วางข้อความ, ซอร์สโค้ด, Hex dump, พิกัด หรืออัปโหลดไฟล์รูปภาพ)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={onOpenPresetsModal}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
          >
            <Sparkles size={13} color="#38bdf8" />
            <span>เลือกจากคลังโจทย์ตัวอย่าง</span>
          </button>

          {challengeText && (
            <button
              type="button"
              onClick={() => onChallengeTextChange('')}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
              title="ล้างข้อความ"
            >
              <RotateCcw size={13} />
              <span>ล้าง</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Textarea */}
      <div style={{ position: 'relative', marginBottom: '0.875rem' }}>
        <textarea
          value={challengeText}
          onChange={(e) => onChallengeTextChange(e.target.value)}
          placeholder={`วางรายละเอียดโจทย์ CTF ที่นี่...
ตัวอย่าง:
- ซอร์สโค้ด (PHP, Python, JavaScript, C, Smart Contract)
- ข้อความ Ciphertext (Base64, Hex, ROT13, RSA Modulus n, e, c)
- Log บันทึกเน็ตเวิร์ก PCAP / DNS queries / Syslog
- ลิงก์ URL และพารามิเตอร์ที่ต้องการเจาะระบบ
- คอนเซปต์โจทย์หรือคำใบ้จากผู้สร้างการแข่งขัน`}
          rows={6}
          style={{
            width: '100%',
            backgroundColor: '#020617',
            border: '1px solid var(--border-subtle)',
            borderRadius: '0.5rem',
            padding: '0.875rem',
            color: '#f8fafc',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-mono, monospace)',
            resize: 'vertical',
            lineHeight: 1.5,
            outline: 'none'
          }}
        />
      </div>

      {/* File Upload Dropzone Section */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragging ? '2px dashed #38bdf8' : '1px dashed var(--border-subtle)',
          backgroundColor: isDragging ? 'rgba(56, 189, 248, 0.08)' : '#020617',
          borderRadius: '0.625rem',
          padding: '0.875rem 1rem',
          marginBottom: '1rem',
          transition: 'all 0.15s ease'
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          accept="*,.pcap,.pcapng,.cap,.apk,.dex,.elf,.bin,.exe,.so,.dll,.zip,.tar,.gz,.png,.jpg,.jpeg,.gif,.bmp,.webp,.txt,.c,.cpp,.py,.js,.json,.log"
          style={{ display: 'none' }}
        />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingFile}
              className="btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
            >
              {isProcessingFile ? (
                <Loader2 size={15} className="animate-spin" color="#38bdf8" />
              ) : (
                <UploadCloud size={15} color="#38bdf8" />
              )}
              <span>{isProcessingFile ? 'กำลังวิเคราะห์ไฟล์...' : 'แนบไฟล์โจทย์ (PCAP, APK, ELF, ภาพ, ZIP)'}</span>
            </button>

            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              หรือลากไฟล์มาวางในกล่องนี้ได้เลย (Drag & Drop)
            </span>
          </div>

          {/* Image Preview Tag if uploaded */}
          {imagePreviewUrl && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.2rem 0.5rem',
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '0.375rem'
            }}>
              <img
                src={imagePreviewUrl}
                alt="Challenge Thumbnail"
                style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 500 }}>
                Multimodal Image Vision Active
              </span>
              <button
                type="button"
                onClick={() => onImageChange(undefined, undefined)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.1rem'
                }}
                title="ลบรูปภาพ"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Supported formats pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.35rem',
          marginTop: '0.625rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)'
        }}>
          <span style={{ fontSize: '0.6875rem', color: '#64748b', marginRight: '0.25rem' }}>
            รองรับ:
          </span>
          <span style={{ fontSize: '0.6875rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Wifi size={11} />
            <span>.pcap / .pcapng (Wireshark Traffic)</span>
          </span>
          <span style={{ fontSize: '0.6875rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Smartphone size={11} />
            <span>.apk / .dex (Android Package)</span>
          </span>
          <span style={{ fontSize: '0.6875rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Cpu size={11} />
            <span>.elf / .exe / .bin (Binary Executables)</span>
          </span>
          <span style={{ fontSize: '0.6875rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(192, 132, 252, 0.1)', color: '#c084fc', border: '1px solid rgba(192, 132, 252, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ImageIcon size={11} />
            <span>.png / .jpg (Steganography / Vision)</span>
          </span>
          <span style={{ fontSize: '0.6875rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
            .zip / .tar (Archive Forensics)
          </span>
        </div>
      </div>

      {/* Attached Files Inspector Component */}
      <FileInspector
        files={attachedFiles}
        onRemoveFile={onRemoveAttachedFile}
        onSelectRecommendedAgents={onSelectRecommendedAgents}
      />

      {/* Agent Selection Section */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.625rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
              เลือก Specialist Agents ที่จะส่งไปลุย ({selectedAgentIds.length}/{specialistAgents.length}):
            </span>
          </div>

          {/* Quick Select Preset Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            <button
              type="button"
              onClick={onSelectAllAgents}
              style={{
                background: selectedAgentIds.length === specialistAgents.length ? '#0284c7' : '#0f172a',
                color: selectedAgentIds.length === specialistAgents.length ? '#ffffff' : '#94a3b8',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '0.2rem 0.5rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              เลือกทั้งหมด 9 ตัว
            </button>
            <button
              type="button"
              onClick={() => onSelectCategory('Web')}
              style={{
                background: '#0f172a',
                color: '#94a3b8',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '0.2rem 0.5rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              เฉพาะ Web
            </button>
            <button
              type="button"
              onClick={() => onSelectCategory('Crypto')}
              style={{
                background: '#0f172a',
                color: '#94a3b8',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '0.2rem 0.5rem',
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
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '0.2rem 0.5rem',
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
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '0.2rem 0.5rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Reverse & PWN
            </button>
          </div>
        </div>

        {/* Agent Selection Chips Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
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
                  padding: '0.5rem 0.65rem',
                  borderRadius: '0.5rem',
                  border: isSelected ? `1px solid ${agent.accentColor}` : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'rgba(15, 23, 42, 0.9)' : '#020617',
                  color: isSelected ? '#ffffff' : '#64748b',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ color: isSelected ? agent.accentColor : '#64748b' }}>
                  {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div style={{ color: isSelected ? agent.accentColor : '#64748b' }}>
                  {getAgentIcon(agent.id)}
                </div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: isSelected ? '#f8fafc' : '#94a3b8' }}>
                    {agent.name}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                    {agent.category}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Submit Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        paddingTop: '0.875rem',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
          <span>* ผลลัพธ์จากทุก Agent จะถูกส่งต่อไปยัง </span>
          <strong style={{ color: '#22c55e' }}>Agent 10 (FlagAssembler)</strong>
          <span> เพื่อสังเคราะห์หา Flag โดยอัตโนมัติ</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isAnalyzing ? (
            <button
              type="button"
              onClick={onAbortAnalysis}
              className="btn-danger"
              style={{ padding: '0.625rem 1.5rem', fontSize: '0.875rem' }}
            >
              <span>หยุดการทำงาน (Abort)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onLaunchSwarm}
              disabled={selectedAgentIds.length === 0 || (!challengeText.trim() && !imageBase64 && attachedFiles.length === 0)}
              className="btn-emerald"
              style={{
                padding: '0.7rem 1.75rem',
                fontSize: '0.9375rem',
                boxShadow: (selectedAgentIds.length > 0 && (challengeText.trim() || imageBase64 || attachedFiles.length > 0))
                  ? '0 4px 20px rgba(16, 185, 129, 0.4)'
                  : 'none',
                opacity: (selectedAgentIds.length === 0 || (!challengeText.trim() && !imageBase64 && attachedFiles.length === 0)) ? 0.5 : 1,
                cursor: (selectedAgentIds.length === 0 || (!challengeText.trim() && !imageBase64 && attachedFiles.length === 0)) ? 'not-allowed' : 'pointer'
              }}
              title={
                selectedAgentIds.length === 0
                  ? 'กรุณาเลือก Agent อย่างน้อย 1 ตัว'
                  : (!challengeText.trim() && !imageBase64 && attachedFiles.length === 0)
                  ? 'กรุณาพิมพ์รายละเอียดโจทย์ หรือแนบไฟล์โจทย์ก่อนปล่อยฝูงบิน'
                  : 'กดเพื่อปล่อยฝูงบิน AI วิเคราะห์โจทย์'
              }
            >
              <Rocket size={18} />
              <span>ปล่อยฝูงบิน AI วิเคราะห์โจทย์ (Launch CTF Swarm)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
