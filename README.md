# ⚡ BuildEaze — Universal Hackathon Orchestrator

> **Plan it. Build it anywhere. Ship it proven.**

BuildEaze is a universal hackathon AI orchestration & readiness platform: paste in a problem statement, get a prioritized requirement breakdown + suggested architecture, export tailored prompts to any AI coding engine (Cursor, Claude Code, Lovable, v0, Bolt), and verify everything through automated security, testing, and accessibility pipelines.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

```
Problem Statement → AI Planning (Claude / GPT-4o / Gemini / Offline AI)
   → AI Code Engine Exporter (Cursor / Claude Code / Lovable / Bolt / Replit)
   → Source Control (GitHub)
   → Security & Secrets (CodeQL / Gitleaks / npm audit)
   → Testing & Accessibility (Playwright / axe-core / Lighthouse)
   → Instant Deployment (Vercel / Cloudflare / Netlify)
   → Live Hackathon Readiness Score & Pitch Deck Generator
```

---

## ✨ Features

- **🚀 1-Click Hackathon Presets**: Instant templates for Healthcare AI, Multi-Chain DeFi Analytics, Real-Time Collab Canvas, Smart Agriculture IoT, and Cyber Threat Sandboxes.
- **🧠 Multi-Provider AI Planning**: Seamlessly switch between **Anthropic Claude 3.5/3.7**, **OpenAI GPT-4o**, **Google Gemini 1.5/2.0**, or **Built-in Offline Intelligence Engine** (zero keys required).
- **📋 Interactive Requirement Traceability Matrix (RTM)**: Live requirement tracking with interactive status toggles (`Passing`, `In Progress`, `Failing`, `Not Started`) that dynamically recalculate readiness scores.
- **⚡ AI Code Engine Exporters**:
  - **Cursor**: Instant `.cursorrules` configuration and context prompt.
  - **Claude Code**: Terminal CLI command and architectural kickoff.
  - **Lovable / v0 / Bolt**: Comprehensive prompt with UX and technical directives.
- **⏱️ 24-48h Sprint Execution Plan**: Timeline milestones from kickoff to submission.
- **🏆 Devpost / Hackathon Pitch Deck Generator**: Instant copyable submission markdown with problem hook, architecture, demo flow, and verified score.
- **🛡️ Automated GitHub Actions Security & Testing Pipeline**:
  - **CodeQL**: Static analysis & AST vulnerability scan.
  - **Gitleaks**: Secret leakage detection.
  - **Playwright & axe-core**: E2E flows and automated WCAG 2.1 AA accessibility audit.
  - **Lighthouse CI**: Performance and Core Web Vitals budgeting.

---

## 🛠️ Quick Start (Local)

```bash
# Clone the repository
git clone https://github.com/vasanth-07-bunny/build-it.git buildeaze
cd buildeaze

# Install dependencies
npm install

# (Optional) Add your AI keys or run directly with the offline simulation engine
cp .env.example .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 One-Click Deployment

### Deploy to Vercel (Recommended)
1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. The project is pre-configured at the root level (`package.json`, `vercel.json`).
4. (Optional) Set `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GOOGLE_GEMINI_API_KEY` under Environment Variables. If not provided, BuildEaze automatically operates in resilient offline mode!

---

## 📂 Project Structure

```
├── .github/
│   └── workflows/
│       ├── security.yml        # CodeQL, Gitleaks, npm audit
│       └── testing.yml         # Playwright, axe-core, Lighthouse CI
├── app/
│   ├── api/
│   │   ├── health/route.ts     # Provider status & telemetry
│   │   ├── orchestrate/route.ts# AI blueprint synthesis & fallback engine
│   │   └── score/route.ts      # Dynamic readiness score & GitHub Actions fetcher
│   ├── globals.css             # Cyber dark theme tokens & styles
│   ├── layout.tsx              # Root HTML & metadata
│   ├── page.module.css         # Glassmorphic component styles
│   └── page.tsx                # Interactive dashboard
├── lib/
│   ├── ai-providers.ts         # Multi-provider caller (Anthropic, OpenAI, Gemini, Simulated)
│   ├── pipeline.ts             # Orchestrator, prompt generators, sprint planner
│   └── scoring.ts              # Weighted scoring engine & verdict calculator
├── tests/
│   └── dashboard.spec.ts       # Playwright E2E and axe-core accessibility tests
├── package.json
├── tsconfig.json
└── vercel.json
```

---

## 🔒 Security & Privacy

- All AI provider keys and GitHub tokens are executed strictly on the server (`app/api/*`) and are never leaked to client bundles.
- GitHub Actions pipeline runs automated secret checks (`Gitleaks`) to prevent credential exposure before deployment.

---

## 📄 License

MIT License. Free to use for any hackathon or production project!
