from __future__ import annotations

from pathlib import Path

import chromadb
from chromadb.utils import embedding_functions


DEFAULT_COLLECTION = "hukuk_kutuphanesi_v2_pilot"
DEFAULT_MODEL = "intfloat/multilingual-e5-large"


def load_chunks_into_chroma(
    chunks: list[dict],
    db_path: Path,
    collection_name: str = DEFAULT_COLLECTION,
    embedding_model: str = DEFAULT_MODEL,
) -> int:
    db_path.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(db_path))
    embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=embedding_model
    )
    collection = client.get_or_create_collection(
        name=collection_name,
        embedding_function=embedding_function,
        metadata={"hnsw:space": "cosine"},
    )

    ids: list[str] = []
    documents: list[str] = []
    metadatas: list[dict] = []

    for index, chunk in enumerate(chunks):
        text = chunk["metin"].strip()
        if len(text) < 40:
            continue
        ids.append(f"{chunk['metadata']['hash']}_{index}")
        documents.append(f"passage: {text}")
        metadatas.append({key: str(value) for key, value in chunk["metadata"].items()})

    if not ids:
        return 0

    collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
    return len(ids)

