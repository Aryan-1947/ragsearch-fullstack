import numpy as np
from rich.console import Console
from sentence_transformers import SentenceTransformer

from app.config import LOCAL_EMBEDDING_MODEL
from app.ingestion.chunker import Chunk

console = Console()

_model = None


def _get_model():
    global _model
    if _model is None:
        console.print(f"[dim]Loading local embedding model: {LOCAL_EMBEDDING_MODEL}...[/dim]")
        _model = SentenceTransformer(LOCAL_EMBEDDING_MODEL)
        console.print("[green]✅ Embedding model loaded[/green]")
    return _model


def embed_text(text: str) -> list[float]:
    embedding = _get_model().encode(text, normalize_embeddings=True)
    return embedding.tolist()


def embed_query(query: str) -> list[float]:
    return embed_text(query)


def embed_chunks(chunks: list[Chunk], batch_size: int = 32) -> list[list[float]]:
    console.print(f"\n[bold]Embedding {len(chunks)} chunks locally...[/bold]")
    texts = [c.content for c in chunks]
    embeddings = _get_model().encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        normalize_embeddings=True,
    )
    console.print(f"[green]✅ Embedded {len(embeddings)} chunks[/green]")
    return [e.tolist() for e in embeddings]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))


def is_duplicate(
    new_embedding: list[float],
    existing_embeddings: list[list[float]],
    threshold: float = 0.95
) -> bool:
    for existing in existing_embeddings:
        if cosine_similarity(new_embedding, existing) > threshold:
            return True
    return False