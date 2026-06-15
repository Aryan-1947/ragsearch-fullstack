import { useAuth0 } from '@auth0/auth0-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Send, ChevronDown, ChevronUp, CheckCircle, XCircle, Loader } from 'lucide-react'
import { askQuestion } from '../lib/api'
import { useTheme } from '../App'

const gradeColor = { HIGH: '#22c55e', MEDIUM: '#f59e0b', LOW: '#ef4444' }

export default function Ask() {
  const { user } = useAuth0()  
  const theme = useTheme()
  const [query, setQuery] = useState(() => sessionStorage.getItem('last_query') || '')
  const [mode, setMode] = useState('hybrid')
  const [reranker, setReranker] = useState(true)
  const [verify, setVerify] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(() => {
  const saved = sessionStorage.getItem('last_result')
  return saved ? JSON.parse(saved) : null
})
  const [error, setError] = useState(null)
  const [openChunk, setOpenChunk] = useState(null)
  

  const handleAsk = async () => {
  if (!query.trim()) return
  setLoading(true); setError(null); setResult(null); setOpenChunk(null)
  sessionStorage.setItem('last_query', query)
  try {
    const data = await askQuestion({
      question: query, mode,
      use_reranker: reranker,
      verify_citations: verify
    }, user?.sub)
    setResult(data)
    sessionStorage.setItem('last_result', JSON.stringify(data))
  } catch {
    setError('Failed to get answer. Is the API running on port 8000?')
  } finally { setLoading(false) }
}

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px', overflowX: 'hidden' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: theme.text, marginBottom: 8 }}>Ask your documents</h1>
        <p style={{ color: theme.textMuted, marginBottom: 40 }}>Get grounded answers with verified citations from your indexed documents.</p>

        {/* Settings */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {['hybrid', 'dense', 'sparse'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              border: `1px solid ${mode === m ? '#6366f1' : theme.border}`,
              background: mode === m ? 'rgba(99,102,241,0.15)' : theme.bgCard,
              color: mode === m ? '#818cf8' : theme.textMuted,
            }}>{m}</button>
          ))}
          <button onClick={() => setReranker(!reranker)} style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            border: `1px solid ${reranker ? '#8b5cf6' : theme.border}`,
            background: reranker ? 'rgba(139,92,246,0.15)' : theme.bgCard,
            color: reranker ? '#a78bfa' : theme.textMuted,
          }}>Reranker {reranker ? 'ON' : 'OFF'}</button>
          <button onClick={() => setVerify(!verify)} style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            border: `1px solid ${verify ? '#22c55e' : theme.border}`,
            background: verify ? 'rgba(34,197,94,0.1)' : theme.bgCard,
            color: verify ? '#4ade80' : theme.textMuted,
          }}>Verify Citations {verify ? 'ON' : 'OFF'}</button>
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder="e.g. What is multi-head attention?"
              style={{
                width: '100%', padding: '14px 16px 14px 46px',
                background: theme.bgCard, border: `1px solid ${theme.border}`,
                borderRadius: 12, color: theme.text, fontSize: 15,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleAsk} disabled={loading} style={{
              padding: '14px 24px', borderRadius: 12, border: 'none',
              background: loading ? '#334155' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600,
            }}>
            {loading ? <Loader size={18} /> : <Send size={18} />}
            {loading ? 'Thinking...' : 'Ask'}
          </motion.button>
        </div>

        {/* Tip */}
        <div style={{ background: 'rgba(99,102,241,0.05)', border: `1px solid rgba(99,102,241,0.15)`, borderRadius: 12, padding: '12px 16px', marginBottom: 32, fontSize: 13, color: theme.textMuted }}>
          💡 <strong style={{ color: '#818cf8' }}>Try asking:</strong> "What is the transformer architecture?" · "How do I install FastAPI?" · "What problem does attention solve?"
        </div>

        {error && (
          <div style={{ padding: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#f87171', marginBottom: 24 }}>
            {error}
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Answer */}
              <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 28, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ color: theme.textMuted, fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>Answer</span>
                  <span style={{
                    padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                    background: `${gradeColor[result.confidence.grade]}20`,
                    color: gradeColor[result.confidence.grade],
                    border: `1px solid ${gradeColor[result.confidence.grade]}40`,
                  }}>{result.confidence.grade} · {result.confidence.composite}</span>
                </div>
                <p style={{ color: theme.text, fontSize: 16, lineHeight: 1.8 }}>{result.answer}</p>
              </div>

              {/* Confidence */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Retrieval', value: result.confidence.retrieval_confidence },
                  { label: 'Citation Support', value: result.confidence.citation_support_rate },
                  { label: 'Completeness', value: `${result.confidence.completeness}/10` },
                  { label: 'Groundedness', value: `${result.confidence.groundedness}/10` },
                ].map((m, i) => (
                  <div key={i} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, padding: '16px 20px' }}>
                    <div style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4 }}>{m.label}</div>
                    <div style={{ color: theme.text, fontWeight: 700, fontSize: 20 }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Citations */}
              {result.citations?.length > 0 && (
                <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
                  <h3 style={{ color: theme.textSub, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Citation Verification</h3>
                  {result.citations.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                      {c.supported ? <CheckCircle size={18} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} /> : <XCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />}
                      <div>
                        <p style={{ color: theme.text, fontSize: 14 }}>{c.claim}</p>
                        <p style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>Citations: [{c.citations?.join(', ')}]</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sources */}
              <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24 }}>
                <h3 style={{ color: theme.textSub, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Source Chunks</h3>
                {result.sources.map((s, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <button onClick={() => setOpenChunk(openChunk === i ? null : i)} style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: theme.bgCard, border: `1px solid ${theme.border}`,
                      borderRadius: 10, padding: '12px 16px', cursor: 'pointer', color: theme.textSub,
                    }}>
                      <span style={{ fontSize: 14 }}>[{s.index}] {s.filename} · Rerank: {s.rerank_score}</span>
                      {openChunk === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <AnimatePresence>
                      {openChunk === i && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                          <div style={{ padding: '12px 16px', background: theme.bgCard, border: `1px solid ${theme.border}`, borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
                            <p style={{ color: theme.textMuted, fontSize: 13, lineHeight: 1.7 }}>{s.preview}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}