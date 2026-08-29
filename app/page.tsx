'use client';

import { useEffect, useState, useTransition } from 'react';
import styles from './page.module.css';

type ProjectType =
  | 'web-app'
  | 'website'
  | 'mobile'
  | 'ai-ml'
  | 'iot'
  | 'saas'
  | 'hardware'
  | 'other';

type Provider = 'anthropic' | 'openai' | 'gemini' | 'simulated';

interface RequirementItem {
  id: string;
  requirement: string;
  priority: 'must' | 'should' | 'nice-to-have';
  suggestedFeature: string;
  assignedTo?: string;
  evidence: string | null;
  testStatus: 'not-started' | 'in-progress' | 'passing' | 'failing';
}

interface SprintMilestone {
  timeframe: string;
  goal: string;
  deliverables: string[];
}

interface OrchestrationResult {
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
  sprintPlan?: SprintMilestone[];
  judgePitch?: {
    hook: string;
    demoFlow: string[];
    technicalHighlights: string[];
  };
  builderPrompts?: {
    cursorRules: string;
    claudeCode: string;
    lovable: string;
    bolt: string;
  };
}

interface CategoryScore {
  category: string;
  score: number;
  weight: number;
  notes: string[];
  status?: 'passed' | 'warning' | 'failed' | 'pending';
}

interface ReadinessReport {
  overall: number;
  status: 'ready' | 'needs-work' | 'not-ready';
  categories: CategoryScore[];
  summaryVerdict?: string;
  passedChecks?: number;
  totalChecks?: number;
}

interface Health {
  ok: boolean;
  status: string;
  providers: { anthropic: boolean; openai: boolean; gemini: boolean; simulated: boolean };
  activeMode: string;
  github: boolean;
  defaultProvider: string;
}

const PROJECT_TYPES: { id: ProjectType; label: string }[] = [
  { id: 'web-app', label: 'Web App' },
  { id: 'website', label: 'Website' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'ai-ml', label: 'AI / ML' },
  { id: 'iot', label: 'IoT / Edge' },
  { id: 'saas', label: 'SaaS' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'other', label: 'Other' }
];

const PRESETS = [
  {
    title: '🤖 Health Diagnostic AI',
    type: 'ai-ml' as ProjectType,
    text: 'Build an autonomous clinical triage assistant that analyzes medical symptoms, cross-references clinical literature via RAG, and produces verified patient diagnostic summaries with strict privacy safeguards.'
  },
  {
    title: '⚡ Multi-Chain DeFi Analytics',
    type: 'web-app' as ProjectType,
    text: 'Create a real-time DeFi risk intelligence dashboard that monitors liquidity pools across Arbitrum and Base, forecasts impermanent loss using predictive models, and simulates automated yield rebalancing.'
  },
  {
    title: '🎨 Real-Time Collab Canvas',
    type: 'web-app' as ProjectType,
    text: 'A high-performance collaborative infinite canvas for system design with real-time multiplayer cursor synchronization, live AI wireframe generation, and instant export to React components.'
  },
  {
    title: '🌾 Smart Agriculture IoT',
    type: 'iot' as ProjectType,
    text: 'An automated precision irrigation and soil telemetry dashboard ingesting live sensor streams via MQTT, detecting soil moisture anomalies, and triggering automated water valve schedules.'
  },
  {
    title: '🛡️ Cyber Threat Sandbox',
    type: 'saas' as ProjectType,
    text: 'An automated vulnerability triaging and secret scanning platform that audits GitHub pull requests for CVE vulnerabilities, analyzes attack vectors with AI, and suggests remediation diffs.'
  }
];

