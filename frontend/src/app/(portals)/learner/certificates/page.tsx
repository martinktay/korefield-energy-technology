"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { EmptyState } from "@/components/feedback";
import { Award, Download, ExternalLink, CheckCircle2, Code, Wrench, FolderGit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TRACK_SKILLS: Record<string, { skills: string[]; tools: string[]; projects: string[] }> = {
  "AI Engineering and Intelligent Systems": {
    skills: ["Model Training & Fine-tuning", "MLOps & CI/CD for ML", "RAG Pipeline Design", "Production AI Architecture", "API Design & Deployment", "Performance Optimization"],
    tools: ["Python", "PyTorch / TensorFlow", "LangChain", "FastAPI", "Docker", "AWS SageMaker", "PostgreSQL", "Redis"],
    projects: ["End-to-end ML Pipeline", "RAG-powered Q&A System", "Real-time Inference API", "Capstone: Production AI System"],
  },
  "Data Science and Decision Intelligence": {
    skills: ["Statistical Modeling", "Exploratory Data Analysis", "Machine Learning", "Data Visualization", "Decision Intelligence", "A/B Testing"],
    tools: ["Python", "Pandas / NumPy", "Scikit-learn", "SQL", "Jupyter", "Matplotlib / Plotly", "Apache Spark", "Tableau"],
    projects: ["Predictive Analytics Dashboard", "Customer Segmentation Model", "Time Series Forecasting", "Capstone: Decision Intelligence System"],
  },
  "Cybersecurity and AI Security": {
    skills: ["Threat Intelligence", "Adversarial ML Defense", "Network Security", "Incident Response", "AI Safety & Alignment", "Penetration Testing"],
    tools: ["Python", "Wireshark", "Metasploit", "OWASP ZAP", "Nmap", "Burp Suite", "AWS Security Hub", "Terraform"],
    projects: ["Vulnerability Assessment Report", "Adversarial Attack Simulation", "Security Audit Framework", "Capstone: AI Security Defense System"],
  },
  "AI Product and Project Leadership": {
    skills: ["Product Strategy", "AI Governance", "Stakeholder Management", "Agile / Scrum", "Technical Writing", "Team Leadership"],
    tools: ["Jira / Linear", "Figma", "Notion", "Miro", "Google Analytics", "SQL", "Python (basics)", "Presentation Tools"],
    projects: ["Product Requirements Document", "Go-to-Market Strategy", "AI Ethics Framework", "Capstone: AI Product Launch Plan"],
  },
};

const FALLBACK_CERTIFICATES = [
  {
    id: "CRT-zara-001",
    verificationCode: "KFCERT-2025-ZM7K9P",
    trackName: "Cybersecurity and AI Security",
    completionDate: "2025-02-10",
    status: "active" as const,
    learnerName: "Kofi Mensah",
    issuer: "KoreField Academy",
  },
];

interface Certificate {
  id: string;
  verificationCode: string;
  trackName: string;
  completionDate: string;
  status: string;
  learnerName?: string;
  issuer?: string;
}

export default function CertificatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "learner", "certificates"],
    queryFn: () => apiFetch<Certificate[]>("/dashboard/learner/certificates"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-xl" />
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  const certificates = data ?? FALLBACK_CERTIFICATES;

  if (certificates.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-heading-lg text-surface-900">Certificates</h1>
        <EmptyState title="No certificates yet" description="Complete a Track Pathway to earn your certificate. Check your progress dashboard for certification readiness." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-heading-lg text-surface-900">Certificates</h1>

      {certificates.map((cert) => {
        const trackData = TRACK_SKILLS[cert.trackName];
        return (
          <div key={cert.id} className="space-y-6">
            {/* Certificate Card — visual representation */}
            <div className="relative rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-surface-0 via-surface-0 to-brand-50/30 p-8 shadow-card-hover overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-100/30 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-100/20 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-caption text-brand-600 font-semibold uppercase tracking-wider">Certificate of Completion</p>
                      <p className="text-heading-sm text-surface-900">{cert.issuer || "KoreField Academy"}</p>
                    </div>
                  </div>
                  <Badge className={cert.status === "active" ? "bg-accent-50 text-accent-700 border-accent-200" : "bg-red-50 text-red-700 border-red-200"}>
                    {cert.status === "active" ? "Active" : "Revoked"}
                  </Badge>
                </div>

                {/* Learner + Track */}
                <div className="mb-6">
                  <p className="text-caption text-surface-400">This certifies that</p>
                  <p className="text-display-sm text-surface-900 font-bold">{cert.learnerName || "Kofi Mensah"}</p>
                  <p className="text-caption text-surface-400 mt-2">has successfully completed all requirements for</p>
                  <p className="text-heading-lg text-brand-700 mt-1">{cert.trackName}</p>
                  <p className="text-body-sm text-surface-500 mt-1">Beginner → Intermediate → Advanced · All performance gates passed · Capstone defense approved</p>
                </div>

                {/* Verification + Date */}
                <div className="flex flex-wrap gap-6 text-body-sm">
                  <div>
                    <p className="text-caption text-surface-400">Verification Code</p>
                    <p className="font-mono font-bold text-surface-900">{cert.verificationCode}</p>
                  </div>
                  <div>
                    <p className="text-caption text-surface-400">Date Issued</p>
                    <p className="font-medium text-surface-900">{cert.completionDate}</p>
                  </div>
                  <div>
                    <p className="text-caption text-surface-400">Certificate ID</p>
                    <p className="font-mono text-surface-700">{cert.id}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => {
                    const blob = new Blob([`KoreField Academy Certificate\n\n${cert.learnerName || "Kofi Mensah"}\n${cert.trackName}\n${cert.verificationCode}\nIssued: ${cert.completionDate}`], { type: "application/pdf" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = `${cert.verificationCode}.pdf`; a.click(); URL.revokeObjectURL(url);
                  }} className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-brand-700 transition-all active:scale-[0.98]">
                    <Download className="h-4 w-4" /> Download PDF
                  </button>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(`https://korefield.academy/verify/${cert.verificationCode}`); }}
                    className="flex items-center gap-2 rounded-xl border border-surface-200 px-4 py-2.5 text-body-sm text-surface-700 hover:bg-surface-50 transition-all">
                    <ExternalLink className="h-4 w-4" /> Share Link
                  </button>
                </div>
              </div>
            </div>

            {/* Skills, Tools & Projects */}
            {trackData && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-card">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-accent-600" />
                    <h3 className="text-body-lg font-semibold text-surface-900">Skills Acquired</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {trackData.skills.map((skill) => (
                      <li key={skill} className="flex items-center gap-2 text-body-sm text-surface-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-500 shrink-0" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-card">
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="h-5 w-5 text-brand-600" />
                    <h3 className="text-body-lg font-semibold text-surface-900">Tools & Technologies</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {trackData.tools.map((tool) => (
                      <Badge key={tool} variant="secondary" className="bg-brand-50 text-brand-700 border-0">{tool}</Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-card">
                  <div className="flex items-center gap-2 mb-3">
                    <FolderGit2 className="h-5 w-5 text-purple-600" />
                    <h3 className="text-body-lg font-semibold text-surface-900">Projects Completed</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {trackData.projects.map((project) => (
                      <li key={project} className="flex items-center gap-2 text-body-sm text-surface-600">
                        <Code className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        {project}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
