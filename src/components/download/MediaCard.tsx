"use client"

import Image from "next/image"
import { Clock, Maximize2, HardDrive, Calendar, User } from "lucide-react"
import { cn, formatDuration } from "@/lib/utils"
import type { MediaInfo } from "@/lib/types"

interface MediaCardProps {
  mediaInfo: MediaInfo
}

export default function MediaCard({ mediaInfo }: MediaCardProps) {
  const { title, thumbnail, duration, durationSeconds, creator, uploadDate, resolution, fileSize } = mediaInfo

  const metaItems = [
    { icon: Clock, label: "Duration", value: duration || formatDuration(durationSeconds) },
    { icon: Maximize2, label: "Resolution", value: resolution },
    { icon: HardDrive, label: "File Size", value: fileSize },
    { icon: Calendar, label: "Uploaded", value: uploadDate },
  ]

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl transition-all duration-300 hover:border-purple-500/30 hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.2)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        <div className="relative aspect-video md:aspect-auto md:h-full min-h-[240px]">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-black/60 md:via-transparent md:to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            {duration || formatDuration(durationSeconds)}
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col justify-center">
          <h1 className="text-xl md:text-2xl font-bold leading-tight mb-4 line-clamp-2">
            {title}
          </h1>

          {creator && (
            <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
              <User className="w-4 h-4 text-purple-400" />
              <span>{creator}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {metaItems.map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white/[0.03] border border-white/5 p-3"
              >
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                  <item.icon className="w-3 h-3" />
                  {item.label}
                </div>
                <div className="text-sm font-medium truncate">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
