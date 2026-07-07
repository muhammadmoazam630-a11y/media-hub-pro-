"use client"

import { Heart, Trash2, ArrowLeft, Search } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useFavoritesStore } from "@/store/favorites"
import { Button } from "@/components/ui/Button"

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavoritesStore()

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/10 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-2xl font-bold">Favorites</h1>
            </div>
            <p className="text-sm text-zinc-500 ml-11">
              {favorites.length} {favorites.length === 1 ? "item" : "items"} saved
            </p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-24 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <Heart className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-sm">
              Save your favorite media for quick access later. Click the heart icon on any media result.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl font-medium text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/20"
            >
              <Search className="h-4 w-4" />
              Browse media
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {favorites.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 hover:border-purple-500/30 hover:bg-white/[0.05]"
              >
                <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-zinc-800">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                <div className="p-4">
                  <h3 className="truncate text-sm font-medium mb-1">{item.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 mb-3">
                    {item.creator && <span>{item.creator}</span>}
                    <span>{item.duration}</span>
                    <span>{item.resolution}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeFavorite(item.id)}
                      className="flex-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
