import { motion } from 'framer-motion'
import { BarChart2, CheckCircle, TrendingUp, Award } from 'lucide-react'
import { useTheme } from '../App'

const results = [
  { id: 'q1', question: 'How do I install FastAPI?', correctness: 1.0, faithfulness: 1.0, retrieval: 1.0, confidence: 0.769, grade: 'HIGH' },
  { id: 'q2', question: 'How does FastAPI handle validation errors?', correctness: 1.0, faithfulness: 1.0, retrieval: 1.0, confidence: 0.796, grade: 'HIGH' },
  { id: 'q3', question: 'What is generated automatically at /docs?', correctness: 1.0, faithfulness: 0.0, retrieval: 0.0, confidence: 0.793, grade: 'HIGH' },
  { id: 'q4', question: 'How do I validate request data in FastAPI?', correctness: 1.0, faithfulness: 0.0, retrieval: 0.0, confidence: 0.808, grade: 'HIGH' },
  { id: 'q5', question: 'What HTTP status code for validation errors?', correctness: 1.0, faithfulness: 1.0, retrieval: 1.0, confidence: 0.844, grade: 'HIGH' },
  { id: 'q6', question: 'How do I return error responses?', correctness: 1.0, faithfulness: 1.0, retrieval: 1.0, confidence: 0.736, grade: 'MEDIUM' },
  { id: 'q7', question: 'What parameter types does FastAPI support?', correctness: 1.0, faithfulness: 0.0, retrieval: 0.0, confidence: 0.724, grade: 'MEDIUM' },
  { id: 'q8', question: 'What is the capital of France?', correctness: 1.0, faithfulness: 0.0, retrieval: 1.0, confidence: 0.475, grade: 'LOW' },
  { id: 'q9', question: 'Create first FastAPI app and handle errors?', correctness: 1.0, faithfulness: 0.67, retrieval: 0.33, confidence: 0.805, grade: 'HIGH' },
  { id: 'q10', question: 'What file do I create for a FastAPI app?', correctness: 1.0, faithfulness: 1.0, retrieval: 0.0, confidence: 0.724, grade: 'MEDIUM' },
]

const gradeColor = { HIGH: '#22c55e', MEDIUM: '#f59e0b', LOW: '#ef4444' }
const avg = (key) => (results.reduce((s, r) => s + r[key], 0) / results.length).toFixed(3)

export default function Evaluation() {
  const theme = useTheme()

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px', overflowX: 'hidden' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: theme.text, marginBottom: 8 }}>Evaluation Results</h1>
        <p style={{ color: theme.textMuted, marginBottom: 40 }}>Golden Q&A dataset — recursive chunking / hybrid retrieval mode.</p>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }}>
          {[
            { icon: Award, label: 'Correctness', value: '100%', color: '#22c55e' },
            { icon: CheckCircle, label: 'Citation Support', value: '1.0', color: '#6366f1' },
            { icon: TrendingUp, label: 'Avg Confidence', value: avg('confidence'), color: '#8b5cf6' },
            { icon: BarChart2, label: 'Avg Faithfulness', value: avg('faithfulness'), color: '#a855f7' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24 }}>
              <div style={{ background: `${s.color}20`, borderRadius: 10, padding: 10, display: 'inline-flex', marginBottom: 12 }}>
                <s.icon size={20} color={s.color} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${theme.border}` }}>
            <h2 style={{ color: theme.textSub, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Per-Question Breakdown</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Question', 'Correct', 'Faithful', 'Retrieval', 'Confidence', 'Grade'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', color: '#475569', fontSize: 12, fontWeight: 600, textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '12px 16px', color: theme.textSub, fontSize: 13, maxWidth: 280 }}>{r.question}</td>
                    <td style={{ padding: '12px 16px', color: r.correctness === 1 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{r.correctness.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', color: r.faithfulness > 0.5 ? '#22c55e' : r.faithfulness > 0 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{r.faithfulness.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', color: r.retrieval > 0.5 ? '#22c55e' : r.retrieval > 0 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{r.retrieval.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', color: theme.text, fontWeight: 600 }}>{r.confidence.toFixed(3)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                        background: `${gradeColor[r.grade]}20`, color: gradeColor[r.grade],
                        border: `1px solid ${gradeColor[r.grade]}40`,
                      }}>{r.grade}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  )
}