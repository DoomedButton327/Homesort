"use client"

import { useEffect, useState } from "react"
import { dbGetImage, dbPutImage } from "@/lib/db"
import { fetchRemoteImage } from "@/lib/github"
import { store } from "@/lib/store"

// module-level cache of object URLs so we don't recreate them constantly
const urlCache = new Map<string, string>()

export function useImage(id: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(id ? urlCache.get(id) ?? null : null)

  useEffect(() => {
    let cancelled = false
    if (!id) {
      setUrl(null)
      return
    }
    const cached = urlCache.get(id)
    if (cached) {
      setUrl(cached)
      return
    }
    ;(async () => {
      let img = await dbGetImage(id)
      // fall back to pulling from the remote repo if we don't have it locally
      if (!img) {
        const config = store.getSnapshot().config
        if (config.githubOwner && config.githubRepo) {
          const blob = await fetchRemoteImage(config, id)
          if (blob) {
            img = { id, blob, createdAt: Date.now(), synced: true }
            await dbPutImage(img).catch(() => {})
          }
        }
      }
      if (img && !cancelled) {
        const objectUrl = URL.createObjectURL(img.blob)
        urlCache.set(id, objectUrl)
        setUrl(objectUrl)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  return url
}
