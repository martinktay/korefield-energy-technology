/**
 * Skeleton-based loading state.
 * Uses skeleton screens (not spinners) per DASHBOARD_LAYOUT_RULES.md.
 * Progressive: text placeholders render before media placeholders.
 */
interface LoadingStateProps {
  /** Number of skeleton rows to display */
  rows?: number;
  /** Optional label for screen readers */
  label?: string;
}

export function LoadingState({ rows = 3, label = "Loading content" }: LoadingStateProps) {
  return (
    <div role="status" aria-label={label} className="animate-pulse space-y-4">
      {/* Text skeleton (loads first) */}
      <div className="h-6 w-1/3 rounded bg-surface-200" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-full rounded bg-surface-200" />
          <div className="h-4 w-5/6 rounded bg-surface-200" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
