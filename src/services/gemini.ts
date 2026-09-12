export interface GeminiCallOptions {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  imageBase64?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', note: 'แนะนำ - เร็ว ฉลาด วิเคราะห์รูปภาพ/มัลติโมดอลได้ยอดเยี่ยม' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', note: 'การคิดหาเหตุผลเชิงลึก เหมาะกับงาน Reverse & Cryptanalysis' },
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', note: 'โมเดลรุ่นใหม่ล่าสุด รวดเร็วและแม่นยำสูง' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite', note: 'ความเร็วสูงสุด ต้นทุนต่ำสุด' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', note: 'โมเดลพรีวิวขั้นสูงสำหรับโค้ดและงานวิจัย' }
];

export async function callGeminiApi(options: GeminiCallOptions): Promise<string> {
  const { apiKey, model, systemPrompt, userPrompt, imageBase64, temperature = 0.2, maxTokens = 4000, signal } = options;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('กรุณากรอก Google Gemini API Key ในหน้าการตั้งค่า หรือเปิด "โหมดจำลองสถานการณ์ (Simulation Mode)"');
  }

  // Strip prefix like "google/" or "models/" if user entered openrouter style
  let cleanModel = model.replace(/^(google\/|models\/)/i, '');
  if (!cleanModel || cleanModel === '') {
    cleanModel = 'gemini-2.5-flash';
  }

  // Build user contents parts
  type GeminiPart = { text?: string; inlineData?: { mimeType: string; data: string } };
  const parts: GeminiPart[] = [{ text: userPrompt || 'วิเคราะห์ข้อมูลเพื่อหา Flag สำหรับการแข่งขัน CTF' }];

  if (imageBase64) {
    let mimeType = 'image/png';
    let data = imageBase64;

    if (imageBase64.includes(';base64,')) {
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        data = match[2];
      }
    }

    parts.push({
      inlineData: {
        mimeType,
        data
      }
    });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey.trim()}`;

  const requestBody: {
    contents: Array<{ role: string; parts: GeminiPart[] }>;
    systemInstruction?: { parts: Array<{ text: string }> };
    generationConfig: { temperature: number; maxOutputTokens: number };
  } = {
    contents: [
      {
        role: 'user',
        parts
      }
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens
    }
  };

  if (systemPrompt && systemPrompt.trim() !== '') {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    let errorMsg = `Gemini API Error (${response.status} ${response.statusText})`;
    try {
      const errData = await response.json();
      if (errData?.error?.message) {
        errorMsg = `Gemini: ${errData.error.message}`;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];

  if (!candidate) {
    throw new Error('Google Gemini ไม่ได้ส่งผลลัพธ์กลับมา (No candidates returned)');
  }

  if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
    if (candidate.finishReason === 'SAFETY') {
      throw new Error('คำตอบถูกระงับโดยระบบความปลอดภัยของ Gemini (Finish Reason: SAFETY)');
    }
  }

  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('ไม่พบข้อความตอบกลับในผลลัพธ์ของ Gemini');
  }

  return text;
}

/**
 * Verify Google Gemini API Key
 */
export async function testGeminiKey(apiKey: string): Promise<{ valid: boolean; modelsCount?: number; error?: string }> {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`, {
      method: 'GET'
    });

    if (!res.ok) {
      let errDetail = `Status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.error?.message) {
          errDetail = errJson.error.message;
        }
      } catch {
        // ignore
      }
      return { valid: false, error: `Google Gemini API Key ไม่ถูกต้อง: ${errDetail}` };
    }

    const data = await res.json();
    const modelsCount = Array.isArray(data?.models) ? data.models.length : undefined;

    return {
      valid: true,
      modelsCount
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, error: `ไม่สามารถเชื่อมต่อไปยัง Google Gemini API ได้: ${message}` };
  }
}
