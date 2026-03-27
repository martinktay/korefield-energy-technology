import type { ReactNode } from "react";

/**
 * Empty state with friendly message and optional action.
 * Per DASHBOARD_LAYOUT_RULES.md: illustration + message + action button.
 * Never shows blank white space.
 */
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Placeholder illustration */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
        <svg
          className="h-8 w-8 text-surface-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5"
          />
        </svg>
      </div>
      <h3 className="text-heading-sm text-surface-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-body-sm text-surface-500">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
