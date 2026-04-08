export default function LoadingSpinner({ size = 'md', color = 'blue' }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10', xl: 'w-16 h-16' }
  const borderMap = { sm: 'border-2', md: 'border-2', lg: 'border-3', xl: 'border-4' }
  const colorMap = {
    blue: 'border-blue-600 border-t-transparent',
    green: 'border-green-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent',
  }

  return (
    <div className={`${sizeMap[size]} ${borderMap[size]} ${colorMap[color]} rounded-full animate-spin`} />
  )
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card p-6 space-y-3 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mt-4"></div>
    </div>
  )
}
