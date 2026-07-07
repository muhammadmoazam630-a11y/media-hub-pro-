"use client"

import { useState } from "react"
import { Clock, Trash2, CheckCircle, XCircle, Loader2, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useDownloadStore } from "@/store/download"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

const statusConfig = {
  complete: { icon: CheckCircle, label: "Completed", className: "text-green-400 bg-green-500/10 border-green-500/20" },
  error: { icon: XCircle, label: "Failed", className: "text-red-400 bg-red-500/10 border-red-500/20" },
  downloading: { icon: Loader2, label: "Downloading", className: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  processing: { icon: Loader2, label: "Processing", className: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  idle: { icon: Clock, label: "Queued", className: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
}

export default function HistoryPage() {
  const { downloads, clearCompleted, removeDownload } = useDownloadStore()
  const [confirmClear, setConfirmClear] = useState(false)

  const completedCount = downloads.filter((d) => d.progress.status === "complete").length

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/10 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-2xl font-bold">Download History</h1>
            </div>
            <p className="text-sm text-zinc-500 ml-11">
              {downloads.length} {downloads.length === 1 ? "item" : "items"}
              {completedCount > 0 && ` (${completedCount} completed)`}
            </p>
          </div>

          {completedCount > 0 && (
            <div className="relative">
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      clearCompleted()
                      setConfirmClear(false)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Confirm Clear
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Completed
                </Button>
              )}
            </div>
          )}
        </div>

        {downloads.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-24 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <Clock className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No download history yet</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-sm">
              Your completed and ongoing downloads will appear here. Start by analyzing a media URL.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl font-medium text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/20"
            >
              <Download className="h-4 w-4" />
              Download something
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {downloads.map((item, index) => {
              const status = statusConfig[item.progress.status]
              const StatusIcon = status.icon

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Download className="h-6 w-6 text-zinc-600" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium">{item.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                        <span>{item.format.label}</span>
                        <span>{item.format.ext.toUpperCase()}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span className="text-zinc-600 truncate max-w-[200px] sm:max-w-none">{item.url}</span>
                      </div>
                      {item.progress.status === "downloading" && (
                        <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                            style={{ width: `${item.progress.percent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className={cn("flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium", status.className)}>
                        <StatusIcon className={cn("h-3.5 w-3.5", item.progress.status === "downloading" && "animate-spin")} />
                        {status.label}
                        {item.progress.status === "downloading" && ` ${item.progress.percent}%`}
                      </div>

                      <button
                        onClick={() => removeDownload(item.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
