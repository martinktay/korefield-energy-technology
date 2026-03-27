"use client";

import { useState } from "react";
import { Users, FileText, CheckCircle2, Clock, Star, X, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AppStatus = "New" | "In Review" | "Shortlisted" | "Interview" | "Offer" | "Hired" | "Rejected";

interface Application {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  status: AppStatus;
  appliedDate: string;
  cvFileName: string;
  coverNote: string;
  reviewerNotes: string;
}

const STATUS_COLORS: Record<AppStatus, string> = {
  New: "bg-brand-50 text-brand-700",
  "In Review": "bg-amber-50 text-amber-700",
  Shortlisted: "bg-purple-50 text-purple-700",
  Interview: "bg-blue-50 text-blue-700",
  Offer: "bg-accent-50 text-accent-700",
  Hired: "bg-green-50 text-green-700",
  Rejected: "bg-red-50 text-red-700",
};

const ALL_STATUSES: AppStatus[] = ["New", "In Review", "Shortlisted", "Interview", "Offer", "Hired", "Rejected"];

const MOCK_APPLICATIONS: Application[] = [
  { id: "APP-001", name: "Dr. Kwame Boateng", email: "kwame.b@example.com", role: "Lead Instructor — AI Engineering", department: "Faculty", atsScore: 88, matchedKeywords: ["python", "pytorch", "mlops", "rag", "langchain", "ai", "machine learning", "deep learning", "deployment", "aws", "docker", "teaching", "phd"], missingKeywords: ["tensorflow", "curriculum", "msc"], status: "Shortlisted", appliedDate: "2026-03-20", cvFileName: "kwame_boateng_cv.pdf", coverNote: "I have 5 years building production ML systems at Google and a passion for teaching AI in Africa.", reviewerNotes: "Strong candidate. PhD from MIT, 5 years at Google Brain. Schedule interview." },
  { id: "APP-002", name: "Fatima Al-Hassan", email: "fatima.h@example.com", role: "Instructor — Data Science", department: "Faculty", atsScore: 72, matchedKeywords: ["python", "pandas", "sql", "statistics", "data science", "machine learning", "visualization", "teaching"], missingKeywords: ["numpy", "scikit-learn", "matplotlib", "tableau", "eda", "msc", "phd", "data analysis"], status: "In Review", appliedDate: "2026-03-22", cvFileName: "fatima_alhassan_cv.pdf", coverNote: "Currently a data analyst at Safaricom. Looking to transition into education.", reviewerNotes: "" },
  { id: "APP-003", name: "Chidi Okonkwo", email: "chidi.o@example.com", role: "Full-Stack Engineer", department: "Engineering", atsScore: 92, matchedKeywords: ["typescript", "react", "next.js", "nestjs", "node.js", "postgresql", "redis", "aws", "docker", "terraform", "tailwind", "prisma", "ci/cd", "github actions", "testing"], missingKeywords: ["ecs", "fargate", "s3", "sqs", "jest", "nodejs", "postgres", "nextjs"], status: "Interview", appliedDate: "2026-03-18", cvFileName: "chidi_okonkwo_cv.pdf", coverNote: "3 years at Paystack building fintech APIs. Love the KoreField mission.", reviewerNotes: "Excellent technical fit. Passed coding assessment. Final interview with CTO scheduled." },
  { id: "APP-004", name: "Amina Diallo", email: "amina.d@example.com", role: "AI/ML Engineer", department: "AI Services", atsScore: 65, matchedKeywords: ["python", "langchain", "rag", "llm", "ai", "fastapi", "prompt engineering", "agent"], missingKeywords: ["langgraph", "langsmith", "vector database", "embedding", "guardrails", "nlp", "chatbot", "machine learning"], status: "New", appliedDate: "2026-03-25", cvFileName: "amina_diallo_cv.pdf", coverNote: "Built RAG chatbots at a startup in Dakar. Excited about LangGraph.", reviewerNotes: "" },
  { id: "APP-005", name: "Tendai Moyo", email: "tendai.m@example.com", role: "Enrollment Coordinator", department: "Operations", atsScore: 78, matchedKeywords: ["operations", "customer success", "enrollment", "onboarding", "learner", "education", "lms", "communication", "administration", "support"], missingKeywords: ["crm", "payment", "coordination"], status: "New", appliedDate: "2026-03-24", cvFileName: "tendai_moyo_cv.pdf", coverNote: "5 years in student services at University of Cape Town.", reviewerNotes: "" },
  { id: "APP-006", name: "Samuel Osei", email: "samuel.o@example.com", role: "Full-Stack Engineer", department: "Engineering", atsScore: 35, matchedKeywords: ["react", "node.js", "postgresql", "docker", "testing"], missingKeywords: ["typescript", "next.js", "nextjs", "nestjs", "nodejs", "redis", "aws", "ecs", "fargate", "s3", "sqs", "terraform", "tailwind", "prisma", "ci/cd", "github actions", "jest", "postgres"], status: "Rejected", appliedDate: "2026-03-15", cvFileName: "samuel_osei_cv.pdf", coverNote: "Junior developer looking for opportunities.", reviewerNotes: "ATS score too low. Missing core stack requirements (NestJS, TypeScript, AWS)." },
];

function getScoreColor(score: number): string {
  if (score >= 75) return "text-accent-600";
  if (score >= 50) return "text-amber-600";
  return "text-status-error";
}

export default function RecruitmentPage() {
  const [applications, setApplications] = useState(MOCK_APPLICATIONS);
  const [filterStatus, setFilterStatus] = useState<AppStatus | "All">("All");
  const [filterDept, setFilterDept] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});

  const depts = ["All", "Faculty", "Engineering", "AI Services", "Operations"];
  const filtered = applications.filter((a) =>
    (filterStatus === "All" || a.status === filterStatus) &&
    (filterDept === "All" || a.department === filterDept)
  );

  const pipeline = {
    total: applications.length,
    new: applications.filter((a) => a.status === "New").length,
    inReview: applications.filter((a) => a.status === "In Review").length,
    shortlisted: applications.filter((a) => a.status === "Shortlisted").length,
    interview: applications.filter((a) => a.status === "Interview").length,
    hired: applications.filter((a) => a.status === "Hired").length,
    rejected: applications.filter((a) => a.status === "Rejected").length,
  };

  function updateStatus(id: string, status: AppStatus) {
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
  }

  function addNote(id: string) {
    const note = noteInput[id]?.trim();
    if (!note) return;
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, reviewerNotes: a.reviewerNotes ? `${a.reviewerNotes}\n${note}` : note } : a));
    setNoteInput((prev) => ({ ...prev, [id]: "" }));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display-sm text-surface-900">Recruitment</h1>
        <p className="mt-1 text-body-lg text-surface-500">Review job applications, manage the hiring pipeline, and onboard new team members.</p>
      </div>

      {/* Pipeline KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 stagger-children">
        {[
          { label: "Total", value: pipeline.total, color: "text-surface-900" },
          { label: "New", value: pipeline.new, color: "text-brand-600" },
          { label: "In Review", value: pipeline.inReview, color: "text-amber-600" },
          { label: "Shortlisted", value: pipeline.shortlisted, color: "text-purple-600" },
          { label: "Interview", value: pipeline.interview, color: "text-blue-600" },
          { label: "Hired", value: pipeline.hired, color: "text-accent-600" },
          { label: "Rejected", value: pipeline.rejected, color: "text-surface-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-surface-200 bg-surface-0 p-3 shadow-card text-center">
            <p className={`text-heading-sm font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-caption text-surface-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-caption text-surface-400 self-center mr-1">Status:</span>
          {(["All", ...ALL_STATUSES] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`rounded-lg px-3 py-1.5 text-caption border transition-all ${filterStatus === s ? "bg-brand-50 border-brand-300 text-brand-700 font-medium" : "border-surface-200 text-surface-500 hover:bg-surface-50"}`}>{s}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-caption text-surface-400 self-center mr-1">Dept:</span>
          {depts.map((d) => (
            <button key={d} onClick={() => setFilterDept(d)} className={`rounded-lg px-3 py-1.5 text-caption border transition-all ${filterDept === d ? "bg-brand-50 border-brand-300 text-brand-700 font-medium" : "border-surface-200 text-surface-500 hover:bg-surface-50"}`}>{d}</button>
          ))}
        </div>
      </div>

      {/* Applications */}
      <div className="space-y-3">
        {filtered.map((app) => {
          const isExpanded = expanded === app.id;
          return (
            <div key={app.id} className="rounded-xl border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
              <button onClick={() => setExpanded(isExpanded ? null : app.id)} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-surface-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-body-sm font-semibold text-surface-900">{app.name}</p>
                    <Badge className={`border-0 ${STATUS_COLORS[app.status]}`}>{app.status}</Badge>
                  </div>
                  <p className="text-caption text-surface-500 mt-0.5">{app.role} · {app.department}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className={`text-body-sm font-bold ${getScoreColor(app.atsScore)}`}>{app.atsScore}%</p>
                    <p className="text-caption text-surface-400">ATS</p>
                  </div>
                  <p className="text-caption text-surface-400 hidden md:block">{app.appliedDate}</p>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-surface-400" /> : <ChevronDown className="h-4 w-4 text-surface-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-surface-100 pt-4 space-y-4 animate-fade-in-up">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-caption text-surface-400">Email</p>
                      <p className="text-body-sm text-surface-900">{app.email}</p>
                    </div>
                    <div>
                      <p className="text-caption text-surface-400">Applied</p>
                      <p className="text-body-sm text-surface-900">{app.appliedDate}</p>
                    </div>
                  </div>

                  {app.coverNote && (
                    <div>
                      <p className="text-caption text-surface-400 mb-1">Cover Note</p>
                      <p className="text-body-sm text-surface-600 bg-surface-50 rounded-lg p-3">{app.coverNote}</p>
                    </div>
                  )}

                  {/* ATS Score Detail */}
                  <div className="rounded-xl border border-surface-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-body-sm font-semibold text-surface-900">ATS Match Score</p>
                      <span className={`text-heading-sm font-bold ${getScoreColor(app.atsScore)}`}>{app.atsScore}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-100 overflow-hidden">
                      <div className={`h-2 rounded-full ${app.atsScore >= 75 ? "bg-accent-500" : app.atsScore >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${app.atsScore}%` }} />
                    </div>
                    {app.matchedKeywords.length > 0 && (
                      <div>
                        <p className="text-caption text-accent-600 font-medium mb-1">Matched ({app.matchedKeywords.length})</p>
                        <div className="flex flex-wrap gap-1">{app.matchedKeywords.map((kw) => <Badge key={kw} variant="secondary" className="bg-accent-50 text-accent-700 border-0 text-[11px]">{kw}</Badge>)}</div>
                      </div>
                    )}
                    {app.missingKeywords.length > 0 && (
                      <div>
                        <p className="text-caption text-surface-400 font-medium mb-1">Missing ({app.missingKeywords.length})</p>
                        <div className="flex flex-wrap gap-1">{app.missingKeywords.map((kw) => <Badge key={kw} variant="secondary" className="bg-surface-100 text-surface-500 border-0 text-[11px]">{kw}</Badge>)}</div>
                      </div>
                    )}
                  </div>

                  {/* CV Download */}
                  <button className="flex items-center gap-2 rounded-xl border border-surface-200 px-4 py-2.5 text-body-sm text-surface-700 hover:bg-surface-50 transition-all">
                    <Download className="h-4 w-4" /> Download CV ({app.cvFileName})
                  </button>

                  {/* Reviewer Notes */}
                  <div>
                    <p className="text-caption text-surface-400 mb-1">Reviewer Notes</p>
                    {app.reviewerNotes ? (
                      <p className="text-body-sm text-surface-600 bg-surface-50 rounded-lg p-3 whitespace-pre-line">{app.reviewerNotes}</p>
                    ) : (
                      <p className="text-body-sm text-surface-400 italic">No notes yet.</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <input type="text" value={noteInput[app.id] || ""} onChange={(e) => setNoteInput({ ...noteInput, [app.id]: e.target.value })} placeholder="Add a note..."
                        className="flex-1 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
                      <button onClick={() => addNote(app.id)} className="rounded-xl bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 transition-all active:scale-[0.98]">Add</button>
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div>
                    <p className="text-caption text-surface-400 mb-2">Change Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_STATUSES.filter((s) => s !== app.status).map((s) => (
                        <button key={s} onClick={() => updateStatus(app.id, s)} className={`rounded-lg px-3 py-1.5 text-caption border transition-all hover:opacity-80 ${STATUS_COLORS[s]}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-surface-200 bg-surface-0 p-8 text-center">
            <Users className="h-8 w-8 text-surface-300 mx-auto mb-2" />
            <p className="text-body-sm text-surface-500">No applications match the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
