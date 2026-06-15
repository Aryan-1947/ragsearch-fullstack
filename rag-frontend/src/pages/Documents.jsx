import { useAuth0 } from '@auth0/auth0-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, RefreshCw, CheckCircle, Loader, File, Info } from 'lucide-react'
import { getDocuments, getStats, uploadDocument, ingestDocuments } from '../lib/api'
import { useTheme } from '../App'

export default function Documents() {
  const theme = useTheme()
  const { user } = useAuth0() 
  const [docs, setDocs] = useState([])
  const [stats, setStats] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [ingesting, setIngesting] = useState(false)
  const [message, setMessage] = useState(null)
  const [strategy, setStrategy] = useState('recursive')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)  // 👈 added

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const load = async () => {
    try {
      const [d, s] = await Promise.all([getDocuments(user?.sub), getStats(user?.sub)])
      setDocs(d.documents); setStats(s)
    } catch {}
  }

  useEffect(() => { load() }, [])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true); setMessage(null)
    try {
      await uploadDocument(file, user?.sub)
      setMessage({ type: 'success', text: `✅ Uploaded: ${file.name} — now click Run Ingestion to index it.` })
      load()
    } catch { setMessage({ type: 'error', text: '❌ Upload failed' }) }
    finally { setUploading(false) }
  }

  const handleIngest = async () => {
    setIngesting(true); setMessage(null)
    try {
      const r = await ingestDocuments(strategy, user?.sub)
      const chunks = r.chunks ?? r.chroma_stats?.total_chunks ?? '?'
      const docCount = r.documents ?? '?'
      setMessage({ type: 'success', text: `✅ Ingested ${chunks} chunks from ${docCount} documents` })
      load()
    } catch { setMessage({ type: 'error', text: '❌ Ingestion failed — check API logs' }) }
    finally { setIngesting(false) }
  }

  const extColor = { pdf: '#ef4444', md: '#6366f1', txt: '#22c55e', html: '#f59e0b' }
  const strategyInfo = {
    fixed: 'Cuts every 500 chars. Fast, simple.',
    recursive: 'Splits on paragraphs/sentences. Best for most docs. ✅ Recommended',
    semantic: 'AI-detected topic boundaries. Slow, uses many API calls.',
  }

  return (
    // ✅ outer wrapper restored exactly as original
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: theme.text, marginBottom: 8 }}>Documents</h1>
        <p style={{ color: theme.textMuted, marginBottom: 40 }}>Upload and manage your document corpus. Supports PDF, Markdown, HTML, and TXT.</p>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
            <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: '20px 28px' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#818cf8' }}>{stats.total_chunks}</div>
              <div style={{ color: theme.textMuted, fontSize: 13 }}>Indexed Chunks</div>
            </div>
            <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 12, padding: '20px 28px' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#a78bfa' }}>{docs.length}</div>
              <div style={{ color: theme.textMuted, fontSize: 13 }}>Documents</div>
            </div>
          </div>
        )}

        {/* Upload + Ingest — only gridTemplateColumns changes based on isMobile */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',  // 👈 only change
          gap: 20, 
          marginBottom: 32 
        }}>
          <div style={{ background: theme.bgCard, border: `2px dashed ${theme.border}`, borderRadius: 16, padding: 32, textAlign: 'center' }}>
            <Upload size={32} color="#475569" style={{ marginBottom: 12 }} />
            <p style={{ color: theme.textMuted, marginBottom: 6, fontSize: 14 }}>Upload PDF, MD, TXT, or HTML</p>
            <p style={{ color: theme.textMuted, fontSize: 12, marginBottom: 16 }}>After uploading, run ingestion to index it.</p>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              color: '#818cf8', padding: '10px 20px', borderRadius: 10,
              cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14,
            }}>
              {uploading ? <Loader size={16} /> : <Upload size={16} />}
              {uploading ? 'Uploading...' : 'Choose File'}
              <input type="file" accept=".pdf,.md,.txt,.html" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>

          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 32 }}>
            <h3 style={{ color: theme.text, fontWeight: 600, marginBottom: 8 }}>Re-index Documents</h3>
            <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 20 }}>Rebuild the search index with your chosen chunking strategy.</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              {['fixed', 'recursive', 'semantic'].map(s => (
                <button key={s} onClick={() => setStrategy(s)} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: `1px solid ${strategy === s ? '#6366f1' : theme.border}`,
                  background: strategy === s ? 'rgba(99,102,241,0.15)' : theme.bgCard,
                  color: strategy === s ? '#818cf8' : theme.textMuted,
                }}>{s}</button>
              ))}
            </div>
            <p style={{ color: theme.textMuted, fontSize: 12, marginBottom: 16, display: 'flex', gap: 6, alignItems: 'center' }}>
              <Info size={12} /> {strategyInfo[strategy]}
            </p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleIngest} disabled={ingesting} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: ingesting ? '#334155' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', border: 'none', borderRadius: 10,
                padding: '10px 20px', cursor: ingesting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14,
              }}>
              {ingesting ? <Loader size={16} /> : <RefreshCw size={16} />}
              {ingesting ? 'Indexing...' : 'Run Ingestion'}
            </motion.button>
          </div>
        </div>

        {message && (
          <div style={{
            padding: 14, borderRadius: 10, marginBottom: 24, fontSize: 14,
            background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: message.type === 'success' ? '#4ade80' : '#f87171',
          }}>{message.text}</div>
        )}

        <h2 style={{ color: theme.textSub, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Indexed Documents</h2>
        {docs.length === 0
          ? <p style={{ color: '#475569', textAlign: 'center', padding: 40 }}>No documents yet. Upload one above!</p>
          : docs.map((d, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, marginBottom: 8 }}>
              <div style={{ background: `${extColor[d.type] || '#6366f1'}20`, borderRadius: 8, padding: 8 }}>
                <File size={16} color={extColor[d.type] || '#6366f1'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: theme.text, fontWeight: 500, fontSize: 14 }}>{d.filename}</div>
                <div style={{ color: '#475569', fontSize: 12 }}>{d.size_kb} KB · {d.type.toUpperCase()}</div>
              </div>
              <CheckCircle size={16} color="#22c55e" />
            </motion.div>
          ))
        }
      </motion.div>
    </div>
  )
}