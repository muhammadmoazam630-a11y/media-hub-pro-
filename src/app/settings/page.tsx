"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Download,
  FolderOpen,
  Monitor,
  HardDrive,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const downloadDir = `C:\\Users\\DELL\\Downloads\\MediaHub Downloads`

interface SettingsField {
  label: string
  value: string | boolean
  type: "path" | "toggle" | "select"
  options?: string[]
}

interface SettingsSection {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  fields: SettingsField[]
}

const settingsSections: SettingsSection[] = [
  {
    id: "general",
    icon: Monitor,
    label: "General",
    fields: [
      { label: "Default Download Location", value: downloadDir, type: "path" },
      { label: "Auto-start Downloads", value: true, type: "toggle" },
      { label: "Show Notifications", value: true, type: "toggle" },
    ],
  },
  {
    id: "downloads",
    icon: Download,
    label: "Downloads",
    fields: [
      { label: "Max Concurrent Downloads", value: "3", type: "select", options: ["1", "2", "3", "5"] },
      { label: "Default Video Quality", value: "1080p", type: "select", options: ["144p", "360p", "480p", "720p", "1080p", "4K"] },
      { label: "Preferred Format", value: "MP4", type: "select", options: ["MP4", "WebM", "MKV"] },
    ],
  },
  {
    id: "storage",
    icon: HardDrive,
    label: "Storage",
    fields: [
      { label: "Download Location", value: downloadDir, type: "path" },
      { label: "Auto-clean Completed Downloads", value: false, type: "toggle" },
    ],
  },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general")

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-zinc-400 mb-8">Configure your download preferences</p>
        </motion.div>

        <div className="flex gap-8 flex-col lg:flex-row">
          <div className="lg:w-56 shrink-0">
            <motion.nav
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="hidden lg:flex lg:flex-col gap-1"
            >
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    activeSection === section.id
                      ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-white/5",
                  )}
                >
                  <section.icon className="w-5 h-5" />
                  {section.label}
                </button>
              ))}
            </motion.nav>

            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#121218] px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50 lg:hidden"
            >
              {settingsSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>
          </div>

          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 space-y-4"
          >
            {settingsSections
              .find((s) => s.id === activeSection)
              ?.fields.map((field) => (
                <div
                  key={field.label}
                  className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"
                >
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {field.label}
                  </label>
                  {field.type === "path" && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-300">
                      <FolderOpen className="w-4 h-4 shrink-0 text-purple-400" />
                      <span className="truncate">{field.value as string}</span>
                    </div>
                  )}
                  {field.type === "toggle" && (
                    <div
                      className={cn(
                        "relative w-14 h-8 rounded-full transition-colors cursor-pointer",
                        field.value ? "bg-purple-500" : "bg-white/20",
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-1 w-6 h-6 rounded-full bg-white transition-transform shadow-md",
                          field.value ? "translate-x-7" : "translate-x-1",
                        )}
                      />
                    </div>
                  )}
                  {field.type === "select" && (
                    <select className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50">
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
