"use client"

import { Boxes, ChevronRight, PackageMinus } from "lucide-react"
import { ImageThumb } from "./image-thumb"
import { store } from "@/lib/store"
import type { Item, Location } from "@/lib/types"
import { useStore } from "@/hooks/use-store"

export function LocationCard({ location, onOpen }: { location: Location; onOpen: () => void }) {
  const { items } = useStore()
  const count = items.filter((i) => i.locationId === location.id).length
  const out = items.filter((i) => i.locationId === location.id && i.checkedOut > 0).length

  return (
    <button
      onClick={onOpen}
      className="laminate laminate-shine group relative flex flex-col overflow-hidden rounded-3xl text-left transition-transform active:scale-[0.98]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <ImageThumb imageId={location.photoId} alt={location.name} className="size-full transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ backgroundColor: location.color }} />
      </div>
      <div className="flex items-center justify-between gap-2 p-3.5">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-bold">{location.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Boxes className="size-3.5" /> {count} item{count === 1 ? "" : "s"}
            {out > 0 && <span className="text-warning">· {out} out</span>}
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  )
}

export function ItemRow({ item, onOpen }: { item: Item; onOpen: () => void }) {
  const available = item.quantity - item.checkedOut
  return (
    <div className="laminate flex items-center gap-3 rounded-2xl p-2.5">
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <ImageThumb imageId={item.photoId} alt={item.name} className="size-14 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <h4 className="truncate font-semibold">{item.name}</h4>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
              {available} on shelf
            </span>
            {item.checkedOut > 0 && (
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                {item.checkedOut} out
              </span>
            )}
          </div>
        </div>
      </button>
      <button
        onClick={() => store.checkOut(item.id, 1)}
        disabled={available <= 0}
        aria-label="Take one out"
        className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground transition-transform active:scale-90 disabled:opacity-40"
      >
        <PackageMinus className="size-5" />
      </button>
    </div>
  )
}
