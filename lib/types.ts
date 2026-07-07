export type ID = string

export interface StoredImage {
  id: ID
  blob: Blob
  createdAt: number
  // whether this image is already committed to the remote repo
  synced: boolean
}

export interface Location {
  id: ID
  name: string
  description: string
  /** image id stored in IndexedDB */
  photoId: ID | null
  /** unique scannable code, e.g. LOC-AB12CD */
  barcode: string
  color: string
  createdAt: number
  updatedAt: number
}

export interface Item {
  id: ID
  name: string
  notes: string
  photoId: ID | null
  /** unique scannable code, e.g. ITM-AB12CD */
  barcode: string
  locationId: ID
  /** total units on the shelf */
  quantity: number
  /** units currently taken out (temporarily) */
  checkedOut: number
  createdAt: number
  updatedAt: number
}

export type ActivityType =
  | "location_added"
  | "location_removed"
  | "item_added"
  | "item_removed"
  | "checked_out"
  | "checked_in"
  | "moved"
  | "synced"
  | "quantity_changed"

export interface Activity {
  id: ID
  type: ActivityType
  message: string
  itemId?: ID
  locationId?: ID
  timestamp: number
}

export interface AppConfig {
  githubPat: string
  githubOwner: string
  githubRepo: string
  githubBranch: string
  discordWebhook: string
  notifyOnCheckout: boolean
  notifyOnMove: boolean
  notifyOnRemove: boolean
}

export const DEFAULT_CONFIG: AppConfig = {
  githubPat: "",
  githubOwner: "",
  githubRepo: "",
  githubBranch: "main",
  // You can hardcode your Discord webhook here so it ships with the site.
  discordWebhook: "",
  notifyOnCheckout: true,
  notifyOnMove: true,
  notifyOnRemove: true,
}

export interface Snapshot {
  locations: Location[]
  items: Item[]
  activity: Activity[]
  exportedAt: number
  version: number
}
