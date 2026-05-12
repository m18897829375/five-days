export default function Loading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-4 py-8">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-sm text-gray-500">加载中...</p>
      </div>
    </div>
  )
}
