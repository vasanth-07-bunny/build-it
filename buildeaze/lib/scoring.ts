/**
 * lib/scoring.ts
 *
 * Turns raw signals — GitHub Actions run results (CodeQL, Gitleaks,
 * Playwright, axe, Lighthouse) plus the requirement-traceability
 * matrix — into the single "Hackathon Readiness Score" shown on
 * the dashboard.
 *
 * This is intentionally a plain, inspectable weighted average, not
 * an AI call: judges and teammates should be able to see exactly
 * why the number is what it is.
 */

export interface CategoryScore {
  category: string;
  score: number; // 0-100
  weight: number; // relative weight, sums to 1 across all categories
  notes: string[];
}

export interface ReadinessReport {
  overall: number;
  status: 'ready' | 'needs-work' | 'not-ready';
  categories: CategoryScore[];
}

const DEFAULT_WEIGHTS: Record<string, number> = {
  'Problem Alignment': 0.15,
  Security: 0.2,
  'Code Quality': 0.15,
  Accessibility: 0.1,
  Performance: 0.1,
  'Test Coverage': 0.15,
  'Deployment Readiness': 0.15
};

export function computeReadiness(
  raw: Partial<Record<keyof typeof DEFAULT_WEIGHTS, { score: number; notes: string[] }>>
): ReadinessReport {
  const categories: CategoryScore[] = Object.entries(DEFAULT_WEIGHTS).map(([category, weight]) => {
    const entry = raw[category as keyof typeof DEFAULT_WEIGHTS];
    return {
      category,
      weight,
      score: entry?.score ?? 0,
      notes: entry?.notes ?? ['No data yet — pipeline has not run for this category.']
    };
  });

  const overall = Math.round(categories.reduce((sum, c) => sum + c.score * c.weight, 0));

  const status: ReadinessReport['status'] =
    overall >= 85 ? 'ready' : overall >= 60 ? 'needs-work' : 'not-ready';

  return { overall, status, categories };
}

/** Maps a GitHub Actions conclusion + a few counts into a 0-100 category score. */
export function scoreFromCheckCounts(passed: number, failed: number, warnings: number = 0): number {
  const total = passed + failed;
  if (total === 0) return 0;
  const base = (passed / total) * 100;
  return Math.max(0, Math.round(base - warnings * 2));
}
