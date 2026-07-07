"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Zap, Shield, Monitor, Music, Download, ArrowRight, ChevronRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"

const features = [
  { icon: Zap, title: "Fast", description: "High-speed downloads with multi-threaded support" },
  { icon: Shield, title: "Secure", description: "All downloads are encrypted and privacy-focused" },
  { icon: Monitor, title: "HD Support", description: "Download up to 4K resolution quality" },
  { icon: Music, title: "Audio Conversion", description: "Extract audio in MP3, AAC, FLAC and more" },
  { icon: Download, title: "No Installation", description: "Works directly in your browser, no setup needed" },
]

const trustedStats = [
  { label: "Downloads", value: "2M+" },
  { label: "Active Users", value: "50K+" },
  { label: "Uptime", value: "99.9%" },
  { label: "Formats", value: "12+" },
]

const steps = [
  { number: "01", title: "Paste", description: "Copy and paste any media URL into the input above" },
  { number: "02", title: "Analyze", description: "Our system scans and extracts all available formats" },
  { number: "03", title: "Download", description: "Pick your preferred format and download instantly" },
]

function FloatingOrbs() {
  return (
    <>
      <div className="absolute top-1/4 left-1/4 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute top-1/3 right-1/4 w-40 sm:w-64 md:w-80 h-40 sm:h-64 md:h-80 bg-blue-500/15 rounded-full blur-[100px] animate-pulse [animation-delay:1s]" />
      <div className="absolute bottom-1/4 left-1/3 w-36 sm:w-56 md:w-72 h-36 sm:h-56 md:h-72 bg-indigo-500/20 rounded-full blur-[110px] animate-pulse [animation-delay:2s]" />
    </>
  )
}

function FeatureCard({ icon: Icon, title, description, index }: { icon: typeof Zap; title: string; description: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group relative p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.06] transition-all duration-300 hover:border-purple-500/30 hover:shadow-[0_0_30px_-10px_rgba(139,92,246,0.3)]"
    >
      <div className="flex items-center gap-4 mb-3">
        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </motion.div>
  )
}

export default function Home() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [analyzing, setAnalyzing] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setAnalyzing(true)
    setAnalyzing(false)
    router.push(`/analyze?url=${encodeURIComponent(url.trim())}`)
  }

  function goToPlaylist() {
    router.push("/playlist")
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-32 overflow-hidden">
        <FloatingOrbs />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-blue-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-sm text-purple-300 mb-6">
              <Zap className="w-3.5 h-3.5" />
              Next-Gen Media Downloader
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-4">
              Download Any Media
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 text-transparent bg-clip-text">
                Instantly & Free
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
              Paste a URL and get any video or audio in your preferred format — no sign-up required.
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Media URL"
                className="w-full h-14 pl-12 pr-4 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl text-white placeholder-zinc-500 text-lg outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!url.trim() || analyzing}
              className={cn(
                "h-14 px-8 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all shrink-0",
                "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "shadow-lg shadow-purple-500/20",
              )}
            >
              {analyzing ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-6 flex items-center justify-center gap-2 text-sm text-zinc-500"
          >
            <span className="w-12 h-px bg-white/10" />
            <span>or</span>
            <span className="w-12 h-px bg-white/10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-6 flex justify-center"
          >
            <button
              onClick={goToPlaylist}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-purple-500/30 transition-all text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
              Download Playlists
            </button>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-32 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {features.map((f, i) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} index={i} />
          ))}
        </div>
      </section>

      <section className="relative z-10 px-4 pb-32 max-w-6xl mx-auto w-full text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-12"
        >
          Trusted by Creators Worldwide
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustedStats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm"
            >
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-zinc-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-4 pb-32 max-w-4xl mx-auto w-full">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-16"
        >
          How It Works
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="text-5xl font-bold bg-gradient-to-b from-purple-500/20 to-transparent text-transparent bg-clip-text mb-4">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{step.description}</p>
              {i < steps.length - 1 && (
                <ChevronRight className="hidden md:block absolute top-6 -right-6 w-5 h-5 text-zinc-600" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-4 pb-32 max-w-4xl mx-auto w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-600/10 via-blue-600/5 to-indigo-600/10 backdrop-blur-xl p-6 sm:p-12 md:p-16"
        >
          <FloatingOrbs />
          <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">
            Ready to Download?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto relative z-10">
            Millions of creators trust DC MOAZAM. Start downloading your favorite content now.
          </p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: "smooth" })
            }}
            className="inline-flex items-center gap-2 h-14 px-8 rounded-2xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/20"
          >
            Get Started <Download className="w-4 h-4" />
          </a>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-zinc-600">
        DC MOAZAM &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}
