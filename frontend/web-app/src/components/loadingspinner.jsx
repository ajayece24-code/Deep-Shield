function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"/>
      <p className="text-gray-500 text-sm">Analyzing video...</p>
      <p className="text-gray-400 text-xs">Checking visual + audio signals</p>
    </div>
  )
}
export default LoadingSpinner