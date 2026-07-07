import { NextResponse } from "next/server"
import { existsSync, statSync, readdirSync, readFileSync } from "fs"
import os from "os"
import path from "path"
import { execSync } from "child_process"

export async function GET() {
  const cookiesBase64 = process.env.COOKIES_BASE64 || ""
  const cookiesFile = process.env.COOKIES_FILE || ""
  const tmpDir = os.tmpdir()
  const tmpFiles = existsSync(tmpDir) ? readdirSync(tmpDir) : []
  const cookiesTmpPath = path.join(tmpDir, "ytdlp-cookies.txt")
  const cookiesTmpExists = existsSync(cookiesTmpPath)
  const cookiesTmpSize = cookiesTmpExists ? statSync(cookiesTmpPath).size : 0

  let cookieContent = ""
  let cookieLines = 0
  try {
    const full = readFileSync(cookiesTmpPath, "utf-8")
    cookieContent = full.substring(0, 2000)
    cookieLines = full.split("\n").filter(l => l.trim() && !l.startsWith("#")).length
  } catch {}

  let curlCffiVersion = "unknown"
  let impersonateTargets = "unknown"
  try {
    curlCffiVersion = execSync("python3 -c \"import curl_cffi; print(curl_cffi.__version__)\"", { encoding: "utf-8", timeout: 10000 }).trim()
  } catch (e: any) {
    curlCffiVersion = "ERROR: " + (e.stderr || e.message || "import failed")
  }
  try {
    impersonateTargets = execSync("yt-dlp --list-impersonate-targets", { encoding: "utf-8", timeout: 15000 }).trim()
  } catch (e: any) {
    impersonateTargets = "ERROR: " + (e.stderr || e.message || "failed")
  }

  return NextResponse.json({
    platform: os.platform(),
    tmpDir,
    COOKIES_BASE64_SET: cookiesBase64.length > 0,
    COOKIES_BASE64_LENGTH: cookiesBase64.length,
    cookiesTmpPath,
    cookiesTmpExists,
    cookiesTmpSize,
    tmpFiles: tmpFiles.filter(f => f.includes("cookie")),
    cookieContent,
    cookieLines,
    curlCffiVersion,
    impersonateTargets,
    nodeEnv: process.env.NODE_ENV,
    railwayEnv: process.env.RAILWAY_ENVIRONMENT_NAME || "not-railway",
  })
}
