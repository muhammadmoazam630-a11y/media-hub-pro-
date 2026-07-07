"use client"

import { motion } from "framer-motion"
import { Loader2, CheckCircle2, XCircle, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DownloadProgress as DownloadProgressType } from "@/lib/types"

interface DownloadProgressProps {
  progress: DownloadProgressType
}

export default function DownloadProgress({ progress }: DownloadProgressProps) {
  const { percent, speed, eta, status, filename, savePath } = progress

  const statusIcon = {
    idle: null,
    downloading: null,
    processing: <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />,
    complete: <CheckCircle2 className="w-6 h-6 text-green-400" />,
    error: <XCircle className="w-6 h-6 text-red-400" />,
  }

  const statusText = {
    idle: "Waiting...",
    downloading: "Downloading...",
    processing: "Processing...",
    complete: "Download Complete",
    error: "Download Failed",
  }

  const isActive = status === "downloading"

  return (
    <div className="space-y-4">
      {filename && (
        <div className="text-sm text-zinc-300 truncate">{filename}</div>
      )}
      {status === "complete" && savePath && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm">
          <FolderOpen className="w-4 h-4 mt-0.5 shrink-0 text-green-400" />
          <div className="text-zinc-300 break-all">
            <span className="text-green-400 font-medium">Saved to:</span> {savePath}
          </div>
        </div>
      )}

      <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            status === "complete"
              ? "bg-green-500"
              : status === "error"
                ? "bg-red-500"
                : "bg-gradient-to-r from-purple-500 to-blue-500",
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {statusIcon[status]}

          <span
            className={cn(
              "text-sm font-medium",
              status === "complete" && "text-green-400",
              status === "error" && "text-red-400",
              isActive && "text-zinc-200",
            )}
          >
            {statusText[status]}
          </span>
        </div>

        <div className="text-right">
          {isActive && (
            <>
              <div className="text-lg font-bold tabular-nums text-white">{percent}%</div>
              <div className="text-xs text-zinc-500">
                {speed} &middot; {eta} remaining
              </div>
            </>
          )}
          {status === "processing" && (
            <div className="text-sm text-purple-300">Finalizing...</div>
          )}
          {status === "complete" && (
            <div className="text-sm text-green-400">100%</div>
          )}
          {status === "error" && (
            <div className="text-sm text-red-400">{progress.error || "Something went wrong"}</div>
          )}
        </div>
      </div>
    </div>
  )
}
