"use client"

import { createContext, useCallback, useContext, useState } from "react"
import { CheckCircle2, Info, TriangleAlert, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastKind = "success" | "error" | "info" | "warning"
interface Toast {
  id: string
  kind: ToastKind
  message: string
}

const ToastCtx = createContext<(message: string, kind?: ToastKind) => void>(() => {})

export function useToast() {
  return useContext(ToastCtx)
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: TriangleAlert,
}
const colors = {
  success: "text-success",
  error: "text-destructive",
  info: "text-primary",
  warning: "text-warning",
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, kind, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }, [])

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => {
          const Icon = icons[t.kind]
          return (
            <div
              key={t.id}
              className="laminate pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl px-4 py-3 animate-pop-in"
            >
              <Icon className={cn("size-5 shrink-0", colors[t.kind])} />
              <span className="text-sm font-medium leading-snug">{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}
