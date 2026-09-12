import { callGeminiApi } from './gemini';
import { callOpenRouter } from './openrouter';
import type { AIProvider } from '../types';

export interface ModelTestLog {
  model: string;
  status: 'testing' | 'success' | 'failed';
  latencyMs?: number;
  error?: string;
  responseSnippet?: string;
}

export interface ModelDiscoveryResult {
  success: boolean;
  workingModel?: string;
  provider: AIProvider;
  latencyMs?: number;
  testedCount: number;
  logs: ModelTestLog[];
  error?: string;
}

// Candidate Gemini models to test in priority order
export const GEMINI_TEST_CANDIDATES = [
  'gemini-flash-lite-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-2.5-pro',
  'gemini-1.5-pro',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.0-flash-exp'
];

// Candidate OpenRouter models (free models first, then popular high-end models)
export const OPENROUTER_TEST_CANDIDATES = [
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-r1:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemini-2.5-flash',
  'openai/gpt-4o-mini',
  'openai/o4-mini',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-sonnet-4'
];

/**
 * Fetch available Gemini models from Google AI Studio API for the given key
 */
export async function fetchAvailableGeminiModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
    if (!res.ok) return GEMINI_TEST_CANDIDATES;

    const data = await res.json();
    if (!Array.isArray(data?.models)) return GEMINI_TEST_CANDIDATES;

    const models = data.models
      .filter((m: { supportedGenerationMethods?: string[] }) => 
        Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent')
      )
      .map((m: { name: string }) => m.name.replace(/^models\//, ''));

    if (models.length === 0) return GEMINI_TEST_CANDIDATES;

    // Prioritize gemini-flash-lite-latest, flash-lite, and flash models
    const sorted = [...models].sort((a, b) => {
      const getScore = (m: string) => {
        if (m === 'gemini-flash-lite-latest') return 100;
        let score = 0;
        if (m.includes('flash-lite')) score += 50;
        if (m.includes('flash')) score += 30;
        if (m.includes('2.5')) score += 10;
        if (m.includes('2.0')) score += 5;
        return score;
      };
      return getScore(b) - getScore(a);
    });

    return sorted;
  } catch {
    return GEMINI_TEST_CANDIDATES;
  }
}

/**
 * Probe a single model with a lightweight test prompt
 */
export async function probeSingleModel(
  provider: AIProvider,
  apiKey: string,
  model: string,
  signal?: AbortSignal
): Promise<{ success: boolean; latencyMs: number; responseSnippet?: string; error?: string }> {
  const startTime = Date.now();
  const testPrompt = 'Ping. Respond with exactly the word "PONG" and nothing else.';
  const systemPrompt = 'You are a test ping agent. Only reply with PONG.';

  try {
    let resultText = '';
    if (provider === 'gemini') {
      resultText = await callGeminiApi({
        apiKey,
        model,
        systemPrompt,
        userPrompt: testPrompt,
        temperature: 0.1,
        maxTokens: 30,
        signal
      });
    } else {
      resultText = await callOpenRouter({
        apiKey,
        model,
        systemPrompt,
        userPrompt: testPrompt,
        temperature: 0.1,
        maxTokens: 30,
        signal
      });
    }

    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      latencyMs,
      responseSnippet: resultText.trim().slice(0, 50)
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      latencyMs,
      error: errorMsg
    };
  }
}

/**
 * Scan candidate models sequentially until a working model is discovered!
 */
export async function scanForWorkingModel(
  provider: AIProvider,
  apiKey: string,
  onProgress?: (log: ModelTestLog, currentIdx: number, total: number) => void,
  signal?: AbortSignal
): Promise<ModelDiscoveryResult> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return {
      success: false,
      provider,
      testedCount: 0,
      logs: [],
      error: `กรุณากรอก API Key ของ ${provider === 'gemini' ? 'Google Gemini' : 'OpenRouter'} ก่อนทำการค้นหาโมเดล`
    };
  }

  // Get candidate list
  let candidateModels: string[];
  if (provider === 'gemini') {
    const fetched = await fetchAvailableGeminiModels(cleanKey);
    const combined = Array.from(new Set(['gemini-flash-lite-latest', ...fetched, ...GEMINI_TEST_CANDIDATES]));
    candidateModels = combined;
  } else {
    candidateModels = OPENROUTER_TEST_CANDIDATES;
  }

  const logs: ModelTestLog[] = [];
  const maxToTest = Math.min(candidateModels.length, 12);

  for (let i = 0; i < maxToTest; i++) {
    if (signal?.aborted) {
      return {
        success: false,
        provider,
        testedCount: i,
        logs,
        error: 'ผู้ใช้ยกเลิกการค้นหาโมเดล (Aborted)'
      };
    }

    const model = candidateModels[i];
    const initialLog: ModelTestLog = {
      model,
      status: 'testing'
    };

    onProgress?.(initialLog, i + 1, maxToTest);

    const probeResult = await probeSingleModel(provider, cleanKey, model, signal);

    const finishedLog: ModelTestLog = {
      model,
      status: probeResult.success ? 'success' : 'failed',
      latencyMs: probeResult.latencyMs,
      responseSnippet: probeResult.responseSnippet,
      error: probeResult.error
    };

    logs.push(finishedLog);
    onProgress?.(finishedLog, i + 1, maxToTest);

    // If successful, stop and return the working model!
    if (probeResult.success) {
      return {
        success: true,
        workingModel: model,
        provider,
        latencyMs: probeResult.latencyMs,
        testedCount: i + 1,
        logs
      };
    }
  }

  return {
    success: false,
    provider,
    testedCount: maxToTest,
    logs,
    error: `ทดสอบครบทั้ง ${maxToTest} โมเดลแล้ว แต่ไม่พบโมเดลที่ตอบกลับสำเร็จ กรุณาตรวจสอบ API Key หรือโควตาเครดิต`
  };
}
