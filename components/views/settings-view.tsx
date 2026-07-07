"use client"

import { useState } from "react"
import {
  BadgeCheck,
  CloudUpload,
  CloudDownload,
  GitBranch,
  Loader2,
  MessageSquare,
  Bell,
  History,
} from "lucide-react"
import { store } from "@/lib/store"
import { testConnection, pullSnapshot } from "@/lib/github"
import { notifyDiscord } from "@/lib/discord"
import { useStore } from "@/hooks/use-store"
import { useToast } from "@/components/toast"
import { BigButton, Field, TextInput, Toggle } from "@/components/kit"

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function SettingsView() {
  const { config, activity, syncing, syncMessage, items, locations } = useStore()
  const toast = useToast()
  const [testing, setTesting] = useState(false)
  const [pulling, setPulling] = useState(false)

  const unsyncedCount = (() => {
    // rough: items/locations updated after nothing tracked here, so just show totals
    return items.length + locations.length
  })()

  async function handleTest() {
    setTesting(true)
    const res = await testConnection(config)
    toast(res.message, res.ok ? "success" : "error")
    setTesting(false)
  }

  async function handlePush() {
    const res = await store.pushToGitHub()
    toast(res.ok ? "Pushed to GitHub" : res.message, res.ok ? "success" : "error")
  }

  async function handlePull() {
    if (!confirm("Pull will REPLACE all local data with the copy from GitHub. Continue?")) return
    setPulling(true)
    try {
      const snap = await pullSnapshot(config)
      await store.applySnapshot(snap)
      toast("Pulled latest data from GitHub", "success")
    } catch (e) {
      toast(e instanceof Error ? e.message : "Pull failed", "error")
    }
    setPulling(false)
  }

  async function handleTestDiscord() {
    if (!config.discordWebhook) {
      toast("Add a Discord webhook first", "warning")
      return
    }
    const ok = await notifyDiscord(config.discordWebhook, {
      title: "Test notification",
      description: "Your Shelf app is connected to Discord.",
      color: 0x22d3ee,
    })
    toast(ok ? "Sent a test message to Discord" : "Discord webhook failed", ok ? "success" : "error")
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-28">
      {/* GitHub storage */}
      <section className="laminate rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <GitBranch className="size-5 text-primary" />
          <h2 className="font-display text-lg font-bold">GitHub storage</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Data, timestamps and images are committed to a separate repo. Nothing is pushed automatically — use the
          buttons below to sync when you&apos;re ready.
        </p>

        <Field label="Personal access token (PAT)" hint="Needs 'repo' contents read/write. Stored only on this device.">
          <TextInput
            type="password"
            value={config.githubPat}
            onChange={(e) => store.setConfig({ githubPat: e.target.value })}
            placeholder="github_pat_..."
            autoComplete="off"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner / username">
            <TextInput
              value={config.githubOwner}
              onChange={(e) => store.setConfig({ githubOwner: e.target.value })}
              placeholder="your-username"
            />
          </Field>
          <Field label="Repository">
            <TextInput
              value={config.githubRepo}
              onChange={(e) => store.setConfig({ githubRepo: e.target.value })}
              placeholder="home-inventory-data"
            />
          </Field>
        </div>
        <Field label="Branch">
          <TextInput
            value={config.githubBranch}
            onChange={(e) => store.setConfig({ githubBranch: e.target.value })}
            placeholder="main"
          />
        </Field>

        <div className="mt-2 grid gap-3">
          <BigButton variant="ghost" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="size-5 animate-spin" /> : <BadgeCheck className="size-5" />}
            Test connection
          </BigButton>

          <BigButton onClick={handlePush} disabled={syncing}>
            {syncing ? <Loader2 className="size-5 animate-spin" /> : <CloudUpload className="size-5" />}
            {syncing ? syncMessage || "Pushing…" : `Push everything now (${unsyncedCount} records)`}
          </BigButton>

          <BigButton variant="accent" onClick={handlePull} disabled={pulling || syncing}>
            {pulling ? <Loader2 className="size-5 animate-spin" /> : <CloudDownload className="size-5" />}
            Pull from GitHub (replace local)
          </BigButton>
        </div>
      </section>

      {/* Discord */}
      <section className="laminate rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="size-5 text-accent" />
          <h2 className="font-display text-lg font-bold">Discord notifications</h2>
        </div>
        <Field label="Webhook URL" hint="You can also hardcode this in lib/types.ts so it ships with the site.">
          <TextInput
            type="password"
            value={config.discordWebhook}
            onChange={(e) => store.setConfig({ discordWebhook: e.target.value })}
            placeholder="https://discord.com/api/webhooks/..."
            autoComplete="off"
          />
        </Field>

        <div className="mb-3 flex items-center gap-2">
          <Bell className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground/90">Notify me when…</span>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/50 px-4">
          <Toggle
            checked={config.notifyOnCheckout}
            onChange={(v) => store.setConfig({ notifyOnCheckout: v })}
            label="An item is taken out or returned"
          />
          <Toggle
            checked={config.notifyOnMove}
            onChange={(v) => store.setConfig({ notifyOnMove: v })}
            label="An item is moved to a new spot"
          />
          <Toggle
            checked={config.notifyOnRemove}
            onChange={(v) => store.setConfig({ notifyOnRemove: v })}
            label="An item is permanently deleted"
          />
        </div>

        <div className="mt-3">
          <BigButton variant="ghost" onClick={handleTestDiscord}>
            <MessageSquare className="size-5" />
            Send test message
          </BigButton>
        </div>
      </section>

      {/* Activity log */}
      <section className="laminate rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <History className="size-5 text-warning" />
          <h2 className="font-display text-lg font-bold">Recent activity</h2>
        </div>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet. Your actions will show up here with timestamps.</p>
        ) : (
          <ul className="space-y-2">
            {[...activity]
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 30)
              .map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-card/40 px-3 py-2"
                >
                  <span className="text-sm leading-snug">{a.message}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.timestamp)}</span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  )
}
