export type AgentId = 
  | 'webx'
  | 'cryptobreaker'
  | 'forensicx'
  | 'steghunter'
  | 'reveng'
  | 'pwnmaster'
  | 'shadowtrace'
  | 'puzzlemind'
  | 'mobilex'
  | 'flagassembler';

export type AgentCategory = 
  | 'Web'
  | 'Cryptography'
  | 'Forensics'
  | 'Steganography'
  | 'Reverse Engineering'
  | 'PWN / Binary Exploitation'
  | 'OSINT'
  | 'Misc / Esoteric'
  | 'Mobile / Android'
  | 'Coordinator';

export interface AgentConfig {
  id: AgentId;
  name: string;
  thaiName: string;
  category: AgentCategory;
  roleDescription: string;
  recommendedModel: string;
  currentModel: string;
  prompt: string;
  defaultPrompt: string;
  temperature: number;
  maxTokens: number;
  icon: string;
  accentColor: string;
  isCoordinator?: boolean;
}

export type ExecutionState = 'idle' | 'running' | 'completed' | 'error';

export interface AgentResult {
  agentId: AgentId;
  status: ExecutionState;
  output: string;
  startTime?: number;
  endTime?: number;
  executionTimeMs?: number;
  error?: string;
  extractedFlag?: string;
  confidence?: number;
}

export type FileCategory = 'pcap' | 'apk' | 'binary' | 'image' | 'text' | 'archive' | 'other';

export interface FileAnalysisDetails {
  packetCount?: number;
  protocols?: string[];
  ipList?: string[];
  dnsQueries?: string[];
  httpRequests?: string[];
  zipEntries?: string[];
  packageName?: string;
  activities?: string[];
  permissions?: string[];
  architecture?: string;
  endianness?: string;
  lineCount?: number;
  internalFindings?: string[];
  pythonStdout?: string;
}

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  sizeFormatted: string;
  mimeType: string;
  category: FileCategory;
  categoryThai: string;
  magicHex: string;
  sha256: string;
  summary: string;
  recommendedAgentIds: AgentId[];
  hexdump?: string;
  extractedStrings?: string[];
  flagCandidates?: string[];
  hasFlag?: boolean;
  details?: FileAnalysisDetails;
  imageBase64?: string;
  rawText?: string;
  pythonStdout?: string;
  rawFile?: File;
}

export interface SwarmReport {
  id: string;
  timestamp: number;
  challengeTitle: string;
  challengeInput: string;
  imageBase64?: string;
  imagePreviewUrl?: string;
  attachedFiles?: AttachedFile[];
  selectedAgentIds: AgentId[];
  agentResults: Record<AgentId, AgentResult>;
  flagReport?: string;
  primaryFlag?: string;
  confidence?: number;
  isFinished: boolean;
}

export interface ChallengePreset {
  id: string;
  title: string;
  titleThai: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  descriptionThai: string;
  content: string;
  suggestedAgentIds: AgentId[];
  imageDataUrl?: string;
  flagAnswer?: string;
}

export type AIProvider = 'openrouter' | 'gemini';

export interface ProviderSettings {
  activeProvider: AIProvider;
  openRouterApiKey: string;
  geminiApiKey: string;
  geminiDefaultModel: string;
  siteUrl: string;
  siteName: string;
  mockMode: boolean;
  // Backward compatibility alias for apiKey
  apiKey?: string;
}

export type OpenRouterSettings = ProviderSettings;

