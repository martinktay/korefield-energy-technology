"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type FormState = "idle" | "submitting" | "success" | "error";

const WAITLIST_FORM_ENDPOINT = process.env.NEXT_PUBLIC_WAITLIST_FORM_ENDPOINT;

export function ComingSoonWaitlistForm() {
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setState("submitting");

    const formData = new FormData(event.currentTarget);

    try {
      if (!WAITLIST_FORM_ENDPOINT) {
        throw new Error("Waitlist form endpoint is not configured.");
      }

      formData.set("area_of_interest", "KoreField Academy");
      formData.set("source", "korefield-academy-coming-soon");

      const res = await fetch(WAITLIST_FORM_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Waitlist signup failed: ${res.status}`);
      }

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
          <span className="text-body-sm font-medium text-surface-700">Your full name</span>
          <input
            name="full_name"
            type="text"
            required
            maxLength={120}
            className="h-11 w-full rounded-lg border border-surface-300 bg-white px-3 text-body-sm text-surface-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            placeholder="Your name"
          />
        </label>
        <label className="space-y-2">
          <span className="text-body-sm font-medium text-surface-700">Email address</span>
          <input
            name="email"
            type="email"
            required
            maxLength={320}
            className="h-11 w-full rounded-lg border border-surface-300 bg-white px-3 text-body-sm text-surface-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            placeholder="you@example.com"
          />
        </label>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" className="bg-[#06463f] text-white hover:bg-[#053832]" disabled={state === "submitting"}>
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
          No spam. We will only contact you about enrollment updates.
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
