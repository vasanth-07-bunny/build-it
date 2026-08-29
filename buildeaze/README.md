# BuildEaze

A **universal hackathon orchestration platform**: paste in a problem statement,
get a prioritized requirement list + suggested architecture, hand it to
*whatever* build engine your team likes, push to GitHub, and let one pipeline
handle security, testing, and accessibility — ending in a single readiness
score you (and the judges) can trust.

BuildEaze is an **orchestration layer, not another AI builder**. It doesn't
replace Lovable, Replit, Cursor, Claude Code, etc. — it sits above them.

```
Problem Statement → AI Planning → Build Engine (your choice) → GitHub
   → Security (CodeQL / Dependabot / Gitleaks)
   → Testing & A11y (Playwright / axe-core / Lighthouse)
   → Deploy (Vercel / Cloudflare / Netlify)
   → Readiness Score
```

---

## 1. Quick start (local)

```bash
git clone <your-repo-url> buildeaze
cd buildeaze
npm install
cp .env.example .env.local
# edit .env.local — see "Which keys do I actually need" below
npm run dev
```

Open `http://localhost:3000`. The header shows two status dots: whether an AI
provider key is detected, and whether GitHub is wired up.

## 2. Which keys do you *actually* need

You do **not** need every integration in `.env.example` connected to demo
this at a hackathon. Minimum viable setup:

| Need | Env var | Required? |
|---|---|---|
| AI planning phase | one of `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_GEMINI_API_KEY` | **Yes, pick one** |
| Security pipeline | *(none)* | No — CodeQL, Dependabot, and Gitleaks all run natively inside GitHub Actions for free |
| Testing/a11y pipeline | *(none)* | No — Playwright, axe-core, Lighthouse run in CI, no key |
| Pull live CI results into the dashboard | `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` | Only if you want the "Pull from GitHub Actions" button to work — otherwise use "Load demo score" |
| Deploy | Vercel/Netlify/Cloudflare tokens | Only for one-click deploy from the dashboard — you can always deploy manually |
| Your own app's backend (Supabase/Firebase) | those vars | Only if *your hackathon project itself* needs a DB — unrelated to BuildEaze's own operation |

**Never put any of these in frontend code.** Every key above is read
server-side only (inside `app/api/*/route.ts`, which runs on the Node
runtime, never shipped to the browser).

## 3. Architecture

```
app/
  page.tsx                 ← the dashboard (intake, pipeline rail, score)
  api/
    orchestrate/route.ts   ← AI planning phase
    score/route.ts         ← readiness score (manual demo or live GitHub)
    health/route.ts        ← which providers/keys are wired up
lib/
  ai-providers.ts          ← ONE function, askAI(), swaps OpenAI/Claude/Gemini via env var
  pipeline.ts              ← problem statement -> requirements + architecture
  scoring.ts                ← weighted readiness score, plain math, no black box
.github/
  workflows/security.yml   ← CodeQL + Gitleaks + npm audit — no keys needed
  workflows/testing.yml    ← Playwright + axe-core + Lighthouse — no keys needed
  dependabot.yml           ← automated dependency PRs
tests/
  dashboard.spec.ts        ← example Playwright + axe test
```

The single most important design decision: **`lib/ai-providers.ts` exposes
one function, `askAI()`.** Every route calls that, never a vendor SDK
directly. Switching your default AI planner from Claude to GPT-4o to Gemini
is a one-line env var change (`DEFAULT_AI_PROVIDER`), not a rewrite. The same
philosophy applies to build engines: BuildEaze hands off a structured brief
(requirements + architecture) as JSON — paste it into Lovable, Replit,
Cursor, Claude Code, or type it by hand. Nothing here is locked to one AI
builder.

## 4. Running the security & testing pipeline

Push this repo to GitHub. The two workflows in `.github/workflows/` run
automatically on every push/PR to `main` or `develop` — nothing to configure.
Check the **Actions** tab for results, or wire `GITHUB_TOKEN` +
`GITHUB_OWNER` + `GITHUB_REPO` into `.env.local` and hit **"Pull from GitHub
Actions"** on the dashboard to see them rolled into your readiness score.

Want to add more scanners later (Snyk, Semgrep, OWASP ZAP, k6)? Add a job to
`security.yml` or `testing.yml` — they follow the same pattern as the
existing jobs.

## 5. Deploying

**Vercel (recommended, matches `vercel.json`):**

```bash
npm i -g vercel   # one-time
vercel link
vercel env add ANTHROPIC_API_KEY   # repeat for whichever keys you're using
vercel --prod
```

Or connect the GitHub repo directly in the Vercel dashboard and set the same
env vars under Project → Settings → Environment Variables — every push to
`main` auto-deploys.

**Cloudflare Pages / Netlify:** same idea — connect the repo, set
`npm run build` as the build command, `.next` as the output, and add the env
vars in that platform's dashboard.

## 6. Using this for a *different* hackathon project

BuildEaze itself doesn't change between hackathons — your **problem
statement** does. For a new project:

1. Paste the new problem statement into the dashboard, pick a project type.
2. Run the planning phase — get a fresh requirement list + architecture.
3. Copy that brief into a **new** repo (or a new branch) and build there —
   BuildEaze's `.github/workflows/` and `lib/` folder can be copied
   wholesale into that new repo as your quality pipeline.
4. Push, let the pipeline run, check the readiness score before you submit.

If you want BuildEaze to manage many hackathon projects from one dashboard
instead of copying the workflow folder each time, the natural next step is
letting `GITHUB_REPO` be selected per-run instead of fixed in `.env.local` —
the `/api/score` route is already structured so that's a small change
(pass `repo` in the request body instead of reading it from env).
