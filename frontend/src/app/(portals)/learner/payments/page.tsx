"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { CreditCard, Building2, Smartphone, Shield, CheckCircle2, AlertCircle, Clock, X, Lock, ArrowRight, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FALLBACK_PLAN = {
  id: "PAY-abc123",
  track: "AI Engineering and Intelligent Systems",
  plan: "3-pay" as const,
  totalAmount: 450000,
  paidAmount: 180000,
  currency: "NGN",
  currencySymbol: "₦",
  installments: [
    { id: "IST-001", sequence: 1, amount: 180000, dueDate: "2025-01-15", paidDate: "2025-01-14", status: "paid" as const },
    { id: "IST-002", sequence: 2, amount: 135000, dueDate: "2025-04-15", paidDate: null, status: "pending" as const },
    { id: "IST-003", sequence: 3, amount: 135000, dueDate: "2025-07-15", paidDate: null, status: "pending" as const },
  ],
  gracePeriodActive: false,
  accessPaused: false,
  nextDueDate: "2025-04-15",
  nextAmount: 135000,
};

const STATUS_CONFIG = {
  paid: { label: "Paid", color: "bg-accent-50 text-accent-700", icon: CheckCircle2 },
  pending: { label: "Upcoming", color: "bg-brand-50 text-brand-700", icon: Clock },
  overdue: { label: "Overdue", color: "bg-red-50 text-red-700", icon: AlertCircle },
  paused: { label: "Paused", color: "bg-surface-100 text-surface-500", icon: Clock },
} as const;

const PAYMENT_METHODS = [
  { id: "card", label: "Debit / Credit Card", description: "Visa, Mastercard, Amex, Verve — accepted worldwide", Icon: CreditCard },
  { id: "mobile", label: "Mobile Money", description: "MTN MoMo, Airtel Money, M-Pesa, Orange Money, Vodafone Cash", Icon: Smartphone },
  { id: "bank", label: "Bank / Wire Transfer", description: "Local bank transfer, SWIFT international wire, USSD", Icon: Building2 },
  { id: "paypal", label: "PayPal", description: "Pay with your PayPal balance or linked card", Icon: Globe },
];

