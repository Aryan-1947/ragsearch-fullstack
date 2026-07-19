# Aletheia — Hybrid RAG Search Engine

> Ask anything about your documents. Get grounded answers with verified citations and confidence scores.

**Live Demo:** [aletheia-engine.vercel.app](https://aletheia-engine.vercel.app)

---

## 🧠 What is this?

Aletheia lets you upload any document (PDF, Markdown, HTML, TXT) and ask natural language questions about it. Answers are grounded in your documents with inline citations, verified against source chunks, and scored for confidence.

Each user gets their own private, isolated document space via Google/GitHub OAuth.

---

## ✨ Features

- **Hybrid Search** — Dense vector search (ChromaDB) + BM25 sparse search combined via Reciprocal Rank Fusion
- **Cross-Encoder Reranking** — Top candidates reranked by an LLM-as-judge for maximum precision
- **Citation Verification** — Every claim checked against source chunks
- **Confidence Scoring** — Composite score across retrieval, faithfulness, and completeness
- **Dual Grounding Modes** — Strict (docs only) or Balanced (docs + general AI knowledge)
- **Web Search Fallback** — Pull in live, context-aware web results when your documents come up short
- **3 Chunking Strategies** — Fixed, Recursive (recommended), Semantic
- **Drag-and-Drop Uploads** — With automatic duplicate-file handling
- **Per-user Isolation** — Google/GitHub OAuth, each user's documents are private
- **Dark/Light Mode**

---

## 📊 Evaluation Results

Tested on a 10-question golden Q&A dataset (recursive chunking / hybrid retrieval mode, local embeddings).

| Metric | Score |
|---|---|
| Avg Correctness | 90.0% |
| Avg Faithfulness | 0.225 |
| Avg Retrieval Relevance | 0.233 |
| Avg Confidence | 0.644 |

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| LLM | Groq LLaMA-3.3-70b |
| Embeddings | Local (`sentence-transformers`, BAAI/bge-small-en-v1.5) |
| Vector Store | ChromaDB |
| Sparse Search | BM25 (rank-bm25) |
| Reranker | LLM-as-judge (Groq) |
| Backend | FastAPI + Python 3.11 |
| Frontend | React + Vite + Tailwind |
| Auth | Auth0 (Google + GitHub OAuth) |
| Deployment | Railway (backend) + Vercel (frontend) |
| Chunking | LangChain Text Splitters |

---

## 🚀 How to Use (Live)

1. Go to [aletheia-engine.vercel.app](https://aletheia-engine.vercel.app)
2. Log in with Google or GitHub
3. Go to **Documents** → upload a PDF/MD/TXT/HTML file (drag-and-drop supported)
4. Select a chunking strategy (recursive recommended for speed) → click **Run Ingestion**
5. Go to **Ask** → type your question, choose Strict or Balanced grounding
6. Get a grounded answer with verified citations and a confidence score

> ⚠️ **Note:** The backend runs on a free-tier trial instance with limited uptime — if the live demo is unresponsive, the hosting trial may have expired. The full pipeline runs reliably when self-hosted (see backend README for local setup).