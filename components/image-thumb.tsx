"use client"

import { Package } from "lucide-react"
import { useImage } from "@/hooks/use-image"
import { cn } from "@/lib/utils"

export function ImageThumb({
  imageId,
  alt,
  className,
  iconClassName,
}: {
  imageId?: string | null
  alt: string
  className?: string
  iconClassName?: string
}) {
  const url = useImage(imageId)
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url || "/placeholder.svg"} alt={alt} className={cn("object-cover", className)} />
  }
  return (
    <div className={cn("grid place-items-center bg-secondary/60 text-muted-foreground", className)}>
      <Package className={cn("size-1/3", iconClassName)} />
    </div>
  )
}
