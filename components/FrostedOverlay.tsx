interface FrostedOverlayProps {
  showCta?: boolean
  ctaText?: string
  onCtaClick?: () => void
  lockMessage?: string
}

export default function FrostedOverlay({
  showCta = false,
  ctaText = "解锁完整报告",
  onCtaClick,
  lockMessage = "解锁完整报告查看详细数据",
}: FrostedOverlayProps) {
  return (
    <div className="absolute inset-0 backdrop-blur-md bg-white/60 rounded-xl flex flex-col items-center justify-center z-10">
      <span className="text-4xl mb-3">🔒</span>
      <p className="text-gray-600 text-sm mb-3">{lockMessage}</p>
      {showCta && (
        <button
          onClick={onCtaClick}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
        >
          {ctaText}
        </button>
      )}
    </div>
  )
}
