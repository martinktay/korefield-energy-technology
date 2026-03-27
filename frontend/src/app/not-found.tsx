/**
 * @file not-found.tsx
 * Custom 404 page shown when a route doesn't match any page.
 * Provides navigation back to the landing page or learner dashboard.
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 px-4 text-center">
      <p className="text-display-lg text-brand-600">404</p>
      <h1 className="mt-2 text-heading-lg text-surface-900">Page not found</h1>
      <p className="mt-2 text-body-sm text-surface-500 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/learner"
          className="rounded-lg border border-surface-300 px-4 py-2 text-body-sm text-surface-700 hover:bg-surface-100 transition-colors"
        >
          Learner Dashboard
        </Link>
      </div>
    </div>
  );
}
