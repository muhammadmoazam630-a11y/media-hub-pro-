import { NextRequest, NextResponse } from "next/server"
import { execSync } from "child_process"

import type { Format } from "@/lib/types"
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

const QUALITY_LABELS: Record<string, string> = {
  "2160": "4K",
  "1440": "2K",
  "1080": "1080p",
  "720": "720p",
  "480": "480p",
  "360": "360p",
  "240": "240p",
  "144": "144p",
}

function getQualityLabel(format: Record<string, unknown>): string {
  const note = format.format_note as string
  if (note && !/^\d+$/.test(note)) return note
  const height = format.height as number
  if (height) {
    const label = QUALITY_LABELS[String(height)]
    if (label) return label
    return `${height}p`
  }
  const resolution = format.resolution as string
  if (resolution) return resolution
  return note || "Unknown"
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
  const fps = format.fps as number | undefined
  const filesize =
    (format.filesize as number) || (format.filesize_approx as number)
  const height = format.height as number | undefined
  const width = format.width as number | undefined
  const ext = (format.ext as string) || ""

  const audioOnly = vcodec === "none" || !vcodec
  const videoOnly = acodec === "none" || !acodec

  return {
    id: format.format_id as string,
    label: getQualityLabel(format),
    ext,
    resolution: height
      ? `${width || 0}x${height}`
      : (format.resolution as string) || undefined,
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
    const body = await request.json()
    const rawUrl = body?.url

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const url = sanitizeUrl(rawUrl)

    if (!isValidMediaUrl(url)) {
      return NextResponse.json(
        { error: "Invalid or unsupported URL" },
        { status: 400 }
      )
    }

    const cookiesFile = getCookiesFile()
    const hasCookies = cookiesFile.length > 0
    const cookiesArg = hasCookies ? `--cookies "${cookiesFile}"` : ""
    const output = execSync(
      `"${YTDLP_PATH}" --dump-json --no-warnings --no-check-certificates --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" --extractor-args "youtube:skip=webpage" ${cookiesArg} ${JSON.stringify(url)}`,
      { encoding: "utf-8", timeout: 60000, maxBuffer: 1024 * 1024 * 10 }
    )

    const data = JSON.parse(output.trim())
    const rawFormats: Record<string, unknown>[] = data.formats || []

    const formats: Format[] = rawFormats
      .filter((f) => f.format_id && f.ext)
      .map(mapFormat)

    const videoFormats = formats.filter((f) => !f.audioOnly)
    const audioFormats = formats.filter((f) => f.audioOnly)

    const sorted = [
      ...videoFormats.sort((a, b) => {
        const aHeight = parseInt(a.resolution?.split("x")[1] || "0")
        const bHeight = parseInt(b.resolution?.split("x")[1] || "0")
        return bHeight - aHeight
      }),
      ...audioFormats.sort((a, b) => {
        const aSize = parseInt(a.size) || 0
        const bSize = parseInt(b.size) || 0
        return bSize - aSize
      }),
    ]

    return NextResponse.json({ formats: sorted })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch formats"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
