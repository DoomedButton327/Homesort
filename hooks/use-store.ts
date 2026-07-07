"use client"

import { useEffect, useSyncExternalStore } from "react"
import { store } from "@/lib/store"

export function useStore() {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  useEffect(() => {
    void store.init()
  }, [])
  return state
}
