"use client"

import type React from "react"
import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/* --------------------------------- Sheet --------------------------------- */

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-in fade-in"
      />
      <div className="laminate relative z-10 flex max-h-[92vh] w-full flex-col rounded-t-3xl sm:max-w-lg sm:rounded-3xl animate-float-in">
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-foreground/20 sm:hidden" />
        <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-2">
          <h2 className="font-display text-lg font-bold text-balance">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full bg-secondary text-secondary-foreground transition-transform active:scale-90"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer ? <div className="border-t border-border/60 bg-card/60 p-4">{footer}</div> : null}
      </div>
    </div>
  )
}

/* --------------------------------- Fields -------------------------------- */

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-sm font-semibold text-foreground/90">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  )
}

const inputBase =
  "w-full rounded-xl border border-border bg-input/60 px-4 py-3 text-base text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/25"

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputBase, "min-h-24 resize-none", props.className)} />
}

/* ------------------------------ Number step ------------------------------ */

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 9999,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v))
  return (
    <div className="inline-flex items-center gap-3 rounded-xl border border-border bg-input/60 p-1.5">
      <button
        onClick={() => onChange(clamp(value - 1))}
        className="grid size-10 place-items-center rounded-lg bg-secondary text-xl font-bold text-secondary-foreground transition-transform active:scale-90"
        aria-label="Decrease"
      >
        −
      </button>
      <span className="min-w-8 text-center font-display text-xl font-bold tabular-nums">{value}</span>
      <button
        onClick={() => onChange(clamp(value + 1))}
        className="grid size-10 place-items-center rounded-lg bg-primary text-xl font-bold text-primary-foreground transition-transform active:scale-90"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  )
}

/* -------------------------------- Toggle --------------------------------- */

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 py-2 text-left"
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-5 rounded-full bg-background shadow transition-all",
            checked ? "left-6" : "left-1",
          )}
        />
      </span>
    </button>
  )
}

/* ------------------------------ Primary CTA ------------------------------ */

export function BigButton({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "accent" }) {
  const variants = {
    primary: "bg-primary text-primary-foreground",
    accent: "bg-accent text-accent-foreground",
    ghost: "bg-secondary text-secondary-foreground",
    danger: "bg-destructive/15 text-destructive border border-destructive/30",
  }
  return (
    <button
      {...props}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-base font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  )
}
