"use client"

import { create } from "zustand"
import type { DownloadItem } from "@/lib/types"

interface DownloadStore {
  downloads: DownloadItem[]
  addDownload: (item: DownloadItem) => void
  updateProgress: (id: string, progress: Partial<DownloadItem["progress"]>) => void
  removeDownload: (id: string) => void
  clearCompleted: () => void
}

export const useDownloadStore = create<DownloadStore>((set) => ({
  downloads: [],
  addDownload: (item) =>
    set((state) => ({ downloads: [item, ...state.downloads] })),
  updateProgress: (id, progress) =>
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === id ? { ...d, progress: { ...d.progress, ...progress } } : d
      ),
    })),
  removeDownload: (id) =>
    set((state) => ({
      downloads: state.downloads.filter((d) => d.id !== id),
    })),
  clearCompleted: () =>
    set((state) => ({
      downloads: state.downloads.filter((d) => d.progress.status !== "complete"),
    })),
}))
