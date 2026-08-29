/**
 * lib/pipeline.ts
 *
 * The orchestration logic: turns a raw hackathon problem statement
 * into (1) a requirements breakdown, (2) a suggested architecture,
 * (3) a requirement-traceability matrix skeleton, (4) timeline milestones,
 * and (5) builder-specific prompts (Cursor, Lovable, Claude Code, Bolt, Replit).
 */

import { askAIForJSON, Provider } from './ai-providers';

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
  assignedTo?: string;
  evidence: string | null;
  testStatus: 'not-started' | 'in-progress' | 'passing' | 'failing';
}

export interface SprintMilestone {
  timeframe: string;
  goal: string;
  deliverables: string[];
}

export interface OrchestrationResult {
  summary: string;
  projectType: ProjectType;
  providerUsed: string;
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
  sprintPlan: SprintMilestone[];
  judgePitch: {
    hook: string;
    demoFlow: string[];
    technicalHighlights: string[];
  };
  builderPrompts: {
    cursorRules: string;
    claudeCode: string;
    lovable: string;
    bolt: string;
  };
}

const SYSTEM_PROMPT = `You are the chief planning & orchestration AI for BuildEaze, a universal hackathon engineering platform.
Given a raw hackathon problem statement and project type, produce an actionable, production-grade build brief built for rapid 24-48h hackathons.
Be concrete, specific, and realistic. Always return strictly valid JSON matching the schema without markdown code blocks.`;

