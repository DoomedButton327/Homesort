import {
  dbDeleteImage,
  dbDeleteItem,
  dbDeleteLocation,
  dbGetActivity,
  dbGetAllImages,
  dbGetConfig,
  dbGetItems,
  dbGetLocations,
  dbMarkImagesSynced,
  dbPutActivity,
  dbPutConfig,
  dbPutImage,
  dbPutItem,
  dbPutLocation,
  dbReplaceAll,
} from "./db"
import { notifyDiscord } from "./discord"
import { pushAll } from "./github"
import { newItemBarcode, newLocationBarcode } from "./barcode"
import type { Activity, ActivityType, AppConfig, Item, Location, Snapshot } from "./types"
import { DEFAULT_CONFIG } from "./types"

const LOCATION_COLORS = [
  "#22d3ee",
  "#f472b6",
  "#facc15",
  "#4ade80",
  "#fb923c",
  "#a78bfa",
  "#38bdf8",
  "#f87171",
]

interface State {
  locations: Location[]
  items: Item[]
  activity: Activity[]
  config: AppConfig
  loaded: boolean
  syncing: boolean
  syncMessage: string
}

type Listener = () => void

function uid() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

class ShelfStore {
  private state: State = {
    locations: [],
    items: [],
    activity: [],
    config: DEFAULT_CONFIG,
    loaded: false,
    syncing: false,
    syncMessage: "",
  }

  private listeners = new Set<Listener>()
  private initStarted = false

