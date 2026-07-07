"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  BarChart3,
  Download,
  Users,
  Activity,
  Settings,
  FileText,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react"
import { cn, formatBytes } from "@/lib/utils"

interface AdminStats {
  totalDownloads: number
  todayDownloads: number
  activeUsers: number
  avgSpeed: number
  popularFormats: { format: string; count: number }[]
  recentErrors: { time: string; error: string; url: string }[]
  trafficData: { hour: string; downloads: number }[]
}

const navItems = [
  { label: "Overview", icon: Activity, active: true },
  { label: "Analytics", icon: BarChart3 },
  { label: "Downloads", icon: Download },
  { label: "Users", icon: Users },
  { label: "System", icon: Settings },
  { label: "Logs", icon: FileText },
  { label: "Settings", icon: Settings },
]

const statCards = [
  {
    label: "Total Downloads",
    key: "totalDownloads" as const,
    icon: Download,
    color: "from-purple-500/20 to-purple-600/10",
    textColor: "text-purple-400",
    format: (v: number) => v.toLocaleString(),
  },
  {
    label: "Today's Downloads",
    key: "todayDownloads" as const,
    icon: BarChart3,
    color: "from-blue-500/20 to-blue-600/10",
    textColor: "text-blue-400",
    format: (v: number) => v.toLocaleString(),
  },
  {
    label: "Active Users",
    key: "activeUsers" as const,
    icon: Users,
    color: "from-green-500/20 to-green-600/10",
    textColor: "text-green-400",
    format: (v: number) => v.toLocaleString(),
  },
  {
    label: "Avg Speed",
    key: "avgSpeed" as const,
    icon: Activity,
    color: "from-amber-500/20 to-amber-600/10",
    textColor: "text-amber-400",
    format: (v: number) => `${formatBytes(v)}/s`,
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const maxTraffic = stats ? Math.max(...stats.trafficData.map((d) => d.downloads), 1) : 1

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-[#0a0a0f]/95 backdrop-blur-2xl transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <span className="text-lg font-bold tracking-tight">
            <span className="text-purple-400">Media</span>Hub
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-3 rounded-xl hover:bg-white/10 transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all",
                item.active
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/5",
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-16 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-2xl flex items-center px-4 lg:px-8 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 rounded-xl hover:bg-white/10 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>

        <main className="flex-1 p-4 lg:p-8 space-y-6 overflow-y-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          >
            {statCards.map((card) => {
              const value = stats ? stats[card.key] : 0
              return (
                <motion.div
                  key={card.key}
                  variants={itemVariants}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
                >
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-50",
                      card.color,
                    )}
                  />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-zinc-400">{card.label}</span>
                      <div
                        className={cn(
                          "p-2 rounded-lg bg-white/5",
                          card.textColor,
                        )}
                      >
                        <card.icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {loading ? (
                        <div className="w-20 h-7 rounded bg-white/5 animate-pulse" />
                      ) : (
                        card.format(value)
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
          >
            <h2 className="text-sm font-semibold text-zinc-300 mb-4">Hourly Traffic (Today)</h2>
            {loading ? (
              <div className="h-40 rounded-lg bg-white/5 animate-pulse" />
            ) : (
              <div className="flex items-end gap-[2px] h-40">
                {stats?.trafficData.map((data) => (
                  <div key={data.hour} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                    <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {data.downloads}
                    </span>
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-purple-600 to-purple-400 transition-all duration-300 hover:from-purple-500 hover:to-purple-300"
                      style={{
                        height: `${(data.downloads / maxTraffic) * 100}%`,
                        minHeight: data.downloads > 0 ? "4px" : "0px",
                      }}
                    />
                    <span className="text-[10px] text-zinc-600 mt-1 [writing-mode:vertical-lr]">
                      {data.hour}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
            >
              <h2 className="text-sm font-semibold text-zinc-300 mb-4">Popular Formats</h2>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-8 rounded-lg bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : !stats?.popularFormats.length ? (
                <p className="text-sm text-zinc-500">No data yet</p>
              ) : (
                <div className="space-y-1">
                  {stats.popularFormats.map((f) => (
                    <div
                      key={f.format}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/5 transition-colors"
                    >
                      <span className="text-sm text-zinc-300">{f.format}</span>
                      <span className="text-sm font-medium text-zinc-500">{f.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-semibold text-zinc-300">Recent Errors</h2>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : !stats?.recentErrors.length ? (
                <p className="text-sm text-zinc-500">No errors</p>
              ) : (
                <div className="space-y-2">
                  {stats.recentErrors.map((err, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/10"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm text-red-300 truncate flex-1">{err.error}</span>
                        <span className="text-[10px] text-zinc-500 shrink-0">
                          {new Date(err.time).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-0.5 truncate">{err.url}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}
