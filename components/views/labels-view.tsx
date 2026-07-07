"use client"

import { useState } from "react"
import { Printer } from "lucide-react"
import { BarcodeSvg } from "../barcode-svg"
import { cn } from "@/lib/utils"
import { useStore } from "@/hooks/use-store"

export function LabelsView() {
  const { locations, items } = useStore()
  const [tab, setTab] = useState<"spots" | "items">("spots")

  const list =
    tab === "spots"
      ? locations.map((l) => ({ id: l.id, title: l.name, code: l.barcode, tag: "SPOT" }))
      : items.map((i) => ({ id: i.id, title: i.name, code: i.barcode, tag: "ITEM" }))

  return (
    <div className="animate-float-in">
      <div className="no-print">
        <h1 className="mb-1 font-display text-3xl font-extrabold tracking-tight">Labels</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Print these, laminate them and stick them on your shelves and items. Scan them anytime to jump straight to the
          list.
        </p>

        <div className="mb-4 flex items-center gap-2">
          <div className="flex flex-1 rounded-xl bg-secondary p-1">
            {(["spots", "items"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-colors",
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            disabled={list.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground active:scale-95 disabled:opacity-50"
          >
            <Printer className="size-4" /> Print
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="laminate rounded-3xl p-8 text-center text-sm text-muted-foreground no-print">
          No {tab} to print yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 print:grid-cols-2">
          {list.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-white p-3 text-center print:border-black/20"
            >
              <span className="text-[10px] font-bold tracking-widest text-neutral-400">{entry.tag}</span>
              <span className="line-clamp-1 w-full text-sm font-bold text-neutral-900">{entry.title}</span>
              <BarcodeSvg value={entry.code} height={54} className="w-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
