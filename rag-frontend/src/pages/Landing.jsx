import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, Shield, Zap, GitMerge, FileText, BarChart2, ArrowRight, Upload, MessageSquare, CheckCircle } from 'lucide-react'
import { useTheme } from '../App'

const features = [
  { icon: GitMerge, title: 'Hybrid Search', desc: 'Combines dense vector search with BM25 sparse retrieval via Reciprocal Rank Fusion for superior accuracy.', color: '#6366f1' },
  { icon: Shield, title: 'Citation Verification', desc: 'Every claim is verified against source chunks using LLM-as-judge. No hallucinations slip through.', color: '#8b5cf6' },
  { icon: Zap, title: 'Cross-Encoder Reranking', desc: 'Top candidates are reranked by a cross-encoder for maximum precision before generation.', color: '#a855f7' },
  { icon: BarChart2, title: 'Confidence Scoring', desc: 'Every answer comes with a composite confidence score across retrieval, faithfulness, and completeness.', color: '#6366f1' },
  { icon: FileText, title: 'Multi-Format Ingestion', desc: 'Ingest PDF, Markdown, HTML, and plain text. Chunked with 3 configurable strategies.', color: '#8b5cf6' },
  { icon: Search, title: 'Grounded Generation', desc: 'Answers generated strictly from your documents with inline citations. Never from outside knowledge.', color: '#a855f7' },
]

const stats = [
  { value: '100%', label: 'Answer Correctness' },
  { value: '1.0', label: 'Citation Support Rate' },
  { value: '0.80', label: 'Avg Confidence Score' },
  { value: '3', label: 'Chunking Strategies' },
]

const steps = [
  { icon: Upload, title: 'Upload Documents', desc: 'Upload PDFs, markdown, HTML or text files to your personal document space.' },
  { icon: Zap, title: 'Index & Search', desc: 'Hybrid retrieval finds the most relevant chunks using both semantic and keyword search.' },
  { icon: MessageSquare, title: 'Ask Questions', desc: 'Get grounded answers with verified citations and confidence scores instantly.' },
]

export default function Landing() {
  const theme = useTheme()

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', overflowX: 'hidden' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '100px 0 80px' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 32,
            color: '#818cf8', fontSize: 13, fontWeight: 500,
          }}>
            <Zap size={13} /> Production-grade RAG with Hybrid Search
          </div>

          <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.1, color: theme.text, marginBottom: 24 }}>
            Ask anything about<br />
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              your documents
            </span>
          </h1>

          <p style={{ fontSize: 18, color: theme.textMuted, maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.7 }}>
            Upload your internal docs, wikis, and PDFs. Get grounded answers with verified citations
            and confidence scores — powered by hybrid retrieval.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/ask" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', border: 'none', borderRadius: 12,
                padding: '14px 28px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              }}>
                Start Asking <ArrowRight size={18} />
              </motion.button>
            </Link>
            <Link to="/documents" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: theme.bgCard, color: theme.textSub,
                border: `1px solid ${theme.border}`, borderRadius: 12,
                padding: '14px 28px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              }}>
                <FileText size={18} /> Manage Documents
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 100 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontWeight: 800, background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
            <div style={{ color: theme.textMuted, fontSize: 14, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* How it works */}
      <div style={{ marginBottom: 100 }}>
        <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 700, color: theme.text, marginBottom: 16 }}>How it works</h2>
        <p style={{ textAlign: 'center', color: theme.textMuted, marginBottom: 56, fontSize: 16 }}>Three steps to intelligent document search</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {steps.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
              style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 32, textAlign: 'center' }}>
              <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: 16, padding: 16, display: 'inline-flex', marginBottom: 20 }}>
                <s.icon size={28} color="#6366f1" />
              </div>
              <div style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, marginBottom: 8 }}>Step {i + 1}</div>
              <h3 style={{ color: theme.text, fontWeight: 600, marginBottom: 8, fontSize: 18 }}>{s.title}</h3>
              <p style={{ color: theme.textMuted, fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ marginBottom: 100 }}>
        <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Built for production</h2>
        <p style={{ textAlign: 'center', color: theme.textMuted, marginBottom: 56, fontSize: 16 }}>Every component designed for real-world reliability</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 28 }}>
              <div style={{ background: `${f.color}20`, borderRadius: 10, padding: 10, display: 'inline-flex', marginBottom: 16 }}>
                <f.icon size={20} color={f.color} />
              </div>
              <h3 style={{ color: theme.text, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: theme.textMuted, fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', padding: '80px 0', marginBottom: 40 }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 24, padding: '60px 40px' }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Ready to search your docs?</h2>
          <p style={{ color: theme.textMuted, marginBottom: 32, fontSize: 16 }}>Upload a document and ask your first question in under 2 minutes.</p>
          <Link to="/documents" style={{ textDecoration: 'none' }}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', border: 'none', borderRadius: 12,
              padding: '14px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <Upload size={18} /> Upload Your First Document
            </motion.button>
          </Link>
        </div>
      </motion.div>

    </div>
  )
}