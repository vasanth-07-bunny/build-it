/**
 * lib/ai-providers.ts
 *
 * A single, provider-agnostic function: askAI(prompt, opts) -> string
 *
 * Every route in the orchestrator calls THIS, never a specific
 * vendor SDK. Swapping OpenAI <-> Claude <-> Gemini is a one-line
 * env var change (DEFAULT_AI_PROVIDER), not a code change.
 * That's the "orchestration layer, not one AI builder" idea from
 * the architecture doc.
 */

export type Provider = 'openai' | 'anthropic' | 'gemini';

export interface AskOptions {
  provider?: Provider;
  system?: string;
  maxTokens?: number;
  json?: boolean; // if true, instruct the model to return ONLY JSON
}

function resolveProvider(explicit?: Provider): Provider {
  if (explicit) return explicit;
  const fallback = (process.env.DEFAULT_AI_PROVIDER as Provider) || 'anthropic';
  if (fallback === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (fallback === 'openai' && process.env.OPENAI_API_KEY) return 'openai';
  if (fallback === 'gemini' && process.env.GOOGLE_GEMINI_API_KEY) return 'gemini';
  // fall back to whichever key actually exists
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GOOGLE_GEMINI_API_KEY) return 'gemini';
  throw new Error(
    'No AI provider key found. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_GEMINI_API_KEY.'
  );
}

async function callAnthropic(prompt: string, opts: AskOptions): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: opts.maxTokens ?? 1500,
      system: opts.system,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.map((b: any) => b.text || '').join('\n') ?? '';
}

async function callOpenAI(prompt: string, opts: AskOptions): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: opts.maxTokens ?? 1500,
      response_format: opts.json ? { type: 'json_object' } : undefined,
      messages: [
        ...(opts.system ? [{ role: 'system', content: opts.system }] : []),
        { role: 'user', content: prompt }
      ]
    })
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callGemini(prompt: string, opts: AskOptions): Promise<string> {
  const model = 'gemini-1.5-pro';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: opts.system ? `${opts.system}\n\n${prompt}` : prompt }]
          }
        ],
        generationConfig: { maxOutputTokens: opts.maxTokens ?? 1500 }
      })
    }
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n') ?? '';
}

export async function askAI(prompt: string, opts: AskOptions = {}): Promise<string> {
  const provider = resolveProvider(opts.provider);
  switch (provider) {
    case 'anthropic':
      return callAnthropic(prompt, opts);
    case 'openai':
      return callOpenAI(prompt, opts);
    case 'gemini':
      return callGemini(prompt, opts);
  }
}

/** Ask for structured JSON and parse it safely, stripping code fences. */
export async function askAIForJSON<T = any>(prompt: string, opts: AskOptions = {}): Promise<T> {
  const raw = await askAI(prompt, { ...opts, json: true });
  const cleaned = raw.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(`AI response was not valid JSON: ${cleaned.slice(0, 300)}`);
  }
}
