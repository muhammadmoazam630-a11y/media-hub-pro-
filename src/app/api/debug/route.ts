import { NextResponse } from "next/server"
import { existsSync, statSync, readdirSync } from "fs"
import os from "os"
import path from "path"

export async function GET() {
  const cookiesBase64 = process.env.COOKIES_BASE64 || ""
  const cookiesFile = process.env.COOKIES_FILE || ""
  const tmpDir = os.tmpdir()
  const tmpFiles = existsSync(tmpDir) ? readdirSync(tmpDir) : []
  const cookiesTmpPath = path.join(tmpDir, "ytdlp-cookies.txt")
  const cookiesTmpExists = existsSync(cookiesTmpPath)
  const cookiesTmpSize = cookiesTmpExists ? statSync(cookiesTmpPath).size : 0

  return NextResponse.json({
    platform: os.platform(),
    tmpDir,
    COOKIES_BASE64_SET: cookiesBase64.length > 0,
    COOKIES_BASE64_LENGTH: cookiesBase64.length,
    COOKIES_FILE_ENV: cookiesFile,
    COOKIES_FILE_EXISTS: cookiesFile ? existsSync(cookiesFile) : false,
    COOKIES_FILE_SIZE: cookiesFile && existsSync(cookiesFile) ? statSync(cookiesFile).size : 0,
    cookiesTmpPath,
    cookiesTmpExists,
    cookiesTmpSize,
    tmpFiles: tmpFiles.filter(f => f.includes("cookie")),
    nodeEnv: process.env.NODE_ENV,
    railwayEnv: process.env.RAILWAY_ENVIRONMENT_NAME || "not-railway",
  })
}
