"use client"

import { useState } from "react"
import { ArrowRightLeft, Barcode, Check, PackageMinus, PackagePlus, ScanLine, Trash2 } from "lucide-react"
import { BigButton, Field, NumberStepper, Sheet, TextArea, TextInput } from "./kit"
import { PhotoPicker } from "./photo-picker"
import { BarcodeSvg } from "./barcode-svg"
import { useScan } from "./scan-provider"
import { useToast } from "./toast"
import { store } from "@/lib/store"
import { useStore } from "@/hooks/use-store"
import type { Item } from "@/lib/types"

export function ItemSheet({
  open,
  onClose,
  item,
  defaultLocationId,
}: {
  open: boolean
  onClose: () => void
  item?: Item | null
  defaultLocationId?: string
}) {
  const { locations } = useStore()
  const scan = useScan()
  const toast = useToast()
  const isEdit = !!item

  const [name, setName] = useState(item?.name ?? "")
  const [notes, setNotes] = useState(item?.notes ?? "")
  const [quantity, setQuantity] = useState(item?.quantity ?? 1)
  const [locationId, setLocationId] = useState(item?.locationId ?? defaultLocationId ?? locations[0]?.id ?? "")
  const [barcode, setBarcode] = useState(item?.barcode ?? "")
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null)
  const [busy, setBusy] = useState(false)

  const live = item ? store.getSnapshot().items.find((i) => i.id === item.id) ?? item : null
  const available = live ? live.quantity - live.checkedOut : 0

  async function handleSave() {
    if (!name.trim()) {
      toast("Give the item a name first", "warning")
      return
    }
    if (!locationId) {
      toast("Pick a spot for this item", "warning")
      return
    }
    setBusy(true)
    let photoId = item?.photoId ?? null
    if (pendingBlob) photoId = await store.saveImage(pendingBlob)

    if (isEdit && item) {
      await store.updateItem(item.id, { name, notes, quantity, locationId, barcode: barcode || item.barcode, photoId })
      if (quantity !== item.quantity) await store.setQuantity(item.id, quantity)
      toast("Item updated", "success")
    } else {
      await store.addItem({ name, notes, quantity, locationId, barcode: barcode || undefined, photoId })
      toast("Item added", "success")
    }
    setBusy(false)
    onClose()
  }

  async function scanOwnBarcode() {
    const code = await scan("Scan this item's own barcode")
    if (code) {
      setBarcode(code)
      toast("Barcode linked", "success")
    }
  }

  async function handleMove() {
    if (!item) return
    const code = await scan("Scan the destination spot's barcode")
    if (!code) return
    const dest = store.getSnapshot().locations.find((l) => l.barcode === code)
    if (!dest) {
      toast("No spot matches that barcode", "error")
      return
    }
    await store.moveItem(item.id, dest.id)
    setLocationId(dest.id)
    toast(`Moved to ${dest.name}`, "success")
  }

  async function handleDelete() {
    if (!item) return
    if (!confirm(`Permanently delete "${item.name}"?`)) return
    await store.deleteItem(item.id)
    toast("Item deleted", "info")
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit item" : "New item"}
      footer={
        <BigButton onClick={handleSave} disabled={busy}>
          <Check className="size-5" /> {isEdit ? "Save changes" : "Add item"}
        </BigButton>
      }
    >
      <div className="grid grid-cols-[7rem_1fr] gap-4">
        <PhotoPicker existingImageId={item?.photoId} onBlob={setPendingBlob} label="Photo" />
        <div>
          <Field label="Item name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Phillips screwdriver" />
          </Field>
          <Field label="Spot">
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full rounded-xl border border-border bg-input/60 px-4 py-3 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/25"
            >
              {locations.length === 0 && <option value="">No spots yet</option>}
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <Field label="Notes">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Details, model number, etc." />
      </Field>

      <Field label="Quantity in stock">
        <NumberStepper value={quantity} onChange={setQuantity} />
      </Field>

      {/* Stock actions for existing items */}
      {isEdit && live && (
        <div className="mb-4 rounded-2xl border border-border bg-secondary/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Stock</span>
            <span className="text-sm text-muted-foreground">
              <span className="font-display text-base font-bold text-foreground">{available}</span> on shelf ·{" "}
              {live.checkedOut} out
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <BigButton variant="ghost" onClick={() => store.checkOut(live.id, 1)} disabled={available <= 0}>
              <PackageMinus className="size-5" /> Take out
            </BigButton>
            <BigButton variant="ghost" onClick={() => store.checkIn(live.id, 1)} disabled={live.checkedOut <= 0}>
              <PackagePlus className="size-5" /> Return
            </BigButton>
          </div>
        </div>
      )}

      <Field label="Item barcode" hint="Auto-generated, or scan the product's own barcode.">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-input/60 px-3 py-2">
            <Barcode className="size-5 text-muted-foreground" />
            <input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Auto"
              className="w-full bg-transparent py-1 text-base outline-none"
            />
          </div>
          <button
            onClick={scanOwnBarcode}
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground active:scale-90"
            aria-label="Scan item barcode"
          >
            <ScanLine className="size-5" />
          </button>
        </div>
      </Field>

      {barcode && (
        <div className="mb-4 grid place-items-center rounded-2xl bg-white p-3">
          <BarcodeSvg value={barcode} height={50} />
        </div>
      )}

      {isEdit && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <BigButton variant="ghost" onClick={handleMove}>
            <ArrowRightLeft className="size-5" /> Move
          </BigButton>
          <BigButton variant="danger" onClick={handleDelete}>
            <Trash2 className="size-5" /> Delete
          </BigButton>
        </div>
      )}
    </Sheet>
  )
}
