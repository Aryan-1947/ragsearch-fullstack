import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import {
  Search, Send, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  Loader2, Globe, SlidersHorizontal, RotateCcw,
} from 'lucide-react'
import { askQuestion, getSuggestions, webSearch } from '../lib/api'

const card = "rounded-xl border border-zinc-300 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 dark:shadow-none"
const STORAGE_KEY = 'ragsearch_ask_state'

const gradeStyle = {
  HIGH: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20',
  MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20',
  LOW: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20',
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ${
        checked ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'
      }`}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all duration-150"
        style={{ left: checked ? '18px' : '2px' }}
      />
    </button>
  )
}

export default function Ask() {
  const { user } = useAuth0()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('hybrid')
  const [reranker, setReranker] = useState(true)
  const [verify, setVerify] = useState(true)
  const [strictnessMode, setStrictnessMode] = useState('strict')
  const [configOpen, setConfigOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [openChunk, setOpenChunk] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [webResults, setWebResults] = useState(null)
  const [webLoading, setWebLoading] = useState(false)

  // Only restore the cached query/result if it belongs to the currently
  // logged-in user — fixes it showing a previous user's answer after
  // logout -> login as someone else.
  useEffect(() => {
    if (!user?.sub) return
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
      if (saved && saved.userId === user.sub) {
        setQuery(saved.query || '')
        setResult(saved.result || null)
      } else {
        sessionStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [user?.sub])

  useEffect(() => {
    if (user?.sub) {
      getSuggestions(user.sub).then(d => setSuggestions(d.suggestions || [])).catch(() => {})
    }
  }, [user])

  const persist = (nextQuery, nextResult) => {
    if (!user?.sub) return
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: user.sub, query: nextQuery, result: nextResult }))
  }

  const handleAsk = async () => {
    if (!query.trim()) return
    setLoading(true); setError(null); setResult(null); setOpenChunk(null); setWebResults(null)
    try {
      const data = await askQuestion({
        question: query,
        mode,
        use_reranker: reranker,
        verify_citations: verify,
        strictness_mode: strictnessMode,
      }, user?.sub)
      setResult(data)
      persist(query, data)
    } catch {
      setError('Failed to get answer. Is the API running?')
    } finally { setLoading(false) }
  }

  const handleNewQuestion = () => {
    setQuery('')
    setResult(null)
    setError(null)
    setWebResults(null)
    setOpenChunk(null)
    if (user?.sub) sessionStorage.removeItem(STORAGE_KEY)
  }

  const activeTokens = [mode, reranker ? 'rerank' : null, strictnessMode === 'strict' && verify ? 'verified' : null, strictnessMode].filter(Boolean)

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div className="mx-auto max-w-2xl text-center sm:mx-0 sm:text-left">
          <h1 className="text-[28px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Ask your documents</h1>
          <p className="mt-2 text-[14px] text-zinc-500">Grounded answers, verified citations.</p>
        </div>
        {result && (
          <button
            onClick={handleNewQuestion}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-[12.5px] font-medium text-zinc-600 transition-all duration-150 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
          >
            <RotateCcw size={13} /> New Question
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="relative mx-auto max-w-2xl">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          placeholder="Ask a question about your uploaded documents…"
          disabled={loading}
          className={`w-full rounded-xl border border-zinc-200 bg-white py-3.5 pl-11 text-[14px] text-zinc-900 outline-none transition-all duration-150 placeholder:text-zinc-400 focus:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-700 ${
            loading ? 'pr-32' : 'pr-20'
          }`}
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition-all duration-150 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {loading ? 'Thinking' : 'Ask'}
        </button>
      </div>

      {/* Active tokens + advanced trigger */}
      <div className="mx-auto mt-3 flex max-w-2xl items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {activeTokens.map(t => (
            <span key={t} className="rounded-md border border-zinc-200 bg-white/80 px-2 py-0.5 text-[11px] uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-500">
              {t}
            </span>
          ))}
        </div>
        <button
          onClick={() => setConfigOpen(!configOpen)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-medium text-zinc-500 transition-colors duration-150 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          <SlidersHorizontal size={13} />
          Advanced
          {configOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Advanced config */}
      {configOpen && (
        <div className={`${card} mx-auto mt-3 max-w-2xl p-5`}>
          <div className="mb-4">
            <div className="mb-2 text-[12.5px] font-medium text-zinc-600 dark:text-zinc-400">Retrieval Method</div>
            <div className="flex gap-1.5">
              {['hybrid', 'dense', 'sparse'].map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-medium capitalize transition-all duration-150 ${
                    mode === m
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                      : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2 text-[12.5px] font-medium text-zinc-600 dark:text-zinc-400">Grounding</div>
            <div className="flex gap-1.5">
              {[
                { v: 'strict', l: 'Strict (docs only)' },
                { v: 'balanced', l: 'Balanced (docs + AI)' },
              ].map(s => (
                <button
                  key={s.v}
                  onClick={() => setStrictnessMode(s.v)}
                  className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150 ${
                    strictnessMode === s.v
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                      : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                  }`}
                >
                  {s.l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <span className="text-[12.5px] text-zinc-600 dark:text-zinc-400">Cross-encoder reranker</span>
            <Toggle checked={reranker} onChange={v => { setReranker(v); setResult(null) }} />
          </div>

          {/* Verify Citations row only exists at all in Strict mode — removed
              entirely (not just disabled) when Balanced is selected, since it
              has no effect there. */}
          {strictnessMode === 'strict' && (
            <div className="flex items-center justify-between pt-3">
              <span className="text-[12.5px] text-zinc-600 dark:text-zinc-400">Verify citations</span>
              <Toggle checked={verify} onChange={setVerify} />
            </div>
          )}

          {strictnessMode === 'balanced' && (
            <p className="pt-3 text-[11.5px] leading-relaxed text-zinc-400 dark:text-zinc-600">
              Citation verification isn't available in Balanced mode — answers can include general knowledge that isn't tied to a specific document source.
            </p>
          )}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && !result && (
        <div className="mx-auto mt-6 max-w-2xl">
          <p className="mb-2.5 text-[12.5px] text-zinc-500">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setQuery(s)}
                className="rounded-full border border-zinc-200 bg-white/90 px-3 py-1.5 text-[12.5px] text-zinc-600 shadow-sm backdrop-blur-sm transition-all duration-150 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-8 space-y-3">
          <div className={`${card} p-6`}>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Answer</span>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${gradeStyle[result.confidence.grade]}`}>
                {result.confidence.grade} · {result.confidence.composite}
              </span>
            </div>
            <p className="text-[14.5px] leading-relaxed text-zinc-800 dark:text-zinc-200">{result.answer}</p>
            {result.strictness_mode === 'balanced' && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                Balanced mode — answer may include AI general knowledge beyond your documents.
              </div>
            )}
          </div>

          {/* Confidence metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Retrieval', value: result.confidence.retrieval_confidence },
              { label: 'Citation Support', value: result.confidence.citation_support_rate },
              { label: 'Completeness', value: `${result.confidence.completeness}/10` },
              { label: 'Groundedness', value: `${result.confidence.groundedness}/10` },
            ].map((m, i) => (
              <div key={i} className={`${card} p-4`}>
                <div className="mb-1 text-[11.5px] text-zinc-500">{m.label}</div>
                <div className="text-[18px] font-semibold text-zinc-900 dark:text-zinc-50">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Web search fallback */}
          <div>
            {!webResults && (
              <button
                onClick={async () => {
                  setWebLoading(true)
                  try {
                    const data = await webSearch(query, result.answer)
                    setWebResults(data.results)
                  } catch {} finally { setWebLoading(false) }
                }}
                disabled={webLoading}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-[13px] font-medium text-zinc-600 backdrop-blur-sm transition-all duration-150 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
              >
                {webLoading ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                {webLoading ? 'Searching web' : 'Learn More on Web'}
              </button>
            )}

            {webResults && webResults.length > 0 && (
              <div className={`${card} p-5`}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Web Results</span>
                  <button onClick={() => setWebResults(null)} className="text-[12px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200">
                    Hide
                  </button>
                </div>
                {webResults.map((r, i) => (
                  <div key={i} className={`pb-3 ${i < webResults.length - 1 ? 'mb-3 border-b border-zinc-200 dark:border-zinc-800' : ''}`}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[13.5px] font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                      {r.title}
                    </a>
                    <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{r.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Citation Verification + Source Chunks side-by-side */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {result.citations?.length > 0 && (
              <div className={`${card} p-5`}>
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Citation Verification</div>
                <div className="space-y-2.5">
                  {result.citations.map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      {c.supported
                        ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        : <XCircle size={14} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />}
                      <div className="text-[13px] text-zinc-600 dark:text-zinc-400">
                        {c.claim} <span className="text-[11px] text-zinc-400 dark:text-zinc-600">[{c.citations?.join(', ')}]</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={`${card} p-5`}>
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Source Chunks</div>
              <div className="space-y-1.5">
                {result.sources.map((s, i) => (
                  <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={() => setOpenChunk(openChunk === i ? null : i)}
                      className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
                    >
                      <span className="text-[12.5px] text-zinc-600 dark:text-zinc-400">
                        <span className="text-zinc-400 dark:text-zinc-600">[{s.index}]</span> {s.filename}
                        {reranker && s.rerank_score ? <span className="ml-2 text-[11px] text-zinc-400 dark:text-zinc-600">rerank {s.rerank_score}</span> : null}
                      </span>
                      {openChunk === i ? <ChevronUp size={13} className="text-zinc-400" /> : <ChevronDown size={13} className="text-zinc-400" />}
                    </button>
                    {openChunk === i && (
                      <div className="border-t border-zinc-200 px-3.5 py-3 text-[12.5px] leading-relaxed text-zinc-500 dark:border-zinc-800">
                        {s.preview}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}