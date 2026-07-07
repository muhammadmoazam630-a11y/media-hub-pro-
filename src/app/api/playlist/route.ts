import { NextRequest, NextResponse } from "next/server"
import { execSync } from "child_process"

import type { PlaylistInfo, PlaylistVideo } from "@/lib/types"
import { YTDLP_PATH, getCookiesFile } from "@/lib/config"

const SUPPORTED_DOMAINS = [
  "youtube.com", "youtu.be", "vimeo.com", "dailymotion.com",
  "twitch.tv", "soundcloud.com", "facebook.com", "instagram.com",
  "tiktok.com", "x.com", "twitter.com",
]

function sanitizeUrl(url: string): string {
  return url.replace(/[<>"'`\x00-\x1f\x7f]/g, "").trim()
}

function isValidMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (!["https:", "http:"].includes(parsed.protocol)) return false
    const hostname = parsed.hostname.replace(/^www\./, "")
    return SUPPORTED_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith("." + d)
    )
  } catch {
    return false
  }
}

function parseDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawUrl = body?.url

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const url = sanitizeUrl(rawUrl)

    if (!isValidMediaUrl(url)) {
      return NextResponse.json({ error: "Invalid or unsupported URL" }, { status: 400 })
    }

    // Check if URL is a playlist
    const parsed = new URL(url)
    const isPlaylist = parsed.searchParams.has("list") || url.includes("/playlist/") || url.includes("/mix/")
    if (!isPlaylist) {
      return NextResponse.json({ error: "URL is not a playlist" }, { status: 400 })
    }

    const cookiesFile = getCookiesFile()
    const hasCookies = cookiesFile.length > 0
    const cookiesArg = hasCookies ? `--cookies "${cookiesFile}"` : ""

    // Get playlist info with flat list
    const output = execSync(
      `"${YTDLP_PATH}" --dump-json --flat-playlist --no-warnings --no-check-certificates --extractor-args "youtube:player_client=tv" --ignore-errors ${cookiesArg} ${JSON.stringify(url)}`,
      { encoding: "utf-8", timeout: 60000, maxBuffer: 1024 * 1024 * 10 }
    )

    const lines = output.trim().split("\n").filter(Boolean)
    if (lines.length === 0) {
      return NextResponse.json({ error: "No videos found in playlist" }, { status: 404 })
    }

    // First line is playlist info (when not flat), or each line is a video
    const first = JSON.parse(lines[0])
    const isPlaylistEntry = first.playlist_id !== undefined && first.playlist_id !== null
      || first._type === "playlist"
      || first.playlist_title !== undefined

    let playlistTitle = ""
    let playlistId = ""
    let channel = ""
    let thumbnail = ""
    let videoLines: string[] = []

    if (isPlaylistEntry && first._type !== "video") {
      playlistTitle = first.playlist_title || first.title || "Untitled Playlist"
      playlistId = first.playlist_id || first.id || ""
      channel = first.uploader || first.channel || first.playlist_uploader || ""
      thumbnail = first.thumbnail || ""
      videoLines = lines.slice(isPlaylistEntry ? 1 : 0).filter(Boolean)
    } else {
      // Flat playlist - each line is a video
      videoLines = lines
    }

    // If we don't have title from first line, get it from playlist info
    if (!playlistTitle && first.playlist_title) {
      playlistTitle = first.playlist_title
    }

    const videos: PlaylistVideo[] = []
    for (const line of videoLines) {
      try {
        const v = JSON.parse(line)
        if (v.id && v.title) {
          videos.push({
            id: v.id,
            title: v.title,
            url: `https://www.youtube.com/watch?v=${v.id}`,
            duration: parseDuration(v.duration || v.duration_seconds || 0),
            durationSeconds: v.duration || v.duration_seconds || 0,
            thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
          })
        }
      } catch {
        // skip malformed lines
      }
    }

    if (videos.length === 0) {
      return NextResponse.json({ error: "Could not parse playlist videos" }, { status: 500 })
    }

    const playlistInfo: PlaylistInfo = {
      id: playlistId || first.playlist_id || videos[0].id,
      title: playlistTitle || first.playlist_title || "Playlist",
      thumbnail: thumbnail || videos[0]?.thumbnail || "",
      channel: channel || first.uploader || first.channel || first.playlist_uploader || "",
      videoCount: videos.length,
      videos,
      url,
    }

    return NextResponse.json(playlistInfo)
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("timed out")) {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 })
    }
    const msg = error instanceof Error ? error.message : "Failed to analyze playlist"
    const cleanMsg = msg.replace(/^ERROR:\s*/i, "").replace(/\[.+?\]\s*/, "").trim()
    return NextResponse.json({ error: cleanMsg || "Failed to analyze playlist" }, { status: 500 })
  }
}