import argparse
import json
import sys

import chromadb


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", required=True)
    parser.add_argument("--collections", default="")
    parser.add_argument("--query", required=True)
    parser.add_argument("--top-k", type=int, default=5)
    args = parser.parse_args()

    client = chromadb.PersistentClient(path=args.db)
    selected = [item.strip() for item in args.collections.split(",") if item.strip()]

    if not selected:
        selected = [collection.name for collection in client.list_collections()]

    results = []

    for collection_name in selected:
        try:
            collection = client.get_collection(collection_name)
            query_result = collection.query(query_texts=[args.query], n_results=args.top_k)
            documents = (query_result.get("documents") or [[]])[0]
            metadatas = (query_result.get("metadatas") or [[]])[0]
            distances = (query_result.get("distances") or [[]])[0]

            hits = []
            for index, document in enumerate(documents):
                hits.append(
                    {
                        "document": document,
                        "metadata": metadatas[index] if index < len(metadatas) else None,
                        "distance": distances[index] if index < len(distances) else None,
                    }
                )

            results.append(
                {
                    "collection": collection_name,
                    "status": "completed",
                    "hits": hits,
                }
            )
        except Exception as exc:
            results.append(
                {
                    "collection": collection_name,
                    "status": "failed",
                    "error": str(exc),
                    "hits": [],
                }
            )

    print(json.dumps({"results": results}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False))
        sys.exit(1)
