import { NextRequest, NextResponse } from 'next/server';
import { runPlanningPhase, ProjectType } from '@/lib/pipeline';
import { Provider } from '@/lib/ai-providers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { problemStatement, projectType, provider, apiKey } = body as {
      problemStatement?: string;
      projectType?: ProjectType;
      provider?: Provider;
      apiKey?: string;
    };

    if (!problemStatement || problemStatement.trim().length < 5) {
      return NextResponse.json(
        { error: 'Please enter a problem statement describing what you are building.' },
        { status: 400 }
      );
    }

    const customKey = apiKey || req.headers.get('x-api-key') || undefined;
    const chosenProvider = provider || (req.headers.get('x-provider') as Provider) || undefined;

    const result = await runPlanningPhase(
      problemStatement.trim(),
      projectType ?? 'web-app',
      { provider: chosenProvider, apiKey: customKey }
    );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Orchestrate route error:', err);
    return NextResponse.json(
      { error: err.message ?? 'Orchestration failed. Fallback engine will be used.' },
      { status: 500 }
    );
  }
}
