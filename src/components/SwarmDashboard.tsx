import React, { useState } from 'react';
import type { AgentConfig, AgentId, AgentResult, SwarmReport } from '../types';
import {
  Flag,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Download,
  Globe,
  KeyRound,
  Search,
  Image as ImageIcon,
  Cpu,
  ShieldAlert,
  Compass,
  Puzzle,
  Smartphone,
  Info,
  FileText
} from 'lucide-react';

interface SwarmDashboardProps {
  agents: AgentConfig[];
  currentReport: SwarmReport | null;
  onSelectAgentForModal: (agentId: AgentId) => void;
  isAnalyzing?: boolean;
}

export const SwarmDashboard: React.FC<SwarmDashboardProps> = ({
  agents,
  currentReport,
  onSelectAgentForModal
}) => {
  const [copiedFlag, setCopiedFlag] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  if (!currentReport) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '0.875rem',
        padding: '3.5rem 2rem',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto',
          border: '1px solid rgba(56, 189, 248, 0.25)'
        }}>
          <Flag size={28} color="#38bdf8" />
        </div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.5rem' }}>
          ยังไม่มีข้อมูลการวิเคราะห์ในขณะนี้
        </h3>
        <p style={{ fontSize: '0.875rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
          กรุณาป้อนโจทย์ CTF หรือเลือกโจทย์ตัวอย่างด้านบน แล้วกดปุ่ม <strong>"ปล่อยฝูงบิน AI วิเคราะห์โจทย์"</strong> เพื่อเริ่มการสืบค้นและถอดรหัส
        </p>
      </div>
    );
  }

  const { agentResults, flagReport, primaryFlag, confidence } = currentReport;

  const handleCopyFlag = () => {
    if (primaryFlag) {
      navigator.clipboard.writeText(primaryFlag);
      setCopiedFlag(true);
      setTimeout(() => setCopiedFlag(false), 2000);
    }
  };

  const handleCopyReport = () => {
    if (flagReport) {
      navigator.clipboard.writeText(flagReport);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    }
  };

  const handleDownloadReport = () => {
    if (!flagReport) return;
    const blob = new Blob([flagReport], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CTF_Flag_Report_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
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

  const specialistAgents = agents.filter(a => !a.isCoordinator);
  const coordinatorAgent = agents.find(a => a.isCoordinator);
  const coordinatorResult = coordinatorAgent ? agentResults[coordinatorAgent.id] : undefined;

  // Calculate stats
  const totalSelected = currentReport.selectedAgentIds.length;
  const completedCount = currentReport.selectedAgentIds.filter(id => agentResults[id]?.status === 'completed').length;
  const errorCount = currentReport.selectedAgentIds.filter(id => agentResults[id]?.status === 'error').length;
  const runningCount = currentReport.selectedAgentIds.filter(id => agentResults[id]?.status === 'running').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Status Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '0.875rem 1.25rem',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
            สถานะฝูงบิน AI (Swarm Status):
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
            <span style={{ color: '#94a3b8' }}>Agent ทั้งหมด:</span>
            <strong style={{ color: '#f8fafc' }}>{totalSelected}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span style={{ color: '#34d399' }}>เสร็จสิ้น: {completedCount}</span>
          </div>
          {runningCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
              <Loader2 size={13} className="animate-spin" color="#38bdf8" />
              <span style={{ color: '#38bdf8' }}>กำลังประมวลผล: {runningCount}</span>
            </div>
          )}
          {errorCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f43f5e' }} />
              <span style={{ color: '#fb7185' }}>ข้อผิดพลาด: {errorCount}</span>
            </div>
          )}
          {currentReport.attachedFiles && currentReport.attachedFiles.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
              <span style={{ color: '#94a3b8' }}>ไฟล์โจทย์ที่แนบ:</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                {currentReport.attachedFiles.length} ไฟล์ ({currentReport.attachedFiles.map(f => f.name).join(', ')})
              </span>
            </div>
          )}
        </div>

        {flagReport && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleCopyReport}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            >
              {copiedReport ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
              <span>{copiedReport ? 'คัดลอกแล้ว' : 'คัดลอกรายงาน'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadReport}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            >
              <Download size={13} />
              <span>ดาวน์โหลด (.md)</span>
            </button>
          </div>
        )}
      </div>

      {/* 🏴 PRIMARY FLAG REPORT CARD (HIGHLIGHT) */}
      {(primaryFlag || coordinatorResult?.status === 'running' || coordinatorResult?.status === 'completed') && (
        <div style={{
          background: primaryFlag 
            ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(11, 17, 32, 0.95) 100%)'
            : 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(11, 17, 32, 0.95) 100%)',
          border: primaryFlag ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: primaryFlag ? '0 0 30px rgba(16, 185, 129, 0.15)' : '0 0 30px rgba(245, 158, 11, 0.12)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Glowing Top Border Bar */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: primaryFlag
              ? 'linear-gradient(90deg, #10b981 0%, #38bdf8 50%, #a855f7 100%)'
              : 'linear-gradient(90deg, #f59e0b 0%, #38bdf8 50%, #ec4899 100%)'
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: primaryFlag ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: primaryFlag ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(245, 158, 11, 0.5)'
              }}>
                {primaryFlag ? <Flag size={20} color="#34d399" /> : <Info size={20} color="#fbbf24" />}
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  {primaryFlag ? '🏴 รายงานสรุปผล Flag (FlagAssembler Report)' : 'ℹ️ รายงานสรุปผล (FlagAssembler Report) — ผลการตรวจหา Flag'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  สังเคราะห์และตรวจสอบความสมบูรณ์โดย Coordinator Agent
                </span>
              </div>
            </div>

            {confidence !== undefined && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                border: '1px solid var(--border-subtle)'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ความมั่นใจ (Confidence):</span>
                <strong style={{
                  color: confidence >= 80 ? '#34d399' : confidence >= 50 ? '#fbbf24' : '#fb7185',
                  fontSize: '0.875rem'
                }}>
                  {confidence}%
                </strong>
              </div>
            )}
          </div>

          {/* Coordinator in-progress banner */}
          {coordinatorResult?.status === 'running' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8'
            }}>
              <Loader2 size={20} className="animate-spin" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  Agent 10 (FlagAssembler) กำลังสังเคราะห์ข้อมูลจาก Specialist Agents...
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  กำลังตรวจสอบการไขรหัส, ผสานส่วนประกอบของ Flag และประเมินคะแนนความน่าเชื่อถือ
                </div>
              </div>
            </div>
          )}

          {/* Primary Flag Banner (if found) OR Info Banner (if no flag found) */}
          {primaryFlag ? (
            <div style={{
              backgroundColor: '#020617',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              borderRadius: '0.75rem',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)'
            }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981', fontWeight: 600 }}>
                  PRIMARY RECOVERED FLAG:
                </span>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: '#34d399',
                  wordBreak: 'break-all',
                  marginTop: '0.25rem',
                  letterSpacing: '0.02em'
                }}>
                  {primaryFlag}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyFlag}
                className="btn-emerald"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}
              >
                {copiedFlag ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedFlag ? 'คัดลอก Flag แล้ว!' : 'คัดลอก Flag'}</span>
              </button>
            </div>
          ) : coordinatorResult?.status === 'completed' ? (
            <div style={{
              backgroundColor: '#020617',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              marginBottom: '1.25rem',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <Info size={22} color="#fbbf24" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fbbf24', fontWeight: 600 }}>
                  สถานะ Flag จากการวิเคราะห์:
                </div>
                <div style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: '#fde68a',
                  marginTop: '0.2rem'
                }}>
                  ℹ️ ไม่มีข้อมูลของ Flag ในไฟล์นี้ / ไม่พบสตริงก์ Flag โดยตรง
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.35rem', lineHeight: 1.6 }}>
                  Specialist Agents ตรวจสอบข้อมูลโจทย์และโครงสร้างไฟล์อย่างละเอียดแล้ว ไม่พบสตริงก์ Flag มาตรฐานในข้อมูลดิบ (เป็นไฟล์ทั่วไป หรือ Flag ซ่อนอยู่ในโค้ดและ Logic ที่ต้องประมวลผลต่อ)
                  <br />
                  🔍 <strong>ผลการวิเคราะห์โครงสร้างภายในไฟล์ คำแนะนำเชิงลึก และ Payload แสดงในรายงานด้านล่าง:</strong>
                </div>
              </div>
            </div>
          ) : null}

          {/* Full Report Accordion / View */}
          {flagReport && (
            <div style={{
              backgroundColor: '#020617',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-subtle)',
              padding: '1.25rem',
              maxHeight: '380px',
              overflowY: 'auto'
            }}>
              <pre style={{
                margin: 0,
                color: '#e2e8f0',
                fontSize: '0.8125rem',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-mono, monospace)',
                lineHeight: 1.6
              }}>
                {flagReport}
              </pre>
            </div>
          )}

          {/* Attached Files Internal Data Breakdown */}
          {currentReport.attachedFiles && currentReport.attachedFiles.length > 0 && (
            <div style={{
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <FileText size={16} color="#38bdf8" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
                  📁 ข้อมูลและโครงสร้างภายในไฟล์ที่ส่งตรวจ ({currentReport.attachedFiles.length} รายการ):
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {currentReport.attachedFiles.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: '#020617',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                          {f.name}
                        </span>
                        <span style={{ fontSize: '0.6875rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                          {f.categoryThai}
                        </span>
                        {f.hasFlag || (f.flagCandidates && f.flagCandidates.length > 0) ? (
                          <span style={{ fontSize: '0.6875rem', color: '#f87171', fontWeight: 600 }}>🚩 พบ Flag ในสตริงก์</span>
                        ) : (
                          <span style={{ fontSize: '0.6875rem', color: '#38bdf8', fontWeight: 500 }}>ℹ️ ไม่มีข้อมูล Flag ในสตริงก์</span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.sizeFormatted}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', whiteSpace: 'pre-line', fontFamily: 'monospace' }}>
                      {f.summary}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SPECIALIST AGENTS GRID */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
            รายงานแยกตาม Specialist Agent ({specialistAgents.length} ตัว)
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            คลิกที่การ์ดเพื่อเปิดดูการวิเคราะห์ฉบับเต็มและดาวน์โหลด Payload
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1rem'
        }}>
          {specialistAgents.map((agent) => {
            const isSelected = currentReport.selectedAgentIds.includes(agent.id);
            const result: AgentResult | undefined = agentResults[agent.id];
            const status = result?.status || (isSelected ? 'running' : 'idle');

            return (
              <div
                key={agent.id}
                onClick={() => onSelectAgentForModal(agent.id)}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: result?.output ? `1px solid rgba(56, 189, 248, 0.3)` : '1px solid var(--border-subtle)',
                  borderRadius: '0.75rem',
                  padding: '1.125rem',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = agent.accentColor;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = result?.output ? 'rgba(56, 189, 248, 0.3)' : 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Top Row: Icon, Name & Status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: `${agent.accentColor}20`,
                      color: agent.accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${agent.accentColor}40`
                    }}>
                      {getAgentIcon(agent.id)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#f8fafc' }}>
                        {agent.name}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                        {agent.category}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {status === 'running' && (
                      <span className="badge badge-cyan">
                        <Loader2 size={12} className="animate-spin" />
                        <span>กำลังวิเคราะห์</span>
                      </span>
                    )}
                    {status === 'completed' && (
                      <span className="badge badge-emerald">
                        <CheckCircle2 size={12} />
                        <span>สำเร็จ</span>
                      </span>
                    )}
                    {status === 'error' && (
                      <span className="badge badge-rose">
                        <AlertTriangle size={12} />
                        <span>เกิดข้อผิดพลาด</span>
                      </span>
                    )}
                    {status === 'idle' && (
                      <span style={{
                        fontSize: '0.6875rem',
                        color: '#64748b',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: '#020617'
                      }}>
                        ไม่ได้เลือก
                      </span>
                    )}
                  </div>
                </div>

                {/* Agent Thai Role Description */}
                <p style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  lineHeight: 1.4,
                  marginBottom: '0.75rem',
                  flexGrow: 1
                }}>
                  {agent.roleDescription}
                </p>

                {/* Output Snippet or Placeholder */}
                <div style={{
                  backgroundColor: '#020617',
                  borderRadius: '0.375rem',
                  padding: '0.625rem',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: result?.output ? '#cbd5e1' : '#64748b',
                  height: '70px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  marginBottom: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  {result?.output ? result.output.slice(0, 200) : (
                    status === 'running' ? 'กำลังอ่านโจทย์และประมวลผลกลยุทธ์...' : 'รอเริ่มการวิเคราะห์'
                  )}
                </div>

                {/* Footer of Card */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '0.6875rem'
                }}>
                  <span style={{ color: '#64748b', fontFamily: 'var(--font-mono, monospace)' }}>
                    {agent.currentModel.split('/')[1] || agent.currentModel}
                  </span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: agent.accentColor,
                    fontWeight: 500
                  }}>
                    <span>ดูรายละเอียด</span>
                    <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
