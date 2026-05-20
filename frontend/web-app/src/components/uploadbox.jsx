import { useState } from "react"
import axios from "axios"

function UploadBox() {
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)
  const API = "http://localhost:8000"

  const handleFileSubmit = async () => {
    if (!file) return
    setLoading(true); setResult(null); setError(null)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await axios.post(`${API}/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      setResult(res.data)
    } catch (err) {
      const msg = err?.response?.data?.detail || "Upload failed."
      setError(msg)
    } finally { setLoading(false) }
  }

  const isReal = result?.verdict === "REAL" ||
                 result?.is_deepfake === false ||
                 result?.prediction === "real"

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>

      {/* Upload box */}
      <div
        style={{
          border: "2px dashed #d1d5db", borderRadius: 12,
          padding: 40, textAlign: "center", cursor: "pointer"
        }}
        onClick={() => document.getElementById("file-input").click()}>

        <input type="file" accept="video/*" id="file-input"
          style={{ display: "none" }}
          onChange={e => { setFile(e.target.files[0]); setResult(null); setError(null) }}/>

        <div style={{ fontSize: 32, color: "#9ca3af", marginBottom: 8 }}>↑</div>
        <p style={{ fontSize: 14, color: "#4b5563" }}>
          {file ? file.name : "Click to select a video file"}
        </p>
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
          MP4, MOV, AVI up to 100MB
        </p>

        {file && (
          <button
            onClick={e => { e.stopPropagation(); handleFileSubmit() }}
            disabled={loading}
            style={{
              marginTop: 16, background: "#3b82f6", color: "white",
              border: "none", borderRadius: 8, padding: "10px 24px",
              fontSize: 14, fontWeight: 500, cursor: "pointer"
            }}>
            {loading ? "Analyzing..." : "Analyze This File"}
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{
            width: 48, height: 48, border: "4px solid #bfdbfe",
            borderTopColor: "#3b82f6", borderRadius: "50%",
            animation: "spin 0.8s linear infinite", margin: "0 auto 12px"
          }}/>
          <p style={{ color: "#6b7280", fontSize: 14 }}>Analyzing video...</p>
          <p style={{ color: "#9ca3af", fontSize: 12 }}>Checking visual + audio signals</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 16, padding: 16, background: "#fef2f2",
          border: "1px solid #fecaca", borderRadius: 8,
          color: "#dc2626", fontSize: 14
        }}>{error}</div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          marginTop: 24, padding: 24, borderRadius: 12,
          border: `2px solid ${isReal ? "#4ade80" : "#f87171"}`,
          background: isReal ? "#f0fdf4" : "#fef2f2"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{
              fontSize: 36, fontWeight: 700,
              color: isReal ? "#16a34a" : "#dc2626"
            }}>
              {isReal ? "REAL" : "FAKE"}
            </span>
            {result.confidence && (
              <span style={{
                background: isReal ? "#dcfce7" : "#fee2e2",
                color: isReal ? "#15803d" : "#b91c1c",
                padding: "4px 12px", borderRadius: 20,
                fontSize: 14, fontWeight: 500
              }}>
                {Math.round(result.confidence)}% confident
              </span>
            )}
          </div>

          {/* Scores */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {result.visual_score !== undefined && (
              <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
                <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Visual score</p>
                <p style={{ fontSize: 24, fontWeight: 600 }}>{Math.round(result.visual_score)}%</p>
                <div style={{ background: "#f3f4f6", borderRadius: 99, height: 6, marginTop: 8 }}>
                  <div style={{ background: "#3b82f6", width: `${result.visual_score}%`, height: 6, borderRadius: 99 }}/>
                </div>
              </div>
            )}
            {result.audio_score !== undefined && (
              <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
                <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Audio score</p>
                <p style={{ fontSize: 24, fontWeight: 600 }}>{Math.round(result.audio_score)}%</p>
                <div style={{ background: "#f3f4f6", borderRadius: 99, height: 6, marginTop: 8 }}>
                  <div style={{ background: "#a855f7", width: `${result.audio_score}%`, height: 6, borderRadius: 99 }}/>
                </div>
              </div>
            )}
          </div>

          {/* Show full raw result for debugging */}
          <details style={{ marginTop: 16 }}>
            <summary style={{ fontSize: 12, color: "#9ca3af", cursor: "pointer" }}>
              Raw API response
            </summary>
            <pre style={{ fontSize: 11, color: "#6b7280", marginTop: 8, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}
export default UploadBox