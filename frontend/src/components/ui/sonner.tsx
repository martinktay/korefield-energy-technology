"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface-0 group-[.toaster]:text-surface-900 group-[.toaster]:border-surface-200 group-[.toaster]:shadow-card group-[.toaster]:rounded-card",
          description: "group-[.toast]:text-surface-500",
          actionButton:
            "group-[.toast]:bg-brand-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-surface-100 group-[.toast]:text-surface-500",
          success: "group-[.toaster]:!bg-accent-50 group-[.toaster]:!text-accent-800 group-[.toaster]:!border-accent-200",
          error: "group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-800 group-[.toaster]:!border-red-200",
          info: "group-[.toaster]:!bg-brand-50 group-[.toaster]:!text-brand-800 group-[.toaster]:!border-brand-200",
          warning: "group-[.toaster]:!bg-amber-50 group-[.toaster]:!text-amber-800 group-[.toaster]:!border-amber-200",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
