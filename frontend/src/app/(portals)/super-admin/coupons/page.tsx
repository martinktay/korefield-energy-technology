"use client";
/** @file super-admin/coupons/page.tsx — Promo coupon management for Super Admin. Supports percentage, fixed amount, and full access discount types. */

import { useState, useRef, useEffect } from "react";
import { X, Plus, Tag, Copy, CheckCircle2, Ban, Pencil, Trash2, MoreHorizontal, Power, CopyPlus } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { useToastStore } from "@/components/ui/toast";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: "percentage" | "fixed_amount" | "full_access";
  discount_value: number;
  track_ids: string[];
  max_uses: number;
  times_used: number;
  valid_from: string;
  valid_to: string;
  status: "active" | "expired" | "exhausted" | "disabled";
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

const DISCOUNT_TYPES = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed_amount", label: "Fixed Amount ($)" },
  { value: "full_access", label: "Full Access (100%)" },
];

function generateId(): string {
  return `CPN-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function statusBadge(status: string) {
  switch (status) {
    case "active": return "bg-green-100 text-green-700";
    case "expired": return "bg-surface-100 text-surface-600";
    case "exhausted": return "bg-amber-100 text-amber-700";
    case "disabled": return "bg-red-100 text-red-600";
    default: return "bg-surface-100 text-surface-600";
  }
}

function discountLabel(type: string, value: number) {
  if (type === "percentage") return `${value}% off`;
  if (type === "fixed_amount") return `$${value} off`;
  if (type === "full_access") return "100% off (Full Access)";
  return `${value}`;
}

function trackNames(ids: string[]) {
  if (ids.length === 0) return "All Tracks";
  return ids.map((id) => TRACKS.find((t) => t.id === id)?.name ?? id).join(", ");
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(FALLBACK_COUPONS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    if (openMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenu]);

  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "percentage" as string,
    discount_value: "",
    track_ids: [] as string[],
    max_uses: "",
    valid_from: "",
    valid_to: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function openDialog() {
    setForm({ code: "", description: "", discount_type: "percentage", discount_value: "", track_ids: [], max_uses: "", valid_from: "", valid_to: "" });
    setErrors({});
    setEditingCoupon(null);
    setDialogOpen(true);
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.code.trim()) errs.code = "Coupon code is required";
    if (form.code.trim() && coupons.some((c) => c.code.toUpperCase() === form.code.trim().toUpperCase() && c.id !== editingCoupon?.id)) errs.code = "Code already exists";
    if (!form.description.trim()) errs.description = "Description is required";
    if (form.discount_type !== "full_access") {
      const val = parseFloat(form.discount_value);
      if (isNaN(val) || val <= 0) errs.discount_value = "Discount value must be greater than 0";
      if (form.discount_type === "percentage" && val > 100) errs.discount_value = "Percentage cannot exceed 100";
    }
    if (!form.valid_from) errs.valid_from = "Start date is required";
    if (!form.valid_to) errs.valid_to = "End date is required";
    if (form.valid_from && form.valid_to && form.valid_from > form.valid_to) errs.valid_to = "End date must be after start date";
    return errs;
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const discountValue = form.discount_type === "full_access" ? 100 : parseFloat(form.discount_value);
    const maxUses = form.max_uses ? parseInt(form.max_uses, 10) : 0;

    if (editingCoupon) {
      setCoupons((prev) => prev.map((c) => c.id === editingCoupon.id ? {
        ...c,
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discount_type: form.discount_type as Coupon["discount_type"],
        discount_value: discountValue,
        track_ids: form.track_ids,
        max_uses: maxUses,
        valid_from: form.valid_from,
        valid_to: form.valid_to,
      } : c));
    } else {
      const newCoupon: Coupon = {
        id: generateId(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discount_type: form.discount_type as Coupon["discount_type"],
        discount_value: discountValue,
        track_ids: form.track_ids,
        max_uses: maxUses,
        times_used: 0,
        valid_from: form.valid_from,
        valid_to: form.valid_to,
        status: "active",
        created_at: new Date().toISOString().split("T")[0],
      };
      setCoupons((prev) => [newCoupon, ...prev]);
    }
    setDialogOpen(false);
    setEditingCoupon(null);
    useToastStore.getState().addToast("Coupon created successfully");
  }

  function editCoupon(coupon: Coupon) {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      track_ids: [...coupon.track_ids],
      max_uses: coupon.max_uses === 0 ? "" : String(coupon.max_uses),
      valid_from: coupon.valid_from,
      valid_to: coupon.valid_to,
    });
    setErrors({});
    setOpenMenu(null);
    setDialogOpen(true);
  }

  function disableCoupon(id: string) {
    setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, status: "disabled" as const } : c));
    setOpenMenu(null);
  }

  function reactivateCoupon(id: string) {
    setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, status: "active" as const } : c));
    setOpenMenu(null);
  }

  function duplicateCoupon(coupon: Coupon) {
    const dup: Coupon = {
      ...coupon,
      id: generateId(),
      code: `${coupon.code}-COPY`,
      times_used: 0,
      status: "active",
      created_at: new Date().toISOString().split("T")[0],
    };
    setCoupons((prev) => [dup, ...prev]);
    setOpenMenu(null);
  }

  function deleteCoupon(id: string) {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    setOpenMenu(null);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function toggleTrack(trackId: string) {
    setForm((f) => ({
      ...f,
      track_ids: f.track_ids.includes(trackId) ? f.track_ids.filter((id) => id !== trackId) : [...f.track_ids, trackId],
    }));
  }

  const activeCoupons = coupons.filter((c) => c.status === "active").length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + c.times_used, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-lg text-surface-900">Coupons & Promo Codes</h1>
        <button onClick={openDialog} className="rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>
      <p className="text-body-sm text-surface-500">
        Create and manage promotional coupons for track discounts, scholarships, and campaigns.
      </p>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card p-4">
          <p className="text-caption text-surface-500">Active Coupons</p>
          <p className="text-heading-lg text-brand-600 mt-1">{activeCoupons}</p>
        </div>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card p-4">
          <p className="text-caption text-surface-500">Total Coupons</p>
          <p className="text-heading-lg text-surface-900 mt-1">{coupons.length}</p>
        </div>
        <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card p-4">
          <p className="text-caption text-surface-500">Total Redemptions</p>
          <p className="text-heading-lg text-accent-600 mt-1">{totalRedemptions}</p>
        </div>
      </div>

      {/* Coupons table */}
      <div className="rounded-card border border-surface-200 bg-surface-0 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-surface-200 bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-surface-600 font-medium">Code</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Description</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Discount</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Tracks</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Usage</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Valid Period</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Status</th>
                <th className="px-4 py-3 text-surface-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="group hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-brand-500" />
                      <code className="text-body-sm font-mono font-medium text-surface-900">{coupon.code}</code>
                      <button onClick={() => copyCode(coupon.code)} className="p-1 rounded text-surface-400 hover:text-brand-600 transition-colors" aria-label="Copy code">
                        {copiedCode === coupon.code ? <CheckCircle2 className="w-3.5 h-3.5 text-accent-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-surface-700 max-w-[200px] truncate">{coupon.description}</td>
                  <td className="px-4 py-3 text-surface-900 font-medium">{discountLabel(coupon.discount_type, coupon.discount_value)}</td>
                  <td className="px-4 py-3 text-surface-600 text-caption max-w-[180px] truncate">{trackNames(coupon.track_ids)}</td>
                  <td className="px-4 py-3">
                    <span className="text-surface-900">{coupon.times_used}</span>
                    <span className="text-surface-400">/{coupon.max_uses === 0 ? "∞" : coupon.max_uses}</span>
                  </td>
                  <td className="px-4 py-3 text-caption text-surface-600">{coupon.valid_from} → {coupon.valid_to}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-caption font-medium capitalize ${statusBadge(coupon.status)}`}>{coupon.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative" ref={openMenu === coupon.id ? menuRef : undefined}>
                      <button onClick={() => setOpenMenu(openMenu === coupon.id ? null : coupon.id)} className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors" aria-label="Coupon actions" aria-haspopup="true" aria-expanded={openMenu === coupon.id}>
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenu === coupon.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-surface-200 bg-surface-0 shadow-lg py-1 animate-scale-in">
                          <button onClick={() => { copyCode(coupon.code); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-surface-700 hover:bg-surface-50 transition-colors">
                            <Copy className="w-3.5 h-3.5 text-surface-400" /> Copy Code
                          </button>
                          {coupon.status === "active" && (
                            <button onClick={() => editCoupon(coupon)} className="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-surface-700 hover:bg-surface-50 transition-colors">
                              <Pencil className="w-3.5 h-3.5 text-surface-400" /> Edit Coupon
                            </button>
                          )}
                          <button onClick={() => duplicateCoupon(coupon)} className="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-surface-700 hover:bg-surface-50 transition-colors">
                            <CopyPlus className="w-3.5 h-3.5 text-surface-400" /> Duplicate
                          </button>
                          {coupon.status === "active" && (
                            <button onClick={() => disableCoupon(coupon.id)} className="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-status-warning hover:bg-amber-50 transition-colors">
                              <Ban className="w-3.5 h-3.5" /> Disable
                            </button>
                          )}
                          {(coupon.status === "disabled" || coupon.status === "expired") && (
                            <button onClick={() => reactivateCoupon(coupon.id)} className="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-accent-600 hover:bg-accent-50 transition-colors">
                              <Power className="w-3.5 h-3.5" /> Reactivate
                            </button>
                          )}
                          <div className="my-1 border-t border-surface-100" />
                          <button onClick={() => deleteCoupon(coupon.id)} className="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-status-error hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-body-sm text-surface-500">No coupons yet. Create your first promo code.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh]">
          <div className="relative w-full max-w-xl mx-4 rounded-card border border-surface-200 border-t-[3px] border-t-brand-600 bg-surface-0 shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-surface-200 bg-surface-0 rounded-t-card">
              <h2 className="text-heading-sm text-surface-900">{editingCoupon ? "Edit Coupon" : "Create Coupon"}</h2>
              <button onClick={() => setDialogOpen(false)} className="p-1 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors" aria-label="Close dialog">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              {/* Code */}
              <div>
                <label htmlFor="cpn-code" className="block text-body-sm font-medium text-surface-700 mb-1.5">Coupon Code <span className="text-status-error">*</span></label>
                <input id="cpn-code" type="text" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. LAUNCH2026" className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 font-mono uppercase placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-invalid={!!errors.code} />
                {errors.code && <p className="mt-1 text-caption text-status-error">{errors.code}</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="cpn-desc" className="block text-body-sm font-medium text-surface-700 mb-1.5">Description <span className="text-status-error">*</span></label>
                <input id="cpn-desc" type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. Launch promo — 25% off all tracks" className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-invalid={!!errors.description} />
                {errors.description && <p className="mt-1 text-caption text-status-error">{errors.description}</p>}
              </div>

              {/* Discount type + value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cpn-type" className="block text-body-sm font-medium text-surface-700 mb-1.5">Discount Type</label>
                  <CustomSelect id="cpn-type" value={form.discount_type} onChange={(v) => setForm((f) => ({ ...f, discount_type: v, discount_value: v === "full_access" ? "100" : f.discount_value }))} options={DISCOUNT_TYPES.map((dt) => ({ value: dt.value, label: dt.label }))} />
                </div>
                <div>
                  <label htmlFor="cpn-value" className="block text-body-sm font-medium text-surface-700 mb-1.5">Discount Value <span className="text-status-error">*</span></label>
                  <input id="cpn-value" type="number" min={0} max={form.discount_type === "percentage" ? 100 : undefined} value={form.discount_type === "full_access" ? "100" : form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))} disabled={form.discount_type === "full_access"} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors disabled:bg-surface-100 disabled:text-surface-400" aria-invalid={!!errors.discount_value} />
                  {errors.discount_value && <p className="mt-1 text-caption text-status-error">{errors.discount_value}</p>}
                </div>
              </div>

              {/* Track restriction */}
              <div>
                <label className="block text-body-sm font-medium text-surface-700 mb-1.5">Applicable Tracks</label>
                <p className="text-caption text-surface-400 mb-2">Leave unchecked for all tracks</p>
                <div className="space-y-2">
                  {TRACKS.map((track) => (
                    <label key={track.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.track_ids.includes(track.id)} onChange={() => toggleTrack(track.id)} className="rounded border-surface-300 text-brand-600 focus:ring-brand-500/20" />
                      <span className="text-body-sm text-surface-700">{track.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Max uses */}
              <div>
                <label htmlFor="cpn-max" className="block text-body-sm font-medium text-surface-700 mb-1.5">Max Uses</label>
                <input id="cpn-max" type="number" min={0} value={form.max_uses} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))} placeholder="0 = unlimited" className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" />
                <p className="mt-1 text-caption text-surface-400">Set to 0 or leave empty for unlimited uses</p>
              </div>

              {/* Validity period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cpn-from" className="block text-body-sm font-medium text-surface-700 mb-1.5">Valid From <span className="text-status-error">*</span></label>
                  <input id="cpn-from" type="date" value={form.valid_from} onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-invalid={!!errors.valid_from} />
                  {errors.valid_from && <p className="mt-1 text-caption text-status-error">{errors.valid_from}</p>}
                </div>
                <div>
                  <label htmlFor="cpn-to" className="block text-body-sm font-medium text-surface-700 mb-1.5">Valid To <span className="text-status-error">*</span></label>
                  <input id="cpn-to" type="date" value={form.valid_to} onChange={(e) => setForm((f) => ({ ...f, valid_to: e.target.value }))} className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-body-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors" aria-invalid={!!errors.valid_to} />
                  {errors.valid_to && <p className="mt-1 text-caption text-status-error">{errors.valid_to}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-100">
                <button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-surface-300 px-4 py-2.5 text-body-sm font-medium text-surface-700 hover:bg-surface-100 transition-colors">Cancel</button>
                <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> {editingCoupon ? "Save Changes" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
