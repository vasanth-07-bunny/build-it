/**
 * lib/pipeline.ts
 *
 * The orchestration logic: turns a raw hackathon problem statement
 * into (1) a requirements breakdown, (2) a suggested architecture,
 * and (3) a requirement-traceability matrix skeleton — the thing
 * that later gets checked off as evidence/tests land.
 *
 * This layer is build-engine-agnostic on purpose: it hands off a
 * structured brief that you paste into Lovable/Replit/Bolt/Cursor/
 * Claude Code/Codex/whatever — BuildEaze does not lock you into one.
 */

import { askAIForJSON } from './ai-providers';

export type ProjectType =
  | 'website'
  | 'web-app'
  | 'mobile'
  | 'ai-ml'
  | 'iot'
  | 'saas'
  | 'hardware'
  | 'other';

export interface RequirementItem {
  id: string;
  requirement: string;
  priority: 'must' | 'should' | 'nice-to-have';
  suggestedFeature: string;
  evidence: string | null; // filled in later once implemented
  testStatus: 'not-started' | 'in-progress' | 'passing' | 'failing';
}

export interface OrchestrationResult {
  summary: string;
  projectType: ProjectType;
  requirements: RequirementItem[];
  architecture: {
    frontend: string;
    backend: string;
    database: string;
    aiComponents: string[];
    deployment: string;
  };
  suggestedBuildEngines: string[];
  riskFlags: string[];
}

const SYSTEM_PROMPT = `You are the planning layer of BuildEaze, a universal hackathon
orchestration tool. Given a raw hackathon problem statement, produce a structured
build brief. Be concrete and hackathon-realistic (buildable in 24-48 hours), not
enterprise-scale. Always respond with ONLY valid JSON matching the requested shape,
no prose, no markdown fences.`;

export async function runPlanningPhase(
  problemStatement: string,
  projectType: ProjectType
): Promise<OrchestrationResult> {
  const prompt = `Problem statement:\n"""${problemStatement}"""\n\nDeclared project type: ${projectType}\n\nReturn JSON with this exact shape:
{
  "summary": string (2-3 sentences),
  "requirements": [
    { "id": "R1", "requirement": string, "priority": "must"|"should"|"nice-to-have", "suggestedFeature": string }
  ],
  "architecture": {
    "frontend": string,
    "backend": string,
    "database": string,
    "aiComponents": string[],
    "deployment": string
  },
  "suggestedBuildEngines": string[] (pick from: Lovable, Replit, Bolt, v0, Cursor, Claude Code, Codex, Gemini CLI, Manual/GitHub),
  "riskFlags": string[] (things likely to trip up judges or the security/testing pipeline)
}
Return 5-8 requirements ordered by priority, must-haves first.`;

  const raw = await askAIForJSON<Omit<OrchestrationResult, 'projectType' | 'requirements'> & {
    requirements: Omit<RequirementItem, 'evidence' | 'testStatus'>[];
  }>(prompt, { system: SYSTEM_PROMPT, maxTokens: 2000 });

  return {
    ...raw,
    projectType,
    requirements: raw.requirements.map((r) => ({
      ...r,
      evidence: null,
      testStatus: 'not-started' as const
    }))
  };
}
