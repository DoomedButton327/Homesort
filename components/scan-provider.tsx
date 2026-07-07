"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"
import { BarcodeScanner } from "./barcode-scanner"

type ScanFn = (prompt?: string) => Promise<string | null>

const ScanCtx = createContext<ScanFn>(async () => null)

export function useScan() {
  return useContext(ScanCtx)
}

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState<string | undefined>()
  const resolverRef = useRef<((v: string | null) => void) | null>(null)

  const scan = useCallback<ScanFn>((p) => {
    setPrompt(p)
    setOpen(true)
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const finish = useCallback((value: string | null) => {
    setOpen(false)
    resolverRef.current?.(value)
    resolverRef.current = null
  }, [])

  return (
    <ScanCtx.Provider value={scan}>
      {children}
      <BarcodeScanner
        open={open}
        prompt={prompt}
        onScan={(v) => finish(v)}
        onClose={() => finish(null)}
      />
    </ScanCtx.Provider>
  )
}
