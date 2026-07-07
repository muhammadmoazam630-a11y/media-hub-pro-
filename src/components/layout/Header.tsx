"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Download, Moon, Sun, Settings, Clipboard, Clock, Heart, Menu, X, ListMusic } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDownloadStore } from "@/store/download"
import { useTheme } from "@/components/layout/ThemeProvider"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/playlist", label: "Playlists" },
  { href: "/history", label: "History" },
  { href: "/favorites", label: "Favorites" },
]

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const downloads = useDownloadStore((s) => s.downloads)
  const [scrolled, setScrolled] = useState(false)
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && /^https?:\/\/.+/.test(text)) {
        setClipboardUrl(text)
        window.open(`/analyze?url=${encodeURIComponent(text)}`, "_self")
      }
    } catch {
      // Clipboard read not supported or permission denied
    }
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/70 dark:bg-[#0a0a0f]/70 backdrop-blur-xl border-b border-white/20 dark:border-white/10 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Download className="h-6 w-6 text-purple-500" />
          <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-xl font-bold text-transparent">
            DC MOAZAM
          </span>
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {link.href === "/history" && <Clock className="h-3.5 w-3.5" />}
              {link.href === "/favorites" && <Heart className="h-3.5 w-3.5" />}
              {link.href === "/playlist" && <ListMusic className="h-3.5 w-3.5" />}
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex sm:hidden h-12 w-12 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-white/10"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePasteFromClipboard}
            className="flex h-12 sm:h-10 w-12 sm:w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
            aria-label="Paste from clipboard"
            title={clipboardUrl ?? "Paste URL from clipboard"}
          >
            <Clipboard className="h-4 w-4" />
          </button>

          <button
            onClick={toggleTheme}
            className="flex h-12 sm:h-10 w-12 sm:w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Link
            href="/settings"
            className="relative flex h-12 sm:h-10 w-12 sm:w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
            {downloads.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white">
                {downloads.length > 99 ? "99+" : downloads.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#0a0a0f]/95 backdrop-blur-2xl sm:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-medium text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.href === "/history" && <Clock className="h-4 w-4" />}
                {link.href === "/favorites" && <Heart className="h-4 w-4" />}
                {link.href === "/playlist" && <ListMusic className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
