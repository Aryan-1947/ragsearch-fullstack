from dataclasses import dataclass, field
from enum import Enum
import numpy as np

from langchain_text_splitters import RecursiveCharacterTextSplitter
from rich.console import Console

from app.ingestion.document_loader import Document
from app.config import CHUNK_SIZE, CHUNK_OVERLAP

def is_reference_chunk(text: str) -> bool:
    """Skip chunks that are mostly bibliography/references."""
    lines = [l.strip() for l in text.strip().split('\n') if l.strip()]
    if not lines:
        return False
    ref_lines = sum(1 for l in lines if l.startswith('[') and ']' in l)
    return ref_lines / len(lines) > 0.5

console = Console()


class ChunkStrategy(str, Enum):
    FIXED = "fixed"
    RECURSIVE = "recursive"
    SEMANTIC = "semantic"


@dataclass
class Chunk:
    content: str
    doc_id: str
    source: str
    chunk_index: int
    strategy: str
    metadata: dict = field(default_factory=dict)

    @property
    def chunk_id(self) -> str:
        return f"{self.doc_id}_chunk_{self.chunk_index}"


def fixed_chunk(doc: Document, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[Chunk]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=size, chunk_overlap=overlap,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    texts = [t for t in splitter.split_text(doc.content) if not is_reference_chunk(t)]
    return [
        Chunk(content=t, doc_id=doc.doc_id, source=doc.source,
              chunk_index=i, strategy=ChunkStrategy.FIXED,
              metadata={**doc.metadata, "char_count": len(t)})
        for i, t in enumerate(texts)
    ]


def recursive_chunk(doc: Document, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[Chunk]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=size, chunk_overlap=overlap,
        separators=["## ", "### ", "\n\n", "\n", ". ", " ", ""]
    )
    texts = [t for t in splitter.split_text(doc.content) if not is_reference_chunk(t)]
    return [
        Chunk(content=t, doc_id=doc.doc_id, source=doc.source,
              chunk_index=i, strategy=ChunkStrategy.RECURSIVE,
              metadata={**doc.metadata, "char_count": len(t)})
        for i, t in enumerate(texts)
    ]


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))


def semantic_chunk(doc: Document, threshold: float = 0.75, size: int = CHUNK_SIZE) -> list[Chunk]:
    from app.ingestion.embedder import embed_text

    # Chunk at paragraph/sentence level (500 chars) instead of 200 — meaningfully
    # fewer, larger base pieces to embed, which is what made semantic chunking
    # slow (400+ tiny pieces vs ~150-200 with this size).
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500, chunk_overlap=0,
        separators=["\n\n", "\n", ". ", " "]
    )
    base_pieces = splitter.split_text(doc.content)

    if len(base_pieces) <= 1:
        return fixed_chunk(doc, size)

    console.print(f"  [dim]Embedding {len(base_pieces)} base pieces locally...[/dim]")
    embeddings = [embed_text(p) for p in base_pieces]

    chunks_text = []
    current_group = [base_pieces[0]]

    for i in range(1, len(base_pieces)):
        sim = _cosine_similarity(embeddings[i - 1], embeddings[i])
        current_text = " ".join(current_group)

        if sim < threshold or len(current_text) > size:
            chunks_text.append(current_text)
            current_group = [base_pieces[i]]
        else:
            current_group.append(base_pieces[i])

    if current_group:
        chunks_text.append(" ".join(current_group))

    return [
        Chunk(content=t, doc_id=doc.doc_id, source=doc.source,
              chunk_index=i, strategy=ChunkStrategy.SEMANTIC,
              metadata={**doc.metadata, "char_count": len(t)})
        for i, t in enumerate(chunks_text)
    ]


def chunk_document(doc: Document, strategy: ChunkStrategy = ChunkStrategy.RECURSIVE) -> list[Chunk]:
    console.print(f"  Chunking [cyan]{doc.metadata.get('filename', doc.doc_id)}[/cyan] with [yellow]{strategy}[/yellow] strategy...")

    if strategy == ChunkStrategy.FIXED:
        chunks = fixed_chunk(doc)
    elif strategy == ChunkStrategy.RECURSIVE:
        chunks = recursive_chunk(doc)
    elif strategy == ChunkStrategy.SEMANTIC:
        chunks = semantic_chunk(doc)
    else:
        chunks = recursive_chunk(doc)

    console.print(f"  [green]→ {len(chunks)} chunks created[/green]")
    return chunks


















