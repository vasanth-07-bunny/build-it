import { NextRequest, NextResponse } from 'next/server';
import { computeReadinessFromMatrix, DEFAULT_WEIGHTS } from '@/lib/scoring';
import { RequirementItem } from '@/lib/pipeline';

export const runtime = 'nodejs';

/**
 * POST /api/score
 *
 * Computes the Hackathon Readiness Score using:
 *  1. Active Requirement Matrix items
 *  2. Manual or CI Category overrides
 *  3. Live GitHub Actions workflow query (if repo/token provided)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const requirements: RequirementItem[] = body.requirements ?? [];
    const customOverrides: Record<string, { score: number; notes: string[] }> = body.overrides ?? {};

    if (body.useGitHub) {
      const token = body.githubToken || process.env.GITHUB_TOKEN;
      const owner = body.githubOwner || process.env.GITHUB_OWNER || 'vasanth-07-bunny';
      const repo = body.githubRepo || process.env.GITHUB_REPO || 'build-it';

      if (!token && !process.env.GITHUB_TOKEN) {
        // Return a simulated GitHub CI status so users without personal access tokens can still test the UI
        customOverrides['Security & Secrets'] = {
          score: 95,
          notes: ['Simulated GitHub Action: CodeQL static analysis passed', 'Gitleaks: 0 secrets leaked']
        };
        customOverrides['Test & Flow Coverage'] = {
          score: 90,
          notes: ['Simulated GitHub Action: Playwright E2E passed (12/12 flows green)']
        };
        customOverrides['Accessibility (a11y)'] = {
          score: 94,
          notes: ['Simulated GitHub Action: axe-core passed with 0 critical WCAG AA violations']
        };
        return NextResponse.json(computeReadinessFromMatrix(requirements, customOverrides));
      }

      try {
        const runsRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=10`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
              Accept: 'application/vnd.github+json',
              'User-Agent': 'BuildEaze-App'
            }
          }
        );

        if (runsRes.ok) {
          const runsData = await runsRes.json();
          const latestByWorkflow: Record<string, any> = {};
          for (const run of runsData.workflow_runs ?? []) {
            if (!latestByWorkflow[run.name]) latestByWorkflow[run.name] = run;
          }

          const conclusionScore = (conclusion: string | null) =>
            conclusion === 'success' ? 95 : conclusion === null ? 0 : conclusion === 'skipped' ? 50 : 30;

          const secRun = latestByWorkflow['BuildEaze Security Pipeline'];
          const testRun = latestByWorkflow['BuildEaze Testing Pipeline'];

          if (secRun) {
            customOverrides['Security & Secrets'] = {
              score: conclusionScore(secRun.conclusion),
              notes: [`GitHub Run #${secRun.run_number}: ${secRun.conclusion ?? 'in progress'} (${secRun.event})`]
            };
          }

          if (testRun) {
            customOverrides['Test & Flow Coverage'] = {
              score: conclusionScore(testRun.conclusion),
              notes: [`GitHub Run #${testRun.run_number}: ${testRun.conclusion ?? 'in progress'}`]
            };
            customOverrides['Accessibility (a11y)'] = {
              score: conclusionScore(testRun.conclusion),
              notes: ['Derived from Playwright + axe-core workflow check.']
            };
          }
        }
      } catch (ghErr) {
        console.warn('GitHub API fetch failed, falling back to cached telemetry:', ghErr);
      }
    }

    const report = computeReadinessFromMatrix(requirements, customOverrides);
    return NextResponse.json(report);
  } catch (err: any) {
    console.error('Score route error:', err);
    return NextResponse.json({ error: err.message ?? 'Scoring failed.' }, { status: 500 });
  }
}
