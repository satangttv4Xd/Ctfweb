import { useState, useRef } from 'react';
import type { AgentConfig, AgentId, AgentResult, OpenRouterSettings, SwarmReport, ChallengePreset, AttachedFile } from './types';
import { INITIAL_AGENTS } from './data/agents';
import { Header } from './components/Header';
import { ApiKeyModal } from './components/ApiKeyModal';
import { PresetsModal } from './components/PresetsModal';
import { ChallengeInput } from './components/ChallengeInput';
import { SwarmDashboard } from './components/SwarmDashboard';
import { AgentModal } from './components/AgentModal';
import { SoloAgentView } from './components/SoloAgentView';
import { PromptManager } from './components/PromptManager';
import { LocalAgentView } from './components/LocalAgentView';
import { ModelDiscoveryModal } from './components/ModelDiscoveryModal';
import { executeAgent } from './services/ai';
import { buildFilesContextPrompt, analyzeUploadedFile } from './services/fileAnalyzer';
import { TokenGateModal } from './components/TokenGateModal';
import './App.css';

const STORAGE_SETTINGS_KEY = 'ctf_swarm_settings';
const STORAGE_AGENTS_KEY = 'ctf_swarm_agents';

export function App() {
  // Auth state for static token gate (always false on initial page load)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Navigation
  const [currentTab, setCurrentTab] = useState<'swarm' | 'solo' | 'prompts' | 'history' | 'agent'>('swarm');

  // OpenRouter Settings
  const [settings, setSettings] = useState<OpenRouterSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      activeProvider: 'openrouter',
      openRouterApiKey: '',
      geminiApiKey: '',
      geminiDefaultModel: 'gemini-2.5-flash',
      apiKey: '',
      siteUrl: 'https://ctf-swarm.local',
      siteName: 'CTF Swarm AI',
      mockMode: false
    };
  });

  // Agent Configurations & Prompts
  const [agents, setAgents] = useState<AgentConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AGENTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AgentConfig[];
        // Merge with initial in case schema changed
        return INITIAL_AGENTS.map(initAgent => {
          const found = parsed.find(p => p.id === initAgent.id);
          return found ? { ...initAgent, ...found } : initAgent;
        });
      }
    } catch {
      // ignore
    }
    return INITIAL_AGENTS;
  });

  // Active Challenge Input State
  const [challengeText, setChallengeText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | undefined>();
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<AgentId[]>([
    'webx',
    'cryptobreaker',
    'forensicx',
    'steghunter',
    'reveng',
    'pwnmaster',
    'shadowtrace',
    'puzzlemind',
    'mobilex'
  ]);

  // Active Swarm Analysis Report
  const [currentReport, setCurrentReport] = useState<SwarmReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Modals
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [modalAgentId, setModalAgentId] = useState<AgentId | null>(null);

  // Abort controller ref
  const abortControllerRef = useRef<AbortController | null>(null);

  // Save settings when changed
  const handleSaveSettings = (newSettings: OpenRouterSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const handleToggleMockMode = () => {
    handleSaveSettings({
      ...settings,
      mockMode: !settings.mockMode
    });
  };

  // Save agents when changed
  const handleUpdateAgent = (agentId: AgentId, updates: Partial<AgentConfig>) => {
    setAgents(prev => {
      const next = prev.map(a => a.id === agentId ? { ...a, ...updates } : a);
      localStorage.setItem(STORAGE_AGENTS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateAllAgentsModel = (newModel: string) => {
    setAgents(prev => {
      const next = prev.map(a => ({ ...a, currentModel: newModel }));
      localStorage.setItem(STORAGE_AGENTS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleResetAgentPrompt = (agentId: AgentId) => {
    setAgents(prev => {
      const next = prev.map(a => a.id === agentId ? { ...a, prompt: a.defaultPrompt, currentModel: a.recommendedModel } : a);
      localStorage.setItem(STORAGE_AGENTS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleResetAllAgents = () => {
    setAgents(INITIAL_AGENTS);
    localStorage.setItem(STORAGE_AGENTS_KEY, JSON.stringify(INITIAL_AGENTS));
  };

  // Agent Selection Handlers
  const handleToggleAgent = (id: AgentId) => {
    setSelectedAgentIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllAgents = () => {
    setSelectedAgentIds(agents.filter(a => !a.isCoordinator).map(a => a.id));
  };

  const handleSelectCategory = (cat: string) => {
    switch (cat) {
      case 'Web':
        setSelectedAgentIds(['webx']);
        break;
      case 'Crypto':
        setSelectedAgentIds(['cryptobreaker', 'puzzlemind']);
        break;
      case 'Stego':
        setSelectedAgentIds(['steghunter', 'forensicx']);
        break;
      case 'Binary':
        setSelectedAgentIds(['reveng', 'pwnmaster', 'mobilex']);
        break;
      default:
        handleSelectAllAgents();
    }
  };

  // File Attachment Handlers
  const handleAddAttachedFile = (file: AttachedFile) => {
    setAttachedFiles(prev => [...prev, file]);
  };

  const handleRemoveAttachedFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSelectRecommendedAgents = (recommended: AgentId[]) => {
    setSelectedAgentIds(prev => Array.from(new Set([...prev, ...recommended])));
  };

  // Preset Selection Handler
  const handleSelectPreset = (preset: ChallengePreset) => {
    setChallengeText(preset.content);
    setAttachedFiles([]);
    if (preset.imageDataUrl) {
      setImageBase64(preset.imageDataUrl);
      setImagePreviewUrl(preset.imageDataUrl);
    } else {
      setImageBase64(undefined);
      setImagePreviewUrl(undefined);
    }
    if (preset.suggestedAgentIds.length > 0) {
      setSelectedAgentIds(preset.suggestedAgentIds);
    }
  };

  // Helper to extract flag from text
  const extractFlagCandidate = (text: string): string | undefined => {
    const regex = /(?:flag|ctf|elec|picoctf)[a-z0-9_-]*\{[^\r\n}]{3,100}\}|[a-z0-9_-]+\{[^\r\n}]{3,100}\}/i;
    const match = text.match(regex);
    return match ? match[0] : undefined;
  };

  // Launch Swarm Analysis Engine
  const handleLaunchSwarm = async () => {
    // If we have attached archive files or files without detected flags, re-run analysis with current challengeText
    let currentFiles = attachedFiles;
    const needsReanalysis = attachedFiles.some(
      f => f.rawFile && (f.category === 'archive' || (!f.hasFlag && challengeText.trim().length > 0))
    );
    if (needsReanalysis) {
      currentFiles = await Promise.all(
        attachedFiles.map(async (f) => {
          if (f.rawFile && (f.category === 'archive' || (!f.hasFlag && challengeText.trim().length > 0))) {
            try {
              return await analyzeUploadedFile(f.rawFile, { challengeText });
            } catch {
              return f;
            }
          }
          return f;
        })
      );
      setAttachedFiles(currentFiles);
    }

    const filesPrompt = buildFilesContextPrompt(currentFiles);
    const combinedChallengeInput = challengeText.trim()
      ? `${challengeText.trim()}${filesPrompt}`
      : filesPrompt.trim();

    if ((!combinedChallengeInput && !imageBase64) || selectedAgentIds.length === 0) return;

    if (!settings.mockMode) {
      const hasKey = settings.activeProvider === 'gemini'
        ? Boolean(settings.geminiApiKey?.trim())
        : Boolean((settings.openRouterApiKey || settings.apiKey)?.trim());
      
      if (!hasKey) {
        setIsApiKeyModalOpen(true);
        return;
      }
    }

    // Initialize Swarm Report
    const reportId = `report_${Date.now()}`;
    const initialAgentResults: Record<AgentId, AgentResult> = {} as Record<AgentId, AgentResult>;

    selectedAgentIds.forEach(id => {
      initialAgentResults[id] = {
        agentId: id,
        status: 'running',
        output: '',
        startTime: Date.now()
      };
    });

    const coordinatorAgent = agents.find(a => a.isCoordinator);
    if (coordinatorAgent) {
      initialAgentResults[coordinatorAgent.id] = {
        agentId: coordinatorAgent.id,
        status: 'idle',
        output: ''
      };
    }

    const newReport: SwarmReport = {
      id: reportId,
      timestamp: Date.now(),
      challengeTitle: challengeText.slice(0, 50) || (currentFiles[0]?.name ? `File: ${currentFiles[0].name}` : 'CTF Challenge'),
      challengeInput: combinedChallengeInput,
      imageBase64,
      imagePreviewUrl,
      attachedFiles: [...currentFiles],
      selectedAgentIds: [...selectedAgentIds],
      agentResults: initialAgentResults,
      isFinished: false
    };

    setCurrentReport(newReport);
    setIsAnalyzing(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Phase 1: Run all selected specialist agents concurrently with slight staggered delays to prevent API Rate Limit (429)
    const specialistPromises = selectedAgentIds.map(async (agentId, index) => {
      const agentConfig = agents.find(a => a.id === agentId);
      if (!agentConfig) return;

      // Stagger request start by 350ms per agent when on free Gemini provider
      if (settings.activeProvider === 'gemini' && !settings.mockMode && index > 0) {
        await new Promise(r => setTimeout(r, index * 350));
      }

      const startTime = Date.now();
      try {
        const output = await executeAgent({
          agent: agentConfig,
          settings,
          userPrompt: combinedChallengeInput,
          imageBase64,
          signal
        });

        const endTime = Date.now();
        const extractedFlag = extractFlagCandidate(output);

        // Update this agent's status
        setCurrentReport(prev => {
          if (!prev) return null;
          return {
            ...prev,
            agentResults: {
              ...prev.agentResults,
              [agentId]: {
                agentId,
                status: 'completed',
                output,
                startTime,
                endTime,
                executionTimeMs: endTime - startTime,
                extractedFlag
              }
            }
          };
        });

        return { agentId, output, success: true };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const endTime = Date.now();

        setCurrentReport(prev => {
          if (!prev) return null;
          return {
            ...prev,
            agentResults: {
              ...prev.agentResults,
              [agentId]: {
                agentId,
                status: 'error',
                output: '',
                startTime,
                endTime,
                executionTimeMs: endTime - startTime,
                error: errorMsg
              }
            }
          };
        });

        return { agentId, error: errorMsg, success: false };
      }
    });

    // Wait for all specialists to finish
    const specialistResults = await Promise.allSettled(specialistPromises);

    // If cancelled, exit early
    if (signal.aborted) {
      setIsAnalyzing(false);
      return;
    }

    // Phase 2: Send all findings to Agent 10: FlagAssembler
    if (coordinatorAgent) {
      // Mark coordinator as running
      setCurrentReport(prev => {
        if (!prev) return null;
        return {
          ...prev,
          agentResults: {
            ...prev.agentResults,
            [coordinatorAgent.id]: {
              agentId: coordinatorAgent.id,
              status: 'running',
              output: '',
              startTime: Date.now()
            }
          }
        };
      });

      // Assemble findings document
      const findingsList: string[] = [];
      specialistResults.forEach(res => {
        if (res.status === 'fulfilled' && res.value && 'output' in res.value && res.value.output) {
          const val = res.value as { agentId: AgentId; output: string; success: boolean };
          const agentConf = agents.find(a => a.id === val.agentId);
          findingsList.push(`## ${agentConf?.name || val.agentId} (${agentConf?.category || 'Specialist'})\n${val.output}`);
        }
      });

      const assembledFindings = findingsList.length > 0 
        ? findingsList.join('\n\n---\n\n')
        : 'No specialist agents returned usable findings.';

      const coordinatorUserPrompt = `Findings from all agents:\n\n${assembledFindings}\n\nOriginal Challenge Input & Forensic Artifacts:\n${combinedChallengeInput}`;

      try {
        const coordinatorOutput = await executeAgent({
          agent: coordinatorAgent,
          settings,
          userPrompt: coordinatorUserPrompt,
          imageBase64,
          signal
        });

        const fileFlags = currentFiles.flatMap(f => f.flagCandidates || []);
        let primaryFlag = fileFlags.length > 0 ? fileFlags[0] : extractFlagCandidate(coordinatorOutput);

        // Parse confidence score if mentioned (e.g. Confidence: 95%)
        const confMatch = coordinatorOutput.match(/Confidence[:\s*]+([0-9]{1,3})%/i);
        const confidence = fileFlags.length > 0 ? 100 : (confMatch ? parseInt(confMatch[1], 10) : (primaryFlag ? 95 : 50));

        setCurrentReport(prev => {
          if (!prev) return null;
          return {
            ...prev,
            agentResults: {
              ...prev.agentResults,
              [coordinatorAgent.id]: {
                agentId: coordinatorAgent.id,
                status: 'completed',
                output: coordinatorOutput,
                endTime: Date.now()
              }
            },
            flagReport: coordinatorOutput,
            primaryFlag,
            confidence,
            isFinished: true
          };
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setCurrentReport(prev => {
          if (!prev) return null;
          return {
            ...prev,
            agentResults: {
              ...prev.agentResults,
              [coordinatorAgent.id]: {
                agentId: coordinatorAgent.id,
                status: 'error',
                output: '',
                error: errorMsg
              }
            },
            isFinished: true
          };
        });
      }
    }

    setIsAnalyzing(false);
  };

  const handleAbortAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
  };

  const selectedAgentForModal = modalAgentId ? agents.find(a => a.id === modalAgentId) : null;
  const resultForModal = modalAgentId && currentReport ? currentReport.agentResults[modalAgentId] : null;

  if (!isAuthenticated) {
    return <TokenGateModal onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="cyber-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Sticky Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
        onOpenDiscoveryModal={() => setIsDiscoveryModalOpen(true)}
        settings={settings}
        onToggleMockMode={handleToggleMockMode}
        isAnalyzing={isAnalyzing}
      />

      {/* Main Container */}
      <main style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '1.5rem', flex: 1 }}>
        {currentTab === 'swarm' && (
          <div>
            {/* Challenge Input Section */}
            <ChallengeInput
              challengeText={challengeText}
              onChallengeTextChange={setChallengeText}
              imageBase64={imageBase64}
              onImageChange={(b64, prev) => {
                setImageBase64(b64);
                setImagePreviewUrl(prev);
              }}
              imagePreviewUrl={imagePreviewUrl}
              attachedFiles={attachedFiles}
              onAddAttachedFile={handleAddAttachedFile}
              onRemoveAttachedFile={handleRemoveAttachedFile}
              onSelectRecommendedAgents={handleSelectRecommendedAgents}
              agents={agents}
              selectedAgentIds={selectedAgentIds}
              onToggleAgent={handleToggleAgent}
              onSelectAllAgents={handleSelectAllAgents}
              onSelectCategory={handleSelectCategory}
              onLaunchSwarm={handleLaunchSwarm}
              isAnalyzing={isAnalyzing}
              onAbortAnalysis={handleAbortAnalysis}
              onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
            />

            {/* Swarm Dashboard & Flag Report */}
            <SwarmDashboard
              agents={agents}
              currentReport={currentReport}
              onSelectAgentForModal={setModalAgentId}
              isAnalyzing={isAnalyzing}
            />
          </div>
        )}

        {currentTab === 'solo' && (
          <SoloAgentView
            agents={agents}
            settings={settings}
          />
        )}

        {currentTab === 'prompts' && (
          <PromptManager
            agents={agents}
            onUpdateAgent={handleUpdateAgent}
            onResetAgentPrompt={handleResetAgentPrompt}
            onResetAllAgents={handleResetAllAgents}
          />
        )}

        {currentTab === 'agent' && (
          <LocalAgentView />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'rgba(2, 6, 23, 0.9)',
        padding: '1.25rem 1.5rem',
        textAlign: 'center',
        fontSize: '0.8125rem',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span>🏴‍☠️ <strong>CTF Swarm AI</strong> — 10 Specialist Agents Collaborative Intelligence Platform</span>
          <span>•</span>
          <span>Bun + Vite + React</span>
          <span>•</span>
          <span>OpenRouter Integration</span>
        </div>
      </footer>

      {/* Modals */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onOpenDiscoveryModal={() => setIsDiscoveryModalOpen(true)}
      />

      <ModelDiscoveryModal
        isOpen={isDiscoveryModalOpen}
        onClose={() => setIsDiscoveryModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        agents={agents}
        onUpdateAllAgentsModel={handleUpdateAllAgentsModel}
      />

      <PresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      <AgentModal
        agent={selectedAgentForModal || null}
        result={resultForModal || null}
        onClose={() => setModalAgentId(null)}
      />
    </div>
  );
}

export default App;
