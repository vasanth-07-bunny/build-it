'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

type ProjectType = 'website' | 'web-app' | 'mobile' | 'ai-ml' | 'iot' | 'saas' | 'hardware' | 'other';

const PROJECT_TYPES: { id: ProjectType; label: string }[] = [
  { id: 'web-app', label: 'Web App' },
  { id: 'website', label: 'Website' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'ai-ml', label: 'AI / ML' },
  { id: 'iot', label: 'IoT' },
  { id: 'saas', label: 'SaaS' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'other', label: 'Other' }
];

const PIPELINE_STAGES = [
  {
    title: 'Plan',
    desc: 'Problem statement is broken into a prioritized requirement list and a suggested architecture.',
    tools: ['Claude', 'GPT-4o', 'Gemini']
  },
  {
    title: 'Build',
    desc: 'Hand the brief to whichever build engine your team likes — BuildEaze does not lock you in.',
    tools: ['Lovable', 'Replit', 'Bolt', 'Cursor', 'Claude Code', 'Codex']
  },
  {
    title: 'Source Control',
    desc: 'Code lands in GitHub. Everything downstream runs automatically on push via Actions.',
    tools: ['GitHub', 'GitHub Actions']
  },
  {
    title: 'Security',
    desc: 'Static analysis, dependency audit, and secret scanning — all free, all inside CI, no API key required.',
    tools: ['CodeQL', 'Dependabot', 'Gitleaks']
  },
  {
    title: 'Testing & Accessibility',
    desc: 'End-to-end flows, a11y violations, and performance budget, run headless on every push.',
    tools: ['Playwright', 'axe-core', 'Lighthouse']
  },
  {
    title: 'Deploy',
    desc: 'One-click ship once the pipeline is green.',
    tools: ['Vercel', 'Cloudflare', 'Netlify']
  },
  {
    title: 'Readiness Score',
    desc: 'All of the above rolls up into one number your team (and the judges) can trust.',
    tools: ['BuildEaze Scoring']
  }
];

interface Health {
  providers: { anthropic: boolean; openai: boolean; gemini: boolean };
  github: boolean;
  defaultProvider: string;
}

interface OrchestrationResult {
  summary: string;
  requirements: {
    id: string;
    requirement: string;
    priority: 'must' | 'should' | 'nice-to-have';
    suggestedFeature: string;
  }[];
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

interface ReadinessReport {
  overall: number;
  status: 'ready' | 'needs-work' | 'not-ready';
  categories: { category: string; score: number; weight: number; notes: string[] }[];
}

const DEMO_SCORE_BODY = {
  manual: {
    'Problem Alignment': { score: 91, notes: ['Requirements matrix 7/8 covered.'] },
    Security: { score: 88, notes: ['No exposed secrets. 1 medium dependency advisory.'] },
    'Code Quality': { score: 84, notes: ['CodeQL: 2 low-severity findings.'] },
    Accessibility: { score: 93, notes: ['axe: 1 color-contrast violation.'] },
    Performance: { score: 87, notes: ['Lighthouse performance 87/100.'] },
    'Test Coverage': { score: 79, notes: ['Playwright: 11/14 flows passing.'] },
    'Deployment Readiness': { score: 96, notes: ['Vercel preview deploy healthy.'] }
  }
};

export default function Page() {
  const [health, setHealth] = useState<Health | null>(null);
  const [problemStatement, setProblemStatement] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('web-app');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrchestrationResult | null>(null);

  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [report, setReport] = useState<ReadinessReport | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const anyProviderConnected = health
    ? health.providers.anthropic || health.providers.openai || health.providers.gemini
    : false;

  async function runPlanning() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemStatement, projectType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Planning phase failed.');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDemoScore() {
    setScoreLoading(true);
    setScoreError(null);
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEMO_SCORE_BODY)
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