  subscribe = (cb: Listener) => {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  getSnapshot = () => this.state

  private set(patch: Partial<State>) {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((l) => l())
  }

  async init() {
    if (this.initStarted) return
    this.initStarted = true
    const [locations, items, activity, config] = await Promise.all([
      dbGetLocations(),
      dbGetItems(),
      dbGetActivity(),
      dbGetConfig(),
    ])
    this.set({ locations, items, activity, config, loaded: true })
  }

  /* ------------------------------ Activity ------------------------------ */

  private async log(type: ActivityType, message: string, refs?: { itemId?: string; locationId?: string }) {
    const entry: Activity = {
      id: uid(),
      type,
      message,
      itemId: refs?.itemId,
      locationId: refs?.locationId,
      timestamp: Date.now(),
    }
    await dbPutActivity(entry)
    this.set({ activity: [...this.state.activity, entry] })
  }

  /* ------------------------------- Images ------------------------------- */

  async saveImage(blob: Blob): Promise<string> {
    const id = uid()
    await dbPutImage({ id, blob, createdAt: Date.now(), synced: false })
    return id
  }

  /* ------------------------------ Locations ----------------------------- */

  async addLocation(input: { name: string; description?: string; photoId?: string | null }): Promise<Location> {
    const now = Date.now()
    const loc: Location = {
      id: uid(),
      name: input.name.trim() || "Untitled spot",
      description: input.description?.trim() ?? "",
      photoId: input.photoId ?? null,
      barcode: newLocationBarcode(),
      color: LOCATION_COLORS[this.state.locations.length % LOCATION_COLORS.length],
      createdAt: now,
      updatedAt: now,
    }
    await dbPutLocation(loc)
    this.set({ locations: [...this.state.locations, loc] })
    await this.log("location_added", `Added spot "${loc.name}"`, { locationId: loc.id })
    return loc
  }

  async updateLocation(id: string, patch: Partial<Location>) {
    const loc = this.state.locations.find((l) => l.id === id)
    if (!loc) return
    const updated = { ...loc, ...patch, updatedAt: Date.now() }
    await dbPutLocation(updated)
    this.set({ locations: this.state.locations.map((l) => (l.id === id ? updated : l)) })
  }

  async deleteLocation(id: string) {
    const loc = this.state.locations.find((l) => l.id === id)
    const childItems = this.state.items.filter((i) => i.locationId === id)
    for (const item of childItems) {
      if (item.photoId) await dbDeleteImage(item.photoId).catch(() => {})
      await dbDeleteItem(item.id)
    }
    if (loc?.photoId) await dbDeleteImage(loc.photoId).catch(() => {})
    await dbDeleteLocation(id)
    this.set({
      locations: this.state.locations.filter((l) => l.id !== id),
      items: this.state.items.filter((i) => i.locationId !== id),
    })
    await this.log("location_removed", `Removed spot "${loc?.name ?? id}" and ${childItems.length} item(s)`)
  }

  /* -------------------------------- Items ------------------------------- */

  async addItem(input: {
    name: string
    locationId: string
    notes?: string
    photoId?: string | null
    quantity?: number
    barcode?: string
  }): Promise<Item> {
    const now = Date.now()
    const item: Item = {
      id: uid(),
      name: input.name.trim() || "Untitled item",
      notes: input.notes?.trim() ?? "",
      photoId: input.photoId ?? null,
      barcode: input.barcode?.trim() || newItemBarcode(),
      locationId: input.locationId,
      quantity: input.quantity ?? 1,
      checkedOut: 0,
      createdAt: now,
      updatedAt: now,
    }
    await dbPutItem(item)
    this.set({ items: [...this.state.items, item] })
    const loc = this.state.locations.find((l) => l.id === item.locationId)
    await this.log("item_added", `Added "${item.name}" to ${loc?.name ?? "a spot"}`, {
      itemId: item.id,
      locationId: item.locationId,
    })
    return item
  }

  async updateItem(id: string, patch: Partial<Item>) {
    const item = this.state.items.find((i) => i.id === id)
    if (!item) return
    const updated = { ...item, ...patch, updatedAt: Date.now() }
    await dbPutItem(updated)
    this.set({ items: this.state.items.map((i) => (i.id === id ? updated : i)) })
  }

  async deleteItem(id: string) {
    const item = this.state.items.find((i) => i.id === id)
    if (item?.photoId) await dbDeleteImage(item.photoId).catch(() => {})
    await dbDeleteItem(id)
    this.set({ items: this.state.items.filter((i) => i.id !== id) })
    const loc = this.state.locations.find((l) => l.id === item?.locationId)
    await this.log("item_removed", `Deleted "${item?.name ?? id}"`, { locationId: item?.locationId })
    if (this.state.config.notifyOnRemove && item) {
      void notifyDiscord(this.state.config.discordWebhook, {
        title: "Item deleted",
        description: `**${item.name}** was permanently removed from **${loc?.name ?? "a spot"}**.`,
        color: 0xf87171,
      })
    }
  }

  async checkOut(itemId: string, qty = 1) {
    const item = this.state.items.find((i) => i.id === itemId)
    if (!item) return
    const available = item.quantity - item.checkedOut
    const take = Math.min(qty, available)
    if (take <= 0) return
    await this.updateItem(itemId, { checkedOut: item.checkedOut + take })
    const loc = this.state.locations.find((l) => l.id === item.locationId)
    await this.log("checked_out", `Took ${take}x "${item.name}" from ${loc?.name ?? "a spot"}`, {
      itemId,
      locationId: item.locationId,
    })
    if (this.state.config.notifyOnCheckout) {
      void notifyDiscord(this.state.config.discordWebhook, {
        title: "Item taken out",
        description: `**${take}x ${item.name}** taken from **${loc?.name ?? "a spot"}**.`,
        color: 0xfacc15,
        fields: [{ name: "Remaining on shelf", value: `${item.quantity - item.checkedOut - take}`, inline: true }],
      })
    }
  }

  async checkIn(itemId: string, qty = 1) {
    const item = this.state.items.find((i) => i.id === itemId)
    if (!item) return
    const give = Math.min(qty, item.checkedOut)
    if (give <= 0) return
    await this.updateItem(itemId, { checkedOut: item.checkedOut - give })
    const loc = this.state.locations.find((l) => l.id === item.locationId)
    await this.log("checked_in", `Returned ${give}x "${item.name}" to ${loc?.name ?? "a spot"}`, {
      itemId,
      locationId: item.locationId,
    })
    if (this.state.config.notifyOnCheckout) {
      void notifyDiscord(this.state.config.discordWebhook, {
        title: "Item returned",
        description: `**${give}x ${item.name}** returned to **${loc?.name ?? "a spot"}**.`,
        color: 0x4ade80,
      })
    }
  }

  async setQuantity(itemId: string, quantity: number) {
    const item = this.state.items.find((i) => i.id === itemId)
    if (!item) return
    const q = Math.max(0, Math.round(quantity))
    await this.updateItem(itemId, { quantity: q, checkedOut: Math.min(item.checkedOut, q) })
    await this.log("quantity_changed", `Set "${item.name}" quantity to ${q}`, { itemId, locationId: item.locationId })
  }

  async moveItem(itemId: string, toLocationId: string) {
    const item = this.state.items.find((i) => i.id === itemId)
    if (!item || item.locationId === toLocationId) return
    const from = this.state.locations.find((l) => l.id === item.locationId)
    const to = this.state.locations.find((l) => l.id === toLocationId)
    await this.updateItem(itemId, { locationId: toLocationId })
    await this.log("moved", `Moved "${item.name}" from ${from?.name ?? "?"} to ${to?.name ?? "?"}`, {
      itemId,
      locationId: toLocationId,
    })
    if (this.state.config.notifyOnMove) {
      void notifyDiscord(this.state.config.discordWebhook, {
        title: "Item moved",
        description: `**${item.name}** moved from **${from?.name ?? "?"}** to **${to?.name ?? "?"}**.`,
        color: 0xa78bfa,
      })
    }
  }

  /* -------------------------------- Config ------------------------------ */

  async setConfig(patch: Partial<AppConfig>) {
    const config = { ...this.state.config, ...patch }
    await dbPutConfig(config)
    this.set({ config })
  }

  /* --------------------------------- Sync ------------------------------- */

  buildSnapshot(): Snapshot {
    return {
      locations: this.state.locations,
      items: this.state.items,
      activity: this.state.activity,
      exportedAt: Date.now(),
      version: 1,
    }
  }

  async pushToGitHub(): Promise<{ ok: boolean; message: string }> {
    if (this.state.syncing) return { ok: false, message: "Already syncing" }
    this.set({ syncing: true, syncMessage: "Starting…" })
    try {
      const allImages = await dbGetAllImages()
      const usedIds = new Set<string>()
      this.state.locations.forEach((l) => l.photoId && usedIds.add(l.photoId))
      this.state.items.forEach((i) => i.photoId && usedIds.add(i.photoId))
      const unsynced = allImages.filter((img) => !img.synced && usedIds.has(img.id))
      const snapshot = this.buildSnapshot()
      const { commitUrl, uploadedImageIds } = await pushAll(this.state.config, snapshot, unsynced, (msg) =>
        this.set({ syncMessage: msg }),
      )
      await dbMarkImagesSynced(uploadedImageIds)
      await this.log("synced", `Pushed ${snapshot.items.length} items & ${uploadedImageIds.length} new images`)
      this.set({ syncing: false, syncMessage: "" })
      void notifyDiscord(this.state.config.discordWebhook, {
        title: "Inventory synced to GitHub",
        description: `${snapshot.locations.length} spots, ${snapshot.items.length} items pushed.`,
        color: 0x22d3ee,
      })
      return { ok: true, message: commitUrl }
    } catch (e) {
      this.set({ syncing: false, syncMessage: "" })
      return { ok: false, message: e instanceof Error ? e.message : "Push failed" }
    }
  }

  async applySnapshot(snapshot: Snapshot) {
    await dbReplaceAll({
      locations: snapshot.locations ?? [],
      items: snapshot.items ?? [],
      activity: snapshot.activity ?? [],
    })
    this.set({
      locations: snapshot.locations ?? [],
      items: snapshot.items ?? [],
      activity: snapshot.activity ?? [],
    })
  }
}

export const store = new ShelfStore()
