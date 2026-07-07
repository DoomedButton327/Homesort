"use client"

import { useMemo, useState } from "react"
import { MapPin, Search, X } from "lucide-react"
import { ItemRow } from "../cards"
import { ItemSheet } from "../item-sheet"
import { useStore } from "@/hooks/use-store"
import type { Item } from "@/lib/types"

export function SearchView() {
  const { items, locations } = useStore()
  const [q, setQ] = useState("")
  const [editItem, setEditItem] = useState<Item | null>(null)

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return items
    return items.filter((i) => {
      const loc = locations.find((l) => l.id === i.locationId)
      return (
        i.name.toLowerCase().includes(term) ||
        i.notes.toLowerCase().includes(term) ||
        i.barcode.toLowerCase().includes(term) ||
        (loc?.name.toLowerCase().includes(term) ?? false)
      )
    })
  }, [q, items, locations])

  const grouped = useMemo(() => {
    const map = new Map<string, Item[]>()
    for (const item of results) {
      const arr = map.get(item.locationId) ?? []
      arr.push(item)
      map.set(item.locationId, arr)
    }
    return map
  }, [results])

  return (
    <div className="animate-float-in">
      <h1 className="mb-4 font-display text-3xl font-extrabold tracking-tight">Search</h1>

      <div className="sticky top-0 z-10 mb-4 flex items-center gap-2 rounded-2xl border border-border bg-input/80 px-4 py-1 backdrop-blur">
        <Search className="size-5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search items, notes, spots, codes…"
          className="w-full bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
        />
        {q && (
          <button onClick={() => setQ("")} aria-label="Clear" className="text-muted-foreground">
            <X className="size-5" />
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <p className="laminate rounded-3xl p-8 text-center text-sm text-muted-foreground">
          {q ? "No items match your search." : "No items yet."}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {[...grouped.entries()].map(([locId, its]) => {
            const loc = locations.find((l) => l.id === locId)
            return (
              <section key={locId}>
                <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                  <MapPin className="size-4" style={{ color: loc?.color }} /> {loc?.name ?? "Unknown spot"}
                </h2>
                <div className="stagger flex flex-col gap-2.5">
                  {its.map((item) => (
                    <ItemRow key={item.id} item={item} onOpen={() => setEditItem(item)} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <ItemSheet open={!!editItem} onClose={() => setEditItem(null)} item={editItem} />
    </div>
  )
}
