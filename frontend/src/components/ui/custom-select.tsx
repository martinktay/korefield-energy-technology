/** @file custom-select.tsx — Custom dropdown select with rounded edges on the options panel. */
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  label?: string;
  className?: string;
  "aria-label"?: string;
}

export function CustomSelect({ id, value, onChange, options, className = "", ...rest }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl border border-surface-200 bg-surface-0 px-3.5 py-2.5 text-body-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={rest["aria-label"]}
      >
        <span>{selected?.label ?? value}</span>
        <ChevronDown className={`h-4 w-4 text-surface-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1.5 w-full rounded-xl border border-surface-200 bg-surface-0 py-1.5 shadow-lg max-h-60 overflow-auto"
        >
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`cursor-pointer px-3.5 py-2 text-body-sm rounded-lg mx-1 transition-colors ${
                opt.value === value
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-surface-700 hover:bg-surface-50"
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
