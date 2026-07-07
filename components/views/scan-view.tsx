"use client"

import { useState } from "react"
import { MapPin, PackageMinus, PackagePlus, ScanLine } from "lucide-react"
import { ItemRow } from "../cards"
import { ImageThumb } from "../image-thumb"
import { BigButton } from "../kit"
import { useScan } from "../scan-provider"
import { useToast } from "../toast"
import { ItemSheet } from "../item-sheet"
import { store } from "@/lib/store"
import { useStore } from "@/hooks/use-store"
import type { Item } from "@/lib/types"

type Result =
  | { kind: "location"; id: string }
  | { kind: "item"; id: string }
  | { kind: "none"; code: string }
  | null

export function ScanView({ onOpenLocation }: { onOpenLocation: (id: string) => void }) {
  const { locations, items } = useStore()
  const scan = useScan()
  const toast = useToast()
  const [result, setResult] = useState<Result>(null)
  const [editItem, setEditItem] = useState<Item | null>(null)

  async function doScan() {
    const code = await scan("Scan a spot or item barcode")
    if (!code) return
    const loc = store.getSnapshot().locations.find((l) => l.barcode === code)
    if (loc) {
      setResult({ kind: "location", id: loc.id })
      if (navigator.vibrate) navigator.vibrate(30)
      return
    }
    const item = store.getSnapshot().items.find((i) => i.barcode === code)
    if (item) {
      setResult({ kind: "item", id: item.id })
      return
    }
    setResult({ kind: "none", code })
  }

  const loc = result?.kind === "location" ? locations.find((l) => l.id === result.id) : null
  const scannedItem = result?.kind === "item" ? items.find((i) => i.id === result.id) : null
  const locItems = loc ? items.filter((i) => i.locationId === loc.id) : []

  return (
    <div className="animate-float-in">
      <h1 className="mb-1 font-display text-3xl font-extrabold tracking-tight">Scan</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Point at a printed spot label or an item barcode. Works with your phone camera or a handheld scanner.
      </p>

      <button
        onClick={doScan}
        className="laminate laminate-shine group relative mb-6 flex w-full flex-col items-center gap-4 rounded-3xl p-10"
      >
        <span className="grid size-24 place-items-center rounded-full bg-primary/15 text-primary animate-pulse-ring">
          <ScanLine className="size-12" />
        </span>
        <span className="font-display text-xl font-bold">Tap to scan</span>
      </button>

      {result?.kind === "none" && (
        <div className="laminate rounded-3xl p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No match for <span className="font-mono font-semibold text-foreground">{result.code}</span>. Link it to an
            item from its edit screen.
          </p>
        </div>
      )}

      {scannedItem && (
        <div className="laminate animate-pop-in rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <ImageThumb imageId={scannedItem.photoId} alt={scannedItem.name} className="size-16 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-display text-lg font-bold">{scannedItem.name}</h3>
              <p className="text-sm text-muted-foreground">
                {scannedItem.quantity - scannedItem.checkedOut} on shelf · {scannedItem.checkedOut} out
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <BigButton variant="ghost" onClick={() => store.checkOut(scannedItem.id, 1)}>
              <PackageMinus className="size-5" /> Take out
            </BigButton>
            <BigButton variant="ghost" onClick={() => store.checkIn(scannedItem.id, 1)}>
              <PackagePlus className="size-5" /> Return
            </BigButton>
          </div>
          <BigButton className="mt-2" variant="accent" onClick={() => setEditItem(scannedItem)}>
            Open item
          </BigButton>
        </div>
      )}

      {loc && (
        <div className="animate-pop-in">
          <button
            onClick={() => onOpenLocation(loc.id)}
            className="laminate mb-3 flex w-full items-center gap-3 rounded-2xl p-3 text-left"
          >
            <span className="grid size-11 place-items-center rounded-xl" style={{ backgroundColor: loc.color + "33" }}>
              <MapPin className="size-5" style={{ color: loc.color }} />
            </span>
            <span className="flex-1">
              <span className="block font-display font-bold">{loc.name}</span>
              <span className="block text-xs text-muted-foreground">{locItems.length} items here</span>
            </span>
          </button>
          <div className="stagger flex flex-col gap-2.5">
            {locItems.map((item) => (
              <ItemRow key={item.id} item={item} onOpen={() => setEditItem(item)} />
            ))}
            {locItems.length === 0 && (
              <p className="laminate rounded-2xl p-6 text-center text-sm text-muted-foreground">No items here yet.</p>
            )}
          </div>
        </div>
      )}

      <ItemSheet open={!!editItem} onClose={() => setEditItem(null)} item={editItem} />
    </div>
  )
}