const PIPELINE_STAGES = [
  {
    title: 'Plan',
    desc: 'Break problem statement into prioritized requirements, tech stack, and RTM.',
    tools: ['Claude 3.5', 'GPT-4o', 'Gemini 1.5']
  },
  {
    title: 'Build',
    desc: 'Export tailor-made briefs to your favorite AI coding engine.',
    tools: ['Cursor', 'Claude Code', 'Lovable', 'v0', 'Bolt']
  },
  {
    title: 'Source Control',
    desc: 'Automate branching, pull requests, and CI trigger on every commit.',
    tools: ['GitHub', 'GitHub Actions']
  },
  {
    title: 'Security',
    desc: 'Zero-cost AST analysis, dependency CVE audit, and secret leak scanning.',
    tools: ['CodeQL', 'Gitleaks', 'Dependabot']
  },
  {
    title: 'Testing & a11y',
    desc: 'Automated end-to-end user flows and WCAG AA accessibility audit.',
    tools: ['Playwright', 'axe-core', 'Lighthouse']
  },
  {
    title: 'Deploy',
    desc: 'Instant preview builds with edge performance and automated SSL.',
    tools: ['Vercel', 'Cloudflare', 'Netlify']
  },
  {
    title: 'Readiness Score',
    desc: 'Consolidates all signals into one objective proof-of-work score for judges.',
    tools: ['BuildEaze Engine']
  }
];

