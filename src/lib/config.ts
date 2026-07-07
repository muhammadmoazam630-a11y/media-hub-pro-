import os from "os"
import path from "path"
import { existsSync, statSync, writeFileSync, chmodSync } from "fs"

const isWin = os.platform() === "win32"

export const YTDLP_PATH: string =
  process.env.YTDLP_PATH ||
  (isWin
    ? path.join(os.homedir(), "AppData", "Local", "yt-dlp", "yt-dlp.exe")
    : "yt-dlp")

export function getCookiesFile(): string {
  const base64 = process.env.COOKIES_BASE64
  if (base64) {
    const targetPath = path.join(os.tmpdir(), `ytdlp-cookies-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`)
    try {
      const buf = Buffer.from(base64, "base64")
      writeFileSync(targetPath, buf)
      chmodSync(targetPath, 0o444)
      return targetPath
    } catch {
      // fall through
    }
  }

  if (isWin) {
    const winPath = path.join(os.homedir(), "AppData", "Local", "yt-dlp", "cookies.txt")
    if (existsSync(winPath) && statSync(winPath).size > 0) return winPath
  }

  return ""
}

export const DOWNLOAD_DIR: string =
  process.env.DOWNLOAD_DIR ||
  path.join(os.homedir(), "Downloads", "MediaHub Downloads")
