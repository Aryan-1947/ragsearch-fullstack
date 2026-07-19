from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import shutil

from app.generation.rag_pipeline import ask
from app.ingestion.pipeline import ingest_documents
from app.ingestion.vector_store import get_collection_stats
from app.ingestion.chunker import ChunkStrategy
from app.config import BASE_DIR

app = FastAPI(
    title="RAG Hybrid Search API",
    description="Production-grade RAG pipeline with hybrid retrieval",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


from app.utils import sanitize_user_id

def get_user_raw_dir(user_id: str) -> Path:
    safe_id = sanitize_user_id(user_id)
    user_dir = BASE_DIR / "data" / "users" / safe_id / "raw"
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir


def get_user_collection(user_id: str) -> str:
    safe_id = sanitize_user_id(user_id)
    return f"rag_{safe_id}"


class AskRequest(BaseModel):
    question: str
    mode: str = "hybrid"
    use_reranker: bool = True
    verify_citations: bool = True
    user_id: str = "default"
    strictness_mode: str = "strict"


class AskResponse(BaseModel):
    question: str
    answer: str
    confidence: dict
    sources: list
    citations: list
    debug: dict


class IngestRequest(BaseModel):
    strategy: str = "recursive"
    user_id: str = "default"
    selected_files: list[str] = None


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "RAGSearch API running 🚀"}


@app.get("/v1/health", tags=["Health"])
def health():
    return {"status": "ok"}


import time as time_module
from app.evaluation.query_logger import log_query, get_global_stats, get_user_history

@app.post("/v1/ask", response_model=AskResponse, tags=["RAG"])
def ask_question(req: AskRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    start_time = time_module.time()

    collection = get_user_collection(req.user_id)
    result = ask(
    query=req.question,
    mode=req.mode,
    use_reranker=req.use_reranker,
    verify=req.verify_citations,
    collection_name=collection,
    user_id=req.user_id,
    strictness_mode=req.strictness_mode,
)
    result["question"] = result.pop("query")

    elapsed = time_module.time() - start_time

    # Log this query for evaluation tracking
    citation_rate = 1.0
    if result.get("citations"):
        supported = sum(1 for c in result["citations"] if c.get("supported", True))
        citation_rate = supported / len(result["citations"]) if result["citations"] else 1.0

    log_query(
        user_id=req.user_id,
        question=req.question,
        answer=result["answer"],
        confidence=result["confidence"],
        citation_support_rate=citation_rate,
        response_time_sec=elapsed,
    )

    return AskResponse(**result)


@app.get("/v1/evaluation/global", tags=["Evaluation"])
def evaluation_global():
    return get_global_stats()


@app.get("/v1/evaluation/history", tags=["Evaluation"])
def evaluation_history(user_id: str = Query(default="default")):
    history = get_user_history(user_id)
    return {"history": history, "count": len(history)}


from fastapi import BackgroundTasks

@app.post("/v1/ingest", tags=["Ingestion"])
def ingest(req: IngestRequest, background_tasks: BackgroundTasks):
    strategy_map = {
        "fixed": ChunkStrategy.FIXED,
        "recursive": ChunkStrategy.RECURSIVE,
        "semantic": ChunkStrategy.SEMANTIC,
    }
    strategy = strategy_map.get(req.strategy, ChunkStrategy.RECURSIVE)
    user_dir = get_user_raw_dir(req.user_id)
    collection = get_user_collection(req.user_id)

    background_tasks.add_task(
        ingest_documents,
        user_dir,
        strategy=strategy,
        collection_name=collection,
        user_id=req.user_id,
        selected_files=req.selected_files,
    )

    return {"status": "processing", "message": "Ingestion started in background. Check back in a moment."}



@app.get("/v1/ingested-files", tags=["Ingestion"])
def ingested_files(user_id: str = Query(default="default")):
    from app.ingestion.manifest import get_ingested_files
    return {"ingested": get_ingested_files(user_id)}



@app.post("/v1/upload", tags=["Ingestion"])
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form(default="default")
):
    allowed = {".txt", ".md", ".html", ".htm", ".pdf"}
    suffix = Path(file.filename).suffix.lower()
    if suffix not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {suffix}")

    user_dir = get_user_raw_dir(user_id)
    stem = Path(file.filename).stem
    dest = user_dir / file.filename

    # If a file with this name already exists, save as "name (1).ext",
    # "name (2).ext", etc. instead of silently overwriting it — same
    # behavior as downloading a duplicate file in a browser/OS.
    counter = 1
    final_filename = file.filename
    while dest.exists():
        final_filename = f"{stem} ({counter}){suffix}"
        dest = user_dir / final_filename
        counter += 1

    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"status": "uploaded", "filename": final_filename, "renamed": final_filename != file.filename}


