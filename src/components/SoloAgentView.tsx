import React, { useState, useRef } from 'react';
import type { AgentConfig, AgentId, OpenRouterSettings, AttachedFile } from '../types';
import { executeAgent } from '../services/ai';
import { analyzeUploadedFile, buildFilesContextPrompt } from '../services/fileAnalyzer';
import {
  Send,
  Trash2,
  Loader2,
  Copy,
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
  Sparkles,
  Paperclip,
  X
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SoloAgentViewProps {
  agents: AgentConfig[];
  settings: OpenRouterSettings;
}

export const SoloAgentView: React.FC<SoloAgentViewProps> = ({
  agents,
  settings
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId>('webx');
  const [messages, setMessages] = useState<Record<AgentId, Message[]>>({
    webx: [],
    cryptobreaker: [],
    forensicx: [],
    steghunter: [],
    reveng: [],
    pwnmaster: [],
    shadowtrace: [],
    puzzlemind: [],
    mobilex: [],
    flagassembler: []
  });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [soloFiles, setSoloFiles] = useState<AttachedFile[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeAgent = agents.find(a => a.id === selectedAgentId) || agents[0];
  const activeMessages = messages[selectedAgentId] || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsProcessingFile(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const analyzed = await analyzeUploadedFile(fileList[i]);
        setSoloFiles(prev => [...prev, analyzed]);
      }
    } catch (err) {
      console.error('File parsing error in solo view:', err);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveSoloFile = (id: string) => {
    setSoloFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && soloFiles.length === 0) || isLoading) return;

    const filesPrompt = buildFilesContextPrompt(soloFiles);
    const combinedPrompt = inputText.trim() 
      ? `${inputText.trim()}${filesPrompt}`
      : filesPrompt.trim();

    const displayContent = inputText.trim()
      ? (soloFiles.length > 0 ? `${inputText.trim()} (📁 แนบไฟล์: ${soloFiles.map(f => f.name).join(', ')})` : inputText.trim())
      : `📁 วิเคราะห์ไฟล์: ${soloFiles.map(f => `${f.name} [${f.categoryThai}]`).join(', ')}`;

    const userMsg: Message = {
      role: 'user',
      content: displayContent,
      timestamp: new Date()
    };

    const newMessages = [...activeMessages, userMsg];
    setMessages(prev => ({
      ...prev,
      [selectedAgentId]: newMessages
    }));

    const firstImage = soloFiles.find(f => f.imageBase64)?.imageBase64;
    setSoloFiles([]);
    setInputText('');
    setIsLoading(true);

    try {
      const reply = await executeAgent({
        agent: activeAgent,
        settings,
        userPrompt: combinedPrompt,
        imageBase64: firstImage
      });

      const assistantMsg: Message = {
        role: 'assistant',
        content: reply,
        timestamp: new Date()
      };

      setMessages(prev => ({
        ...prev,
        [selectedAgentId]: [...newMessages, assistantMsg]
      }));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const assistantError: Message = {
        role: 'assistant',
        content: `**[ERROR]** เกิดข้อผิดพลาดในการประมวลผล:\n${errorMsg}`,
        timestamp: new Date()
      };
      setMessages(prev => ({
        ...prev,
        [selectedAgentId]: [...newMessages, assistantError]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages(prev => ({
      ...prev,
      [selectedAgentId]: []
    }));
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

  const sampleQuestions: Record<AgentId, string[]> = {
    webx: [
      "ช่วยสร้าง SQL injection payload สำหรับ bypass login ของ SQLite หน่อย",
      "JWT token นี้ใช้ algorithm: none ได้อย่างไร?",
      "แนะนำวิธีทำ LFI to RCE ใน PHP wrapper"
    ],
    cryptobreaker: [
      "ถอดรหัสข้อความนี้: TTEzYVhwbWFYUTlhRFZsTlNBd1pXUnZabVpsYkd4bFlXNHdkVEV5TXpNeE5qYzFOalV5",
      "มีค่า RSA: n=..., e=3, c=... ช่วยคำนวณ Small e cube root attack",
      "ช่วยวิเคราะห์ความถี่ของตัวอักษรนี้หน่อย"
    ],
    forensicx: [
      "ไฟล์นี้ขึ้นต้นด้วย 89 50 4E 47 หมายถึงอะไร?",
      "ตรวจพบ DNS Tunneling สกัดข้อมูลอย่างไรจาก PCAP?",
      "ช่วยแนะนำการดู metadata EXIF สำหรับหา Flag ซ่อน"
    ],
    steghunter: [
      "วิเคราะห์รูปภาพ LSB ใน Red channel มีขั้นตอนอย่างไร?",
      "ใช้คำสั่ง zsteg หรือ steghide อย่างไรบ้าง?",
      "ตรวจสอบไฟล์ภาพว่ามีการนำข้อมูลไปต่อท้าย EOF หรือไม่"
    ],
    reveng: [
      "ช่วยเขียน script Python ทำ XOR brute force กับ key 1 byte",
      "แกะฟังก์ชัน check_password() ในภาษา C นี้ให้หน่อย",
      "ช่วย reverse lookup z3 solver constraints นี้"
    ],
    pwnmaster: [
      "เขียน template pwntools สำหรับ ret2libc ใน Ubuntu 22.04",
      "วิธีคำนวณ offset ของ buffer overflow ด้วย cyclic pattern",
      "อธิบายการ leak canary ผ่าน format string %p"
    ],
    shadowtrace: [
      "แนะนำ Google Dorking ค้นหา credentials ที่หลุดใน GitHub",
      "วิธีค้นหาพิกัดจาก EXIF GPS coordinates",
      "ตรวจสอบประวัติเว็บเพจด้วย Wayback Machine"
    ],
    puzzlemind: [
      "ช่วยรันโค้ดภาษา Brainfuck นี้: ++++++++++[>+>+++>+++++++>++++++++++<<<<-]>>>++.>+.+++++++..+++.<<++.>+++++++++++++++.>.+++.------.--------.<<+.<.",
      "ถอดรหัสรหัสมอส / JSFuck นี้ให้หน่อย",
      "ช่วยแก้ Pyjail escape เมื่อ input ถูกกรอง __import__"
    ],
    mobilex: [
      "วิธี decompile APK ด้วย jadx และหา hardcoded key ใน strings.xml",
      "อธิบายโค้ด Smali ส่วนตรวจสอบรหัสผ่านนี้",
      "วิธีดึงข้อมูลจาก SQLite database ในแอป Android"
    ],
    flagassembler: [
      "ช่วยสังเคราะห์ข้อมูลเหล่านี้เพื่อหา Flag",
      "ตรวจสอบ format flag{...} จากสตริงที่สกัดมาได้",
      "จัดอันดับความเป็นไปได้ของ Flag candidates"
    ]
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      gap: '1.25rem',
      minHeight: '680px'
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
          เลือก Agent ที่ต้องการปรึกษา
        </div>

        {agents.map(agent => {
          const isSelected = agent.id === selectedAgentId;
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
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ color: isSelected ? agent.accentColor : '#64748b' }}>
                {getAgentIcon(agent.id)}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: isSelected ? '#f8fafc' : '#cbd5e1' }}>
                  {agent.name}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {agent.category}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Chat Panel */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '0.875rem',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Agent Info Banner */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
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
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                  {activeAgent.name}
                </h3>
                <span className="badge" style={{ backgroundColor: `${activeAgent.accentColor}20`, color: activeAgent.accentColor }}>
                  {activeAgent.category}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                {activeAgent.thaiName} (โมเดล: {activeAgent.currentModel})
              </p>
            </div>
          </div>

          {activeMessages.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
              title="ล้างประวัติการคุย"
            >
              <Trash2 size={13} />
              <span>ล้างการสนทนา</span>
            </button>
          )}
        </div>

        {/* Message Thread */}
        <div style={{
          flex: 1,
          padding: '1.25rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {activeMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                color: activeAgent.accentColor
              }}>
                <Sparkles size={24} />
              </div>
              <h4 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                เริ่มการวิเคราะห์เจาะลึกกับ {activeAgent.name}
              </h4>
              <p style={{ fontSize: '0.8125rem', maxWidth: '440px', margin: '0 auto 1.25rem auto', lineHeight: 1.5 }}>
                {activeAgent.roleDescription}
              </p>

              {/* Sample Prompt Suggestions */}
              <div style={{ maxWidth: '540px', margin: '0 auto', textAlign: 'left' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
                  ตัวอย่างคำถามที่พบบ่อย:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {sampleQuestions[activeAgent.id]?.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(q)}
                      style={{
                        background: '#020617',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '0.375rem',
                        padding: '0.45rem 0.75rem',
                        color: '#cbd5e1',
                        fontSize: '0.75rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = activeAgent.accentColor;
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.color = '#cbd5e1';
                      }}
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            activeMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  backgroundColor: msg.role === 'user' ? '#0369a1' : '#020617',
                  border: msg.role === 'user' ? '1px solid #0284c7' : '1px solid var(--border-subtle)',
                  borderRadius: '0.75rem',
                  padding: '0.875rem 1.125rem',
                  color: '#f8fafc',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  position: 'relative'
                }}>
                  <div style={{
                    fontSize: '0.6875rem',
                    color: msg.role === 'user' ? '#bae6fd' : '#94a3b8',
                    marginBottom: '0.35rem',
                    fontWeight: 600
                  }}>
                    {msg.role === 'user' ? 'คุณ (You)' : activeAgent.name}
                  </div>

                  <pre style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    fontFamily: msg.role === 'assistant' ? 'var(--font-mono, monospace)' : 'inherit',
                    fontSize: '0.8125rem'
                  }}>
                    {msg.content}
                  </pre>

                  {msg.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(msg.content);
                        setCopiedIndex(idx);
                        setTimeout(() => setCopiedIndex(null), 2000);
                      }}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '0.2rem'
                      }}
                      title="คัดลอกข้อความ"
                    >
                      {copiedIndex === idx ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontSize: '0.8125rem', padding: '0.5rem' }}>
              <Loader2 size={16} className="animate-spin" />
              <span>{activeAgent.name} กำลังวิเคราะห์ข้อมูลและสร้างรายงาน...</span>
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div style={{
          padding: '0.875rem 1rem',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: '#020617',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {/* Attached files preview chips */}
          {soloFiles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', paddingBottom: '0.25rem' }}>
              {soloFiles.map(file => (
                <div
                  key={file.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontSize: '0.75rem',
                    color: '#38bdf8'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{file.name}</span>
                  <span style={{ color: '#94a3b8' }}>({file.sizeFormatted})</span>
                  {file.hasFlag || (file.flagCandidates && file.flagCandidates.length > 0) ? (
                    <span style={{ fontSize: '0.6875rem', color: '#f87171', fontWeight: 600 }}>🚩 พบ Flag</span>
                  ) : (
                    <span style={{ fontSize: '0.6875rem', color: '#38bdf8' }}>ℹ️ ไม่มีข้อมูล Flag</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveSoloFile(file.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fb7185',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="ลบไฟล์นี้"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept="*,.pcap,.pcapng,.cap,.apk,.dex,.elf,.bin,.exe,.zip,.png,.jpg,.txt"
              style={{ display: 'none' }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingFile || isLoading}
              className="btn-secondary"
              style={{
                padding: '0.625rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '42px',
                width: '42px',
                flexShrink: 0
              }}
              title="แนบไฟล์วิเคราะห์ (PCAP, APK, ELF, ภาพ, ZIP)"
            >
              {isProcessingFile ? (
                <Loader2 size={16} className="animate-spin" color="#38bdf8" />
              ) : (
                <Paperclip size={16} color="#38bdf8" />
              )}
            </button>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`พิมพ์ข้อความหรือโจทย์ที่ต้องการปรึกษา ${activeAgent.name} (กด Enter เพื่อส่ง, Shift+Enter เพื่อขึ้นบรรทัดใหม่)...`}
              rows={2}
              style={{
                flex: 1,
                backgroundColor: '#0b1120',
                border: '1px solid var(--border-subtle)',
                borderRadius: '0.5rem',
                padding: '0.625rem 0.875rem',
                color: '#f8fafc',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-mono, monospace)',
                resize: 'none',
                outline: 'none'
              }}
            />

            <button
              type="button"
              onClick={handleSendMessage}
              disabled={(!inputText.trim() && soloFiles.length === 0) || isLoading}
              className="btn-primary"
              style={{ padding: '0 1.25rem', height: '42px', flexShrink: 0 }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span>ส่ง</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
