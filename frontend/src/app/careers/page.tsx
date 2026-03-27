"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { MapPin, Clock, Briefcase, ChevronDown, ChevronUp, Send, CheckCircle2, Upload, FileText, Loader2, AlertCircle } from "lucide-react";

interface JobOpening {
  id: string;
  title: string;
  department: string;
  type: string;
  location: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  keywords: string[]; // ATS matching keywords
}

const openings: JobOpening[] = [
  {
    id: "INS-001",
    title: "Lead Instructor — AI Engineering",
    department: "Faculty",
    type: "Full-time",
    location: "Remote (Africa)",
    description: "Design and deliver the AI Engineering and Intelligent Systems curriculum across Beginner, Intermediate, and Advanced levels. Lead lab sessions using Python, PyTorch, and LangChain. Mentor learners through pod-based projects and capstone defenses. Collaborate with assessors on performance gate design and grading rubrics.",
    responsibilities: [
      "Design 18 modules covering model training, MLOps, RAG pipelines, and production AI architecture",
      "Lead live lab sessions and review learner code submissions via the Assignment Feedback Agent",
      "Create assessments (MCQ, coding exercises, drag-and-drop) using the platform's assessment builder",
      "Supervise pod-based capstone projects and participate in defense panels",
      "Collaborate with the AI services team on Tutor Agent prompt engineering",
    ],
    requirements: [
      "PhD or MSc in Computer Science, AI, Machine Learning, or related field",
      "3+ years building production AI/ML systems (model training, deployment, monitoring)",
      "Proficiency in Python, PyTorch or TensorFlow, and cloud deployment (AWS preferred)",
      "Experience with RAG pipelines, LangChain, or LLM-based applications",
      "Strong communication skills and prior teaching or mentoring experience",
    ],
    niceToHave: [
      "Experience with LangGraph for multi-step AI workflows",
      "Published research in AI/ML",
      "Familiarity with NestJS or FastAPI backend development",
    ],
    keywords: ["python", "pytorch", "tensorflow", "mlops", "rag", "langchain", "ai", "machine learning", "deep learning", "model training", "deployment", "aws", "docker", "teaching", "curriculum", "phd", "msc"],
  },
  {
    id: "INS-002",
    title: "Instructor — Data Science & Decision Intelligence",
    department: "Faculty",
    type: "Full-time",
    location: "Remote (Africa)",
    description: "Teach statistical modeling, exploratory data analysis, and ML pipeline design within the Data Science track. Create hands-on lab exercises using Pandas, Scikit-learn, and SQL. Provide feedback on learner submissions and contribute to performance gate assessments.",
    responsibilities: [
      "Develop and deliver 18 modules covering EDA, statistical modeling, ML, and decision intelligence",
      "Create coding exercises with test cases for the in-browser Python/SQL execution environment",
      "Grade submissions and provide structured feedback via the platform's grading queue",
      "Design performance gate assessments with clear rubrics and passing criteria",
      "Mentor learners in pod-based data projects",
    ],
    requirements: [
      "MSc or PhD in Data Science, Statistics, Mathematics, or related field",
      "2+ years hands-on experience with data pipelines, statistical modeling, and ML",
      "Proficiency in Python, Pandas, NumPy, Scikit-learn, and SQL",
      "Experience with data visualization (Matplotlib, Plotly, or Tableau)",
      "Prior teaching, tutoring, or technical mentoring experience",
    ],
    niceToHave: [
      "Experience with Apache Spark or distributed computing",
      "Published work in data science or analytics",
      "Familiarity with Jupyter notebooks and interactive teaching",
    ],
    keywords: ["python", "pandas", "numpy", "scikit-learn", "sql", "statistics", "data science", "machine learning", "data analysis", "visualization", "matplotlib", "tableau", "eda", "teaching", "msc", "phd"],
  },
  {
    id: "INS-003",
    title: "Instructor — Cybersecurity & AI Security",
    department: "Faculty",
    type: "Full-time",
    location: "Remote (Africa)",
    description: "Lead the Cybersecurity and AI Security track. Teach threat intelligence, adversarial ML defense, penetration testing, and AI safety. Design lab exercises that simulate real-world security scenarios using the platform's sandboxed code execution environment.",
    responsibilities: [
      "Develop 18 modules covering network security, adversarial ML, incident response, and AI safety",
      "Create hands-on security labs with realistic attack/defense scenarios",
      "Design performance gates testing practical security skills",
      "Supervise pod-based security audit projects and capstone defenses",
      "Stay current with emerging AI security threats and update curriculum accordingly",
    ],
    requirements: [
      "MSc or PhD in Cybersecurity, Computer Science, or related field",
      "3+ years in cybersecurity with hands-on penetration testing or incident response",
      "Knowledge of adversarial ML attacks and defenses",
      "Proficiency with security tools (Wireshark, Metasploit, Burp Suite, OWASP ZAP)",
      "Experience with Python scripting for security automation",
    ],
    niceToHave: [
      "CISSP, CEH, or OSCP certification",
      "Experience with AWS security services (GuardDuty, Security Hub)",
      "Published research in AI security or adversarial ML",
    ],
    keywords: ["cybersecurity", "security", "penetration testing", "adversarial", "ai safety", "wireshark", "metasploit", "burp suite", "owasp", "python", "incident response", "threat intelligence", "cissp", "ceh", "oscp", "network security"],
  },
  {
    id: "ASR-001",
    title: "Senior Assessor — Performance & Certification",
    department: "Faculty",
    type: "Contract",
    location: "Remote (Africa)",
    description: "Evaluate capstone defenses, supervise pod deliverables, score professionalism across 5 dimensions (Communication, Accountability, Collaboration, Documentation, Learning Discipline), and validate certification readiness. Work with the Certification Validation Agent to ensure consistent, fair assessments.",
    responsibilities: [
      "Conduct capstone defense panels (14-day scheduling window per submission)",
      "Evaluate pod deliverables: working prototype, documentation, governance checklist, sprint reviews",
      "Score learner professionalism across 5 standardized dimensions",
      "Validate all 6 certification conditions before recommending certificate issuance",
      "Provide structured feedback that feeds into the Assessor Support Agent",
    ],
    requirements: [
      "5+ years industry experience in AI, data science, cybersecurity, or product management",
      "Experience evaluating technical projects, theses, or professional portfolios",
      "Strong judgment on professional conduct, team dynamics, and industry realism",
      "Excellent written communication for structured feedback reports",
      "Available for scheduled defense panels (flexible hours, ~10-15 hrs/week)",
    ],
    niceToHave: [
      "Prior experience as a university examiner or industry mentor",
      "Familiarity with competency-based assessment frameworks",
      "Experience with multiple African tech ecosystems",
    ],
    keywords: ["assessment", "evaluation", "capstone", "defense", "mentoring", "feedback", "professionalism", "certification", "industry", "ai", "data science", "cybersecurity", "product management", "examiner"],
  },
  {
    id: "ENG-001",
    title: "Full-Stack Engineer",
    department: "Engineering",
    type: "Full-time",
    location: "Remote",
    description: "Build and maintain the KoreField Academy platform across the Next.js 14 frontend, NestJS backend, and AWS infrastructure. Work on the learner portal, instructor tools, admin dashboards, and real-time features like pod chat and notifications. Ensure performance, accessibility, and security across all portal types.",
    responsibilities: [
      "Develop frontend features using Next.js 14 (App Router), Tailwind CSS, React Query, and Zustand",
      "Build backend APIs using NestJS with Prisma ORM and PostgreSQL",
      "Implement RBAC guards, JWT auth, and MFA for privileged roles",
      "Design and optimize database queries, caching (Redis), and SQS job processing",
      "Write unit tests, integration tests, and maintain CI/CD pipelines (GitHub Actions)",
    ],
    requirements: [
      "3+ years professional experience with TypeScript, React, and Node.js",
      "Experience with Next.js (App Router), Tailwind CSS, and state management (React Query, Zustand)",
      "Backend experience with NestJS or Express, PostgreSQL, and Redis",
      "Familiarity with AWS services (ECS Fargate, RDS, S3, SQS) or similar cloud platforms",
      "Experience with Docker, CI/CD, and infrastructure as code (Terraform preferred)",
    ],
    niceToHave: [
      "Experience with Prisma ORM and database migration workflows",
      "Familiarity with Pyodide or WebAssembly-based code execution",
      "Experience building real-time features (WebSocket, SSE)",
    ],
    keywords: ["typescript", "react", "next.js", "nextjs", "nestjs", "node.js", "nodejs", "postgresql", "postgres", "redis", "aws", "ecs", "fargate", "s3", "sqs", "docker", "terraform", "tailwind", "prisma", "ci/cd", "github actions", "jest", "testing"],
  },
  {
    id: "ENG-002",
    title: "AI/ML Engineer — Agent Development",
    department: "AI Services",
    type: "Full-time",
    location: "Remote",
    description: "Build and maintain the 11 AI agents powering KoreField Academy using LangChain, LangGraph, and LangSmith. Develop RAG pipelines for the Tutor Agent, implement multi-step workflows for certification validation and market intelligence, and ensure prompt safety with guardrails.",
    responsibilities: [
      "Develop learner-side agents: Tutor, Assignment Feedback, Dropout Risk, Career Support",
      "Build faculty-side agents: Instructor Insight, Assessor Support, Certification Validation",
      "Implement executive agents: Market Intelligence, Pricing Intelligence, Expansion, Academic Performance",
      "Design and optimize RAG pipelines with chunking, embedding, and vector search",
      "Monitor agent performance via LangSmith tracing and implement prompt injection protection",
    ],
    requirements: [
      "2+ years experience with Python and LLM-based applications",
      "Hands-on experience with LangChain and/or LangGraph",
      "Understanding of RAG patterns, vector databases, and embedding models",
      "Experience with prompt engineering, output safety filtering, and AI guardrails",
      "Familiarity with FastAPI and async Python patterns",
    ],
    niceToHave: [
      "Experience with LangSmith for observability and prompt debugging",
      "Knowledge of multi-agent orchestration patterns",
      "Familiarity with AWS Bedrock or other managed LLM services",
    ],
    keywords: ["python", "langchain", "langgraph", "langsmith", "rag", "llm", "ai", "machine learning", "fastapi", "vector database", "embedding", "prompt engineering", "guardrails", "agent", "nlp", "chatbot"],
  },
  {
    id: "OPS-001",
    title: "Enrollment & Learner Success Coordinator",
    department: "Operations",
    type: "Full-time",
    location: "Remote (Africa)",
    description: "Manage the end-to-end learner lifecycle from registration through certification. Handle Foundation School onboarding, track enrollment, payment support, pod assignment coordination, and dropout intervention. Work closely with the Dropout Risk Agent to identify and support at-risk learners.",
    responsibilities: [
      "Onboard new learners through Foundation School and track enrollment",
      "Coordinate pod assignments ensuring multidisciplinary team composition",
      "Monitor payment plans, handle overdue escalations, and manage grace periods",
      "Identify at-risk learners using Dropout Risk Agent insights and intervene proactively",
      "Support certificate issuance workflow and learner communications",
    ],
    requirements: [
      "2+ years in operations, customer success, or education administration",
      "Strong organizational skills and attention to detail",
      "Experience with CRM, LMS, or student information systems",
      "Excellent written and verbal communication in English",
      "Empathy and patience for supporting diverse learner populations",
    ],
    niceToHave: [
      "Fluency in French, Portuguese, or Swahili",
      "Experience in African edtech or workforce development",
      "Familiarity with payment systems in African markets (mobile money, local gateways)",
    ],
    keywords: ["operations", "customer success", "enrollment", "onboarding", "learner", "education", "lms", "crm", "communication", "administration", "support", "payment", "coordination"],
  },
];

