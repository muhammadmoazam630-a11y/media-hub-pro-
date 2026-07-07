import type { MediaInfo, Format, PlaylistInfo } from "./types"

export async function analyzePlaylist(url: string): Promise<PlaylistInfo> {
  const res = await fetch("/api/playlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Playlist analysis failed" }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function analyzeUrl(url: string): Promise<MediaInfo> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Analysis failed" }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getFormats(url: string): Promise<Format[]> {
  const res = await fetch("/api/formats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) throw new Error("Failed to fetch formats")
  const data = await res.json()
  return data.formats
}

export async function startDownload(url: string, formatId: string, quality?: string): Promise<{ downloadId: string }> {
  const res = await fetch("/api/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, formatId, quality }),
  })
  if (!res.ok) throw new Error("Failed to start download")
  return res.json()
}

export async function getDownloadStatus(downloadId: string) {
  const res = await fetch(`/api/download?id=${downloadId}`)
  if (!res.ok) throw new Error("Failed to get status")
  return res.json()
}
