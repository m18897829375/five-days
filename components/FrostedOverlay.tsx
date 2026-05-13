import { cn } from "@/lib/utils"

interface FrostedOverlayProps {
  children?: React.ReactNode
  title: string
  showCta?: boolean
  ctaText?: string
  onCtaClick?: () => void
  className?: string
}

export default function FrostedOverlay({
  children,
  title,
  showCta = false,
  ctaText = "解锁完整方案 — ¥99",
  onCtaClick,
  className,
}: FrostedOverlayProps) {
  return (
    <div className={cn("relative rounded-xl overflow-hidden", className)}>
      {children}

      <div className="absolute inset-0 backdrop-blur-md bg-white/60 flex flex-col items-center justify-center p-6">
        <span className="text-3xl mb-3" role="img" aria-label="locked">
          🔒
        </span>
        <p className="text-sm text-gray-600 font-medium text-center">{title}</p>
        {showCta && (
          <button
            onClick={onCtaClick}
            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold rounded-full text-sm shadow-lg hover:from-amber-500 hover:to-orange-600 transition-all duration-200"
          >
            {ctaText}
          </button>
        )}
      </div>
    </div>
  )
}
