export interface DiscordField {
  name: string
  value: string
  inline?: boolean
}

/**
 * Fire a Discord webhook. Discord webhooks accept cross-origin POSTs from the
 * browser, so this works from a static GitHub Pages site.
 */
export async function notifyDiscord(
  webhook: string,
  opts: { title: string; description?: string; color?: number; fields?: DiscordField[] },
): Promise<boolean> {
  if (!webhook) return false
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Shelf Keeper",
        embeds: [
          {
            title: opts.title,
            description: opts.description,
            color: opts.color ?? 0x22d3ee,
            fields: opts.fields ?? [],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    })
    return res.ok
  } catch (e) {
    console.log("[v0] discord webhook error", e)
    return false
  }
}
