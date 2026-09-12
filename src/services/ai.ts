import type { AgentConfig, ProviderSettings } from '../types';
import { callOpenRouter, simulateAgentResponse } from './openrouter';
import { callGeminiApi } from './gemini';

export interface ExecuteAgentOptions {
  agent: AgentConfig;
  settings: ProviderSettings;
  userPrompt: string;
  imageBase64?: string;
  signal?: AbortSignal;
}

export async function executeAgent(options: ExecuteAgentOptions): Promise<string> {
  const { agent, settings, userPrompt, imageBase64, signal } = options;

  // 1. Mock / Simulation Mode
  if (settings.mockMode) {
    return simulateAgentResponse(agent.id, userPrompt);
  }

  // 2. Google Gemini Provider
  if (settings.activeProvider === 'gemini') {
    const key = settings.geminiApiKey?.trim();
    if (!key) {
      throw new Error('กรุณากรอก Google Gemini API Key ในการตั้งค่า หรือเปิดโหมดจำลองสถานการณ์ (Simulation Mode)');
    }

    // Determine model for Gemini: if the agent's currentModel starts with gemini, use it; otherwise use geminiDefaultModel or gemini-2.5-flash
    let modelToUse = agent.currentModel;
    if (!modelToUse.toLowerCase().includes('gemini')) {
      modelToUse = settings.geminiDefaultModel || 'gemini-2.5-flash';
    }

    return callGeminiApi({
      apiKey: key,
      model: modelToUse,
      systemPrompt: agent.prompt,
      userPrompt,
      imageBase64,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      signal
    });
  }

  // 3. OpenRouter Provider
  const openRouterKey = (settings.openRouterApiKey || settings.apiKey || '').trim();
  if (!openRouterKey) {
    throw new Error('กรุณากรอก OpenRouter API Key ในการตั้งค่า หรือเปิดโหมดจำลองสถานการณ์ (Simulation Mode)');
  }

  return callOpenRouter({
    apiKey: openRouterKey,
    model: agent.currentModel,
    systemPrompt: agent.prompt,
    userPrompt,
    imageBase64,
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
    signal
  });
}
