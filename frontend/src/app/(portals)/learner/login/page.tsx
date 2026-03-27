"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowRight } from "lucide-react";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Please enter a valid email address";
    if (!password || password.length < 1) errs.password = "Password is required";
    return errs;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    if (email.includes("admin") || email.includes("instructor") || email.includes("assessor")) {
      setMfaRequired(true);
      return;
    }
    router.push("/learner");
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    if (mfaCode.length !== 6) { setErrors({ general: "Please enter a 6-digit code" }); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    router.push("/learner");
  }

  // MFA step
  if (mfaRequired) {
    return (
      <div className="flex min-h-screen">
        <BrandPanel />
        <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-sm animate-fade-in-up">
            <div className="rounded-2xl border border-surface-200 bg-surface-0 p-8 shadow-card-hover">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 mb-5">
                <span className="text-heading-sm">🔐</span>
              </div>
              <h1 className="text-heading-sm text-surface-900 text-center">Two-Factor Authentication</h1>
              <p className="mt-2 text-body-sm text-surface-500 text-center">Enter the 6-digit code from your authenticator app.</p>
              <form onSubmit={handleMfaVerify} className="mt-6 space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-3 text-center text-heading-sm text-surface-900 tracking-[0.5em] placeholder:text-surface-300 placeholder:tracking-[0.5em] focus:border-brand-500 focus:bg-surface-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-mono"
                  aria-label="MFA verification code"
                />
                {errors.general && <p className="text-caption text-status-error text-center" role="alert">{errors.general}</p>}
                <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand-600 px-4 py-3 text-body-sm font-semibold text-white shadow-sm hover:bg-brand-700 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
                  {loading ? "Verifying..." : "Verify"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <BrandPanel />
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Logo (mobile only) */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 text-heading-lg text-brand-700 font-bold">
              <GraduationCap className="h-7 w-7" />
              KoreField Academy
            </Link>
          </div>

          <div>
            <h1 className="text-display-sm text-surface-900">Welcome back</h1>
            <p className="mt-1 text-body-sm text-surface-500">Sign in to continue learning</p>
          </div>

          {errors.general && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-body-sm text-red-700" role="alert">{errors.general}</div>
          )}

          <form onSubmit={handleLogin} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-body-sm font-medium text-surface-700 mb-1.5">Email</label>
              <input
                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-3 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:bg-surface-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && <p id="email-error" className="mt-1.5 text-caption text-status-error" role="alert">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-body-sm font-medium text-surface-700">Password</label>
                <button type="button" onClick={() => { setForgotMode(true); setResetSent(false); setForgotEmail(""); }} className="text-caption text-brand-600 hover:text-brand-700 transition-colors font-medium">
                  Forgot password?
                </button>
              </div>
              <input
                id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-3 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:bg-surface-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && <p id="password-error" className="mt-1.5 text-caption text-status-error" role="alert">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand-600 px-4 py-3 text-body-sm font-semibold text-white shadow-sm hover:bg-brand-700 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              {loading ? "Signing in..." : <><span>Sign In</span><ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          {/* Forgot Password */}
          {forgotMode && (
            <div className="mt-6 rounded-2xl border border-surface-200 bg-surface-0 p-6 shadow-card animate-fade-in-up">
              {resetSent ? (
                <div className="text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 mb-3">
                    <span className="text-accent-600 font-bold">✓</span>
                  </div>
                  <p className="text-body-sm text-surface-900 font-medium">Reset link sent</p>
                  <p className="mt-1 text-caption text-surface-500">Check your email for password reset instructions.</p>
                  <button type="button" onClick={() => setForgotMode(false)} className="mt-3 text-caption text-brand-600 hover:text-brand-700 transition-colors font-medium">Back to sign in</button>
                </div>
              ) : (
                <>
                  <h2 className="text-body-lg font-semibold text-surface-900">Reset your password</h2>
                  <p className="mt-1 text-caption text-surface-500">Enter your email and we&apos;ll send a reset link.</p>
                  <form onSubmit={(e) => { e.preventDefault(); if (forgotEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) setResetSent(true); }} className="mt-4 space-y-3">
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com"
                      className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-3 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:bg-surface-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                      aria-label="Email for password reset"
                    />
                    <div className="flex gap-3">
                      <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2.5 text-body-sm font-semibold text-white hover:bg-brand-700 transition-all active:scale-[0.98]">Send Reset Link</button>
                      <button type="button" onClick={() => setForgotMode(false)} className="rounded-xl border border-surface-200 px-4 py-2.5 text-body-sm text-surface-700 hover:bg-surface-50 transition-all">Cancel</button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}

          <p className="mt-8 text-center text-body-sm text-surface-500">
            Don&apos;t have an account?{" "}
            <Link href="/learner/register" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/** Left brand panel — visible on lg+ screens */
function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-brand-600/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="relative">
        <Link href="/" className="inline-flex items-center gap-2 text-heading-lg text-white font-bold">
          <GraduationCap className="h-7 w-7" />
          KoreField Academy
        </Link>
      </div>
      <div className="relative">
        <blockquote className="text-heading-lg text-white/90 leading-relaxed">
          &ldquo;Build real AI skills, not just certificates.&rdquo;
        </blockquote>
        <p className="mt-4 text-body-sm text-brand-200">
          Africa&apos;s applied AI learning platform — AI-powered teaching, hands-on labs, and multidisciplinary team projects.
        </p>
      </div>
      <div className="relative flex gap-6 text-body-sm text-brand-300">
        <span>4 Tracks</span>
        <span>·</span>
        <span>11 AI Agents</span>
        <span>·</span>
        <span>54+ Countries</span>
      </div>
    </div>
  );
}
