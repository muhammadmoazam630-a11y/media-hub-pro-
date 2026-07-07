import os from "os"
import path from "path"

const isWin = os.platform() === "win32"

export const YTDLP_PATH: string =
  process.env.YTDLP_PATH ||
  (isWin
    ? path.join(os.homedir(), "AppData", "Local", "yt-dlp", "yt-dlp.exe")
    : "yt-dlp")

export const COOKIES_FILE: string =
  process.env.COOKIES_FILE ||
  (isWin
    ? path.join(os.homedir(), "AppData", "Local", "yt-dlp", "cookies.txt")
    : "")

export const DOWNLOAD_DIR: string =
  process.env.DOWNLOAD_DIR ||
  path.join(os.homedir(), "Downloads", "MediaHub Downloads")
