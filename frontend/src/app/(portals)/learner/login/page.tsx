/**
 * @file login/page.tsx
 * Login page for returning learners.
 * Renders outside the sidebar layout (excluded in learner/layout.tsx).
 * Supports email/password auth with MFA prompt for privileged roles.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Please enter a valid email address";
    }
    if (!password || password.length < 1) {
      errs.password = "Password is required";
    }
    return errs;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    // Simulate API call — replace with actual POST /auth/login
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);

    // Simulate: if email contains "admin" or "instructor", require MFA
    if (email.includes("admin") || email.includes("instructor") || email.includes("assessor")) {
      setMfaRequired(true);
      return;
    }

    // Success — redirect to learner dashboard
    router.push("/learner");
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    if (mfaCode.length !== 6) {
      setErrors({ general: "Please enter a 6-digit code" });
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    router.push("/learner");
  }

  // MFA verification step
  if (mfaRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-heading-lg text-brand-700 font-semibold">
              KoreField Academy
            </Link>
          </div>
          <div className="rounded-card border border-surface-200 bg-surface-0 p-8 shadow-card">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 mb-4">
              <span className="text-heading-sm text-brand-600">🔐</span>
            </div>
            <h1 className="text-heading-sm text-surface-900 text-center">Two-Factor Authentication</h1>
            <p className="mt-2 text-body-sm text-surface-500 text-center">
              Enter the 6-digit code from your authenticator app.
            </p>
            <form onSubmit={handleMfaVerify} className="mt-6 space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full rounded-lg border border-surface-300 bg-surface-0 px-3.5 py-2.5 text-center text-heading-sm text-surface-900 tracking-[0.5em] placeholder:text-surface-300 placeholder:tracking-[0.5em] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors font-mono"
                aria-label="MFA verification code"
              />
              {errors.general && (
                <p className="text-caption text-status-error text-center" role="alert">{errors.general}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main login form
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="text-heading-lg text-brand-700 font-semibold">
            KoreField Academy
          </Link>
          <p className="mt-1 text-body-sm text-surface-500">
            Sign in to continue learning
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-card border border-surface-200 bg-surface-0 p-8 shadow-card">
          <h1 className="text-heading-sm text-surface-900 mb-6">Welcome back</h1>

          {errors.general && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-body-sm text-red-700" role="alert">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-body-sm font-medium text-surface-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-surface-300 bg-surface-0 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1.5 text-caption text-status-error" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-body-sm font-medium text-surface-700">
                  Password
                </label>
                <button type="button" onClick={() => { setForgotMode(true); setResetSent(false); setForgotEmail(""); }} className="text-caption text-brand-600 hover:text-brand-700 transition-colors">
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-surface-300 bg-surface-0 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && (
                <p id="password-error" className="mt-1.5 text-caption text-status-error" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Forgot Password Form */}
        {forgotMode && (
          <div className="mt-4 rounded-card border border-surface-200 bg-surface-0 p-6 shadow-card">
            {resetSent ? (
              <div className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 mb-3">
                  <span className="text-green-600">✓</span>
                </div>
                <p className="text-body-sm text-surface-900 font-medium">Reset link sent</p>
                <p className="mt-1 text-caption text-surface-500">Check your email for password reset instructions.</p>
                <button type="button" onClick={() => setForgotMode(false)} className="mt-3 text-caption text-brand-600 hover:text-brand-700 transition-colors">
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-body-lg font-medium text-surface-900">Reset your password</h2>
                <p className="mt-1 text-caption text-surface-500">Enter your email and we&apos;ll send a reset link.</p>
                <form onSubmit={(e) => { e.preventDefault(); if (forgotEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) setResetSent(true); }} className="mt-4 space-y-3">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-surface-300 bg-surface-0 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                    aria-label="Email for password reset"
                  />
                  <div className="flex gap-3">
                    <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">
                      Send Reset Link
                    </button>
                    <button type="button" onClick={() => setForgotMode(false)} className="rounded-lg border border-surface-300 px-4 py-2.5 text-body-sm text-surface-700 hover:bg-surface-100 transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}

        {/* Register link */}
        <p className="mt-6 text-center text-body-sm text-surface-500">
          Don&apos;t have an account?{" "}
          <Link href="/learner/register" className="font-medium text-brand-600 hover:text-brand-700 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
