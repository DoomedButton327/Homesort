import { openDB, type DBSchema, type IDBPDatabase } from "idb"
import type { Activity, AppConfig, Item, Location, StoredImage } from "./types"
import { DEFAULT_CONFIG } from "./types"

interface ShelfDB extends DBSchema {
  locations: { key: string; value: Location }
  items: { key: string; value: Item; indexes: { by_location: string } }
  images: { key: string; value: StoredImage }
  activity: { key: string; value: Activity }
  config: { key: string; value: unknown }
}

const DB_NAME = "shelf-keeper"
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<ShelfDB>> | null = null

function getDB() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser")
  }
  if (!dbPromise) {
    dbPromise = openDB<ShelfDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("locations")) {
          db.createObjectStore("locations", { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains("items")) {
          const items = db.createObjectStore("items", { keyPath: "id" })
          items.createIndex("by_location", "locationId")
        }
        if (!db.objectStoreNames.contains("images")) {
          db.createObjectStore("images", { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains("activity")) {
          db.createObjectStore("activity", { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains("config")) {
          db.createObjectStore("config")
        }
      },
    })
  }
  return dbPromise
}

/* ------------------------------- Locations ------------------------------- */

export async function dbGetLocations(): Promise<Location[]> {
  return (await getDB()).getAll("locations")
}
export async function dbPutLocation(loc: Location) {
  await (await getDB()).put("locations", loc)
}
export async function dbDeleteLocation(id: string) {
  await (await getDB()).delete("locations", id)
}

/* --------------------------------- Items --------------------------------- */

export async function dbGetItems(): Promise<Item[]> {
  return (await getDB()).getAll("items")
}
export async function dbPutItem(item: Item) {
  await (await getDB()).put("items", item)
}
export async function dbDeleteItem(id: string) {
  await (await getDB()).delete("items", id)
}

/* --------------------------------- Images -------------------------------- */

export async function dbGetImage(id: string): Promise<StoredImage | undefined> {
  return (await getDB()).get("images", id)
}
export async function dbGetAllImages(): Promise<StoredImage[]> {
  return (await getDB()).getAll("images")
}
export async function dbPutImage(img: StoredImage) {
  await (await getDB()).put("images", img)
}
export async function dbDeleteImage(id: string) {
  await (await getDB()).delete("images", id)
}
export async function dbMarkImagesSynced(ids: string[]) {
  const db = await getDB()
  const tx = db.transaction("images", "readwrite")
  for (const id of ids) {
    const img = await tx.store.get(id)
    if (img) {
      img.synced = true
      await tx.store.put(img)
    }
  }
  await tx.done
}

/* -------------------------------- Activity ------------------------------- */

export async function dbGetActivity(): Promise<Activity[]> {
  return (await getDB()).getAll("activity")
}
export async function dbPutActivity(a: Activity) {
  await (await getDB()).put("activity", a)
}

/* --------------------------------- Config -------------------------------- */

export async function dbGetConfig(): Promise<AppConfig> {
  const stored = (await (await getDB()).get("config", "app")) as Partial<AppConfig> | undefined
  return { ...DEFAULT_CONFIG, ...(stored ?? {}) }
}
export async function dbPutConfig(config: AppConfig) {
  await (await getDB()).put("config", config, "app")
}

/* ------------------------------ Bulk replace ----------------------------- */

export async function dbReplaceAll(data: {
  locations: Location[]
  items: Item[]
  activity: Activity[]
}) {
  const db = await getDB()
  const tx = db.transaction(["locations", "items", "activity"], "readwrite")
  await tx.objectStore("locations").clear()
  await tx.objectStore("items").clear()
  await tx.objectStore("activity").clear()
  for (const l of data.locations) await tx.objectStore("locations").put(l)
  for (const i of data.items) await tx.objectStore("items").put(i)
  for (const a of data.activity) await tx.objectStore("activity").put(a)
  await tx.done
}