@app.get("/v1/documents", tags=["Ingestion"])
def list_documents(user_id: str = Query(default="default")):
    allowed = {".txt", ".md", ".html", ".htm", ".pdf"}
    user_dir = get_user_raw_dir(user_id)
    files = [
        {
            "filename": f.name,
            "size_kb": round(f.stat().st_size / 1024, 2),
            "type": f.suffix.lstrip(".")
        }
        for f in user_dir.rglob("*") if f.suffix.lower() in allowed
    ]
    collection = get_user_collection(user_id)
    stats = get_collection_stats(collection)
    return {"documents": files, "total_chunks_indexed": stats["total_chunks"]}


@app.get("/v1/stats", tags=["Stats"])
def stats(user_id: str = Query(default="default")):
    collection = get_user_collection(user_id)
    return get_collection_stats(collection)


@app.get("/v1/suggestions", tags=["RAG"])
def get_suggestions(user_id: str = Query(default="default")):
    import json as json_lib
    safe_id = user_id.replace("|", "_").replace("/", "_")
    suggestions_path = BASE_DIR / "data" / "users" / safe_id / "suggestions.json"

    if not suggestions_path.exists():
        return {"suggestions": []}

    suggestions = json_lib.loads(suggestions_path.read_text(encoding="utf-8"))
    return {"suggestions": suggestions}



@app.delete("/v1/documents/{filename}", tags=["Ingestion"])
def delete_document(filename: str, user_id: str = Query(default="default")):
    user_dir = get_user_raw_dir(user_id)
    file_path = user_dir / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    file_path.unlink()

    # Also remove from ingested manifest if present
    from app.ingestion.manifest import get_ingested_files, mark_files_ingested
    import json as json_lib
    from app.ingestion.manifest import get_manifest_path

    ingested = get_ingested_files(user_id)
    if filename in ingested:
        ingested.remove(filename)
        get_manifest_path(user_id).write_text(json_lib.dumps(ingested), encoding="utf-8")

    return {"status": "deleted", "filename": filename}



from fastapi.responses import FileResponse
import mimetypes

@app.get("/v1/documents/{filename}/view", tags=["Ingestion"])
async def view_document(filename: str, user_id: str = Query(default="default")):
    user_dir = get_user_raw_dir(user_id)
    file_path = user_dir / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    mime_type, _ = mimetypes.guess_type(str(file_path))
    mime_type = mime_type or "application/octet-stream"
    
    return FileResponse(
        str(file_path),
        media_type=mime_type,
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )


@app.post("/v1/web-search", tags=["RAG"])
def web_search(query: str = Query(...), context: str = Query(default=None)):
    from app.generation.web_search import search_web
    # Enrich the search with real document-grounded context (the RAG answer
    # itself) so a vague question like "summarize the introduction" doesn't
    # get interpreted generically by the search engine.
    search_query = f"{query} — {context[:200]}" if context else query
    results = search_web(search_query)
    return {"query": query, "results": results}


@app.delete("/v1/ingested-files", tags=["Ingestion"])
def reset_ingested_files(user_id: str = Query(default="default")):
    from app.ingestion.manifest import get_manifest_path
    path = get_manifest_path(user_id)
    if path.exists():
        path.write_text("[]", encoding="utf-8")
    return {"status": "reset"}



@app.get("/v1/stats/global", tags=["Stats"])
def stats_global():
    """Real platform-wide numbers for the Landing page — not per-user."""
    from app.ingestion.vector_store import get_platform_stats
    from pathlib import Path

    platform = get_platform_stats()

    allowed = {".txt", ".md", ".html", ".htm", ".pdf"}
    users_dir = BASE_DIR / "data" / "users"
    total_documents = 0
    active_user_ids = set()

    if users_dir.exists():
        for user_dir in users_dir.iterdir():
            raw_dir = user_dir / "raw"
            has_docs = False
            if raw_dir.exists():
                doc_count = sum(1 for f in raw_dir.rglob("*") if f.suffix.lower() in allowed)
                total_documents += doc_count
                has_docs = doc_count > 0
            if has_docs:
                active_user_ids.add(user_dir.name)

    global_eval = get_global_stats()

    # Also count distinct users who've asked at least one question, even if
    # they haven't uploaded a doc (e.g. querying the 'default' shared space)
    from app.evaluation.query_logger import GLOBAL_LOG
    import json as json_lib
    if GLOBAL_LOG.exists():
        with open(GLOBAL_LOG, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    entry = json_lib.loads(line)
                    uid = entry.get("user_id")
                    if uid:
                        active_user_ids.add(sanitize_user_id(uid))

    return {
        "total_chunks": platform["total_chunks"],
        "active_users": len(active_user_ids),
        "total_documents": total_documents,
        "total_queries": global_eval.get("total_queries", 0),
    }



@app.delete("/v1/evaluation/history", tags=["Evaluation"])
def delete_evaluation_entry(user_id: str = Query(...), timestamp: str = Query(...)):
    from app.evaluation.query_logger import delete_query_entry
    deleted = delete_query_entry(user_id, timestamp)
    if not deleted:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"status": "deleted"}