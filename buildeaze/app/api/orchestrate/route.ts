import { NextRequest, NextResponse } from 'next/server';
import { runPlanningPhase, ProjectType } from '@/lib/pipeline';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { problemStatement, projectType } = body as {
      problemStatement?: string;
      projectType?: ProjectType;
    };

    if (!problemStatement || problemStatement.trim().length < 10) {
      return NextResponse.json(
        { error: 'problemStatement is required and should be a real sentence or two.' },
        { status: 400 }
      );
    }

    const result = await runPlanningPhase(problemStatement, projectType ?? 'web-app');
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('orchestrate error', err);
    return NextResponse.json(
      { error: err.message ?? 'Orchestration failed. Check your AI provider key in .env.local.' },
      { status: 500 }
    );
  }
}
