function ResultCard({ result }) {
  const isReal = result.verdict === "REAL"
  return (
    <div className={`rounded-xl border-2 p-6 mt-6 ${isReal ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-4xl font-bold ${isReal ? "text-green-600" : "text-red-600"}`}>
          {isReal ? "REAL" : "FAKE"}
        </span>
        <span className={`text-lg px-3 py-1 rounded-full font-medium ${isReal ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {result.confidence}% confident
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Visual score</p>
          <p className="text-2xl font-semibold text-gray-800">{result.visual_score}%</p>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${result.visual_score}%` }}/>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Audio score</p>
          <p className="text-2xl font-semibold text-gray-800">{result.audio_score}%</p>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${result.audio_score}%` }}/>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4 text-right">Analyzed in {result.time_taken}s</p>
    </div>
  )
}
export default ResultCard