  async function loadLiveScore() {
    setScoreLoading(true);
    setScoreError(null);
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useGitHub: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not reach GitHub Actions.');
      setReport(data);
    } catch (err: any) {
      setScoreError(err.message);
    } finally {
      setScoreLoading(false);
    }
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.wordmark}>
            <b>Build</b>Eaze — universal hackathon orchestrator
          </p>
          <h1 className={styles.h1}>Plan it. Build it anywhere. Ship it proven.</h1>
        </div>
        <div className={styles.headerStatus}>
          <span className={`${styles.dot} ${anyProviderConnected ? styles.dotOn : styles.dotOff}`} />
          {health ? (anyProviderConnected ? `AI: ${health.defaultProvider}` : 'AI: no key set') : 'checking…'}
          <span style={{ opacity: 0.3 }}>|</span>
          <span className={`${styles.dot} ${health?.github ? styles.dotOn : styles.dotOff}`} />
          {health?.github ? 'GitHub connected' : 'GitHub not connected'}
        </div>
      </header>

      {/* ---------- INTAKE ---------- */}
      <section className={styles.panel} style={{ marginBottom: 40 }}>
        <p className={styles.eyebrow}>01 — Intake</p>
        <h2 className={styles.sectionTitle}>Give it the problem statement</h2>

        <div className={styles.intakeGrid}>
          <div>
            <label className={styles.label}>Problem statement</label>
            <textarea
              className={styles.textarea}
              placeholder="Paste the hackathon problem statement here…"
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
            />

            <label className={styles.label}>Project type</label>
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

            <button className={styles.runBtn} onClick={runPlanning} disabled={loading || !problemStatement.trim()}>
              {loading ? 'Running planning phase…' : 'Run planning phase'}
            </button>
            {!anyProviderConnected && health && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
                No AI key detected yet — set ANTHROPIC_API_KEY, OPENAI_API_KEY or GOOGLE_GEMINI_API_KEY in
                .env.local, then restart the dev server.
              </p>
            )}
          </div>

          <div className={`${styles.outputPanel}`}>
            <label className={styles.label} style={{ marginTop: 0 }}>
              Build brief
            </label>
            {error && <div className={styles.errorBox}>{error}</div>}
            {!error && !result && (
              <div className={styles.placeholder}>
                Requirements, suggested architecture, and build-engine recommendations will show up here once
                you run the planning phase.
              </div>
            )}
            {result && (
              <>
                <p className={styles.summary}>{result.summary}</p>
                <ul className={styles.reqList}>
                  {result.requirements.map((r) => (
                    <li key={r.id} className={styles.reqItem}>
                      <span className={styles.reqId}>{r.id}</span>
                      <span
                        className={`${styles.priority} ${
                          r.priority === 'must'
                            ? styles.priorityMust
                            : r.priority === 'should'
                            ? styles.priorityShould
                            : styles.priorityNice
                        }`}
                      >
                        {r.priority}
                      </span>
                      <span>{r.requirement}</span>
                    </li>
                  ))}
                </ul>
                <dl className={styles.archGrid}>
                  <div className={styles.archRow}>
                    <dt>Frontend</dt>
                    <dd>{result.architecture.frontend}</dd>
                  </div>
                  <div className={styles.archRow}>
                    <dt>Backend</dt>
                    <dd>{result.architecture.backend}</dd>
                  </div>
                  <div className={styles.archRow}>
                    <dt>Database</dt>
                    <dd>{result.architecture.database}</dd>
                  </div>
                  <div className={styles.archRow}>
                    <dt>Deployment</dt>
                    <dd>{result.architecture.deployment}</dd>
                  </div>
                </dl>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ---------- PIPELINE RAIL ---------- */}
      <section className={styles.panel} style={{ marginBottom: 40 }}>
        <p className={styles.eyebrow}>02 — Pipeline</p>
        <h2 className={styles.sectionTitle}>Same rail, every hackathon</h2>
        <div className={styles.rail}>
          <div className={styles.railLine} />
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

      {/* ---------- SCORE ---------- */}
      <section className={styles.panel}>
        <p className={styles.eyebrow}>03 — Readiness</p>
        <div className={styles.scoreTop}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
            Hackathon readiness score
          </h2>
          <div className={styles.scoreActions}>
            <button className={styles.ghostBtn} onClick={loadDemoScore} disabled={scoreLoading}>
              Load demo score
            </button>
            <button className={styles.ghostBtn} onClick={loadLiveScore} disabled={scoreLoading}>
              Pull from GitHub Actions
            </button>
          </div>
        </div>

        {scoreError && <div className={styles.errorBox} style={{ marginBottom: 16 }}>{scoreError}</div>}

        {!report && !scoreError && (
          <div className={styles.placeholder}>
            Load the demo score to see the layout, or wire up GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO and
            pull your real pipeline results.
          </div>
        )}

        {report && (
          <>
            <div className={styles.bigScore} style={{ marginBottom: 28 }}>
              <span className={styles.bigScoreNum}>{report.overall}</span>
              <span
                className={`${styles.statusBadge} ${
                  report.status === 'ready'
                    ? styles.statusReady
                    : report.status === 'needs-work'
                    ? styles.statusNeedsWork
                    : styles.statusNotReady
                }`}
              >
                {report.status === 'ready'
                  ? 'Hackathon ready'
                  : report.status === 'needs-work'
                  ? 'Needs work'
                  : 'Not ready'}
              </span>
            </div>
            {report.categories.map((c) => (
              <div className={styles.catRow} key={c.category}>
                <span>{c.category}</span>
                <span className={styles.barTrack}>
                  <span className={styles.barFill} style={{ width: `${c.score}%` }} />
                </span>
                <span style={{ textAlign: 'right' }}>{c.score}</span>
              </div>
            ))}
          </>
        )}
      </section>

      <p className={styles.footNote}>
        BuildEaze orchestrates — it does not replace — your AI planner, your build engine, and your CI. Swap
        any piece without touching the rest.
      </p>
    </main>
  );
}
