import type { AppConfig, Snapshot, StoredImage } from "./types"

const API = "https://api.github.com"

function headers(pat: string) {
  return {
    Authorization: `Bearer ${pat}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
}

function assertConfig(config: AppConfig) {
  if (!config.githubPat) throw new Error("Missing GitHub token (PAT).")
  if (!config.githubOwner) throw new Error("Missing GitHub owner/username.")
  if (!config.githubRepo) throw new Error("Missing GitHub repository name.")
}

async function ghFetch(pat: string, path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...headers(pat), ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    let detail = ""
    try {
      const j = await res.json()
      detail = j.message ? ` – ${j.message}` : ""
    } catch {
      /* ignore */
    }
    throw new Error(`GitHub ${res.status}${detail}`)
  }
  return res
}

export async function testConnection(config: AppConfig): Promise<{ ok: boolean; message: string }> {
  try {
    assertConfig(config)
    const res = await ghFetch(config.githubPat, `/repos/${config.githubOwner}/${config.githubRepo}`)
    const repo = await res.json()
    return { ok: true, message: `Connected to ${repo.full_name}` }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Connection failed" }
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1] ?? "")
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

interface TreeItem {
  path: string
  mode: "100644"
  type: "blob"
  sha: string
}

/**
 * Push a full snapshot + all unsynced images to the repo in a single commit
 * using the Git Data API. Returns the ids of images that were uploaded.
 */
export async function pushAll(
  config: AppConfig,
  snapshot: Snapshot,
  images: StoredImage[],
  onProgress?: (msg: string) => void,
): Promise<{ commitUrl: string; uploadedImageIds: string[] }> {
  assertConfig(config)
  const { githubPat: pat, githubOwner: owner, githubRepo: repo, githubBranch: branch } = config
  const base = `/repos/${owner}/${repo}`

  // 1. Find current ref (may not exist on an empty repo)
  let baseCommitSha: string | null = null
  let baseTreeSha: string | undefined
  onProgress?.("Reading repository state…")
  try {
    const refRes = await ghFetch(pat, `${base}/git/ref/heads/${branch}`)
    const ref = await refRes.json()
    baseCommitSha = ref.object.sha
    const commitRes = await ghFetch(pat, `${base}/git/commits/${baseCommitSha}`)
    const commit = await commitRes.json()
    baseTreeSha = commit.tree.sha
  } catch (e) {
    // Empty repo / branch: we'll create the first commit.
    console.log("[v0] no existing ref, creating first commit", e)
  }

  const tree: TreeItem[] = []

  // 2. Upload images as blobs
  const uploadedImageIds: string[] = []
  let n = 0
  for (const img of images) {
    n++
    onProgress?.(`Uploading image ${n}/${images.length}…`)
    const b64 = await blobToBase64(img.blob)
    const blobRes = await ghFetch(pat, `${base}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: b64, encoding: "base64" }),
    })
    const blob = await blobRes.json()
    tree.push({ path: `images/${img.id}.jpg`, mode: "100644", type: "blob", sha: blob.sha })
    uploadedImageIds.push(img.id)
  }

  // 3. data.json blob
  onProgress?.("Uploading data…")
  const dataB64 = btoa(unescape(encodeURIComponent(JSON.stringify(snapshot, null, 2))))
  const dataBlobRes = await ghFetch(pat, `${base}/git/blobs`, {
    method: "POST",
    body: JSON.stringify({ content: dataB64, encoding: "base64" }),
  })
  const dataBlob = await dataBlobRes.json()
  tree.push({ path: "data.json", mode: "100644", type: "blob", sha: dataBlob.sha })

  // 4. Create tree
  onProgress?.("Building commit…")
  const treeRes = await ghFetch(pat, `${base}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseTreeSha, tree }),
  })
  const newTree = await treeRes.json()

  // 5. Create commit
  const message = `Shelf sync – ${new Date().toISOString()} (${snapshot.locations.length} locations, ${snapshot.items.length} items)`
  const commitRes = await ghFetch(pat, `${base}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message,
      tree: newTree.sha,
      parents: baseCommitSha ? [baseCommitSha] : [],
    }),
  })
  const newCommit = await commitRes.json()

  // 6. Update or create ref
  onProgress?.("Finalizing…")
  if (baseCommitSha) {
    await ghFetch(pat, `${base}/git/refs/heads/${branch}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommit.sha, force: false }),
    })
  } else {
    await ghFetch(pat, `${base}/git/refs`, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: newCommit.sha }),
    })
  }

  return { commitUrl: newCommit.html_url, uploadedImageIds }
}

/**
 * Pull the latest data.json from the repo. Images are fetched lazily via raw URLs.
 */
export async function pullSnapshot(config: AppConfig): Promise<Snapshot> {
  assertConfig(config)
  const { githubPat: pat, githubOwner: owner, githubRepo: repo, githubBranch: branch } = config
  const res = await ghFetch(
    pat,
    `/repos/${owner}/${repo}/contents/data.json?ref=${encodeURIComponent(branch)}`,
    { headers: { Accept: "application/vnd.github.raw+json" } },
  )
  const text = await res.text()
  return JSON.parse(text) as Snapshot
}

export function rawImageUrl(config: AppConfig, imageId: string) {
  return `https://raw.githubusercontent.com/${config.githubOwner}/${config.githubRepo}/${config.githubBranch}/images/${imageId}.jpg`
}

export async function fetchRemoteImage(config: AppConfig, imageId: string): Promise<Blob | null> {
  try {
    const res = await fetch(
      `${API}/repos/${config.githubOwner}/${config.githubRepo}/contents/images/${imageId}.jpg?ref=${encodeURIComponent(config.githubBranch)}`,
      { headers: { ...headers(config.githubPat), Accept: "application/vnd.github.raw+json" } },
    )
    if (!res.ok) return null
    return await res.blob()
  } catch (e) {
    console.log("[v0] fetchRemoteImage error", e)
    return null
  }
}