export function generateSimulatedPlan(
  problemStatement: string,
  projectType: ProjectType
): OrchestrationResult {
  const text = problemStatement.toLowerCase();

  let domain = 'General Web Application';
  let frontend = 'Next.js 15 (React 19, TypeScript, TailwindCSS / CSS Modules)';
  let backend = 'Next.js Route Handlers + Edge Runtime';
  let db = 'Supabase PostgreSQL + Prisma ORM';
  let aiComp = ['OpenAI / Anthropic Structured Output API', 'Embeddings Vector Search'];
  let deployment = 'Vercel / Cloudflare Pages';

  if (text.includes('health') || text.includes('med') || text.includes('doctor') || text.includes('patient')) {
    domain = 'HealthTech AI Diagnostic & Patient Care';
    frontend = 'Next.js 15 + TailwindCSS + Radix UI + Lucide Icons';
    backend = 'FastAPI Python Backend + Next.js Gateway';
    db = 'PostgreSQL + pgvector (HIPAA-compliant schema sandbox)';
    aiComp = ['Medical NER Extraction (Claude 3.5 Sonnet)', 'RAG Clinical Literature Search'];
    deployment = 'Vercel + Railway / AWS ECS';
  } else if (text.includes('crypto') || text.includes('defi') || text.includes('web3') || text.includes('wallet') || text.includes('token')) {
    domain = 'Web3 DeFi Protocol & Real-time Analytics';
    frontend = 'Next.js 15 + Wagmi / Viem + RainbowKit + Recharts';
    backend = 'Node.js Express + Ethers.js Indexer';
    db = 'PostgreSQL (TimescaleDB) + Redis Cache';
    aiComp = ['Smart Contract Audit Agent', 'Predictive Gas / Yield Forecaster'];
    deployment = 'Vercel + Arbitrum / Base Sepolia Testnet';
  } else if (text.includes('iot') || text.includes('sensor') || text.includes('energy') || text.includes('device') || text.includes('hardware')) {
    domain = 'IoT Telemetry & Edge Intelligence';
    frontend = 'Next.js 15 + Chart.js / Leaflet Map Visualizer';
    backend = 'MQTT Broker + Go / Node.js Streaming Ingestion';
    db = 'InfluxDB Time-series + SQLite Edge Sync';
    aiComp = ['Anomaly Detection Model (Isolation Forest)', 'Edge LLM Alert Summarizer'];
    deployment = 'AWS IoT Core + Vercel Dashboard';
  } else if (text.includes('game') || text.includes('multiplayer') || text.includes('canvas') || text.includes('collab')) {
    domain = 'Real-time Multiplayer Collaboration Engine';
    frontend = 'Next.js 15 + Pixi.js / HTML5 Canvas + TailwindCSS';
    backend = 'PartyKit / Liveblocks WebSocket Server';
    db = 'Redis KV Store + Neon Serverless Postgres';
    aiComp = ['Real-time AI Co-player / NPC Engine', 'Procedural Content Generator'];
    deployment = 'PartyKit Cloud + Vercel';
  } else if (text.includes('sec') || text.includes('threat') || text.includes('cyber') || text.includes('audit')) {
    domain = 'Cybersecurity Threat Detection & Audit Sandbox';
    frontend = 'Next.js 15 + Tremor Dashboard + Cytoscape Graph View';
    backend = 'Python FastAPI + Suricata / Gitleaks Worker Engine';
    db = 'Elasticsearch / OpenSearch + PostgreSQL';
    aiComp = ['Vulnerability Triaging Agent (Claude 3.5 Sonnet)', 'Attack Vector Simulator'];
    deployment = 'Vercel + Docker Containers';
  }

  const rawReqs: Array<{ id: string; requirement: string; priority: 'must' | 'should' | 'nice-to-have'; suggestedFeature: string }> = [
    {
      id: 'REQ-01',
      requirement: 'Instant User Onboarding & Interactive Problem Input Workspace',
      priority: 'must',
      suggestedFeature: 'Zero-friction auth or demo mode with pre-loaded mock scenarios and responsive intake form.'
    },
    {
      id: 'REQ-02',
      requirement: 'Core Domain Processing & Real-time AI Analysis Pipeline',
      priority: 'must',
      suggestedFeature: 'Fast streaming or structured AI computation transforming user input into actionable breakdown.'
    },
    {
      id: 'REQ-03',
      requirement: 'Live Interactive Visualization & Requirement Traceability Matrix',
      priority: 'must',
      suggestedFeature: 'Dynamic status toggles, evidence attachment, and live progress calculations for hackathon judges.'
    },
    {
      id: 'REQ-04',
      requirement: 'Multi-engine Code Prompt & Rules Exporter',
      priority: 'should',
      suggestedFeature: '1-click export for Cursor (.cursorrules), Claude Code, Lovable, v0, and Bolt to build the MVP.'
    },
    {
      id: 'REQ-05',
      requirement: 'Automated CI/CD Quality, Security & Accessibility Auditing',
      priority: 'should',
      suggestedFeature: 'Pre-configured GitHub Actions for CodeQL, Gitleaks, Playwright E2E, and axe-core accessibility.'
    },
    {
      id: 'REQ-06',
      requirement: 'One-Click Devpost / Judge Pitch Summary Generator',
      priority: 'nice-to-have',
      suggestedFeature: 'Exportable markdown brief with architecture diagram, test score verification, and live demo link.'
    }
  ];

  const sprintPlan: SprintMilestone[] = [
    {
      timeframe: 'Hours 0 – 8 (Architecture & Setup)',
      goal: 'Scaffold repo, verify CI/CD pipelines, and lock down database schema & AI prompts.',
      deliverables: ['Initialize Next.js / Repo', 'Configure GitHub Actions & Vercel deployment', 'Test core AI API endpoints']
    },
    {
      timeframe: 'Hours 8 – 24 (Core MVP Implementation)',
      goal: 'Build primary user flow, interactive dashboard, and integrate backend AI models.',
      deliverables: ['Build intake UI & interactive matrix', 'Hook up data stores & live streaming', 'Complete MVP demo path']
    },
    {
      timeframe: 'Hours 24 – 36 (Polishing, Testing & Pitch)',
      goal: 'Run accessibility & security audits, record demo video, and write hackathon submission.',
      deliverables: ['Pass Playwright & axe-core audits', 'Generate judge audit report', 'Polish responsive styles & dark mode']
    }
  ];

  const judgePitch = {
    hook: `A high-velocity ${domain} platform solving "${problemStatement.slice(0, 80)}..." with automated quality gates and zero-lockin builder orchestration.`,
    demoFlow: [
      '1. Start with live problem statement ingestion and instant structured breakdown.',
      '2. Demonstrate real-time AI processing with full traceability and verifiable evidence.',
      '3. Show automated CI readiness score verifying security, accessibility, and test pass rates.'
    ],
    technicalHighlights: [
      'Modular architecture ready for Cursor, Claude Code, and Lovable builders.',
      '100% automated CI security (CodeQL, Gitleaks) & accessibility (axe-core).',
      'Production-ready Next.js 15 full-stack architecture with sub-second response times.'
    ]
  };

  const cursorRules = `# .cursorrules for ${domain}
You are an expert full-stack engineer building the hackathon project for "${problemStatement.slice(0, 60)}".
Tech Stack: ${frontend}, ${backend}, ${db}.

Key Guidelines:
1. Always write strict TypeScript with zero any types.
2. Use modern React 19 server/client component separation.
3. Keep code modular: separate business logic in lib/, UI in components/, and routes in app/api/.
4. Provide comprehensive error handling and fallback mock states for demo resilience.
5. Ensure WCAG AA compliance with accessible semantic HTML and ARIA tags.
`;

  const claudeCode = `claude-code project-init --stack="${frontend}, ${backend}" --prompt="Implement the hackathon project for: ${problemStatement.slice(0, 100)}. Follow the requirements: ${rawReqs.map((r) => r.id + ': ' + r.requirement).join('; ')}"`;

  const lovable = `Build a modern, slick, dark-themed ${domain} web application for this hackathon problem:
"${problemStatement}"

Include:
- Hero section with live interactive demo and intake controls.
- Dynamic data visualization and requirement traceability board.
- Responsive layout with glassmorphic cards and keyboard accessibility.
- Built-in mock data mode for seamless judge demonstration.`;

  const bolt = `Create a full-stack Next.js web application implementing:
${problemStatement}
Architecture: ${frontend}, ${backend}.
Deliver must-have features:
${rawReqs.filter((r) => r.priority === 'must').map((r) => `- ${r.requirement}: ${r.suggestedFeature}`).join('\n')}`;

  return {
    summary: `BuildEaze has synthesized a 24-48h hackathon blueprint for "${domain}". The architecture uses ${frontend} with ${backend} and ${db}, structured to pass security and accessibility audits while enabling rapid prototyping across any AI code engine.`,
    projectType,
    providerUsed: 'BuildEaze Intelligent Fallback Engine (Offline Mode)',
    requirements: rawReqs.map((r) => ({
      ...r,
      evidence: null,
      testStatus: 'not-started' as const
    })),
    architecture: {
      frontend,
      backend,
      database: db,
      aiComponents: aiComp,
      deployment
    },
    suggestedBuildEngines: ['Cursor', 'Claude Code', 'Lovable', 'v0', 'Bolt', 'Replit'],
    riskFlags: [
      'API rate limits during live judge demos — maintain local mock fallback.',
      'Ensure environment secrets are never committed to public repositories (verified via Gitleaks).',
      'Test mobile viewport responsiveness to avoid layout breakages on judge review devices.'
    ],
    sprintPlan,
    judgePitch,
    builderPrompts: {
      cursorRules,
      claudeCode,
      lovable,
      bolt
    }
  };
}

