import React, { useState } from 'react';
import type { AttachedFile, AgentId } from '../types';
import {
  FileText,
  Smartphone,
  Wifi,
  Cpu,
  Archive,
  Image as ImageIcon,
  FileCode,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  Flag,
  Info,
  Layers,
  Code,
  FolderTree,
  FileSearch,
  Terminal
} from 'lucide-react';

interface FileInspectorProps {
  files: AttachedFile[];
  onRemoveFile: (fileId: string) => void;
  onSelectRecommendedAgents?: (agentIds: AgentId[]) => void;
}

export const FileInspector: React.FC<FileInspectorProps> = ({
  files,
  onRemoveFile,
  onSelectRecommendedAgents
}) => {
  const [userExpandedFileId, setUserExpandedFileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'content' | 'strings' | 'hexdump'>('content');
  const [stringsFilter, setStringsFilter] = useState('');
  const [entriesFilter, setEntriesFilter] = useState('');
  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const [copiedRawText, setCopiedRawText] = useState(false);

  // Derived state: automatically expand first file if only 1 file is attached, unless user explicitly collapsed it
  const effectiveExpandedId = userExpandedFileId === 'none'
    ? null
    : (userExpandedFileId ?? (files.length === 1 ? files[0].id : null));

  const toggleExpand = (fileId: string) => {
    if (effectiveExpandedId === fileId) {
      setUserExpandedFileId('none');
    } else {
      setUserExpandedFileId(fileId);
    }
  };

  if (!files || files.length === 0) return null;

  const getCategoryIcon = (category: AttachedFile['category']) => {
    switch (category) {
      case 'pcap':
        return <Wifi size={18} color="#38bdf8" />;
      case 'apk':
        return <Smartphone size={18} color="#4ade80" />;
      case 'binary':
        return <Cpu size={18} color="#f43f5e" />;
      case 'archive':
        return <Archive size={18} color="#fbbf24" />;
      case 'image':
        return <ImageIcon size={18} color="#c084fc" />;
      case 'text':
        return <FileCode size={18} color="#34d399" />;
      default:
        return <FileText size={18} color="#94a3b8" />;
    }
  };

  const getCategoryColor = (category: AttachedFile['category']) => {
    switch (category) {
      case 'pcap': return { bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)', text: '#38bdf8' };
      case 'apk': return { bg: 'rgba(74, 222, 128, 0.12)', border: 'rgba(74, 222, 128, 0.3)', text: '#4ade80' };
      case 'binary': return { bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)', text: '#fb7185' };
      case 'archive': return { bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.3)', text: '#fbbf24' };
      case 'image': return { bg: 'rgba(192, 132, 252, 0.12)', border: 'rgba(192, 132, 252, 0.3)', text: '#c084fc' };
      default: return { bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8' };
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSha(id);
    setTimeout(() => setCopiedSha(null), 1500);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRawText(true);
    setTimeout(() => setCopiedRawText(false), 2000);
  };

  return (
    <div style={{
      marginBottom: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f8fafc' }}>
            ไฟล์โจทย์ที่แนบ ({files.length} รายการ)
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            — สแกนโครงสร้างและถอดรหัสพร้อมส่งเข้า AI Swarm
          </span>
        </div>
      </div>

      {files.map(file => {
        const colors = getCategoryColor(file.category);
        const isExpanded = effectiveExpandedId === file.id;
        const hasFlag = Boolean(file.flagCandidates && file.flagCandidates.length > 0);
        
        const filteredStrings = (file.extractedStrings || []).filter(s => 
          stringsFilter ? s.toLowerCase().includes(stringsFilter.toLowerCase()) : true
        );

        const filteredZipEntries = (file.details?.zipEntries || []).filter(e =>
          entriesFilter ? e.toLowerCase().includes(entriesFilter.toLowerCase()) : true
        );

        return (
          <div
            key={file.id}
            style={{
              backgroundColor: '#020617',
              border: `1px solid ${isExpanded ? colors.border : 'var(--border-subtle)'}`,
              borderRadius: '0.625rem',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              boxShadow: isExpanded ? `0 0 20px ${colors.bg}` : 'none'
            }}
          >
            {/* File Header Card */}
            <div style={{
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              background: isExpanded ? 'rgba(15, 23, 42, 0.85)' : 'rgba(2, 6, 23, 0.5)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {getCategoryIcon(file.category)}
                </div>

                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#f8fafc',
                      fontFamily: 'var(--font-mono, monospace)',
                      wordBreak: 'break-all'
                    }}>
                      {file.name}
                    </span>

                    {/* Category badge */}
                    <span style={{
                      fontSize: '0.6875rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: colors.bg,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                      fontWeight: 600
                    }}>
                      {file.categoryThai}
                    </span>

                    {/* 🚩 Flag Status Badge */}
                    {hasFlag ? (
                      <span style={{
                        fontSize: '0.6875rem',
                        padding: '0.125rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#fca5a5',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: 600
                      }}>
                        <Flag size={11} color="#ef4444" />
                        <span>พบ {file.flagCandidates?.length} Flag Candidates!</span>
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.6875rem',
                        padding: '0.125rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        color: '#38bdf8',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: 500
                      }}>
                        <Info size={11} color="#38bdf8" />
                        <span>ไม่มีข้อมูลของ Flag ในไฟล์นี้ (ไฟล์ทั่วไป)</span>
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap' }}>
                    <span>{file.sizeFormatted}</span>
                    <span>•</span>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                      SHA256: {file.sha256.slice(0, 12)}...
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(file.sha256, file.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '0 0.2rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                      title="คัดลอก SHA-256"
                    >
                      {copiedSha === file.id ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {onSelectRecommendedAgents && file.recommendedAgentIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onSelectRecommendedAgents(file.recommendedAgentIds)}
                    className="btn-secondary"
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.35rem 0.65rem',
                      gap: '0.3rem',
                      color: colors.text,
                      borderColor: colors.border
                    }}
                    title={`เลือก ${file.recommendedAgentIds.join(', ')} อัตโนมัติสำหรับไฟล์นี้`}
                  >
                    <Zap size={13} />
                    <span>เลือก Agent เหมาะสม</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => toggleExpand(file.id)}
                  className="btn-secondary"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.65rem',
                    gap: '0.35rem',
                    borderColor: isExpanded ? colors.border : undefined,
                    color: isExpanded ? colors.text : undefined
                  }}
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>{isExpanded ? 'ย่อรายละเอียด' : 'ดูโครงสร้าง & ข้อมูลข้างใน'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveFile(file.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#fb7185',
                    borderRadius: '0.375rem',
                    padding: '0.35rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="ลบไฟล์นี้"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Collapsible Forensic Details */}
            {isExpanded && (
              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: '#090d16',
                padding: '1.25rem'
              }}>
                {/* ℹ️ / 🚩 Prominent Flag Status Announcement Banner */}
                {!hasFlag ? (
                  <div style={{
                    marginBottom: '1rem',
                    padding: '0.875rem 1rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)'
                  }}>
                    <div style={{
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '6px',
                      padding: '0.35rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Info size={18} color="#38bdf8" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f8fafc' }}>
                        ℹ️ ไม่มีข้อมูลของ Flag ในไฟล์นี้ (ไฟล์ทั่วไป หรือ Flag ซ่อนอยู่ในโค้ด/Logic)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', lineHeight: 1.5 }}>
                        จากการสแกนสตริงก์เบื้องต้น ไม่พบรูปแบบสตริงก์ Flag มาตรฐาน เช่น <code style={{ color: '#38bdf8' }}>flag&#123;...&#125;</code> ในไฟล์นี้โดยตรง
                        <br />
                        👉 <strong>ระบบได้ดึงข้อมูลโครงสร้างและเนื้อหาทั้งหมดภายในไฟล์ออกมาแสดงด้านล่าง เพื่อให้คุณและ AI ตรวจสอบ:</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    marginBottom: '1rem',
                    padding: '0.875rem 1rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '0.5rem',
                    boxShadow: '0 2px 10px rgba(239, 68, 68, 0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fca5a5', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      <Flag size={16} color="#ef4444" />
                      <span>🚩 ตรวจพบสตริงก์ที่ตรงกับรูปแบบ Flag ในไฟล์ ({file.flagCandidates?.length} รายการ):</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {file.flagCandidates?.map((flagCandidate, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: '#020617',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '4px'
                          }}
                        >
                          <span style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            color: '#f87171',
                            fontSize: '0.8125rem',
                            fontWeight: 700
                          }}>
                            {flagCandidate}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(flagCandidate, `flag_${i}`)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: 0
                            }}
                            title="คัดลอก Flag"
                          >
                            {copiedSha === `flag_${i}` ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detail Tabs Navigation */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.5rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('content')}
                    style={{
                      background: activeTab === 'content' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      border: activeTab === 'content' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                      color: activeTab === 'content' ? '#38bdf8' : '#94a3b8',
                      borderRadius: '0.375rem',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Code size={13} />
                    <span>📄 ข้อมูลและเนื้อหาภายในไฟล์</span>
                    {file.rawText && (
                      <span style={{ fontSize: '0.6875rem', padding: '0.05rem 0.35rem', borderRadius: '9999px', backgroundColor: '#0284c7', color: '#fff' }}>
                        ข้อความ
                      </span>
                    )}
                    {file.category === 'apk' && (
                      <span style={{ fontSize: '0.6875rem', padding: '0.05rem 0.35rem', borderRadius: '9999px', backgroundColor: '#16a34a', color: '#fff' }}>
                        APK Tree
                      </span>
                    )}
                    {file.category === 'pcap' && (
                      <span style={{ fontSize: '0.6875rem', padding: '0.05rem 0.35rem', borderRadius: '9999px', backgroundColor: '#0284c7', color: '#fff' }}>
                        Traffic
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('summary')}
                    style={{
                      background: activeTab === 'summary' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      border: activeTab === 'summary' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                      color: activeTab === 'summary' ? '#38bdf8' : '#94a3b8',
                      borderRadius: '0.375rem',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Layers size={13} />
                    <span>📊 สรุปโครงสร้าง & Findings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('strings')}
                    style={{
                      background: activeTab === 'strings' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      border: activeTab === 'strings' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                      color: activeTab === 'strings' ? '#38bdf8' : '#94a3b8',
                      borderRadius: '0.375rem',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <FileSearch size={13} />
                    <span>📜 สตริงก์ที่พบ ({file.extractedStrings?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('hexdump')}
                    style={{
                      background: activeTab === 'hexdump' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      border: activeTab === 'hexdump' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                      color: activeTab === 'hexdump' ? '#38bdf8' : '#94a3b8',
                      borderRadius: '0.375rem',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span>🔢 Hex Dump Header</span>
                  </button>
                </div>

                {/* TAB 1: INTERNAL CONTENT & FILE STRUCTURE */}
                {activeTab === 'content' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* If rawText is available (code / text files / small readable configs) */}
                    {file.rawText ? (
                      <div style={{
                        backgroundColor: '#020617',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '0.5rem',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          padding: '0.5rem 0.875rem',
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          borderBottom: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>
                            เนื้อหาไฟล์ข้อความ / โค้ดต้นฉบับ ({file.name}) — {file.rawText.split('\n').length} บรรทัด
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(file.rawText || '')}
                            className="btn-secondary"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.6875rem' }}
                          >
                            {copiedRawText ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                            <span>{copiedRawText ? 'คัดลอกแล้ว' : 'คัดลอกเนื้อหาทั้งหมด'}</span>
                          </button>
                        </div>
                        <pre style={{
                          margin: 0,
                          padding: '0.875rem',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '0.75rem',
                          color: '#e2e8f0',
                          lineHeight: 1.5,
                          maxHeight: '360px',
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all'
                        }}>
                          {file.rawText}
                        </pre>
                      </div>
                    ) : null}

                    {/* If APK: Show Package, Permissions & Complete File Tree */}
                    {file.category === 'apk' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {file.details?.packageName && (
                          <div style={{
                            padding: '0.625rem 0.875rem',
                            backgroundColor: 'rgba(74, 222, 128, 0.08)',
                            border: '1px solid rgba(74, 222, 128, 0.25)',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                          }}>
                            <div>
                              <span style={{ fontSize: '0.6875rem', color: '#86efac', textTransform: 'uppercase', fontWeight: 600 }}>
                                Package Name:
                              </span>
                              <div style={{ fontSize: '0.875rem', fontWeight: 700, fontFamily: 'monospace', color: '#4ade80' }}>
                                {file.details.packageName}
                              </div>
                            </div>
                            {file.details.permissions && file.details.permissions.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {file.details.permissions.map((p, i) => (
                                  <span key={i} style={{ fontSize: '0.6875rem', padding: '0.1rem 0.4rem', backgroundColor: '#020617', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '4px', color: '#86efac' }}>
                                    {p.split('.').pop()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Searchable APK File Directory */}
                        <div style={{
                          backgroundColor: '#020617',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '0.5rem',
                          padding: '0.75rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <FolderTree size={14} color="#4ade80" />
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>
                                รายการไฟล์ภายใน APK ({file.details?.zipEntries?.length || 0} ไฟล์):
                              </span>
                            </div>
                            <input
                              type="text"
                              value={entriesFilter}
                              onChange={(e) => setEntriesFilter(e.target.value)}
                              placeholder="ค้นหาไฟล์ใน APK (เช่น dex, xml, so, assets)..."
                              style={{
                                background: '#090d16',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '4px',
                                padding: '0.2rem 0.5rem',
                                color: '#f8fafc',
                                fontSize: '0.6875rem',
                                outline: 'none',
                                minWidth: '220px'
                              }}
                            />
                          </div>

                          <div style={{
                            maxHeight: '220px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem',
                            fontFamily: 'monospace',
                            fontSize: '0.75rem'
                          }}>
                            {filteredZipEntries.length > 0 ? (
                              filteredZipEntries.map((entry, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '3px',
                                    backgroundColor: entry.includes('dex') || entry.includes('AndroidManifest') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                    color: entry.includes('dex') || entry.includes('AndroidManifest') ? '#4ade80' : '#94a3b8',
                                    fontWeight: entry.includes('dex') || entry.includes('AndroidManifest') ? 600 : 400
                                  }}
                                >
                                  📄 {entry}
                                </div>
                              ))
                            ) : (
                              <div style={{ color: '#64748b', textAlign: 'center', padding: '0.75rem' }}>
                                ไม่พบไฟล์ที่ตรงกับคำค้น
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* If PCAP: Show Network Protocols, IPs, DNS queries & HTTP Requests */}
                    {file.category === 'pcap' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '0.75rem'
                        }}>
                          <div style={{ backgroundColor: '#020617', border: '1px solid var(--border-subtle)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                            <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>จำนวนแพ็กเก็ต (Packet Count):</span>
                            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
                              ~{file.details?.packetCount || 0} Packets
                            </div>
                          </div>
                          <div style={{ backgroundColor: '#020617', border: '1px solid var(--border-subtle)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                            <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>โปรโตคอลที่พบ:</span>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc', marginTop: '0.2rem' }}>
                              {file.details?.protocols?.join(', ') || 'TCP/UDP/IP'}
                            </div>
                          </div>
                        </div>

                        {/* DNS Queries */}
                        {file.details?.dnsQueries && file.details.dnsQueries.length > 0 && (
                          <div style={{ backgroundColor: '#020617', border: '1px solid var(--border-subtle)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8' }}>
                              🌐 DNS Domain Queries ที่พบในทราฟฟิก ({file.details.dnsQueries.length} รายการ):
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                              {file.details.dnsQueries.map((q, i) => (
                                <span key={i} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#090d16', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '4px', color: '#7dd3fc', fontFamily: 'monospace' }}>
                                  {q}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* HTTP Requests */}
                        {file.details?.httpRequests && file.details.httpRequests.length > 0 && (
                          <div style={{ backgroundColor: '#020617', border: '1px solid var(--border-subtle)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399' }}>
                              🌐 HTTP Endpoints / URLs:
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.4rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {file.details.httpRequests.map((req, i) => (
                                <div key={i} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#090d16', borderRadius: '4px', color: '#a7f3d0' }}>
                                  {req}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* IP List */}
                        {file.details?.ipList && file.details.ipList.length > 0 && (
                          <div style={{ backgroundColor: '#020617', border: '1px solid var(--border-subtle)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
                              📡 IP Addresses ที่สื่อสารกัน:
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                              {file.details.ipList.map((ip, i) => (
                                <span key={i} style={{ fontSize: '0.6875rem', padding: '0.15rem 0.4rem', backgroundColor: '#090d16', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                                  {ip}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* If Archive: Show Zip Entries Tree */}
                    {file.category === 'archive' && file.details?.zipEntries && (
                      <div style={{ backgroundColor: '#020617', border: '1px solid var(--border-subtle)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                          <FolderTree size={15} color="#fbbf24" />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>
                            รายการไฟล์ทั้งหมดใน Archive ({file.details.zipEntries.length} รายการ):
                          </span>
                        </div>
                        <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.2rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {file.details.zipEntries.map((e, idx) => (
                            <div key={idx} style={{ padding: '0.2rem 0.4rem', backgroundColor: 'rgba(251, 191, 36, 0.05)', color: '#fde68a', borderRadius: '3px' }}>
                              📦 {e}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* If Binary: Show Architecture, Endianness & Libc Functions */}
                    {file.category === 'binary' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '0.75rem'
                        }}>
                          <div style={{ backgroundColor: '#020617', border: '1px solid var(--border-subtle)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                            <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>สถาปัตยกรรม (Architecture):</span>
                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fb7185', marginTop: '0.2rem' }}>
                              {file.details?.architecture || 'Unknown / Executable'}
                            </div>
                          </div>
                          <div style={{ backgroundColor: '#020617', border: '1px solid var(--border-subtle)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                            <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Endianness:</span>
                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.2rem' }}>
                              {file.details?.endianness || 'Little Endian'}
                            </div>
                          </div>
                        </div>

                        <div style={{ backgroundColor: '#020617', border: '1px solid var(--border-subtle)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fb7185' }}>
                            สัญลักษณ์ฟังก์ชัน / libc Call ในไบนารี:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                            {file.extractedStrings?.filter(s => /system|exec|gets|strcpy|printf|fork|socket|connect|\/bin\/sh/i.test(s)).map((fn, i) => (
                              <span key={i} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '4px', color: '#fca5a5', fontFamily: 'monospace' }}>
                                {fn}
                              </span>
                            )) || <span style={{ color: '#64748b', fontSize: '0.75rem' }}>ไม่พบฟังก์ชันอันตรายเด่นชัด</span>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* If Image: Show Image preview */}
                    {file.category === 'image' && file.imageBase64 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ backgroundColor: '#020617', border: '1px solid var(--border-subtle)', borderRadius: '0.5rem', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <img
                            src={file.imageBase64}
                            alt={file.name}
                            style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}
                          />
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6 }}>
                            <strong style={{ color: '#c084fc' }}>ภาพสำหรับ Steganography / Multimodal Vision</strong>
                            <div>• ตรวจสอบ LSB Red/Green/Blue planes</div>
                            <div>• ตรวจสอบ EXIF metadata และ comment tag</div>
                            <div>• ตรวจสอบ EOF padding data ต่อท้าย IEND</div>
                          </div>
                        </div>

                        {file.details?.pythonStdout && (
                          <div style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '0.5rem',
                            padding: '0.75rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                              <Terminal size={14} color="#34d399" />
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>
                                ผลลัพธ์จาก Local Python Stego Engine (http://localhost:7788):
                              </span>
                            </div>
                            <pre style={{
                              margin: 0,
                              padding: '0.5rem 0.75rem',
                              backgroundColor: '#020617',
                              borderRadius: '0.375rem',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              fontFamily: 'var(--font-mono, monospace)',
                              fontSize: '0.75rem',
                              color: '#6ee7b7',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                              maxHeight: '180px',
                              overflowY: 'auto'
                            }}>
                              {file.details.pythonStdout}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: SUMMARY & FINDINGS */}
                {activeTab === 'summary' && (
                  <div>
                    <div style={{
                      backgroundColor: '#020617',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0.5rem',
                      padding: '0.875rem',
                      fontSize: '0.8125rem',
                      lineHeight: 1.6,
                      color: '#e2e8f0',
                      whiteSpace: 'pre-line',
                      fontFamily: 'var(--font-mono, monospace)'
                    }}>
                      {file.summary}
                    </div>

                    <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ padding: '0.4rem 0.65rem', backgroundColor: '#020617', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <strong>Magic Bytes:</strong> <code style={{ color: '#38bdf8' }}>{file.magicHex}</code>
                      </div>
                      <div style={{ padding: '0.4rem 0.65rem', backgroundColor: '#020617', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <strong>MIME:</strong> <code style={{ color: '#34d399' }}>{file.mimeType}</code>
                      </div>
                      <div style={{ padding: '0.4rem 0.65rem', backgroundColor: '#020617', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <strong>Agents แนะนำ:</strong> {file.recommendedAgentIds.join(', ')}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: STRINGS */}
                {activeTab === 'strings' && (
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      background: '#020617',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0.375rem',
                      padding: '0.3rem 0.5rem'
                    }}>
                      <Search size={14} color="#64748b" />
                      <input
                        type="text"
                        value={stringsFilter}
                        onChange={(e) => setStringsFilter(e.target.value)}
                        placeholder="ค้นหาสตริงก์ (เช่น flag, password, key, http, token, admin)..."
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f8fafc',
                          fontSize: '0.75rem',
                          outline: 'none',
                          width: '100%'
                        }}
                      />
                    </div>

                    <div style={{
                      maxHeight: '260px',
                      overflowY: 'auto',
                      backgroundColor: '#020617',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0.375rem',
                      padding: '0.5rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}>
                      {filteredStrings.length > 0 ? (
                        filteredStrings.map((str, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '3px',
                              backgroundColor: /flag|ctf/i.test(str) ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                              color: /flag|ctf/i.test(str) ? '#f87171' : '#cbd5e1',
                              fontWeight: /flag|ctf/i.test(str) ? 700 : 400,
                              wordBreak: 'break-all'
                            }}
                          >
                            {str}
                          </div>
                        ))
                      ) : (
                        <div style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem' }}>
                          ไม่พบสตริงก์ที่ตรงกับคำค้น
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: HEX DUMP */}
                {activeTab === 'hexdump' && (
                  <pre style={{
                    margin: 0,
                    padding: '0.875rem',
                    backgroundColor: '#020617',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '0.375rem',
                    color: '#38bdf8',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.6875rem',
                    lineHeight: 1.45,
                    overflowX: 'auto',
                    maxHeight: '280px'
                  }}>
                    {file.hexdump || 'ไม่มีข้อมูล Hexdump'}
                  </pre>
                )}

                {/* TAB 5: PYTHON EXECUTION LOG */}
                {activeTab === ('python_log' as any) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '0.5rem 0.875rem',
                      borderRadius: '0.375rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
                        <Terminal size={14} />
                        <span>ผลการรัน Python Solver Script จริง (`scripts/steg_solver.py`)</span>
                      </div>
                      {file.details?.pythonStdout && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(file.details?.pythonStdout || '')}
                          className="btn-secondary"
                          style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem' }}
                        >
                          <Copy size={12} />
                          <span>{copiedRawText ? 'คัดลอก Log แล้ว!' : 'คัดลอก Log'}</span>
                        </button>
                      )}
                    </div>

                    <pre style={{
                      margin: 0,
                      padding: '0.875rem',
                      backgroundColor: '#020617',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '0.375rem',
                      color: '#34d399',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.75rem',
                      lineHeight: 1.5,
                      overflowX: 'auto',
                      maxHeight: '320px',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {file.details?.pythonStdout || file.pythonStdout || 'ไม่มีข้อมูล Log จาก Python Execution'}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
