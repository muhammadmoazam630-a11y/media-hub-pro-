"use client"

import { motion } from "framer-motion"
import { Film, Music } from "lucide-react"
import { cn, formatBytes } from "@/lib/utils"
import type { Format } from "@/lib/types"

interface FormatSelectorProps {
  formats: Format[]
  selectedFormat: Format | null
  onSelect: (format: Format) => void
}

function FormatCard({
  format,
  isSelected,
  onSelect,
  index,
}: {
  format: Format
  isSelected: boolean
  onSelect: () => void
  index: number
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onSelect}
      className={cn(
        "relative text-left w-full p-4 rounded-xl border transition-all duration-200",
        "hover:bg-white/[0.06] backdrop-blur-sm",
        isSelected
          ? "border-purple-500 bg-purple-500/10 shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]"
          : "border-white/10 bg-white/[0.02] hover:border-white/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              "shrink-0 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider",
              isSelected ? "bg-purple-500 text-white" : "bg-white/10 text-zinc-300",
            )}
          >
            {format.ext}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {format.resolution && (
                <div className="text-sm font-medium truncate">{format.resolution}</div>
              )}
              {format.fps && format.fps >= 60 && (
                <span className="shrink-0 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold tracking-wider">
                  {format.fps}FPS
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-500 truncate">
              {!format.audioOnly && format.vcodec && <span>{format.vcodec}</span>}
              {!format.audioOnly && format.vcodec && format.acodec && <span> / </span>}
              {format.acodec && !format.audioOnly && <span>{format.acodec}</span>}
              {format.audioOnly && format.acodec && <span>{format.acodec}</span>}
              {format.fps && <span> @ {format.fps}fps</span>}
            </div>
          </div>
        </div>
        <span className="shrink-0 text-sm font-medium text-zinc-300">{format.size}</span>
      </div>
    </motion.button>
  )
}

export default function FormatSelector({ formats, selectedFormat, onSelect }: FormatSelectorProps) {
  const videoFormats = formats.filter((f) => !f.audioOnly)
  const audioFormats = formats.filter((f) => f.audioOnly)

  return (
    <div className="space-y-6">
      {videoFormats.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Film className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Video Formats
            </h3>
            <span className="text-xs text-zinc-600">({videoFormats.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {videoFormats.map((f, i) => (
              <FormatCard
                key={f.id}
                format={f}
                isSelected={selectedFormat?.id === f.id}
                onSelect={() => onSelect(f)}
                index={i}
              />
            ))}
          </div>
        </div>
      )}

      {audioFormats.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Music className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Audio Formats
            </h3>
            <span className="text-xs text-zinc-600">({audioFormats.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {audioFormats.map((f, i) => (
              <FormatCard
                key={f.id}
                format={f}
                isSelected={selectedFormat?.id === f.id}
                onSelect={() => onSelect(f)}
                index={i}
              />
            ))}
          </div>
        </div>
      )}

      {formats.length === 0 && (
        <div className="text-center py-8 text-zinc-500 text-sm">No formats available</div>
      )}
    </div>
  )
}
