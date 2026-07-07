import Link from "next/link"
import { Download } from "lucide-react"

const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0a0f]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-purple-500" />
          <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-lg font-bold text-transparent">
            DC MOAZAM
          </span>
        </div>

        <nav className="flex items-center gap-2 sm:gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-3 sm:py-2 text-sm text-gray-400 transition-colors hover:text-white rounded-lg hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} DC MOAZAM. All rights reserved.</p>
      </div>
    </footer>
  )
}
