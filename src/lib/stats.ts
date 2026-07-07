export interface DownloadStats {
  totalDownloads: number
  todayDownloads: number
  activeUsers: number
  avgSpeed: number
  popularFormats: { format: string; count: number }[]
  recentErrors: { time: string; error: string; url: string }[]
  trafficData: { hour: string; downloads: number }[]
}

const stats: DownloadStats = {
  totalDownloads: 0,
  todayDownloads: 0,
  activeUsers: 0,
  avgSpeed: 0,
  popularFormats: [],
  recentErrors: [],
  trafficData: Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, "0")}:00`,
    downloads: 0,
  })),
}

let todayDate = new Date().toDateString()

function resetTodayIfNeeded() {
  const now = new Date().toDateString()
  if (now !== todayDate) {
    todayDate = now
    stats.todayDownloads = 0
  }
}

export function incrementStats(formatLabel: string, url: string) {
  resetTodayIfNeeded()
  stats.totalDownloads++
  stats.todayDownloads++
  const hour = new Date().getHours()
  stats.trafficData[hour].downloads++

  const existing = stats.popularFormats.find((f) => f.format === formatLabel)
  if (existing) {
    existing.count++
  } else {
    stats.popularFormats.push({ format: formatLabel, count: 1 })
  }
}

export function incrementActiveUsers() {
  stats.activeUsers++
}

export function decrementActiveUsers() {
  stats.activeUsers--
}

export function addRecentError(error: string, url: string) {
  stats.recentErrors.push({
    time: new Date().toISOString(),
    error,
    url,
  })
  if (stats.recentErrors.length > 50) {
    stats.recentErrors.shift()
  }
}

export function getStats(): DownloadStats {
  return stats
}
