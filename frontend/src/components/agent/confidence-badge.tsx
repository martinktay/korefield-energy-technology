"use client";
/** @file confidence-badge.tsx — Color-coded confidence pill for agent report sections. */

interface ConfidenceBadgeProps {
  confidence: number;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);

  let colorClasses: string;
  let level: string;

  if (confidence >= 0.75) {
    colorClasses = "bg-green-100 text-green-700";
    level = "high";
  } else if (confidence >= 0.50) {
    colorClasses = "bg-amber-100 text-amber-700";
    level = "medium";
  } else {
    colorClasses = "bg-red-100 text-red-700";
    level = "low";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses}`}
      aria-label={`Confidence: ${pct}%, ${level}`}
    >
      {pct}%
    </span>
  );
}
