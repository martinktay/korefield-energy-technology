"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const WAITLIST_FORM_ENDPOINT =
  process.env.NEXT_PUBLIC_WAITLIST_FORM_ENDPOINT || "https://formspree.io/f/xvzdeyvn";

export function ComingSoonWaitlistForm() {
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsSuccess(params.get("waitlist") === "success");
  }, []);

  return (
    <form
      action={WAITLIST_FORM_ENDPOINT}
      method="POST"
      className="space-y-4"
      aria-label="Join the waitlist"
    >
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <input type="hidden" name="area_of_interest" value="KoreField Academy" />
      <input type="hidden" name="source" value="korefield-academy-coming-soon" />
      <input type="hidden" name="_subject" value="KoreField Academy Waitlist Signup" />
      <input
        type="hidden"
        name="_next"
        value="https://academy.korefield.com/?waitlist=success#waitlist"
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
        <Button type="submit" size="lg" className="bg-[#06463f] text-white hover:bg-[#053832]">
          <ArrowRight className="size-4" />
          Join the waitlist
        </Button>
        <p className="text-caption text-surface-500">
          No spam. We will only contact you about enrollment updates.
        </p>
      </div>
      {isSuccess && (
        <p className="text-body-sm font-medium text-status-success" role="status">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            You are on the waitlist. We will keep you posted on enrollment updates.
          </span>
        </p>
      )}
    </form>
  );
}
