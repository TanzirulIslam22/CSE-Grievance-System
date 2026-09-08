import { Link } from "react-router-dom";
import { Shield, Lock, MessageSquare, TrendingUp, FileText, Zap, Github, ExternalLink } from "lucide-react";
import { Footer } from "../components/Footer.jsx";

export const LIVE_URL = "https://cse-grievance-production.up.railway.app";

const FEATURES = [
  {
    icon: Lock,
    title: "Private by default",
    desc: "Submit complaints as identified, protected or fully confidential — identities are never exposed without authorisation.",
  },
  {
    icon: MessageSquare,
    title: "Two-way messaging",
    desc: "Students and the department communicate safely inside each case while identity protection stays intact.",
  },
  {
    icon: TrendingUp,
    title: "Smart analytics",
    desc: "Live dashboards with SLA metrics, resolution times, escalation tracking and CSV exports.",
  },
  {
    icon: Zap,
    title: "Real-time updates",
    desc: "WebSocket-powered notifications the moment a case status changes or a message is posted.",
  },
  {
    icon: Shield,
    title: "Security & audit",
    desc: "Role-based access, every sensitive action audited, CAPTCHA on auth, and full audit-log export.",
  },
  {
    icon: FileText,
    title: "Weekly reporting",
    desc: "Automated weekly summary CSV + email reports to the Head of Department.",
  },
];

const TECH = [
  "React 18",
  "Vite",
  "Tailwind CSS",
  "Node.js",
  "Express",
  "Socket.IO",
  "MongoDB + Mongoose",
  "JWT",
  "Nodemailer",
];

export function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <header className="border-b border-surface-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary-600" />
            <span className="text-lg font-semibold text-primary-800">CSE Grievance System</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={LIVE_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700"
            >
              <ExternalLink className="h-4 w-4" /> Live app
            </a>
            <Link to="/login" className="text-sm text-surface-600 hover:text-surface-900">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-16 text-center">
            <h1 className="text-3xl font-bold text-surface-900 md:text-4xl">
              A Digital Grievance-Resolution System for the CSE Department
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-base text-surface-600">
              The <strong>CSE Grievance System</strong> is a web platform that lets students and other
              members of the department submit complaints confidentially, track them through an official
              resolution workflow, and get answers — all while protecting the identity of everyone
              involved. Built as a final-year project at <strong>RUET</strong>, it replaces manual,
              paper-based complaint handling with a secure, transparent and auditable digital process.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={LIVE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                <ExternalLink className="h-4 w-4" /> Open live app
              </a>
              <a
                href="https://github.com/TanzirulIslam22/CSE-Grievance-System"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-surface-300 bg-white px-5 py-2.5 text-sm font-semibold text-surface-700 transition-colors hover:bg-surface-50"
              >
                <Github className="h-4 w-4" /> View source
              </a>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 px-4 py-12 md:grid-cols-3 md:px-0" style={{ maxWidth: "64rem", margin: "0 auto" }}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card">
                <Icon className="mb-2 h-5 w-5 text-primary-500" />
                <div className="text-sm font-semibold text-surface-900">{f.title}</div>
                <p className="mt-1 text-xs text-surface-500">{f.desc}</p>
              </div>
            );
          })}
        </section>

        <section className="border-t border-surface-200 bg-white px-4 py-12">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-xl font-bold text-surface-900">Built with</h2>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {TECH.map((t) => (
                <span key={t} className="badge bg-primary-50 text-primary-700">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-10 max-w-3xl mx-auto space-y-4 text-left text-sm text-surface-600">
              <p>
                <strong>Who uses it.</strong> Students, teachers and staff submit complaints; the HoD and
                departmental committee resolve them; an administrator manages users and system settings.
              </p>
              <p>
                <strong>Why it matters.</strong> Complainants stay protected, every action is logged for
                accountability, and the department gets measurable insight — average first-response time,
                resolution time, escalated cases — instead of lost paper trails.
              </p>
              <p>
                <strong>Try the demo.</strong> All passwords: <code>password123</code>
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Student: <code>2203054@student.ruet.ac.bd</code></li>
                <li>Student: <code>2203060@student.cse.ruet.ac.bd</code></li>
                <li>Teacher: <code>xyz@cse.ruet.ac.bd</code></li>
                <li>HoD: <code>hod@cse.ruet.ac.bd</code></li>
                <li>Admin: <code>admin@cse.ruet.ac.bd</code></li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}