'''import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
import google.generativeai as genai
import numpy as np

from langchain_text_splitters import RecursiveCharacterTextSplitter
from rich.console import Console

from app.ingestion.document_loader import Document
from app.config import CHUNK_SIZE, CHUNK_OVERLAP, GOOGLE_API_KEY, EMBEDDING_MODEL

console = Console()
genai.configure(api_key=GOOGLE_API_KEY)


class ChunkStrategy(str, Enum):
    FIXED = "fixed"
    RECURSIVE = "recursive"
    SEMANTIC = "semantic"


@dataclass
class Chunk:
    content: str
    doc_id: str
    source: str
    chunk_index: int
    strategy: str
    metadata: dict = field(default_factory=dict)

    @property
    def chunk_id(self) -> str:
        return f"{self.doc_id}_chunk_{self.chunk_index}"


def fixed_chunk(doc: Document, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[Chunk]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=size,
        chunk_overlap=overlap,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    texts = splitter.split_text(doc.content)
    return [
        Chunk(
            content=t,
            doc_id=doc.doc_id,
            source=doc.source,
            chunk_index=i,
            strategy=ChunkStrategy.FIXED,
            metadata={**doc.metadata, "char_count": len(t)}
        )
        for i, t in enumerate(texts)
    ]


def recursive_chunk(doc: Document, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[Chunk]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=size,
        chunk_overlap=overlap,
        separators=["## ", "### ", "\n\n", "\n", ". ", " ", ""]
    )
    texts = splitter.split_text(doc.content)
    return [
        Chunk(
            content=t,
            doc_id=doc.doc_id,
            source=doc.source,
            chunk_index=i,
            strategy=ChunkStrategy.RECURSIVE,
            metadata={**doc.metadata, "char_count": len(t)}
        )
        for i, t in enumerate(texts)
    ]


def _embed_texts(texts: list[str]) -> list[list[float]]:
    embeddings = []
    for text in texts:
        for attempt in range(3):
            try:
                result = genai.embed_content(
                    model=EMBEDDING_MODEL,
                    content=text,
                    task_type="retrieval_document"
                )
                embeddings.append(result["embedding"])
                time.sleep(0.7)
                break
            except Exception as e:
                if attempt < 2:
                    time.sleep(60)
                else:
                    embeddings.append([0.0] * 3072)
    return embeddings

def _cosine_similarity(a: list[float], b: list[float]) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))


def semantic_chunk(doc: Document, threshold: float = 0.75, size: int = CHUNK_SIZE) -> list[Chunk]:
    """Split on topic boundaries using embedding similarity."""
    # First do a base split into sentences/paragraphs
    splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=0)
    base_pieces = splitter.split_text(doc.content)

    if len(base_pieces) <= 1:
        return fixed_chunk(doc, size)

    console.print(f"  [dim]Embedding {len(base_pieces)} base pieces for semantic chunking...[/dim]")
    embeddings = _embed_texts(base_pieces)

    # Group pieces into chunks based on similarity
    chunks_text = []
    current_group = [base_pieces[0]]

    for i in range(1, len(base_pieces)):
        sim = _cosine_similarity(embeddings[i - 1], embeddings[i])
        current_text = " ".join(current_group)

        if sim < threshold or len(current_text) > size:
            chunks_text.append(current_text)
            current_group = [base_pieces[i]]
        else:
            current_group.append(base_pieces[i])

    if current_group:
        chunks_text.append(" ".join(current_group))

    return [
        Chunk(
            content=t,
            doc_id=doc.doc_id,
            source=doc.source,
            chunk_index=i,
            strategy=ChunkStrategy.SEMANTIC,
            metadata={**doc.metadata, "char_count": len(t)}
        )
        for i, t in enumerate(chunks_text)
    ]


def chunk_document(doc: Document, strategy: ChunkStrategy = ChunkStrategy.RECURSIVE) -> list[Chunk]:
    console.print(f"  Chunking [cyan]{doc.metadata.get('filename', doc.doc_id)}[/cyan] with [yellow]{strategy}[/yellow] strategy...")
    
    if strategy == ChunkStrategy.FIXED:
        chunks = fixed_chunk(doc)
    elif strategy == ChunkStrategy.RECURSIVE:
        chunks = recursive_chunk(doc)
    elif strategy == ChunkStrategy.SEMANTIC:
        chunks = semantic_chunk(doc)
    else:
        chunks = recursive_chunk(doc)

    console.print(f"  [green]→ {len(chunks)} chunks created[/green]")
    return chunks'''