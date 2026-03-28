"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-0 px-4">
      <div className="text-center max-w-md">
        <h2 className="text-heading-lg text-surface-900">Something went wrong</h2>
        <p className="mt-2 text-body-sm text-surface-500">{error.message || "An unexpected error occurred."}</p>
        <button onClick={reset} className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">
          Try again
        </button>
      </div>
    </div>
  );
}
