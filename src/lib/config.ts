import os from "os"
import path from "path"
import { writeFileSync } from "fs"

const isWin = os.platform() === "win32"

export const YTDLP_PATH: string =
  process.env.YTDLP_PATH ||
  (isWin
    ? path.join(os.homedir(), "AppData", "Local", "yt-dlp", "yt-dlp.exe")
    : "yt-dlp")

// Write cookies from base64 env var if provided (for Railway deployment)
const COOKIES_BASE64 = process.env.COOKIES_BASE64 || ""
const ENV_COOKIES_FILE = process.env.COOKIES_FILE || ""
let cookiesFilePath = ENV_COOKIES_FILE

if (COOKIES_BASE64) {
  const targetPath = "/app/cookies.txt"
  try {
    const buf = Buffer.from(COOKIES_BASE64, "base64")
    writeFileSync(targetPath, buf)
    cookiesFilePath = targetPath
  } catch {
    cookiesFilePath = ENV_COOKIES_FILE
  }
}

export const COOKIES_FILE: string =
  cookiesFilePath ||
  (isWin
    ? path.join(os.homedir(), "AppData", "Local", "yt-dlp", "cookies.txt")
    : "")

export const DOWNLOAD_DIR: string =
  process.env.DOWNLOAD_DIR ||
  path.join(os.homedir(), "Downloads", "MediaHub Downloads")
