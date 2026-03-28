"use client";
/** @file super-admin/coupons/page.tsx — Promo coupon management for Super Admin. Supports percentage, fixed amount, and full access discount types. */

import { useState } from "react";
import { X, Plus, Tag, Copy, CheckCircle2, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  track_ids: string[];
  max_uses: number;
  times_used: number;
  valid_from: string;
  valid_to: string;
  status: string;
  created_at: string;
}

const TRACKS = [
  { id: "TRK-ai-eng-001", name: "AI Engineering and Intelligent Systems" },
  { id: "TRK-data-sci-002", name: "Data Science and Decision Intelligence" },
  { id: "TRK-cyber-sec-003", name: "Cybersecurity and AI Security" },
  { id: "TRK-ai-prod-004", name: "AI Product and Project Leadership" },
];

const FALLBACK_COUPONS: Coupon[] = [
  { id: "CPN-001", code: "LAUNCH2026", description: "Launch promo — 25% off all tracks", discount_type: "percentage", discount_value: 25, track_ids: [], max_uses: 500, times_used: 127, valid_from: "2026-01-01", valid_to: "2026-06-30", status: "active", created_at: "2026-01-01" },
  { id: "CPN-002", code: "AIENG50", description: "AI Engineering track — $50 off", discount_type: "fixed_amount", discount_value: 50, track_ids: ["TRK-ai-eng-001"], max_uses: 100, times_used: 43, valid_from: "2026-02-01", valid_to: "2026-04-30", status: "active", created_at: "2026-02-01" },
  { id: "CPN-003", code: "FREEACCESS", description: "Full scholarship — 100% off Data Science", discount_type: "full_access", discount_value: 100, track_ids: ["TRK-data-sci-002"], max_uses: 10, times_used: 10, valid_from: "2026-01-15", valid_to: "2026-12-31", status: "exhausted", created_at: "2026-01-15" },
  { id: "CPN-004", code: "EXPIRED10", description: "Expired 10% promo", discount_type: "percentage", discount_value: 10, track_ids: [], max_uses: 0, times_used: 89, valid_from: "2025-06-01", valid_to: "2025-12-31", status: "expired", created_at: "2025-06-01" },
];

function generateId(): string {
  return `CPN-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}
