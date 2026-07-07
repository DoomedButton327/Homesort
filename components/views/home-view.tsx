"use client"

import { Boxes, CloudUpload, Home, Plus, Sparkles } from "lucide-react"
import { LocationCard } from "../cards"
import { useStore } from "@/hooks/use-store"

export function HomeView({
  onOpenLocation,
  onAddLocation,
  onGoSync,
}: {
  onOpenLocation: (id: string) => void
  onAddLocation: () => void
  onGoSync: () => void
}) {
  const { locations, items, loaded } = useStore()

  return (
    <div className="animate-float-in">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <Sparkles className="size-4" /> Shelf Keeper
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-balance">Your home, cataloged</h1>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="laminate rounded-2xl p-4">
          <Home className="mb-2 size-5 text-primary" />
          <p className="font-display text-2xl font-bold">{locations.length}</p>
          <p className="text-xs text-muted-foreground">spots</p>
        </div>
        <div className="laminate rounded-2xl p-4">
          <Boxes className="mb-2 size-5 text-accent" />
          <p className="font-display text-2xl font-bold">{items.length}</p>
          <p className="text-xs text-muted-foreground">items</p>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Spots</h2>
        <button
          onClick={onAddLocation}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
        >
          <Plus className="size-4" /> New spot
        </button>
      </div>

      {!loaded ? (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="laminate aspect-[16/13] animate-shimmer rounded-3xl" />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <button
          onClick={onAddLocation}
          className="laminate laminate-shine flex w-full flex-col items-center gap-3 rounded-3xl p-10 text-center"
        >
          <span className="grid size-16 place-items-center rounded-3xl bg-primary/15 text-primary animate-pulse-ring">
            <Plus className="size-8" />
          </span>
          <span className="font-display text-lg font-bold">Add your first spot</span>
          <span className="max-w-xs text-sm text-muted-foreground">
            Snap a photo of a shelf, drawer or cupboard, then fill it with items.
          </span>
        </button>
      ) : (
        <div className="stagger grid grid-cols-2 gap-3">
          {locations.map((l) => (
            <LocationCard key={l.id} location={l} onOpen={() => onOpenLocation(l.id)} />
          ))}
        </div>
      )}

      <button
        onClick={onGoSync}
        className="glass mt-5 flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-transform active:scale-[0.99]"
      >
        <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
          <CloudUpload className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Back up to GitHub</span>
          <span className="block text-xs text-muted-foreground">Push all data, photos & history in one commit.</span>
        </span>
      </button>
    </div>
  )
}
