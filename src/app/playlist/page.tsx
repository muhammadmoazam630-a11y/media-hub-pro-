"use client"

import { useState, type FormEvent } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Download, X, CheckCircle2, AlertCircle, Music, Film, ListMusic, Square, CheckSquare, Loader2, Search, ChevronRight, Play } from "lucide-react"
import toast from "react-hot-toast"
import { analyzePlaylist, startDownload, getDownloadStatus } from "@/lib/api"
import { useDownloadStore } from "@/store/download"
import { cn, generateId, isValidUrl } from "@/lib/utils"
import type { PlaylistInfo, PlaylistVideo, DownloadProgress as DownloadProgressType } from "@/lib/types"

type Mode = "video" | "audio"

const qualityOptions: Record<Mode, string[]> = {
  video: ["144p", "240p", "360p", "480p", "720p", "1080p", "1440p", "2160p"],
  audio: ["64kbps", "96kbps", "128kbps", "192kbps", "256kbps", "320kbps"],
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-white/5", className)} />
}

export default function PlaylistPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" /></div>}>
      <PlaylistContent />
    </Suspense>
  )
}

function PlaylistContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlParam = searchParams.get("url") || ""

  const [inputUrl, setInputUrl] = useState(urlParam)
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>("video")
  const [selectedQuality, setSelectedQuality] = useState("1080p")
  const [selectedVideos, setSelectedVideos] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(true)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; videoTitle: string; percent: number; status: string } | null>(null)
  const [batchDownloading, setBatchDownloading] = useState(false)

  const addDownload = useDownloadStore((s) => s.addDownload)

  useEffect(() => {
    if (urlParam) {
      setInputUrl(urlParam)
      fetchPlaylist(urlParam)
    }
  }, [urlParam])

  async function fetchPlaylist(url: string) {
    if (!url.trim()) return
    if (!isValidUrl(url)) {
      setError("Invalid URL")
      return
    }
    setLoading(true)
    setError(null)
    setPlaylistInfo(null)
    try {
      const data = await analyzePlaylist(url)
      setPlaylistInfo(data)
      setSelectedVideos(new Set(data.videos.map((_, i) => i)))
      setSelectAll(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to analyze playlist"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!inputUrl.trim()) return
    router.push(`/playlist?url=${encodeURIComponent(inputUrl.trim())}`)
  }

  function toggleVideo(index: number) {
    const next = new Set(selectedVideos)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setSelectedVideos(next)
    setSelectAll(next.size === (playlistInfo?.videos.length || 0))
  }

  function toggleSelectAll() {
    if (!playlistInfo) return
    if (selectAll) {
      setSelectedVideos(new Set())
      setSelectAll(false)
    } else {
      setSelectedVideos(new Set(playlistInfo.videos.map((_, i) => i)))
      setSelectAll(true)
    }
  }

  async function handleDownload() {
    if (!playlistInfo || selectedVideos.size === 0) {
      toast.error("Please select at least one video")
      return
    }

    const selected = playlistInfo.videos.filter((_, i) => selectedVideos.has(i))
    setBatchDownloading(true)
    setShowProgressModal(true)
    setBatchProgress({ current: 0, total: selected.length, videoTitle: "", percent: 0, status: "starting" })

    for (let i = 0; i < selected.length; i++) {
      const video = selected[i]
      setBatchProgress({ current: i + 1, total: selected.length, videoTitle: video.title, percent: 0, status: "starting" })

      try {
        const { downloadId: realId } = await startDownload(video.url, mode, selectedQuality)
        setBatchProgress({ current: i + 1, total: selected.length, videoTitle: video.title, percent: 0, status: "downloading" })

        await new Promise<void>((resolve, reject) => {
          const poll = setInterval(async () => {
            try {
              const status = await getDownloadStatus(realId)
              setBatchProgress((prev) => prev ? { ...prev, percent: status.percent, status: status.status } : null)

              if (status.status === "complete") {
                clearInterval(poll)
                const ext = mode === "video" ? "mp4" : "mp3"
                addDownload({
                  id: generateId(),
                  url: video.url,
                  title: video.title,
                  format: { id: mode, label: selectedQuality, ext, size: "", audioOnly: mode === "audio", videoOnly: mode === "video" },
                  progress: { percent: 100, speed: "0 B/s", eta: "0s", status: "complete" as const, savePath: `Downloads\\MediaHub Downloads\\${video.title}.${ext}` },
                  createdAt: new Date().toISOString(),
                  thumbnail: video.thumbnail,
                })
                resolve()
              } else if (status.status === "error") {
                clearInterval(poll)
                reject(new Error(status.error || "Download failed"))
              }
            } catch {
              clearInterval(poll)
              reject(new Error("Lost connection"))
            }
          }, 1000)
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Download failed"
        toast.error(`Failed: ${video.title} - ${msg}`)
      }
    }

    setBatchProgress((prev) => prev ? { ...prev, status: "complete", percent: 100 } : null)
    setBatchDownloading(false)
    toast.success(`Downloaded ${selectedVideos.size} of ${selected.length} videos!`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </a>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <ListMusic className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Playlist Downloader</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Download Entire Playlists</h1>
          <p className="text-zinc-400">Paste a YouTube playlist URL to download multiple videos at once</p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste YouTube playlist URL..."
              className="w-full h-14 pl-12 pr-4 rounded-2xl border border-white/10 bg-white/[0.04] text-white placeholder-zinc-500 text-base outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!inputUrl.trim() || loading}
            className={cn(
              "h-14 px-8 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all shrink-0",
              "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "shadow-lg shadow-purple-500/20",
            )}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <><Search className="w-4 h-4" /> Analyze</>
            )}
          </button>
        </motion.form>

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        )}

        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-zinc-400 text-center">{error}</p>
          </motion.div>
        )}

        {playlistInfo && !loading && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex items-start gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.02] mb-8"
            >
              <div className="relative aspect-video w-24 sm:w-32 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                {playlistInfo.thumbnail && (
                  <img src={playlistInfo.thumbnail} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm text-purple-400 mb-1">
                  <ListMusic className="w-4 h-4" />
                  <span>Playlist</span>
                </div>
                <h2 className="text-lg font-semibold truncate">{playlistInfo.title}</h2>
                {playlistInfo.channel && <p className="text-sm text-zinc-400 mt-0.5">{playlistInfo.channel}</p>}
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">{playlistInfo.videoCount} videos</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="mb-6"
            >
              <div className="flex rounded-xl border border-white/10 bg-white/[0.02] p-1.5 max-w-sm">
                <button
                  onClick={() => setMode("video")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all",
                    mode === "video"
                      ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Film className="w-4 h-4" /> MP4
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
                  <Music className="w-4 h-4" /> MP3
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-8"
            >
              <label className="block text-sm font-medium text-zinc-400 mb-3">Quality</label>
              <div className="flex flex-wrap gap-2">
                {qualityOptions[mode].map((q) => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuality(q)}
                    className={cn(
                      "px-5 py-3 rounded-xl border text-sm font-medium transition-all",
                      selectedQuality === q
                        ? "border-purple-500 bg-purple-500/10 text-purple-300"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20"
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-zinc-400">Videos ({playlistInfo.videoCount})</h2>
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {selectAll ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  {selectAll ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {playlistInfo.videos.map((video, i) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => toggleVideo(i)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      selectedVideos.has(i)
                        ? "border-purple-500/30 bg-purple-500/5"
                        : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="shrink-0">
                      {selectedVideos.has(i) ? (
                        <CheckSquare className="w-5 h-5 text-purple-400" />
                      ) : (
                        <Square className="w-5 h-5 text-zinc-600" />
                      )}
                    </div>
                    <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                      <img src={video.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{video.title}</p>
                      <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">{video.duration}</p>
                    </div>
                    <div className="shrink-0">
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <button
                onClick={handleDownload}
                disabled={batchDownloading || selectedVideos.size === 0}
                className={cn(
                  "w-full h-14 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 transition-all",
                  "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "shadow-lg shadow-purple-500/20",
                )}
              >
                {batchDownloading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                {batchDownloading ? "Downloading..." : `Download Selected (${selectedVideos.size})`}
              </button>
            </motion.div>
          </>
        )}

        <AnimatePresence>
          {showProgressModal && batchProgress && (
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
                  <h3 className="text-lg font-semibold">Playlist Download</h3>
                  {batchProgress.status === "complete" && (
                    <button onClick={() => setShowProgressModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                      <X className="w-4 h-4 text-zinc-400" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Video {batchProgress.current} of {batchProgress.total}</span>
                    <span className="text-zinc-500 truncate max-w-[140px] sm:max-w-[200px]">{batchProgress.videoTitle}</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${batchProgress.percent}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {batchProgress.status === "downloading" || batchProgress.status === "starting" ? (
                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                      ) : batchProgress.status === "complete" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-zinc-400" />
                      )}
                      <span className="text-sm font-medium text-zinc-300">
                        {batchProgress.status === "complete" ? "Complete" : "Downloading..."}
                      </span>
                    </div>
                    {batchProgress.status === "downloading" && (
                      <span className="text-lg font-bold tabular-nums text-white">{batchProgress.percent}%</span>
                    )}
                  </div>
                </div>

                {batchProgress.status === "complete" && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowProgressModal(false)}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Done
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}