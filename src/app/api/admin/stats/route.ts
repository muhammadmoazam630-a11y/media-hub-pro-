import { NextResponse } from "next/server"
import { getStats } from "@/lib/stats"

export async function GET() {
  const stats = getStats()

  return NextResponse.json({
    totalDownloads: stats.totalDownloads,
    todayDownloads: stats.todayDownloads,
    activeUsers: stats.activeUsers,
    avgSpeed: stats.avgSpeed,
    popularFormats: stats.popularFormats,
    recentErrors: stats.recentErrors.slice(-10),
    trafficData: stats.trafficData,
  })
}
