import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { existsSync, mkdirSync, createReadStream, statSync, readdirSync } from "fs"
import path from "path"
import type { DownloadProgress } from "@/lib/types"
import {
  incrementStats,
  incrementActiveUsers,
  decrementActiveUsers,
  addRecentError,
} from "@/lib/stats"
import { YTDLP_PATH, getCookiesFile, DOWNLOAD_DIR } from "@/lib/config"

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

interface DownloadEntry {
  progress: DownloadProgress
  controller: AbortController
  filePath?: string
}

const downloads = new Map<string, DownloadEntry>()

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

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function parseProgressLine(line: string): Partial<DownloadProgress> | null {
  const pctMatch = line.match(/(\d+\.?\d*)%/)
  if (!pctMatch) return null

  const percent = parseFloat(pctMatch[1])
  const speedMatch = line.match(/at\s+([\d.]+[KMGT]?i?B\/s)/)
  const etaMatch = line.match(/ETA\s+(\d{2}:\d{2}(?::\d{2})?)/)

  const destMatch = line.match(/Destination:\s+(.+)/)
  const errorMatch = line.match(/ERROR:\s+(.+)/)

  const update: Partial<DownloadProgress> = { percent }

  if (speedMatch) update.speed = speedMatch[1]
  if (etaMatch) update.eta = etaMatch[1]
  if (destMatch) update.filename = destMatch[1].trim()
  if (errorMatch) {
    update.error = errorMatch[1].trim()
    update.status = "error"
  }

  if (percent >= 100) {
    update.status = "processing"
  } else if (percent > 0) {
    update.status = "downloading"
  }

  return Object.keys(update).length > 1 ? update : null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawUrl = body?.url
    const formatId = body?.formatId
    const quality = body?.quality as string | undefined

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }
    if (!formatId || typeof formatId !== "string") {
      return NextResponse.json(
        { error: "formatId is required" },
        { status: 400 }
      )
    }

    const url = sanitizeUrl(rawUrl)

    if (!isValidMediaUrl(url)) {
      return NextResponse.json(
        { error: "Invalid or unsupported URL" },
        { status: 400 }
      )
    }

    const downloadId = generateId()
    const controller = new AbortController()

    const isAudio = formatId === "audio" || formatId.startsWith("audio") || formatId.includes("mp3") || formatId.includes("m4a") || formatId.includes("opus")

    const downloadDir = DOWNLOAD_DIR
    if (!existsSync(downloadDir)) mkdirSync(downloadDir, { recursive: true })

    const ffmpegPath = path.join(path.dirname(YTDLP_PATH), "ffmpeg.exe")
    const hasFfmpeg = existsSync(ffmpegPath)
    const ffmpegArgs = hasFfmpeg ? ["--ffmpeg-location", ffmpegPath] : []

    const args: string[] = [
      "--no-warnings", "--newline", "--no-check-certificates",
      "--extractor-args", "youtube:player_client=tv",
      "-P", downloadDir,
      ...ffmpegArgs,
    ]
    const cookiesFile = getCookiesFile()
    if (cookiesFile) args.push("--cookies", cookiesFile)
    if (isAudio) {
      const audioFormat = formatId === "audio" ? "bestaudio/best" : formatId
      args.push("-x", "--audio-format", "mp3", "--audio-quality", "0", "-f", audioFormat)
    } else {
      const qualityVal = quality ? parseInt(quality) : undefined
      const audioPref = "bestaudio[ext=m4a]/bestaudio"
      const sortPref = ["-S", "vcodec:avc1:vp9:av01,res,br"]
      const remuxPref = hasFfmpeg ? ["--recode-video", "mp4"] : []
      if (qualityVal && qualityVal > 0) {
        args.push(
          "-f",
          `bestvideo[height<=${qualityVal}][vcodec^=avc1]+${audioPref}/bestvideo[height<=${qualityVal}]+${audioPref}/best[height<=${qualityVal}]`,
          ...sortPref,
          ...remuxPref,
        )
      } else {
        const fallbackFormat = formatId === "video" ? "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best" : formatId
        args.push("-f", fallbackFormat, ...sortPref, ...remuxPref)
      }
    }
    args.push(url)

    const entry: DownloadEntry = {
      progress: {
        percent: 0,
        speed: "",
        eta: "",
        status: "idle",
      },
      controller,
    }
    downloads.set(downloadId, entry)

    const proc = spawn(YTDLP_PATH, args, {
      windowsHide: true,
      signal: controller.signal,
    })

    incrementActiveUsers()
    incrementStats(isAudio ? "audio" : formatId === "video" ? "mp4" : formatId, url)

    let filename = ""

    proc.stdout?.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n")
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        if (
          trimmed.endsWith(".mp4") ||
          trimmed.endsWith(".mp3") ||
          trimmed.endsWith(".webm") ||
          trimmed.endsWith(".m4a") ||
          trimmed.endsWith(".mkv")
        ) {
          filename = trimmed
          entry.progress.filename = filename
          entry.progress.status = "downloading"
        }

        const parsed = parseProgressLine(trimmed)
        if (parsed) {
          Object.assign(entry.progress, parsed)
        }
      }
    })

    proc.stderr?.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n")
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        const destMatch = trimmed.match(/Destination:\s+(.+)/)
        if (destMatch) {
          filename = destMatch[1].trim()
          entry.progress.filename = filename.split("\\").pop() || filename
        }

        if (trimmed.startsWith("ERROR:")) {
          entry.progress.error = trimmed.replace("ERROR:", "").trim()
          entry.progress.status = "error"
        } else if (trimmed.startsWith("WARNING:")) {
          continue
        } else {
          const parsed = parseProgressLine(trimmed)
          if (parsed) {
            Object.assign(entry.progress, parsed)
          }
        }
      }
    })

    proc.on("close", (code) => {
      decrementActiveUsers()
      if (code === 0) {
        entry.progress.percent = 100
        entry.progress.status = "complete"
        entry.progress.speed = ""
        entry.progress.eta = ""
        if (filename && existsSync(filename)) entry.filePath = filename
        else if (filename) {
          const merged = filename.replace(/\.f\d+\.\w+$/, ".mp4")
          if (existsSync(merged)) entry.filePath = merged
        }
      } else if (entry.progress.status !== "error") {
        entry.progress.status = "error"
        entry.progress.error = `Download failed with exit code ${code}`
        addRecentError(entry.progress.error, url)
      }
    })

    proc.on("error", (err) => {
      decrementActiveUsers()
      if (err.name === "AbortError") {
        entry.progress.status = "idle"
        return
      }
      entry.progress.status = "error"
      entry.progress.error = err.message
      addRecentError(err.message, url)
    })

    return NextResponse.json({ downloadId })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to start download"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Download ID is required" },
        { status: 400 }
      )
    }

    const entry = downloads.get(id)
    if (!entry) {
      return NextResponse.json(
        { error: "Download not found" },
        { status: 404 }
      )
    }

    if (entry.progress.status === "complete") {
      const serveFile = searchParams.get("serve") === "1"
    const downloadDir = DOWNLOAD_DIR

      let filePath = entry.filePath
      if (!filePath && existsSync(downloadDir)) {
        const files = readdirSync(downloadDir)
          .filter((f: string) => f.endsWith(".mp4") || f.endsWith(".mp3"))
          .map((f: string) => ({ name: f, time: statSync(path.join(downloadDir, f)).mtimeMs }))
          .sort((a: any, b: any) => b.time - a.time)
        if (files.length > 0) filePath = path.join(downloadDir, files[0].name)
      }
      if (serveFile && filePath && existsSync(filePath)) {
        try {
          const stat = statSync(filePath)
          const stream = createReadStream(filePath)
          const ext = path.extname(filePath).toLowerCase()
          const contentType = ext === ".mp3" ? "audio/mpeg" : "video/mp4"
          return new NextResponse(stream as any, {
            headers: {
              "Content-Type": contentType,
              "Content-Length": stat.size.toString(),
              "Content-Disposition": `inline; filename="media${ext}"`,
            },
          })
        } catch {
          return NextResponse.json({ error: "File read error" }, { status: 500 })
        }
      }
      if (serveFile) {
        return NextResponse.json({ error: "No completed file found" }, { status: 404 })
      }
    }

    return NextResponse.json(entry.progress)
  } catch {
    return NextResponse.json(
      { error: "Failed to get download status" },
      { status: 500 }
    )
  }
}
