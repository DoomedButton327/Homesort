"use client"

import { useEffect, useRef } from "react"
import { renderBarcode } from "@/lib/barcode"

export function BarcodeSvg({
  value,
  height = 60,
  width = 2,
  displayValue = true,
  className,
}: {
  value: string
  height?: number
  width?: number
  displayValue?: boolean
  className?: string
}) {
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (ref.current) {
      renderBarcode(ref.current, value, { height, width, displayValue })
    }
  }, [value, height, width, displayValue])
  return <svg ref={ref} className={className} />
}