const departments = ["All", "Faculty", "Engineering", "AI Services", "Operations"];

/** ATS scoring: extract text from uploaded file, match against job keywords */
function scoreCV(cvText: string, job: JobOpening): { score: number; matched: string[]; missing: string[] } {
  const text = cvText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of job.keywords) {
    if (text.includes(kw.toLowerCase())) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }

  const score = job.keywords.length > 0 ? Math.round((matched.length / job.keywords.length) * 100) : 0;
  return { score, matched, missing };
}

function getScoreColor(score: number): string {
  if (score >= 75) return "text-accent-600";
  if (score >= 50) return "text-amber-600";
  return "text-status-error";
}

function getScoreLabel(score: number): string {
  if (score >= 75) return "Strong Match";
  if (score >= 50) return "Moderate Match";
  return "Low Match";
}

export default function CareersPage() {
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", email: "", cover: "" });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");
  const [atsResult, setAtsResult] = useState<{ score: number; matched: string[]; missing: string[] } | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = filter === "All" ? openings : openings.filter((o) => o.department === filter);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, jobId: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvFile(file);
    setAtsResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCvText(text);

      // Run ATS scan
      setScanning(true);
      const job = openings.find((o) => o.id === jobId);
      if (job) {
        // Simulate processing delay
        setTimeout(() => {
          const result = scoreCV(text, job);
          setAtsResult(result);
          setScanning(false);
        }, 1500);
      }
    };
    reader.readAsText(file);
  }

  function handleApply(id: string) {
    if (!form.name.trim() || !form.email.trim() || !cvFile) return;
    setSubmitted((prev) => [...prev, id]);
    setApplying(null);
    setForm({ name: "", email: "", cover: "" });
    setCvFile(null);
    setCvText("");
    setAtsResult(null);
  }

  function startApplying(id: string) {
    setApplying(id);
    setCvFile(null);
    setCvText("");
    setAtsResult(null);
    setForm({ name: "", email: "", cover: "" });
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <nav className="sticky top-0 z-50 border-b border-surface-200/80 bg-surface-0/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-heading-sm text-brand-700 font-semibold tracking-tight">KoreField Academy</Link>
          <div className="hidden items-center gap-1 sm:flex">
            <Link href="/#tracks" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Specialized Tracks</Link>
            <Link href="/pricing" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Pricing</Link>
            <Link href="/team" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Team</Link>
            <Link href="/careers" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-brand-600")}>Careers</Link>
            <Separator orientation="vertical" className="mx-2 h-5" />
            <Link href="/learner/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Sign In</Link>
            <Link href="/learner/register" className={cn(buttonVariants({ size: "sm" }), "bg-brand-600 text-white hover:bg-brand-700")}>Get Started</Link>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <Link href="/learner/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Sign In</Link>
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-surface-900 py-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-3xl px-4">
          <Badge variant="secondary" className="mb-4 bg-brand-700/40 text-brand-100 border border-brand-500/40 hover:bg-brand-700/40">We&apos;re Hiring</Badge>
          <h1 className="text-display-lg text-white">Build the Future of AI Education</h1>
          <p className="mt-4 text-body-lg text-surface-200 max-w-xl mx-auto">Join KoreField Academy and help prepare Africa&apos;s workforce for intelligent industries. Remote-first, mission-driven. Upload your CV and our ATS will match your skills instantly.</p>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-display-sm text-surface-900">Open Positions</h2>
          <span className="text-body-sm text-surface-500">{filtered.length} role{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {departments.map((dept) => (
            <button key={dept} onClick={() => setFilter(dept)} className={`rounded-xl px-4 py-2 text-body-sm border transition-all ${filter === dept ? "bg-brand-50 border-brand-300 text-brand-700 font-medium" : "border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50"}`}>
              {dept}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((job) => {
            const isExpanded = expanded === job.id;
            const isApplying = applying === job.id;
            const isSubmitted = submitted.includes(job.id);

            return (
              <div key={job.id} className="rounded-2xl border border-surface-200 bg-surface-0 shadow-card overflow-hidden transition-all">
                <button onClick={() => setExpanded(isExpanded ? null : job.id)} className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-surface-50 transition-colors">
                  <div>
                    <h3 className="text-heading-sm text-surface-900">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-caption text-surface-500">
                      <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{job.department}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{job.type}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-surface-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-surface-400 shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-surface-100 pt-4 animate-fade-in-up">
                    <p className="text-body-sm text-surface-600 leading-relaxed">{job.description}</p>

                    <h4 className="text-body-sm font-semibold text-surface-900 mt-5 mb-2">Responsibilities</h4>
                    <ul className="space-y-1.5">
                      {job.responsibilities.map((r) => (
                        <li key={r} className="flex items-start gap-2 text-body-sm text-surface-600"><span className="text-brand-500 mt-1 shrink-0">•</span>{r}</li>
                      ))}
                    </ul>

                    <h4 className="text-body-sm font-semibold text-surface-900 mt-5 mb-2">Requirements</h4>
                    <ul className="space-y-1.5">
                      {job.requirements.map((r) => (
                        <li key={r} className="flex items-start gap-2 text-body-sm text-surface-600"><CheckCircle2 className="h-4 w-4 text-accent-500 shrink-0 mt-0.5" />{r}</li>
                      ))}
                    </ul>

                    {job.niceToHave.length > 0 && (
                      <>
                        <h4 className="text-body-sm font-semibold text-surface-900 mt-5 mb-2">Nice to Have</h4>
                        <ul className="space-y-1.5">
                          {job.niceToHave.map((r) => (
                            <li key={r} className="flex items-start gap-2 text-body-sm text-surface-400"><span className="mt-1 shrink-0">○</span>{r}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    {isSubmitted ? (
                      <div className="mt-6 rounded-xl bg-accent-50 border border-accent-200 p-5 text-center">
                        <CheckCircle2 className="h-6 w-6 text-accent-600 mx-auto mb-2" />
                        <p className="text-body-sm font-medium text-accent-700">Application submitted</p>
                        <p className="text-caption text-accent-600 mt-1">We&apos;ll review your application and get back to you within 5 business days.</p>
                      </div>
                    ) : isApplying ? (
                      <div className="mt-6 rounded-xl border border-surface-200 bg-surface-50 p-5 space-y-4 animate-fade-in-up">
                        <h4 className="text-body-sm font-semibold text-surface-900">Apply for {job.title}</h4>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-caption font-medium text-surface-700 mb-1">Full Name *</label>
                            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name"
                              className="w-full rounded-xl border border-surface-200 bg-surface-0 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
                          </div>
                          <div>
                            <label className="block text-caption font-medium text-surface-700 mb-1">Email *</label>
                            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"
                              className="w-full rounded-xl border border-surface-200 bg-surface-0 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
                          </div>
                        </div>

                        {/* CV Upload */}
                        <div>
                          <label className="block text-caption font-medium text-surface-700 mb-1">Upload CV / Resume *</label>
                          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => handleFileUpload(e, job.id)} />
                          {cvFile ? (
                            <div className="rounded-xl border border-surface-200 bg-surface-0 p-4">
                              <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-brand-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-body-sm font-medium text-surface-900 truncate">{cvFile.name}</p>
                                  <p className="text-caption text-surface-400">{(cvFile.size / 1024).toFixed(0)} KB</p>
                                </div>
                                <button onClick={() => { setCvFile(null); setCvText(""); setAtsResult(null); }} className="text-caption text-surface-400 hover:text-status-error transition-colors">Remove</button>
                              </div>

                              {/* ATS Scanning */}
                              {scanning && (
                                <div className="mt-3 flex items-center gap-2 text-body-sm text-brand-600">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Scanning CV against job requirements...
                                </div>
                              )}

                              {/* ATS Results */}
                              {atsResult && !scanning && (
                                <div className="mt-4 rounded-xl border border-surface-200 bg-surface-0 p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-body-sm font-semibold text-surface-900">ATS Match Score</p>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-heading-sm font-bold ${getScoreColor(atsResult.score)}`}>{atsResult.score}%</span>
                                      <Badge className={`border-0 ${atsResult.score >= 75 ? "bg-accent-50 text-accent-700" : atsResult.score >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                                        {getScoreLabel(atsResult.score)}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Progress bar */}
                                  <div className="h-2 w-full rounded-full bg-surface-100 overflow-hidden">
                                    <div className={`h-2 rounded-full transition-all duration-500 ${atsResult.score >= 75 ? "bg-accent-500" : atsResult.score >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${atsResult.score}%` }} />
                                  </div>

                                  {atsResult.matched.length > 0 && (
                                    <div>
                                      <p className="text-caption font-medium text-accent-600 mb-1">Matched Skills ({atsResult.matched.length})</p>
                                      <div className="flex flex-wrap gap-1">
                                        {atsResult.matched.map((kw) => (
                                          <Badge key={kw} variant="secondary" className="bg-accent-50 text-accent-700 border-0 text-[11px]">{kw}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {atsResult.missing.length > 0 && (
                                    <div>
                                      <p className="text-caption font-medium text-surface-500 mb-1">Missing Keywords ({atsResult.missing.length})</p>
                                      <div className="flex flex-wrap gap-1">
                                        {atsResult.missing.map((kw) => (
                                          <Badge key={kw} variant="secondary" className="bg-surface-100 text-surface-500 border-0 text-[11px]">{kw}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {atsResult.score < 50 && (
                                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                      <p className="text-caption text-amber-700">Your CV may not be the strongest match for this role. Consider highlighting the missing keywords if you have relevant experience, or explore other positions that better match your background.</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button onClick={() => fileRef.current?.click()} className="w-full rounded-xl border-2 border-dashed border-surface-300 bg-surface-0 p-6 text-center hover:border-brand-400 hover:bg-brand-50/30 transition-all">
                              <Upload className="h-8 w-8 text-surface-400 mx-auto mb-2" />
                              <p className="text-body-sm text-surface-600">Click to upload your CV</p>
                              <p className="text-caption text-surface-400 mt-1">PDF, DOC, DOCX, or TXT (max 5MB)</p>
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-caption font-medium text-surface-700 mb-1">Cover Note <span className="text-surface-400 font-normal">(optional)</span></label>
                          <textarea value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })} rows={3} placeholder="Tell us why you're interested in this role..."
                            className="w-full rounded-xl border border-surface-200 bg-surface-0 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all resize-none" />
                        </div>

                        <div className="flex gap-3">
                          <button onClick={() => handleApply(job.id)} disabled={!form.name.trim() || !form.email.trim() || !cvFile}
                            className="rounded-xl bg-brand-600 px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center gap-2">
                            <Send className="h-4 w-4" /> Submit Application
                          </button>
                          <button onClick={() => { setApplying(null); setCvFile(null); setAtsResult(null); }}
                            className="rounded-xl border border-surface-200 px-4 py-2.5 text-body-sm text-surface-700 hover:bg-surface-100 transition-all">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => startApplying(job.id)} className="mt-6 rounded-xl bg-brand-600 px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-brand-700 transition-all active:scale-[0.98]">Apply Now</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-surface-50 py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-heading-lg text-surface-900 mb-8">Why Work With Us</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { title: "Remote-First", desc: "Work from anywhere in Africa or globally. Flexible hours, async communication via the platform's messaging system." },
              { title: "Mission-Driven", desc: "Shape AI education for an entire continent. Real impact — every learner you teach builds real skills, not just certificates." },
              { title: "Cutting-Edge Stack", desc: "Next.js 14, NestJS, LangChain, LangGraph, AWS, Terraform. Work with modern tools on meaningful problems." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-surface-200 bg-surface-0 p-6 shadow-card">
                <h3 className="text-heading-sm text-surface-900">{item.title}</h3>
                <p className="mt-2 text-body-sm text-surface-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-surface-200 bg-surface-50 py-8 text-center">
        <p className="text-caption text-surface-400">© {new Date().getFullYear()} KoreField Academy. All rights reserved.</p>
      </footer>
    </div>
  );
}
