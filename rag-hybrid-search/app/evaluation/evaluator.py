import json
from datetime import datetime
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from app.evaluation.golden_dataset import GOLDEN_QA
from app.evaluation.metrics import (
    score_keyword_match,
    score_correctness_llm,
    score_faithfulness,
    score_retrieval_relevance,
)
from app.generation.rag_pipeline import ask
from app.config import BASE_DIR

console = Console()
EVAL_DIR = BASE_DIR / "data" / "eval_results"
EVAL_DIR.mkdir(parents=True, exist_ok=True)


def run_evaluation(
    mode: str = "hybrid",
    use_reranker: bool = True,
    strategy_label: str = "recursive",
    save_results: bool = True,
) -> dict:
    """Run full evaluation suite on golden Q&A dataset."""

    console.print(Panel(
        f"[bold cyan]📊 Running Evaluation[/bold cyan]\n"
        f"Mode: {mode} | Reranker: {use_reranker} | Strategy: {strategy_label}"
    ))

    results = []

    for i, qa in enumerate(GOLDEN_QA):
        console.print(f"\n[bold][{i+1}/{len(GOLDEN_QA)}][/bold] {qa['question'][:70]}")

        try:
            # Run RAG pipeline
            output = ask(
                qa["question"],
                mode=mode,
                use_reranker=use_reranker,
                verify=False,  # Skip per-question citation verify for speed
            )

            answer = output["answer"]
            chunks = output.get("sources", [])
            # Re-map sources to chunk format for scoring
            chunk_dicts = [{"content": s["preview"], "rerank_score": s.get("rerank_score", 5)} for s in chunks]

            # Compute metrics
            keyword_score = score_keyword_match(answer, qa["expected_keywords"])
            correctness = score_correctness_llm(
                qa["question"], answer,
                qa["expected_keywords"], qa["type"]
            )
            faithfulness = score_faithfulness(answer, chunk_dicts)
            retrieval_rel = score_retrieval_relevance(
                qa["question"], chunk_dicts, qa["expected_keywords"]
            )

            result = {
                "id": qa["id"],
                "question": qa["question"],
                "type": qa["type"],
                "answer": answer[:200],
                "keyword_score": keyword_score,
                "correctness_score": correctness["score"],
                "correctness_correct": correctness["correct"],
                "correctness_reasoning": correctness["reasoning"],
                "faithfulness": faithfulness,
                "retrieval_relevance": retrieval_rel,
                "confidence_composite": output["confidence"]["composite"],
                "confidence_grade": output["confidence"]["grade"],
            }

        except Exception as e:
            console.print(f"  [red]Evaluation error: {e}[/red]")
            result = {
                "id": qa["id"],
                "question": qa["question"],
                "type": qa["type"],
                "answer": "ERROR",
                "keyword_score": 0.0,
                "correctness_score": 0.0,
                "correctness_correct": False,
                "correctness_reasoning": str(e),
                "faithfulness": 0.0,
                "retrieval_relevance": 0.0,
                "confidence_composite": 0.0,
                "confidence_grade": "LOW",
            }

        results.append(result)
        console.print(
            f"  Correctness: {result['correctness_score']:.2f} | "
            f"Faithfulness: {result['faithfulness']:.2f} | "
            f"Retrieval: {result['retrieval_relevance']:.2f}"
        )

    # Aggregate metrics
    # Aggregate metrics
    n = len(results)
    summary = {
    "strategy": strategy_label,
    "mode": mode,
    "reranker": use_reranker,
    "timestamp": datetime.now().isoformat(),
    "total_questions": n,
    "avg_correctness": round(sum(r["correctness_score"] for r in results) / n, 3),
    "pct_correct": round(sum(1 for r in results if r["correctness_correct"]) / n * 100, 1),
    "avg_faithfulness": round(sum(r["faithfulness"] for r in results) / n, 3),
    "avg_retrieval_relevance": round(sum(r["retrieval_relevance"] for r in results) / n, 3),
    "avg_confidence": round(sum(r["confidence_composite"] for r in results) / n, 3),
    "results": results,
}

    # Print summary table
    table = Table(title=f"Evaluation Summary — {strategy_label} / {mode}", show_header=True)
    table.add_column("Metric", style="cyan")
    table.add_column("Score", style="green")
    table.add_row("Avg Correctness", f"{summary['avg_correctness']:.3f}")
    table.add_row("% Correct", f"{summary['pct_correct']}%")
    table.add_row("Avg Faithfulness", f"{summary['avg_faithfulness']:.3f}")
    table.add_row("Avg Retrieval Relevance", f"{summary['avg_retrieval_relevance']:.3f}")
    table.add_row("Avg Confidence", f"{summary['avg_confidence']:.3f}")
    console.print(table)

    # Save results
    if save_results:
        out_path = EVAL_DIR / f"eval_{strategy_label}_{mode}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        out_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
        console.print(f"[green]✅ Results saved to {out_path}[/green]")

    return summary