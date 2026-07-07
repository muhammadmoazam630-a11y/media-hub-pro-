import { NextRequest, NextResponse } from "next/server"
import { execSync } from "child_process"

import type { MediaInfo, Format } from "@/lib/types"
import { YTDLP_PATH, getCookiesFile } from "@/lib/config"

const SUPPORTED_DOMAINS = [
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "dailymotion.com",
  "twitch.tv",
  "soundcloud.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
]

const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW = 60_000

const rateMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

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

function formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes === 0) return "Unknown"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function mapFormat(format: Record<string, unknown>): Format {
  const vcodec = format.vcodec as string | undefined
  const acodec = format.acodec as string | undefined
  const resolution = format.resolution as string | undefined
  const formatNote = format.format_note as string | undefined
  const height = format.height as number | undefined
  const width = format.width as number | undefined
  const fps = format.fps as number | undefined
  const filesize = (format.filesize as number) || (format.filesize_approx as number)
  const ext = (format.ext as string) || ""

  let label = formatNote || resolution || `${height || 0}p`
  if (fps && fps > 30) label += `${fps}`

  const audioOnly = vcodec === "none" || !vcodec
  const videoOnly = acodec === "none" || !acodec

  return {
    id: format.format_id as string,
    label,
    ext,
    resolution: resolution || (height ? `${width || 0}x${height}` : undefined),
    fps: fps && fps > 0 ? fps : undefined,
    size: formatFileSize(filesize),
    vcodec: vcodec && vcodec !== "none" ? vcodec : undefined,
    acodec: acodec && acodec !== "none" ? acodec : undefined,
    audioOnly,
    videoOnly,
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1"

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const rawUrl = body?.url

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      )
    }

    const url = sanitizeUrl(rawUrl)

    if (!isValidMediaUrl(url)) {
      return NextResponse.json(
        {
          error:
            "Invalid or unsupported URL. Supported domains: " +
            SUPPORTED_DOMAINS.join(", "),
        },
        { status: 400 }
      )
    }

    const cookiesFile = getCookiesFile()
    const hasCookies = cookiesFile.length > 0
    console.log("[ANALYZE] cookiesFile:", cookiesFile, "hasCookies:", hasCookies)
    const cookiesArg = hasCookies ? `--cookies "${cookiesFile}"` : ""
    const output = execSync(
      `"${YTDLP_PATH}" --dump-json --no-warnings ${cookiesArg} ${JSON.stringify(url)}`,
      { encoding: "utf-8", timeout: 30000 }
    )

    const data = JSON.parse(output.trim())

    const formats: Format[] = (data.formats || [])
      .filter((f: Record<string, unknown>) => f.format_id && f.ext)
      .map(mapFormat)

    const durationSeconds = data.duration as number || 0
    const filesize =
      data.filesize || data.filesize_approx || data.requested_formats?.[0]?.filesize || 0

    const mediaInfo: MediaInfo = {
      id: data.id as string,
      title: data.title as string,
      thumbnail: (data.thumbnail as string) || "",
      duration: parseDuration(durationSeconds),
      durationSeconds,
      creator: (data.uploader as string) || (data.channel as string) || "Unknown",
      uploadDate: (data.upload_date as string) || "",
      resolution:
        data.resolution
          ? String(data.resolution)
          : data.height
            ? `${data.width || 0}x${data.height}`
            : "Unknown",
      fileSize: formatFileSize(filesize),
      formats,
      url,
    }

    return NextResponse.json(mediaInfo)
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("timed out")) {
      return NextResponse.json(
        { error: "Request timed out. The server may be unreachable." },
        { status: 504 }
      )
    }
    if (error instanceof Error && error.message.includes("ENOENT")) {
      return NextResponse.json(
        { error: "yt-dlp binary not found. Check server configuration." },
        { status: 500 }
      )
    }
    const message =
      error instanceof Error ? error.message : "Failed to analyze media"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
