"use client"

import { useState } from "react"
import { ArrowLeft, Pencil, Plus, ScanLine } from "lucide-react"
import { ItemRow } from "../cards"
import { ImageThumb } from "../image-thumb"
import { BarcodeSvg } from "../barcode-svg"
import { BigButton } from "../kit"
import { useScan } from "../scan-provider"
import { useToast } from "../toast"
import { ItemSheet } from "../item-sheet"
import { store } from "@/lib/store"
import { useStore } from "@/hooks/use-store"
import type { Item } from "@/lib/types"

export function LocationDetail({
  locationId,
  onBack,
  onEdit,
}: {
  locationId: string
  onBack: () => void
  onEdit: () => void
}) {
  const { locations, items } = useStore()
  const scan = useScan()
  const toast = useToast()
  const location = locations.find((l) => l.id === locationId)
  const locItems = items.filter((i) => i.locationId === locationId)

  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)

  if (!location) {
    return (
      <div className="grid place-items-center py-20 text-muted-foreground">
        <p>Spot not found.</p>
      </div>
    )
  }

  // Enforce: scan the item's barcode before taking it off the shelf.
  async function scanToTake() {
    const code = await scan("Scan the item you want to take")
    if (!code) return
    const found = locItems.find((i) => i.barcode === code)
    if (!found) {
      const elsewhere = items.find((i) => i.barcode === code)
      toast(elsewhere ? `That item lives in another spot` : "No item matches that barcode", "error")
      return
    }
    if (found.quantity - found.checkedOut <= 0) {
      toast("None left on the shelf", "warning")
      return
    }
    await store.checkOut(found.id, 1)
    toast(`Took 1x ${found.name}`, "success")
  }

  return (
    <div className="animate-float-in">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground active:scale-95"
        >
          <ArrowLeft className="size-4" /> Spots
        </button>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground active:scale-95"
        >
          <Pencil className="size-4" /> Edit
        </button>
      </div>

      <div className="laminate laminate-shine overflow-hidden rounded-3xl">
        <div className="relative aspect-[16/9] w-full">
          <ImageThumb imageId={location.photoId} alt={location.name} className="size-full" />
          <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ backgroundColor: location.color }} />
        </div>
        <div className="p-4">
          <h1 className="font-display text-2xl font-extrabold text-balance">{location.name}</h1>
          {location.description && <p className="mt-1 text-sm text-muted-foreground">{location.description}</p>}
          <div className="mt-3 grid place-items-center rounded-xl bg-white p-2">
            <BarcodeSvg value={location.barcode} height={44} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <BigButton onClick={scanToTake}>
          <ScanLine className="size-5" /> Scan to take
        </BigButton>
        <BigButton variant="accent" onClick={() => setAddOpen(true)}>
          <Plus className="size-5" /> Add item
        </BigButton>
      </div>

      <h2 className="mb-2 mt-5 font-display text-lg font-bold">
        Items <span className="text-muted-foreground">({locItems.length})</span>
      </h2>

      {locItems.length === 0 ? (
        <div className="laminate rounded-3xl p-8 text-center text-sm text-muted-foreground">
          Nothing here yet. Tap <span className="font-semibold text-foreground">Add item</span> to start filling this
          spot.
        </div>
      ) : (
        <div className="stagger flex flex-col gap-2.5">
          {locItems.map((item) => (
            <ItemRow key={item.id} item={item} onOpen={() => setEditItem(item)} />
          ))}
        </div>
      )}

      <ItemSheet open={addOpen} onClose={() => setAddOpen(false)} defaultLocationId={locationId} />
      <ItemSheet open={!!editItem} onClose={() => setEditItem(null)} item={editItem} />
    </div>
  )
}
