"use client"

import { create } from "zustand"
import type { MediaInfo } from "@/lib/types"

interface FavoritesStore {
  favorites: MediaInfo[]
  addFavorite: (item: MediaInfo) => void
  removeFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: [],
  addFavorite: (item) =>
    set((state) => {
      if (state.favorites.some((f) => f.id === item.id)) return state
      return { favorites: [item, ...state.favorites] }
    }),
  removeFavorite: (id) =>
    set((state) => ({
      favorites: state.favorites.filter((f) => f.id !== id),
    })),
  isFavorite: (id) => get().favorites.some((f) => f.id === id),
}))