export async function runPlanningPhase(
  problemStatement: string,
  projectType: ProjectType,
  options?: { provider?: Provider; apiKey?: string }
): Promise<OrchestrationResult> {
  const prompt = `Problem Statement:
"""${problemStatement}"""

Declared Project Type: ${projectType}

Return a valid JSON object matching this exact TypeScript structure:
{
  "summary": string,
  "requirements": [
    { "id": "REQ-01", "requirement": string, "priority": "must" | "should" | "nice-to-have", "suggestedFeature": string }
  ],
  "architecture": {
    "frontend": string,
    "backend": string,
    "database": string,
    "aiComponents": string[],
    "deployment": string
  },
  "suggestedBuildEngines": string[],
  "riskFlags": string[],
  "sprintPlan": [
    { "timeframe": string, "goal": string, "deliverables": string[] }
  ],
  "judgePitch": {
    "hook": string,
    "demoFlow": string[],
    "technicalHighlights": string[]
  },
  "builderPrompts": {
    "cursorRules": string,
    "claudeCode": string,
    "lovable": string,
    "bolt": string
  }
}
Provide 5-8 requirements, realistic 3-phase sprint milestones, and concrete prompt code.`;

  try {
    const raw = await askAIForJSON<Omit<OrchestrationResult, 'projectType' | 'requirements' | 'providerUsed'> & {
      requirements: Omit<RequirementItem, 'evidence' | 'testStatus'>[];
    }>(prompt, {
      system: SYSTEM_PROMPT,
      maxTokens: 2500,
      provider: options?.provider,
      apiKey: options?.apiKey
    });

    return {
      ...raw,
      projectType,
      providerUsed: options?.provider ?? (process.env.DEFAULT_AI_PROVIDER || 'anthropic'),
      requirements: raw.requirements.map((r) => ({
        ...r,
        evidence: null,
        testStatus: 'not-started' as const
      }))
    };
  } catch (err: any) {
    console.info('Using simulated planning engine fallback:', err.message);
    return generateSimulatedPlan(problemStatement, projectType);
  }
}
