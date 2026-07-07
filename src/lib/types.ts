export interface MediaInfo {
  id: string
  title: string
  thumbnail: string
  duration: string
  durationSeconds: number
  creator: string
  uploadDate: string
  resolution: string
  fileSize: string
  formats: Format[]
  url: string
}

export interface Format {
  id: string
  label: string
  ext: string
  resolution?: string
  fps?: number
  size: string
  vcodec?: string
  acodec?: string
  audioOnly: boolean
  videoOnly: boolean
}

export interface DownloadProgress {
  percent: number
  speed: string
  eta: string
  status: "idle" | "downloading" | "processing" | "complete" | "error"
  filename?: string
  error?: string
  savePath?: string
}

export interface DownloadItem {
  id: string
  url: string
  title: string
  format: Format
  progress: DownloadProgress
  createdAt: string
  thumbnail?: string
}

export interface PlaylistVideo {
  id: string
  title: string
  url: string
  duration: string
  durationSeconds: number
  thumbnail: string
}

export interface PlaylistInfo {
  id: string
  title: string
  thumbnail: string
  channel: string
  videoCount: number
  videos: PlaylistVideo[]
  url: string
}

export interface AnalyticsEvent {
  type: string
  data: Record<string, unknown>
  timestamp: string
}
