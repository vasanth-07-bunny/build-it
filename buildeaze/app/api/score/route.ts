import { NextRequest, NextResponse } from 'next/server';
import { computeReadiness } from '@/lib/scoring';

export const runtime = 'nodejs';

/**
 * POST /api/score
 *
 * Two modes:
 *  1. Manual  — body = { manual: { "Security": { score, notes }, ... } }
 *     Useful for the demo dashboard before CI is wired up.
 *  2. GitHub  — body = { useGitHub: true }
 *     Pulls the latest workflow run conclusions from
 *     GITHUB_OWNER/GITHUB_REPO using GITHUB_TOKEN and maps
 *     job conclusions -> category scores.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    if (body.useGitHub) {
      const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;
      if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        return NextResponse.json(
          {
            error:
              'GITHUB_TOKEN, GITHUB_OWNER and GITHUB_REPO must be set to pull live CI results. Use manual mode for a demo score instead.'
          },
          { status: 400 }
        );
      }

      const runsRes = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs?per_page=10`,
        { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } }
      );
      if (!runsRes.ok) {
        return NextResponse.json({ error: `GitHub API error ${runsRes.status}` }, { status: 502 });
      }
      const runsData = await runsRes.json();

      const latestByWorkflow: Record<string, any> = {};
      for (const run of runsData.workflow_runs ?? []) {
        if (!latestByWorkflow[run.name]) latestByWorkflow[run.name] = run;
      }

      const conclusionScore = (conclusion: string | null) =>
        conclusion === 'success' ? 95 : conclusion === null ? 0 : conclusion === 'skipped' ? 50 : 20;

      const raw: Record<string, { score: number; notes: string[] }> = {
        Security: {
          score: conclusionScore(latestByWorkflow['BuildEaze Security Pipeline']?.conclusion ?? null),
          notes: [`Latest run: ${latestByWorkflow['BuildEaze Security Pipeline']?.conclusion ?? 'no run yet'}`]
        },
        'Test Coverage': {
          score: conclusionScore(latestByWorkflow['BuildEaze Testing Pipeline']?.conclusion ?? null),
          notes: [`Latest run: ${latestByWorkflow['BuildEaze Testing Pipeline']?.conclusion ?? 'no run yet'}`]
        },
        Accessibility: {
          score: conclusionScore(latestByWorkflow['BuildEaze Testing Pipeline']?.conclusion ?? null),
          notes: ['Derived from testing pipeline (axe + Lighthouse run in the same workflow).']
        }
      };

      return NextResponse.json(computeReadiness(raw));
    }

    // Manual / demo mode
    const manual = body.manual ?? {};
    return NextResponse.json(computeReadiness(manual));
  } catch (err: any) {
    console.error('score error', err);
    return NextResponse.json({ error: err.message ?? 'Scoring failed.' }, { status: 500 });
  }
}
