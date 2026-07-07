"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"
import { DecodeHintType, BarcodeFormat } from "@zxing/library"
import { Keyboard, X } from "lucide-react"

export function BarcodeScanner({
  open,
  onScan,
  onClose,
  prompt = "Point at a barcode",
}: {
  open: boolean
  onScan: (value: string) => void
  onClose: () => void
  prompt?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState("")

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setError(null)

    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.QR_CODE,
    ])
    const reader = new BrowserMultiFormatReader(hints)

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result, _err, controls) => {
        controlsRef.current = controls
        if (result && !cancelled) {
          if (navigator.vibrate) navigator.vibrate(60)
          onScan(result.getText())
          controls.stop()
        }
      })
      .catch((e) => {
        console.log("[v0] scanner start error", e)
        if (!cancelled) setError("Could not access the camera. You can type the code instead.")
      })

    return () => {
      cancelled = true
      controlsRef.current?.stop()
    }
  }, [open, onScan])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between p-4">
        <span className="font-display text-lg font-bold">Scan</span>
        <button
          onClick={onClose}
          aria-label="Close scanner"
          className="grid size-10 place-items-center rounded-full bg-secondary text-secondary-foreground active:scale-90"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="relative mx-4 flex-1 overflow-hidden rounded-3xl bg-black">
        <video ref={videoRef} className="size-full object-cover" playsInline muted />
        {!error && (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-48 w-72 max-w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              <div className="animate-scan-sweep absolute inset-x-3 h-0.5 bg-primary shadow-[0_0_12px_2px] shadow-primary" />
            </div>
            <p className="absolute inset-x-0 bottom-6 text-center text-sm font-medium text-white/90">{prompt}</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (manual.trim()) {
            onScan(manual.trim())
            setManual("")
          }
        }}
        className="flex items-center gap-2 p-4"
      >
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-input/60 px-3">
          <Keyboard className="size-5 text-muted-foreground" />
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Type / scan with handheld…"
            autoFocus
            className="w-full bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button type="submit" className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground active:scale-95">
          Go
        </button>
      </form>
    </div>
  )
}
