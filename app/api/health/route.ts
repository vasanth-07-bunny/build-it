import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const anthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const openai = Boolean(process.env.OPENAI_API_KEY);
  const gemini = Boolean(process.env.GOOGLE_GEMINI_API_KEY);
  const hasAnyKey = anthropic || openai || gemini;

  return NextResponse.json({
    ok: true,
    status: 'operational',
    providers: {
      anthropic,
      openai,
      gemini,
      simulated: true
    },
    activeMode: hasAnyKey ? 'live-ai' : 'simulated-engine',
    github: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO),
    defaultProvider: process.env.DEFAULT_AI_PROVIDER ?? (hasAnyKey ? (anthropic ? 'anthropic' : openai ? 'openai' : 'gemini') : 'simulated'),
    version: '1.0.0'
  });
}
