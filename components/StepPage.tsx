"use client"

interface StepPageProps {
  title: string
  children: React.ReactNode
  onContinue?: () => void
  isLoading?: boolean
  isContinueDisabled?: boolean
  continueLabel?: string
  continueDisabled?: boolean
}

export default function StepPage({
  title,
  children,
  onContinue,
  isLoading,
  isContinueDisabled,
  continueLabel,
  continueDisabled,
}: StepPageProps) {
  const disabled = isContinueDisabled ?? continueDisabled ?? false
  const loading = isLoading ?? false
  const buttonLabel = loading ? "提交中..." : (continueLabel ?? "继续")

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-6">
      <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">{title}</h1>

      <div className="flex-1">{children}</div>

      {onContinue && (
        <div className="mt-6">
          <button
            onClick={onContinue}
            disabled={disabled || loading}
            aria-label={buttonLabel}
            className="w-full rounded-2xl bg-blue-500 py-4 text-lg font-semibold text-white transition-all hover:bg-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {buttonLabel}
              </span>
            ) : (
              buttonLabel
            )}
          </button>
        </div>
      )}
    </main>
  )
}