export default function Page() {
  const [health, setHealth] = useState<Health | null>(null);
  const [problemStatement, setProblemStatement] = useState(PRESETS[0].text);
  const [projectType, setProjectType] = useState<ProjectType>(PRESETS[0].type);
  const [selectedProvider, setSelectedProvider] = useState<Provider>('simulated');
  const [customApiKey, setCustomApiKey] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrchestrationResult | null>(null);

  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [report, setReport] = useState<ReadinessReport | null>(null);

  const [activeBuilderTab, setActiveBuilderTab] = useState<'cursor' | 'claude' | 'lovable' | 'bolt'>('cursor');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [githubOwner, setGithubOwner] = useState('vasanth-07-bunny');
  const [githubRepo, setGithubRepo] = useState('build-it');
  const [githubToken, setGithubToken] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`Copied ${label} to clipboard!`);
  };

  // Initial health check & demo load
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data: Health) => {
        setHealth(data);
        if (data.providers.anthropic) setSelectedProvider('anthropic');
        else if (data.providers.openai) setSelectedProvider('openai');
        else if (data.providers.gemini) setSelectedProvider('gemini');
        else setSelectedProvider('simulated');
      })
      .catch(() => setHealth(null));

    // Load initial score
    updateScore([]);
  }, []);

  async function runPlanning() {
    if (!problemStatement.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-api-key': customApiKey } : {}),
          'x-provider': selectedProvider
        },
        body: JSON.stringify({
          problemStatement,
          projectType,
          provider: selectedProvider,
          apiKey: customApiKey || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Planning phase failed.');
      setResult(data);
      triggerToast('Build blueprint generated successfully!');
      
      // Update readiness score with new requirements
      if (data.requirements) {
        updateScore(data.requirements);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateScore(reqs: RequirementItem[], useGitHub: boolean = false) {
    setScoreLoading(true);
    setScoreError(null);
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements: reqs,
          useGitHub,
          githubOwner,
          githubRepo,
          githubToken: githubToken || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Scoring failed.');
      setReport(data);
    } catch (err: any) {
      setScoreError(err.message);
    } finally {
      setScoreLoading(false);
    }
  }

  function handleRequirementStatusChange(index: number, newStatus: RequirementItem['testStatus']) {
    if (!result) return;
    const updatedReqs = [...result.requirements];
    updatedReqs[index] = { ...updatedReqs[index], testStatus: newStatus };
    setResult({ ...result, requirements: updatedReqs });
    updateScore(updatedReqs);
  }

  const anyProviderConnected = health
    ? health.providers.anthropic || health.providers.openai || health.providers.gemini
    : false;

  return (
    <main className={styles.shell}>
      {toastMessage && <div className={styles.toast}>✓ {toastMessage}</div>}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoGroup}>
          <div className={styles.logoIcon}>⚡</div>
          <div>
            <p className={styles.wordmark}>BuildEaze — Universal Hackathon Orchestrator</p>
            <h1 className={styles.h1}>Plan it. Build it anywhere. Ship it proven.</h1>
          </div>
        </div>

        <div className={styles.headerControls}>
          <div className={styles.statusPill}>
            <span
              className={`${styles.dot} ${
                anyProviderConnected ? styles.dotOn : styles.dotSimulated
              }`}
            />
            <span>
              Engine:{' '}
              <b>
                {selectedProvider === 'simulated'
                  ? 'Simulated Offline AI'
                  : selectedProvider.toUpperCase()}
              </b>
            </span>
          </div>

          <div className={styles.statusPill}>
            <span className={`${styles.dot} ${styles.dotOn}`} />
            <span>CI: <b>GitHub Actions Ready</b></span>
          </div>

          <button
            type="button"
            className={styles.configBtn}
            onClick={() => setShowSettingsModal(true)}
          >
            ⚙️ Settings
          </button>
        </div>
      </header>

      {/* ---------- 01: INTAKE & PRESETS ---------- */}
      <section className={styles.panel}>
        <div className={styles.eyebrow}>01 — Intake & Prompt Studio</div>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Give it the Hackathon Problem Statement</h2>
            <p className={styles.sectionDesc}>
              Pick a quick-start template or paste your hackathon challenge. BuildEaze synthesizes
              the optimal architecture, tech stack, and interactive test matrix.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className={styles.presetGroup}>
          <div className={styles.presetLabel}>Quick Presets</div>
          <div className={styles.presetRow}>
            {PRESETS.map((p) => (
              <button
                key={p.title}
                type="button"
                className={styles.presetPill}
                onClick={() => {
                  setProblemStatement(p.text);
                  setProjectType(p.type);
                }}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.intakeGrid}>
          <div className={styles.formCol}>
            <label className={styles.label}>Hackathon Problem Statement</label>
            <textarea
              className={styles.textarea}
              placeholder="Describe what you want to build in 1-3 sentences…"
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
            />

            <label className={styles.label}>Target Category / Project Type</label>
            <div className={styles.chipRow}>
              {PROJECT_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.chip} ${projectType === t.id ? styles.chipActive : ''}`}
                  onClick={() => setProjectType(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={styles.runBtn}
              onClick={runPlanning}
              disabled={loading || !problemStatement.trim()}
            >
              {loading ? (
                <>⏳ Synthesizing Blueprint & Matrix…</>
              ) : (
                <>🚀 Generate Build Blueprint & Prompts</>
              )}
            </button>
          </div>

          <div className={styles.outputPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label className={styles.label} style={{ margin: 0 }}>Executive Blueprint</label>
              {result && (
                <span className={styles.providerBadge}>
                  {result.providerUsed}
                </span>
              )}
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}

            {!error && !result && (
              <div className={styles.placeholder}>
                Click <b>"Generate Build Blueprint & Prompts"</b> to break down requirements, tech stack,
                and exportable code rules for Cursor, Claude Code, and Lovable.
              </div>
            )}

            {result && (
              <>
                <div className={styles.summaryBox}>
                  <p className={styles.summaryText}>{result.summary}</p>
                </div>

                <div className={styles.archGrid}>
                  <div className={styles.archCard}>
                    <div className={styles.archLabel}>Frontend</div>
                    <div className={styles.archVal}>{result.architecture.frontend}</div>
                  </div>
                  <div className={styles.archCard}>
                    <div className={styles.archLabel}>Backend</div>
                    <div className={styles.archVal}>{result.architecture.backend}</div>
                  </div>
                  <div className={styles.archCard}>
                    <div className={styles.archLabel}>Database</div>
                    <div className={styles.archVal}>{result.architecture.database}</div>
                  </div>
                  <div className={styles.archCard}>
                    <div className={styles.archLabel}>Deployment</div>
                    <div className={styles.archVal}>{result.architecture.deployment}</div>
                  </div>
                </div>

                {result.riskFlags && result.riskFlags.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div className={styles.presetLabel} style={{ color: '#f43f5e' }}>⚠️ Hackathon Risk Flags</div>
                    <ul style={{ paddingLeft: 18, fontSize: 12, color: '#fda4af', lineHeight: 1.5 }}>
                      {result.riskFlags.map((flag, idx) => (
                        <li key={idx}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ---------- 02: AI BUILDER EXPORT SUITE ---------- */}
      {result && result.builderPrompts && (
        <section className={styles.panel}>
          <div className={styles.eyebrow}>02 — AI Code Engine Exporters</div>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>One-Click Prompts for Any Build Engine</h2>
              <p className={styles.sectionDesc}>
                Copy tailored instructions and rules files directly into your AI workflow — zero vendor lock-in.
              </p>
            </div>
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() => setShowPitchModal(true)}
            >
              📄 View Judge Pitch & Submission Deck
            </button>
          </div>

          <div className={styles.tabNav}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeBuilderTab === 'cursor' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveBuilderTab('cursor')}
            >
              🚀 Cursor (.cursorrules)
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeBuilderTab === 'claude' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveBuilderTab('claude')}
            >
              🤖 Claude Code CLI
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeBuilderTab === 'lovable' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveBuilderTab('lovable')}
            >
              ⚡ Lovable / v0 Prompt
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeBuilderTab === 'bolt' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveBuilderTab('bolt')}
            >
              ⚡ Bolt.new Prompt
            </button>
          </div>

          <div className={styles.codeBox}>
            <button
              type="button"
              className={styles.copyAbsoluteBtn}
              onClick={() => {
                const text =
                  activeBuilderTab === 'cursor'
                    ? result.builderPrompts?.cursorRules ?? ''
                    : activeBuilderTab === 'claude'
                    ? result.builderPrompts?.claudeCode ?? ''
                    : activeBuilderTab === 'lovable'
                    ? result.builderPrompts?.lovable ?? ''
                    : result.builderPrompts?.bolt ?? '';
                copyToClipboard(text, activeBuilderTab.toUpperCase());
              }}
            >
              📋 Copy Code
            </button>
            <code>
              {activeBuilderTab === 'cursor' && result.builderPrompts.cursorRules}
              {activeBuilderTab === 'claude' && result.builderPrompts.claudeCode}
              {activeBuilderTab === 'lovable' && result.builderPrompts.lovable}
              {activeBuilderTab === 'bolt' && result.builderPrompts.bolt}
            </code>
          </div>
        </section>
      )}

      {/* ---------- 03: INTERACTIVE RTM MATRIX ---------- */}
      <section className={styles.panel}>
        <div className={styles.eyebrow}>03 — Requirement Traceability Matrix (RTM)</div>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Track, Verify & Prove Your Features</h2>
            <p className={styles.sectionDesc}>
              Judges demand proof. Toggle each requirement's verification state to dynamically recalculate
              your live hackathon readiness score.
            </p>
          </div>
        </div>

        {!result && (
          <div className={styles.placeholder}>
            Generate a build blueprint above to populate the interactive Requirement Traceability Matrix.
          </div>
        )}

        {result && (
          <div className={styles.rtmContainer}>
            {result.requirements.map((r, idx) => (
              <div className={styles.rtmCard} key={r.id}>
                <div className={styles.rtmId}>{r.id}</div>
                <div>
                  <span
                    className={
                      r.priority === 'must'
                        ? styles.priorityMust
                        : r.priority === 'should'
                        ? styles.priorityShould
                        : styles.priorityNice
                    }
                  >
                    {r.priority}
                  </span>
                </div>
                <div className={styles.rtmContent}>
                  <div className={styles.rtmReq}>{r.requirement}</div>
                  <div className={styles.rtmFeature}>Feature: {r.suggestedFeature}</div>
                </div>
                <div>
                  <select
                    className={`${styles.statusSelect} ${
                      r.testStatus === 'passing'
                        ? styles.statusPassing
                        : r.testStatus === 'in-progress'
                        ? styles.statusInProgress
                        : r.testStatus === 'failing'
                        ? styles.statusFailing
                        : styles.statusNotStarted
                    }`}
                    value={r.testStatus}
                    onChange={(e) =>
                      handleRequirementStatusChange(
                        idx,
                        e.target.value as RequirementItem['testStatus']
                      )
                    }
                  >
                    <option value="not-started">⚪ Not Started</option>
                    <option value="in-progress">🟡 In Progress</option>
                    <option value="passing">🟢 Passing / Verified</option>
                    <option value="failing">🔴 Failing Check</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- 04: 24-48H SPRINT TIMELINE ---------- */}
      {result && result.sprintPlan && (
        <section className={styles.panel}>
          <div className={styles.eyebrow}>04 — Hackathon Sprint Milestones</div>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>24-48 Hour Execution Blueprint</h2>
              <p className={styles.sectionDesc}>
                Structured phases to keep your team aligned from opening kickoff to judging deadline.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {result.sprintPlan.map((s, i) => (
              <div key={i} className={styles.archCard} style={{ padding: 18 }}>
                <div style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: 4 }}>
                  {s.timeframe}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                  {s.goal}
                </div>
                <ul style={{ paddingLeft: 16, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {s.deliverables.map((d, dIdx) => (
                    <li key={dIdx}>{d}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- 05: UNIVERSAL PIPELINE RAIL ---------- */}
      <section className={styles.panel}>
        <div className={styles.eyebrow}>05 — Universal Pipeline Rail</div>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>The Standard Quality Pipeline</h2>
            <p className={styles.sectionDesc}>
              Every hackathon project runs through this standardized security and verification pipeline.
            </p>
          </div>
        </div>

        <div className={styles.rail}>
          {PIPELINE_STAGES.map((s, i) => (
            <div className={styles.stage} key={s.title}>
              <div className={styles.stageNode}>{i + 1}</div>
              <h3 className={styles.stageTitle}>{s.title}</h3>
              <p className={styles.stageDesc}>{s.desc}</p>
              <div className={styles.stageTools}>
                {s.tools.map((t) => (
                  <span className={styles.toolTag} key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- 06: READINESS SCORE ---------- */}
      <section className={styles.panel}>
        <div className={styles.eyebrow}>06 — Readiness Score</div>
        <div className={styles.scoreTop}>
          <div>
            <h2 className={styles.sectionTitle}>Hackathon Readiness Score</h2>
            <p className={styles.sectionDesc}>
              Consolidates requirement verification, automated security scans, accessibility audits, and test coverage.
            </p>
          </div>
          <div className={styles.scoreActions}>
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() => updateScore(result?.requirements ?? [], false)}
              disabled={scoreLoading}
            >
              🔄 Recalculate Score
            </button>
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() => updateScore(result?.requirements ?? [], true)}
              disabled={scoreLoading}
            >
              🐙 Query GitHub Actions CI
            </button>
          </div>
        </div>

        {scoreError && <div className={styles.errorBox}>{scoreError}</div>}

        {report && (
          <>
            <div className={styles.bigScoreRow}>
              <div className={styles.scoreCircle}>
                <span className={styles.bigScoreNum}>{report.overall}</span>
              </div>
              <div>
                <span
                  className={
                    report.status === 'ready'
                      ? styles.statusBadgeReady
                      : report.status === 'needs-work'
                      ? styles.statusBadgeNeedsWork
                      : styles.statusBadgeNotReady
                  }
                >
                  {report.status === 'ready'
                    ? '🎉 Hackathon Ready'
                    : report.status === 'needs-work'
                    ? '⚡ Needs Work'
                    : '🛑 Not Ready'}
                </span>
                <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)', maxWidth: 500 }}>
                  {report.summaryVerdict}
                </p>
              </div>
            </div>

            <div className={styles.catList}>
              {report.categories.map((c) => (
                <div className={styles.catRow} key={c.category}>
                  <span style={{ fontWeight: 600 }}>{c.category}</span>
                  <span className={styles.barTrack}>
                    <span className={styles.barFill} style={{ width: `${c.score}%` }} />
                  </span>
                  <span style={{ textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                    {c.score}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSettingsModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>⚙️ BuildEaze Engine Configuration</h3>
            
            <label className={styles.label}>Active AI Provider</label>
            <select
              className={styles.modalInput}
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as Provider)}
            >
              <option value="simulated">⚡ Built-in Intelligent Simulator (Offline / Zero-Key)</option>
              <option value="anthropic">Anthropic (Claude 3.5 / 3.7 Sonnet)</option>
              <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
              <option value="gemini">Google Gemini (1.5 Flash / Pro)</option>
            </select>

            {selectedProvider !== 'simulated' && (
              <>
                <label className={styles.label}>Custom API Key (Optional client override)</label>
                <input
                  type="password"
                  className={styles.modalInput}
                  placeholder={`Paste your ${selectedProvider.toUpperCase()} API key here…`}
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                />
              </>
            )}

            <label className={styles.label}>GitHub Owner / Organization</label>
            <input
              type="text"
              className={styles.modalInput}
              value={githubOwner}
              onChange={(e) => setGithubOwner(e.target.value)}
            />

            <label className={styles.label}>GitHub Repository Name</label>
            <input
              type="text"
              className={styles.modalInput}
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
            />

            <label className={styles.label}>GitHub Personal Access Token (Optional for private repos)</label>
            <input
              type="password"
              className={styles.modalInput}
              placeholder="ghp_..."
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
            />

            <div className={styles.modalBtnRow}>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setShowSettingsModal(false)}
              >
                Close & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Devpost Pitch Deck Modal */}
      {showPitchModal && result?.judgePitch && (
        <div className={styles.modalOverlay} onClick={() => setShowPitchModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>📄 Hackathon Judge Pitch & Devpost Brief</h3>
            
            <div style={{ marginBottom: 16 }}>
              <div className={styles.presetLabel}>Pitch Hook</div>
              <p style={{ fontSize: 14, color: '#fff', lineHeight: 1.5 }}>
                {result.judgePitch.hook}
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className={styles.presetLabel}>Demo Script Flow</div>
              <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {result.judgePitch.demoFlow.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className={styles.presetLabel}>Technical Highlights for Judges</div>
              <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {result.judgePitch.technicalHighlights.map((th, idx) => (
                  <li key={idx}>{th}</li>
                ))}
              </ul>
            </div>

            <div className={styles.modalBtnRow}>
              <button
                type="button"
                className={styles.runBtn}
                style={{ padding: '8px 16px', fontSize: 13 }}
                onClick={() => {
                  const markdown = `# ${result.projectType.toUpperCase()} Project - Hackathon Brief
## Hook
${result.judgePitch?.hook}

## Tech Stack
- Frontend: ${result.architecture.frontend}
- Backend: ${result.architecture.backend}
- Database: ${result.architecture.database}
- AI Components: ${result.architecture.aiComponents.join(', ')}
- Deployment: ${result.architecture.deployment}

## Demo Flow
${result.judgePitch?.demoFlow.map((d) => `- ${d}`).join('\n')}

## Technical Highlights
${result.judgePitch?.technicalHighlights.map((t) => `- ${t}`).join('\n')}
`;
                  copyToClipboard(markdown, 'Devpost Submission Markdown');
                }}
              >
                📋 Copy Devpost Markdown
              </button>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setShowPitchModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className={styles.footNote}>
        BuildEaze universal hackathon orchestrator • Built for speed, quality, and zero-lockin builder agility.
      </footer>
    </main>
  );
}
