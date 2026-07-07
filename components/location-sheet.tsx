"use client"

import { useState } from "react"
import { Check, Trash2 } from "lucide-react"
import { BigButton, Field, Sheet, TextArea, TextInput } from "./kit"
import { PhotoPicker } from "./photo-picker"
import { BarcodeSvg } from "./barcode-svg"
import { useToast } from "./toast"
import { store } from "@/lib/store"
import type { Location } from "@/lib/types"

export function LocationSheet({
  open,
  onClose,
  location,
}: {
  open: boolean
  onClose: () => void
  location?: Location | null
}) {
  const toast = useToast()
  const isEdit = !!location
  const [name, setName] = useState(location?.name ?? "")
  const [description, setDescription] = useState(location?.description ?? "")
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSave() {
    if (!name.trim()) {
      toast("Name your spot first", "warning")
      return
    }
    setBusy(true)
    let photoId = location?.photoId ?? null
    if (pendingBlob) photoId = await store.saveImage(pendingBlob)
    if (isEdit && location) {
      await store.updateLocation(location.id, { name, description, photoId })
      toast("Spot updated", "success")
    } else {
      await store.addLocation({ name, description, photoId })
      toast("Spot created", "success")
    }
    setBusy(false)
    onClose()
  }

  async function handleDelete() {
    if (!location) return
    if (!confirm(`Delete "${location.name}" and all its items?`)) return
    await store.deleteLocation(location.id)
    toast("Spot deleted", "info")
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit spot" : "New spot"}
      footer={
        <BigButton onClick={handleSave} disabled={busy}>
          <Check className="size-5" /> {isEdit ? "Save changes" : "Create spot"}
        </BigButton>
      }
    >
      <PhotoPicker existingImageId={location?.photoId} onBlob={setPendingBlob} aspect="wide" label="Snap this spot" />
      <div className="h-4" />
      <Field label="Spot name">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Garage shelf B" />
      </Field>
      <Field label="Description">
        <TextArea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Where is it? What's it for?"
        />
      </Field>

      {isEdit && location && (
        <>
          <Field label="Spot barcode" hint="Print it from the Labels tab and stick it on the shelf.">
            <div className="grid place-items-center rounded-2xl bg-white p-3">
              <BarcodeSvg value={location.barcode} height={56} />
            </div>
          </Field>
          <BigButton variant="danger" onClick={handleDelete}>
            <Trash2 className="size-5" /> Delete spot
          </BigButton>
        </>
      )}
    </Sheet>
  )
}