interface PaymentPlan {
  id: string; track: string; plan: string; totalAmount: number; paidAmount: number;
  currency: string; currencySymbol: string;
  installments: { id: string; sequence: number; amount: number; dueDate: string; paidDate: string | null; status: keyof typeof STATUS_CONFIG }[];
  gracePeriodActive: boolean; accessPaused: boolean; nextDueDate: string; nextAmount: number;
}

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "learner", "payments"],
    queryFn: () => apiFetch<PaymentPlan | null>("/dashboard/learner/payments"),
  });

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [step, setStep] = useState<"method" | "details" | "processing" | "success">("method");
  const [pauseConfirmed, setPauseConfirmed] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-xl" />
        <div className="h-40 skeleton rounded-xl" />
        <div className="h-48 skeleton rounded-xl" />
      </div>
    );
  }

  const plan = (data ?? FALLBACK_PLAN) as PaymentPlan;
  const progressPct = Math.round((plan.paidAmount / plan.totalAmount) * 100);
  const remaining = plan.totalAmount - plan.paidAmount;
  const nextPending = plan.installments.find((i) => i.status === "pending" || i.status === "overdue");
  const fmt = (n: number) => `${plan.currencySymbol}${n.toLocaleString()}`;

  function openCheckout() {
    setCheckoutOpen(true);
    setStep("method");
    setSelectedMethod("card");
    setCardNumber(""); setCardExpiry(""); setCardCvv(""); setCardName("");
  }

  function processPayment() {
    setStep("processing");
    setTimeout(() => setStep("success"), 2000);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-display-sm text-surface-900">Payments</h1>

      {/* Alerts */}
      {plan.gracePeriodActive && (
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4" role="alert">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-body-sm font-medium text-amber-800">Grace period active</p>
            <p className="text-caption text-amber-700 mt-0.5">Please complete your payment to maintain full access to your track.</p>
          </div>
        </div>
      )}
      {plan.accessPaused && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4" role="alert">
          <AlertCircle className="h-5 w-5 text-status-error shrink-0 mt-0.5" />
          <div>
            <p className="text-body-sm font-medium text-red-800">Access paused</p>
            <p className="text-caption text-red-700 mt-0.5">Your track access is paused due to overdue payment. Progress is preserved — pay now to resume.</p>
          </div>
        </div>
      )}

      {/* Payment Overview Card */}
      <div className="rounded-2xl border border-surface-200 bg-surface-0 p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-caption text-surface-400">Enrolled Track</p>
            <h2 className="text-heading-sm text-surface-900 mt-0.5">{plan.track}</h2>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="secondary" className="bg-brand-50 text-brand-700 border-0">
                {plan.plan === "3-pay" ? "3 Installments" : plan.plan === "2-pay" ? "2 Installments" : "Full Payment"}
              </Badge>
              <span className="text-caption text-surface-400">{plan.id}</span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-caption text-surface-400">Total</p>
            <p className="text-heading-lg font-bold text-surface-900">{fmt(plan.totalAmount)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-caption mb-2">
            <span className="text-accent-600 font-medium">{fmt(plan.paidAmount)} paid</span>
            <span className="text-surface-400">{fmt(remaining)} remaining</span>
          </div>
          <div className="h-3 w-full rounded-full bg-surface-100 overflow-hidden">
            <div className="h-3 rounded-full bg-gradient-to-r from-accent-500 to-accent-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-caption text-surface-400 mt-1.5">{progressPct}% complete</p>
        </div>

        {/* Next payment due */}
        {nextPending && (
          <div className="mt-6 flex items-center justify-between rounded-xl bg-brand-50/50 border border-brand-100 p-4">
            <div>
              <p className="text-caption text-brand-600 font-medium">Next payment due</p>
              <p className="text-heading-sm font-bold text-surface-900 mt-0.5">{fmt(nextPending.amount)}</p>
              <p className="text-caption text-surface-500 mt-0.5">Due {nextPending.dueDate}</p>
            </div>
            <button onClick={openCheckout} className="rounded-xl bg-brand-600 px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-brand-700 transition-all active:scale-[0.98] flex items-center gap-2">
              Pay Now <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Installment Schedule */}
      <section>
        <h2 className="text-heading-sm text-surface-900 mb-4">Installment Schedule</h2>
        <div className="space-y-3">
          {plan.installments.map((inst) => {
            const config = STATUS_CONFIG[inst.status];
            const StatusIcon = config.icon;
            return (
              <div key={inst.id} className={`rounded-xl border bg-surface-0 p-4 shadow-card transition-all ${inst.status === "overdue" ? "border-red-200" : "border-surface-200"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${inst.status === "paid" ? "bg-accent-50" : inst.status === "overdue" ? "bg-red-50" : "bg-surface-50"}`}>
                      <StatusIcon className={`h-5 w-5 ${inst.status === "paid" ? "text-accent-600" : inst.status === "overdue" ? "text-status-error" : "text-surface-400"}`} />
                    </div>
                    <div>
                      <p className="text-body-sm font-medium text-surface-900">Installment {inst.sequence}</p>
                      <p className="text-caption text-surface-500">Due {inst.dueDate}{inst.paidDate ? ` · Paid ${inst.paidDate}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-body-sm font-bold text-surface-900">{fmt(inst.amount)}</p>
                    <Badge className={`border-0 ${config.color}`}>{config.label}</Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => { setPauseOpen(true); setPauseConfirmed(false); }}
          className="rounded-xl border border-surface-200 px-4 py-2.5 text-body-sm text-surface-700 hover:bg-surface-50 transition-all">
          Pause Payments
        </button>
      </div>

      {/* ── Checkout Modal ── */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto py-6">
          <div className="w-full max-w-lg mx-4 rounded-2xl border border-surface-200 bg-surface-0 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-accent-600" />
                <h2 className="text-heading-sm text-surface-900">Secure Checkout</h2>
              </div>
              {step !== "processing" && (
                <button onClick={() => setCheckoutOpen(false)} className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 transition-colors"><X className="w-4 h-4" /></button>
              )}
            </div>

            <div className="px-6 py-5">
              {/* Step: Method Selection */}
              {step === "method" && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-surface-50 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-caption text-surface-400">Amount to pay</p>
                      <p className="text-heading-sm font-bold text-surface-900">{fmt(nextPending?.amount || 0)}</p>
                    </div>
                    <Badge variant="secondary" className="bg-brand-50 text-brand-700 border-0">Installment {nextPending?.sequence}</Badge>
                  </div>

                  <p className="text-body-sm font-medium text-surface-700">Select payment method</p>
                  <div className="space-y-2">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.Icon;
                      return (
                        <button key={method.id} onClick={() => setSelectedMethod(method.id)}
                          className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${selectedMethod === method.id ? "border-brand-400 bg-brand-50/50 ring-1 ring-brand-200" : "border-surface-200 hover:border-surface-300 hover:bg-surface-50"}`}>
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selectedMethod === method.id ? "bg-brand-100" : "bg-surface-100"}`}>
                            <Icon className={`h-5 w-5 ${selectedMethod === method.id ? "text-brand-600" : "text-surface-500"}`} />
                          </div>
                          <div>
                            <p className="text-body-sm font-medium text-surface-900">{method.label}</p>
                            <p className="text-caption text-surface-500">{method.description}</p>
                          </div>
                          {selectedMethod === method.id && (
                            <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-brand-600">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <button onClick={() => setStep("details")} className="w-full rounded-xl bg-brand-600 px-4 py-3 text-body-sm font-semibold text-white hover:bg-brand-700 transition-all active:scale-[0.98]">
                    Continue
                  </button>
                </div>
              )}

              {/* Step: Payment Details */}
              {step === "details" && (
                <div className="space-y-4">
                  <button onClick={() => setStep("method")} className="text-caption text-brand-600 hover:text-brand-700 transition-colors">← Back to methods</button>

                  {selectedMethod === "card" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-caption font-medium text-surface-700 mb-1">Card Number</label>
                        <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim())} maxLength={19} placeholder="1234 5678 9012 3456"
                          className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-300 focus:bg-surface-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-mono tracking-wider" />
                      </div>
                      <div>
                        <label className="block text-caption font-medium text-surface-700 mb-1">Cardholder Name</label>
                        <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card"
                          className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-300 focus:bg-surface-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-caption font-medium text-surface-700 mb-1">Expiry</label>
                          <input type="text" value={cardExpiry} onChange={(e) => { let v = e.target.value.replace(/\D/g, ""); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2, 4); setCardExpiry(v); }} maxLength={5} placeholder="MM/YY"
                            className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-300 focus:bg-surface-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-mono" />
                        </div>
                        <div>
                          <label className="block text-caption font-medium text-surface-700 mb-1">CVV</label>
                          <input type="password" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} maxLength={4} placeholder="•••"
                            className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-300 focus:bg-surface-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-mono" />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMethod === "mobile" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-caption font-medium text-surface-700 mb-1">Country</label>
                        <select className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-body-sm text-surface-900 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all">
                          <option>Ghana</option>
                          <option>Nigeria</option>
                          <option>Kenya</option>
                          <option>Tanzania</option>
                          <option>Uganda</option>
                          <option>Rwanda</option>
                          <option>Senegal</option>
                          <option>Cameroon</option>
                          <option>Côte d&apos;Ivoire</option>
                          <option>South Africa</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-caption font-medium text-surface-700 mb-1">Mobile Money Provider</label>
                        <select className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-body-sm text-surface-900 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all">
                          <option>MTN Mobile Money</option>
                          <option>Airtel Money</option>
                          <option>M-Pesa (Safaricom)</option>
                          <option>Orange Money</option>
                          <option>Vodafone Cash</option>
                          <option>Tigo Pesa</option>
                          <option>Wave</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-caption font-medium text-surface-700 mb-1">Mobile Number</label>
                        <input type="tel" placeholder="+XXX XX XXX XXXX"
                          className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-300 focus:bg-surface-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
                      </div>
                      <p className="text-caption text-surface-400">You&apos;ll receive a prompt on your phone to authorize the payment.</p>
                    </div>
                  )}

                  {selectedMethod === "bank" && (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-surface-50 border border-surface-200 p-4 space-y-2">
                        <p className="text-body-sm font-medium text-surface-900">Local Bank Transfer (Africa)</p>
                        <div className="grid grid-cols-2 gap-2 text-caption">
                          <span className="text-surface-400">Bank</span><span className="text-surface-900 font-medium">Ecobank Ghana</span>
                          <span className="text-surface-400">Account Name</span><span className="text-surface-900 font-medium">KoreField Academy Ltd</span>
                          <span className="text-surface-400">Account Number</span><span className="text-surface-900 font-mono">0012345678901</span>
                          <span className="text-surface-400">Branch</span><span className="text-surface-900">Accra Main</span>
                          <span className="text-surface-400">Reference</span><span className="text-surface-900 font-mono">{plan.id}</span>
                        </div>
                      </div>
                      <div className="rounded-xl bg-surface-50 border border-surface-200 p-4 space-y-2">
                        <p className="text-body-sm font-medium text-surface-900">International Wire Transfer (SWIFT)</p>
                        <div className="grid grid-cols-2 gap-2 text-caption">
                          <span className="text-surface-400">Bank</span><span className="text-surface-900 font-medium">Ecobank Ghana</span>
                          <span className="text-surface-400">SWIFT/BIC</span><span className="text-surface-900 font-mono">EABORIGHXXX</span>
                          <span className="text-surface-400">IBAN</span><span className="text-surface-900 font-mono">GH12 ECOB 0012 3456 7890 1</span>
                          <span className="text-surface-400">Account Name</span><span className="text-surface-900 font-medium">KoreField Academy Ltd</span>
                          <span className="text-surface-400">Currency</span><span className="text-surface-900">USD / GHS / EUR / GBP</span>
                          <span className="text-surface-400">Reference</span><span className="text-surface-900 font-mono">{plan.id}</span>
                        </div>
                      </div>
                      <p className="text-caption text-surface-500">Use your payment ID as the transfer reference. Local transfers confirm within 24 hours. International wires may take 2-5 business days.</p>
                    </div>
                  )}

                  {selectedMethod === "paypal" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-caption font-medium text-surface-700 mb-1">PayPal Email</label>
                        <input type="email" placeholder="your@email.com"
                          className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-body-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-300 focus:bg-surface-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
                      </div>
                      <p className="text-caption text-surface-400">You&apos;ll be redirected to PayPal to complete the payment. Supports USD, EUR, GBP, and 25+ currencies.</p>
                    </div>
                  )}

                  <div className="rounded-xl bg-surface-50 p-3 flex items-center justify-between">
                    <span className="text-body-sm text-surface-600">You&apos;ll be charged</span>
                    <span className="text-heading-sm font-bold text-surface-900">{fmt(nextPending?.amount || 0)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-caption text-surface-400">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Secured with 256-bit SSL encryption. PCI DSS compliant.</span>
                  </div>

                  <button onClick={processPayment} className="w-full rounded-xl bg-brand-600 px-4 py-3 text-body-sm font-semibold text-white hover:bg-brand-700 transition-all active:scale-[0.98]">
                    {selectedMethod === "bank" ? "I've Made the Transfer" : selectedMethod === "paypal" ? "Continue to PayPal" : `Pay ${fmt(nextPending?.amount || 0)}`}
                  </button>
                </div>
              )}

              {/* Step: Processing */}
              {step === "processing" && (
                <div className="text-center py-8">
                  <div className="mx-auto h-12 w-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mb-4" />
                  <p className="text-body-sm font-medium text-surface-900">Processing your payment...</p>
                  <p className="text-caption text-surface-500 mt-1">Please don&apos;t close this window.</p>
                </div>
              )}

              {/* Step: Success */}
              {step === "success" && (
                <div className="text-center py-8">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 mb-4">
                    <CheckCircle2 className="h-7 w-7 text-accent-600" />
                  </div>
                  <p className="text-heading-sm font-bold text-surface-900">Payment Successful</p>
                  <p className="text-body-sm text-surface-500 mt-2">{fmt(nextPending?.amount || 0)} has been received for Installment {nextPending?.sequence}.</p>
                  <p className="text-caption text-surface-400 mt-1">A receipt has been sent to your email.</p>
                  <button onClick={() => setCheckoutOpen(false)} className="mt-6 rounded-xl bg-brand-600 px-6 py-3 text-body-sm font-semibold text-white hover:bg-brand-700 transition-all active:scale-[0.98]">
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Pause Dialog ── */}
      {pauseOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto py-6">
          <div className="w-full max-w-md mx-4 rounded-2xl border border-surface-200 bg-surface-0 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <h2 className="text-heading-sm text-surface-900">Pause Payments</h2>
              <button onClick={() => setPauseOpen(false)} className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5">
              {pauseConfirmed ? (
                <div className="text-center py-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-3">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <p className="text-body-sm font-medium text-surface-900">Payments paused</p>
                  <p className="text-caption text-surface-500 mt-1">Your progress is preserved. Resume anytime to regain full access.</p>
                  <button onClick={() => setPauseOpen(false)} className="mt-4 rounded-xl bg-brand-600 px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-brand-700 transition-all">Done</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-body-sm font-medium text-amber-800">What happens when you pause?</p>
                      <ul className="mt-2 space-y-1 text-caption text-amber-700">
                        <li>• Track access will be limited to completed modules only</li>
                        <li>• Your progress and grades are fully preserved</li>
                        <li>• Future installments are suspended until you resume</li>
                        <li>• You can resume at any time</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setPauseOpen(false)} className="flex-1 rounded-xl border border-surface-200 px-4 py-2.5 text-body-sm text-surface-700 hover:bg-surface-50 transition-all">Keep Paying</button>
                    <button onClick={() => setPauseConfirmed(true)} className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-body-sm font-semibold text-white hover:bg-amber-700 transition-all active:scale-[0.98]">Confirm Pause</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
