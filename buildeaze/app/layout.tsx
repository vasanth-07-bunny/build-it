import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BuildEaze — Hackathon Orchestrator',
  description:
    'Feed in a problem statement, plug in any AI planner and any build engine, run one security/testing/accessibility pipeline, ship with a readiness score.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
