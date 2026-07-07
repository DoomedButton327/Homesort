"use client"

import { useState } from "react"
import { Home, ScanLine, Search, Tag, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScanProvider } from "./scan-provider"
import { ToastProvider } from "./toast"
import { LocationSheet } from "./location-sheet"
import { HomeView } from "./views/home-view"
import { LocationDetail } from "./views/location-detail"
import { ScanView } from "./views/scan-view"
import { SearchView } from "./views/search-view"
import { LabelsView } from "./views/labels-view"
import { SettingsView } from "./views/settings-view"
import { useStore } from "@/hooks/use-store"
import type { Location } from "@/lib/types"

type Tab = "home" | "scan" | "search" | "labels" | "settings"

const NAV: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "search", label: "Search", icon: Search },
  { id: "scan", label: "Scan", icon: ScanLine },
  { id: "labels", label: "Labels", icon: Tag },
  { id: "settings", label: "Setup", icon: Settings },
]

export function AppShell() {
  const { locations } = useStore()
  const [tab, setTab] = useState<Tab>("home")
  const [openLocationId, setOpenLocationId] = useState<string | null>(null)
  const [locSheet, setLocSheet] = useState<{ open: boolean; location: Location | null }>({
    open: false,
    location: null,
  })

  const openLocation = locations.find((l) => l.id === openLocationId) ?? null

  function goTo(t: Tab) {
    setOpenLocationId(null)
    setTab(t)
  }

  return (
    <ToastProvider>
      <ScanProvider>
        <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
          <main className="flex-1 px-4 pb-28 pt-6">
            {openLocation ? (
              <LocationDetail
                locationId={openLocation.id}
                onBack={() => setOpenLocationId(null)}
                onEdit={() => setLocSheet({ open: true, location: openLocation })}
              />
            ) : (
              <>
                {tab === "home" && (
                  <HomeView
                    onOpenLocation={(id) => setOpenLocationId(id)}
                    onAddLocation={() => setLocSheet({ open: true, location: null })}
                    onGoSync={() => setTab("settings")}
                  />
                )}
                {tab === "scan" && <ScanView onOpenLocation={(id) => setOpenLocationId(id)} />}
                {tab === "search" && <SearchView />}
                {tab === "labels" && <LabelsView />}
                {tab === "settings" && <SettingsView />}
              </>
            )}
          </main>

          {/* Bottom navigation */}
          <nav className="no-print fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-xl px-4 pb-4">
            <div className="laminate flex items-center justify-around rounded-2xl px-2 py-2">
              {NAV.map(({ id, label, icon: Icon }) => {
                const active = tab === id && !openLocation
                const isScan = id === "scan"
                return (
                  <button
                    key={id}
                    onClick={() => goTo(id)}
                    aria-label={label}
                    className={cn(
                      "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-all active:scale-90",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "grid place-items-center rounded-xl transition-all",
                        isScan ? "-mt-6 size-12 bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "size-6",
                        active && !isScan && "scale-110",
                      )}
                    >
                      <Icon className={isScan ? "size-6" : "size-5"} />
                    </span>
                    {label}
                  </button>
                )
              })}
            </div>
          </nav>
        </div>

        <LocationSheet
          open={locSheet.open}
          location={locSheet.location}
          onClose={() => setLocSheet({ open: false, location: null })}
        />
      </ScanProvider>
    </ToastProvider>
  )
}
