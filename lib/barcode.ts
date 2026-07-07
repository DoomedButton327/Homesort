import JsBarcode from "jsbarcode"

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function randomChunk(len: number) {
  let out = ""
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

export function newLocationBarcode() {
  return `LOC-${randomChunk(6)}`
}

export function newItemBarcode() {
  return `ITM-${randomChunk(6)}`
}

/**
 * Render a Code128 barcode into an <svg> element.
 */
export function renderBarcode(
  svg: SVGSVGElement,
  value: string,
  opts?: { height?: number; width?: number; fontSize?: number; displayValue?: boolean; background?: string; lineColor?: string },
) {
  try {
    JsBarcode(svg, value, {
      format: "CODE128",
      height: opts?.height ?? 70,
      width: opts?.width ?? 2,
      fontSize: opts?.fontSize ?? 16,
      displayValue: opts?.displayValue ?? true,
      margin: 8,
      background: opts?.background ?? "#ffffff",
      lineColor: opts?.lineColor ?? "#0b0f19",
      font: "monospace",
    })
  } catch (e) {
    console.log("[v0] barcode render error", e)
  }
}
