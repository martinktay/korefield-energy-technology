"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

type FormState = "idle" | "submitting" | "success" | "error";

export function ComingSoonWaitlistForm() {
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setState("submitting");

    const formData = new FormData(event.currentTarget);

    try {
      await apiFetch("/launch-waitlist", {
        method: "POST",
        body: JSON.stringify({
          email: formData.get("email"),
          full_name: formData.get("full_name"),
          organization: formData.get("organization"),
          role: formData.get("role"),
          area_of_interest: "KoreField Academy",
          source: "korefield-academy-coming-soon",
          website: formData.get("website"),
        }),
        retries: 0,
      });

      event.currentTarget.reset();
      setState("success");
    } catch {
      setError("We could not add you to the waitlist. Please try again.");
      setState("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-label="Join the waitlist">
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-body-sm font-medium text-surface-700">Full name</span>
          <input
            name="full_name"
            type="text"
            maxLength={120}
            className="h-11 w-full rounded-lg border border-surface-300 bg-white px-3 text-body-sm text-surface-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            placeholder="Your name"
          />
        </label>
        <label className="space-y-2">
          <span className="text-body-sm font-medium text-surface-700">Work email</span>
          <input
            name="email"
            type="email"
            required
            maxLength={320}
            className="h-11 w-full rounded-lg border border-surface-300 bg-white px-3 text-body-sm text-surface-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            placeholder="you@company.com"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-body-sm font-medium text-surface-700">Organization</span>
          <input
            name="organization"
            type="text"
            maxLength={160}
            className="h-11 w-full rounded-lg border border-surface-300 bg-white px-3 text-body-sm text-surface-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            placeholder="Company or school"
          />
        </label>
        <label className="space-y-2">
          <span className="text-body-sm font-medium text-surface-700">Role</span>
          <input
            name="role"
            type="text"
            maxLength={120}
            className="h-11 w-full rounded-lg border border-surface-300 bg-white px-3 text-body-sm text-surface-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            placeholder="Founder, learner, HR lead"
          />
        </label>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" className="bg-brand-600 text-white hover:bg-brand-700" disabled={state === "submitting"}>
          {state === "submitting" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : state === "success" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          {state === "success" ? "You are on the list" : "Join the waitlist"}
        </Button>
        <p className="text-caption text-surface-500">
          No spam. We will only contact you about the KoreField Academy launch.
        </p>
      </div>
      {state === "error" && (
        <p className="text-body-sm font-medium text-status-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
