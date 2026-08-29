/**
 * lib/ai-providers.ts
 *
 * Provider-agnostic AI calling layer with intelligent fallback simulation.
 * Supports: Anthropic Claude, OpenAI GPT-4o, Google Gemini, and Simulated Offline Engine.
 */

export type Provider = 'openai' | 'anthropic' | 'gemini' | 'simulated';

export interface AskOptions {
  provider?: Provider;
  apiKey?: string;
  system?: string;
  maxTokens?: number;
  json?: boolean;
}

export function resolveProvider(explicit?: Provider, customKey?: string): { provider: Provider; key?: string } {
  if (explicit === 'simulated') {
    return { provider: 'simulated' };
  }

  if (explicit && customKey) {
    return { provider: explicit, key: customKey };
  }

  if (explicit) {
    if (explicit === 'anthropic' && (customKey || process.env.ANTHROPIC_API_KEY)) {
      return { provider: 'anthropic', key: customKey || process.env.ANTHROPIC_API_KEY };
    }
    if (explicit === 'openai' && (customKey || process.env.OPENAI_API_KEY)) {
      return { provider: 'openai', key: customKey || process.env.OPENAI_API_KEY };
    }
    if (explicit === 'gemini' && (customKey || process.env.GOOGLE_GEMINI_API_KEY)) {
      return { provider: 'gemini', key: customKey || process.env.GOOGLE_GEMINI_API_KEY };
    }
  }

  const fallback = (process.env.DEFAULT_AI_PROVIDER as Provider) || 'anthropic';
  if (fallback === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    return { provider: 'anthropic', key: process.env.ANTHROPIC_API_KEY };
  }
  if (fallback === 'openai' && process.env.OPENAI_API_KEY) {
    return { provider: 'openai', key: process.env.OPENAI_API_KEY };
  }
  if (fallback === 'gemini' && process.env.GOOGLE_GEMINI_API_KEY) {
    return { provider: 'gemini', key: process.env.GOOGLE_GEMINI_API_KEY };
  }

  if (process.env.ANTHROPIC_API_KEY) return { provider: 'anthropic', key: process.env.ANTHROPIC_API_KEY };
  if (process.env.OPENAI_API_KEY) return { provider: 'openai', key: process.env.OPENAI_API_KEY };
  if (process.env.GOOGLE_GEMINI_API_KEY) return { provider: 'gemini', key: process.env.GOOGLE_GEMINI_API_KEY };

  // Fallback to simulated offline engine so deployments without keys never crash
  return { provider: 'simulated' };
}

async function callAnthropic(prompt: string, opts: AskOptions, apiKey: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: opts.maxTokens ?? 2000,
      system: opts.system,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Anthropic error (${res.status}): ${errorText}`);
  }
  const data = await res.json();
  return data.content?.map((b: any) => b.text || '').join('\n') ?? '';
}

async function callOpenAI(prompt: string, opts: AskOptions, apiKey: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: opts.maxTokens ?? 2000,
      response_format: opts.json ? { type: 'json_object' } : undefined,
      messages: [
        ...(opts.system ? [{ role: 'system', content: opts.system }] : []),
        { role: 'user', content: prompt }
      ]
    })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI error (${res.status}): ${errorText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callGemini(prompt: string, opts: AskOptions, apiKey: string): Promise<string> {
  const model = 'gemini-1.5-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: opts.system ? `${opts.system}\n\n${prompt}` : prompt }]
          }
        ],
        generationConfig: {
          maxOutputTokens: opts.maxTokens ?? 2000,
          responseMimeType: opts.json ? 'application/json' : 'text/plain'
        }
      })
    }
  );
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini error (${res.status}): ${errorText}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n') ?? '';
}

export async function askAI(prompt: string, opts: AskOptions = {}): Promise<string> {
  const { provider, key } = resolveProvider(opts.provider, opts.apiKey);

  if (provider === 'simulated' || !key) {
    throw new Error('SIMULATED_FALLBACK');
  }

  try {
    switch (provider) {
      case 'anthropic':
        return await callAnthropic(prompt, opts, key);
      case 'openai':
        return await callOpenAI(prompt, opts, key);
      case 'gemini':
        return await callGemini(prompt, opts, key);
      default:
        throw new Error('SIMULATED_FALLBACK');
    }
  } catch (err: any) {
    console.warn(`Upstream AI call failed (${err.message}). Defaulting to simulated fallback.`);
    throw err;
  }
}

/** Ask for structured JSON and parse safely */
export async function askAIForJSON<T = any>(prompt: string, opts: AskOptions = {}): Promise<T> {
  const raw = await askAI(prompt, { ...opts, json: true });
  const cleaned = raw.replace(/```json\s*|```/g, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(`AI response was not valid JSON: ${cleaned.slice(0, 300)}`);
  }
}
