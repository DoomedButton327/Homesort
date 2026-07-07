"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, ImagePlus, RefreshCw } from "lucide-react"
import { useImage } from "@/hooks/use-image"

async function compress(file: File, maxDim = 1280, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file
  let { width, height } = bitmap
  if (width > height && width > maxDim) {
    height = Math.round((height * maxDim) / width)
    width = maxDim
  } else if (height > maxDim) {
    width = Math.round((width * maxDim) / height)
    height = maxDim
  }
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, width, height)
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
  return blob ?? file
}

export function PhotoPicker({
  existingImageId,
  onBlob,
  aspect = "square",
  label = "Add photo",
}: {
  existingImageId?: string | null
  onBlob: (blob: Blob) => void
  aspect?: "square" | "wide"
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localUrl, setLocalUrl] = useState<string | null>(null)
  const existingUrl = useImage(existingImageId)
  const shownUrl = localUrl ?? existingUrl

  useEffect(() => {
    return () => {
      if (localUrl) URL.revokeObjectURL(localUrl)
    }
  }, [localUrl])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const blob = await compress(file)
    if (localUrl) URL.revokeObjectURL(localUrl)
    setLocalUrl(URL.createObjectURL(blob))
    onBlob(blob)
    e.target.value = ""
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`laminate laminate-shine group relative flex w-full items-center justify-center overflow-hidden rounded-2xl ${
          aspect === "square" ? "aspect-square" : "aspect-[16/10]"
        }`}
      >
        {shownUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shownUrl || "/placeholder.svg"} alt="Captured" className="size-full object-cover" />
            <span className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <RefreshCw className="size-3.5" /> Retake
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Camera className="size-7" />
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold">
              <ImagePlus className="size-4" /> {label}
            </span>
          </span>
        )}
      </button>
    </div>
  )
}
