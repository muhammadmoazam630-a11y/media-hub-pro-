"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Download, Pause, Play, X, CheckCircle2, AlertCircle, Music, Film } from "lucide-react"
import toast from "react-hot-toast"
import { analyzeUrl, startDownload, getDownloadStatus } from "@/lib/api"
import { useDownloadStore } from "@/store/download"
import { cn, generateId, isValidUrl } from "@/lib/utils"
import type { MediaInfo, Format, DownloadProgress as DownloadProgressType } from "@/lib/types"
import DownloadProgress from "@/components/download/DownloadProgress"

type Mode = "video" | "audio"

const qualityOptions: Record<Mode, string[]> = {
  video: ["144p", "240p", "360p", "480p", "720p", "1080p", "1440p", "2160p"],
  audio: ["64kbps", "96kbps", "128kbps", "192kbps", "256kbps", "320kbps"],
}

function getFpsOptions(formats: Format[], qualityLabel: string): number[] {
  const height = parseInt(qualityLabel)
  if (!height) return []
  const fpsSet = new Set<number>()
  formats.forEach((f) => {
    const h = parseInt(f.resolution?.split("x")[1] || "")
    if (h === height && f.fps) fpsSet.add(f.fps)
  })
  return [...fpsSet].sort((a, b) => b - a)
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-white/5", className)} />
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" /></div>}>
      <AnalyzeContent />
    </Suspense>
  )
}

function AnalyzeContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get("url") || ""

  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>("video")
  const [selectedQuality, setSelectedQuality] = useState("")
  const [selectedFps, setSelectedFps] = useState<number | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgressType | null>(null)
  const [paused, setPaused] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [realDownloadId, setRealDownloadId] = useState<string | null>(null)

  const addDownload = useDownloadStore((s) => s.addDownload)
  const updateProgress = useDownloadStore((s) => s.updateProgress)

  const fetchAnalysis = useCallback(async () => {
    if (!url) {
      setLoading(false)
      setError("No URL provided")
      return
    }
    if (!isValidUrl(url)) {
      setLoading(false)
      setError("Invalid URL. Please provide a valid media URL.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await analyzeUrl(url)
      setMediaInfo(data)
      setSelectedQuality(qualityOptions.video[5])
      setSelectedFps(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to analyze URL"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  useEffect(() => {
    setSelectedFps(null)
  }, [mode, selectedQuality])

  async function handleDownload() {
    if (!selectedQuality) {
      toast.error("Please select a quality")
      return
    }

    const ext = mode === "video" ? "mp4" : "mp3"
    const downloadId = generateId()
    const item = {
      id: downloadId,
      url,
      title: mediaInfo?.title || "Media",
      format: { id: mode, label: selectedQuality, ext, size: "", audioOnly: mode === "audio", videoOnly: mode === "video" },
      progress: { percent: 0, speed: "0 B/s", eta: "--", status: "downloading" as const },
      createdAt: new Date().toISOString(),
      thumbnail: mediaInfo?.thumbnail,
    }
    addDownload(item)
    setShowProgressModal(true)
    setDownloading(true)
    setPaused(false)

    try {
      const { downloadId: realId } = await startDownload(url, mode, selectedQuality)
      setRealDownloadId(realId)
      const savePath = `Downloads\\MediaHub Downloads\\${mediaInfo?.title || "media"}.${ext}`
      setDownloadProgress({ percent: 1, speed: "", eta: "", status: "downloading", filename: `${mediaInfo?.title || "media"}.${ext}` })

      const poll = setInterval(async () => {
        try {
          const status = await getDownloadStatus(realId)
          setDownloadProgress((prev) => ({ ...prev, ...status }))

          if (status.status === "complete") {
            clearInterval(poll)
            setDownloadProgress({ percent: 100, speed: "0 B/s", eta: "0s", status: "complete", savePath, filename: status.filename })
            updateProgress(downloadId, { percent: 100, speed: "0 B/s", eta: "0s", status: "complete", savePath, filename: status.filename })
            setDownloading(false)
            toast.success("Download complete! Saved to " + savePath)
          } else if (status.status === "error") {
            clearInterval(poll)
            setDownloadProgress((prev) => ({ percent: prev?.percent || 0, speed: prev?.speed || "", eta: prev?.eta || "", status: "error", filename: prev?.filename, error: status.error }))
            updateProgress(downloadId, { percent: 0, speed: "", eta: "", status: "error", error: status.error })
            setDownloading(false)
            toast.error(status.error || "Download failed")
          }
        } catch {
          clearInterval(poll)
          setDownloading(false)
          toast.error("Lost connection to server")
        }
      }, 1000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start download"
      setDownloadProgress({ percent: 0, speed: "", eta: "", status: "error", error: msg })
      setDownloading(false)
      toast.error(msg)
    }
  }

  function togglePause() {
    setPaused((p) => !p)
  }

  function cancelDownload() {
    setShowProgressModal(false)
    setDownloadProgress(null)
    setDownloading(false)
    setPaused(false)
    toast("Download cancelled", { icon: "🗑️" })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="aspect-video rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-16 rounded-xl" />
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center px-4">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Analysis Failed</h2>
        <p className="text-zinc-400 mb-6 text-center max-w-md">{error}</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </a>
      </div>
    )
  }

  const fpsOptions = mode === "video" ? getFpsOptions(mediaInfo?.formats || [], selectedQuality) : []

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </a>

        {mediaInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="relative aspect-video w-24 sm:w-32 md:w-48 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                {mediaInfo.thumbnail && (
                  <img src={mediaInfo.thumbnail} alt={mediaInfo.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold truncate">{mediaInfo.title}</h1>
                {mediaInfo.creator && <p className="text-sm text-zinc-400 mt-1">{mediaInfo.creator}</p>}
                <p className="text-xs sm:text-sm text-zinc-500 mt-1">{mediaInfo.duration} &middot; {mediaInfo.resolution}</p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mt-8"
        >
          <div className="flex rounded-xl border border-white/10 bg-white/[0.02] p-1.5">
            <button
              onClick={() => setMode("video")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all",
                mode === "video"
                  ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Film className="w-4 h-4" />
              MP4 Video
            </button>
            <button
              onClick={() => setMode("audio")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all",
                mode === "audio"
                  ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Music className="w-4 h-4" />
              MP3 Audio
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mt-6"
        >
          <label className="block text-sm font-medium text-zinc-400 mb-3">Quality</label>
          <div className="flex flex-wrap gap-2">
            {qualityOptions[mode].map((q) => {
              const isActive = selectedQuality === q && !selectedFps
              return (
                <button
                  key={q}
                  onClick={() => { setSelectedQuality(q); setSelectedFps(null) }}
                  className={cn(
                    "px-5 py-3 rounded-xl border text-sm font-medium transition-all",
                    isActive
                      ? "border-purple-500 bg-purple-500/10 text-purple-300"
                      : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20"
                  )}
                >
                  {q}
                </button>
              )
            })}
          </div>
        </motion.div>

        {fpsOptions.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-4"
          >
            <label className="block text-sm font-medium text-zinc-400 mb-3">Frame Rate</label>
            <div className="flex flex-wrap gap-2">
              {fpsOptions.map((fps) => (
                <button
                  key={fps}
                  onClick={() => setSelectedFps(fps)}
                  className={cn(
                    "px-5 py-3 rounded-xl border text-sm font-medium transition-all",
                    selectedFps === fps
                      ? "border-amber-500 bg-amber-500/10 text-amber-300"
                      : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20"
                  )}
                >
                  {fps}fps
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-8"
        >
          <button
            onClick={handleDownload}
            disabled={!selectedQuality || downloading}
            className={cn(
              "w-full h-14 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 transition-all",
              "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "shadow-lg shadow-purple-500/20",
            )}
          >
            <Download className="w-5 h-5" />
            {downloading ? "Downloading..." : `Download ${mode === "video" ? "MP4" : "MP3"}`}
          </button>
        </motion.div>

        <AnimatePresence>
          {showProgressModal && downloadProgress && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121218] p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Download Progress</h3>
                  {downloadProgress.status !== "downloading" && (
                    <button
                      onClick={() => setShowProgressModal(false)}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4 text-zinc-400" />
                    </button>
                  )}
                </div>

                <DownloadProgress progress={downloadProgress} />

                <div className="mt-6 flex gap-3">
                  {downloadProgress.status === "downloading" && (
                    <>
                      <button
                        onClick={togglePause}
                        className="flex-1 h-12 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        {paused ? "Resume" : "Pause"}
                      </button>
                      <button
                        onClick={cancelDownload}
                        className="flex-1 h-12 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </>
                  )}
                  {downloadProgress.status === "complete" && (
                    <>
                      {mode === "video" && realDownloadId && (
                        <div className="w-full mb-3 rounded-xl overflow-hidden bg-black">
                          <video controls className="w-full max-h-64" preload="metadata">
                            <source src={`/api/download?id=${realDownloadId}&serve=1`} type="video/mp4" />
                          </video>
                        </div>
                      )}
                      {mode === "audio" && realDownloadId && (
                        <div className="w-full mb-3">
                          <audio controls className="w-full" preload="metadata">
                            <source src={`/api/download?id=${realDownloadId}&serve=1`} type="audio/mpeg" />
                          </audio>
                        </div>
                      )}
                      <button
                        onClick={() => setShowProgressModal(false)}
                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Done
                      </button>
                    </>
                  )}
                  {downloadProgress.status === "error" && (
                    <button
                      onClick={cancelDownload}
                      className="flex-1 h-12 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium text-sm"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}