#!/usr/bin/env python3
"""Run the ordered multi-model YargiMCP research pipeline."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
import time
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Sequence


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "model-routing.json"
LUNA_SCHEMA_PATH = ROOT / "config" / "yargi-luna-output.schema.json"
MCP_NAME = "yargi-mcp-pro"


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def ascii_slug(value: str, limit: int = 56) -> str:
    value = value.translate(str.maketrans({"ı": "i", "İ": "I"}))
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")
    return (slug[:limit].rstrip("-") or "arastirma")


def atomic_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=str(path.parent), delete=False
    ) as handle:
        handle.write(content)
        temp_path = Path(handle.name)
    temp_path.replace(path)


def atomic_json(path: Path, payload: object) -> None:
    atomic_text(path, json.dumps(payload, ensure_ascii=False, indent=2) + "\n")


def read_question(args: argparse.Namespace) -> str:
    if args.soru and args.soru_dosyasi:
        raise ValueError("Soru ile --soru-dosyasi birlikte kullanilamaz.")
    if args.soru_dosyasi:
        question = args.soru_dosyasi.read_text(encoding="utf-8").strip()
    else:
        question = (args.soru or "").strip()
    if not question:
        raise ValueError("Bir soru veya --soru-dosyasi gerekli.")
    return question


def load_routing() -> Dict[str, object]:
    data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    task = data.get("tasks", {}).get("yargi_mcp", {})
    pipeline = task.get("pipeline")
    if not isinstance(pipeline, dict):
        raise RuntimeError("tasks.yargi_mcp.pipeline yapilandirmasi bulunamadi.")
    stages = pipeline.get("stages")
    if not isinstance(stages, list) or len(stages) != 4:
        raise RuntimeError("Yargi pipeline tam olarak dort asama icermeli.")
    orders = [stage.get("order") for stage in stages]
    if orders != [1, 2, 3, 4]:
        raise RuntimeError("Yargi pipeline sirasi 1,2,3,4 olmali.")
    return pipeline


def check_command(command: Sequence[str], label: str, timeout: int = 75) -> None:
    result = subprocess.run(
        command,
        cwd=str(ROOT),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        timeout=timeout,
        check=False,
    )
    if result.returncode:
        raise RuntimeError("{} basarisiz:\n{}".format(label, result.stdout[-1600:]))


def preflight() -> None:
    missing = [name for name in ("codex", "claude") if not shutil.which(name)]
    if missing:
        raise RuntimeError("Eksik komutlar: {}".format(", ".join(missing)))
    check_command(["codex", "login", "status"], "Codex oturum kontrolu")
    check_command(["claude", "auth", "status"], "Claude oturum kontrolu")
    check_command(["codex", "mcp", "get", MCP_NAME], "Codex YargiMCP kontrolu")
    check_command(["claude", "mcp", "get", MCP_NAME], "Claude YargiMCP kontrolu")
    if not LUNA_SCHEMA_PATH.is_file():
        raise RuntimeError("Luna cikti semasi bulunamadi: {}".format(LUNA_SCHEMA_PATH))


def doctrine() -> str:
    return (ROOT / "prompts" / "_doktrin-preamble.md").read_text(encoding="utf-8")


def thresholds(pipeline: Dict[str, object], mode: str) -> Dict[str, int]:
    modes = pipeline.get("modes", {})
    selected = modes.get(mode, {}) if isinstance(modes, dict) else {}
    return {
        "min_queries": int(selected.get("min_queries", 15 if mode == "derin" else 6)),
        "min_full_text": int(selected.get("min_full_text", 5 if mode == "derin" else 3)),
    }


def common_prompt(question: str, mode: str, limits: Dict[str, int]) -> str:
    return """{doctrine}

HUKUKI SORU / KRITIK NOKTA:
{question}

CALISMA MODU: {mode}
MINIMUM: {queries} benzersiz arama sorgusu, {full_text} tam metin karari.

ZORUNLU:
- Yalniz `yargi-mcp-pro` ictihat araclarini kullan. Search sonucu atif icin
  yeterli degildir; atif yapilan her karar `ictihat_getir` ile tam metin acilir.
- Her kunye documentId, mahkeme/daire, tarih, E./K. ve baglamla yazilir.
- Tam metin gorulmeyen karar nihai sonuca alinmaz; DOGRULANMAMIS olarak ayrilir.
- Aleyhe kararlar ve gorus degisimleri gizlenmez. Model uzlasisi kaynak
  dogrulamasi sayilmaz.
- Kararlardaki mevzuat atiflarini 2C girdisi olacak kadar acik cikar.
- Dosya degistirme. Yalniz son yanitinda istenen ciktisini ver.
""".format(
        doctrine=doctrine(),
        question=question,
        mode=mode,
        queries=limits["min_queries"],
        full_text=limits["min_full_text"],
    )


def sol_prompt(question: str, mode: str, limits: Dict[str, int]) -> str:
    protocol = (
        ".claude/commands/arastir-yargi.md"
        if mode == "derin"
        else "ARASTIRMA.md icindeki Faz 1 hafif protokolu"
    )
    return common_prompt(question, mode, limits) + """

ROL 1/4: ANA ARASTIRMACI. Model routing'deki birinci model olarak {protocol}
kurallarini oku ve uygula. Terim uretimi, genis/dar arama, guncellik, karsi
arguman ve tam metin dogrulamasini yap. Ciktinda sorgu gunlugu, dogrulanmis ve
elenen kararlar, temporal seyir, celiskiler, mevzuat atiflari ve sonraki
denetcinin kontrol etmesi gereken riskler bulunsun.
""".format(protocol=protocol)


def terra_prompt(
    question: str,
    mode: str,
    limits: Dict[str, int],
    sol_path: Path,
) -> str:
    fresh_queries = 6 if mode == "derin" else 3
    return common_prompt(question, mode, limits) + """

ROL 2/4: BAGIMSIZ DENETCI. Once su Sol raporunu oku:
{sol_path}

Sol'un aramalarini mekanik tekrarlama. En az {fresh_queries} bagimsiz karsi
arama yap; kritik documentId'leri yeniden tam metin ac. Sol'daki dogru
bulgulari, kunye/baglam hatalarini, atlanan aleyhe kararlari, eski kararlari ve
yeni emsalleri ayri yaz. Luna icin duzeltilmis karar ve mevzuat atfi listesi
uret.
""".format(sol_path=sol_path, fresh_queries=fresh_queries)


def luna_prompt(
    question: str,
    mode: str,
    limits: Dict[str, int],
    sol_path: Path,
    terra_path: Path,
    luna_model: str,
) -> str:
    return common_prompt(question, mode, limits) + """

ROL 3/4: NIHAYI YARGI BULGULARI SENTEZI.
Oku:
- Sol: {sol_path}
- Terra: {terra_path}

Celiskili veya yuksek riskli noktalarda hedefli YargiMCP kontrolleri yap.
Yalniz tam metinle desteklenen sonuclari koru. Verilen JSON semasina birebir
uyan tek bir JSON nesnesi dondur:
- `report_markdown`: kanonik Yargi raporu. Frontmatter'da engine=codex,
  model={luna_model}, mcp=yargi-mcp-pro, pipeline_stage=3, status=TASLAK olsun.
- `atif_maddeleri`: her karar icin documentId, kunye, tam-metin dogrulamasi ve
  o kararin atif yaptigi mevzuat maddeleri.
- `query_count`: raporda listelenen benzersiz gercek MCP arama sayisi.
- `full_text_count`: ictihat_getir ile acilmis benzersiz karar sayisi.

Bu asama nihai 2B raporunu yazar. Claude raporu yeniden yazmayacak.
""".format(
        sol_path=sol_path,
        terra_path=terra_path,
        luna_model=luna_model,
    )


def claude_prompt(
    question: str,
    report_path: Path,
    citations_path: Path,
    max_calls: int,
    max_words: int,
) -> str:
    return """{doctrine}

ROL 4/4: CLAUDE KISA KALITE KAPISI.
Soru: {question}
Luna raporu: {report_path}
Atif verisi: {citations_path}

- Nihai sentez yapma ve raporu yeniden yazma.
- Genis arastirma yapma. En fazla {max_calls} hedefli YargiMCP cagrisi kullan;
  yalniz sonucu degistirecek kunye veya baglam supheliyse arac cagir.
- En fazla {max_words} kelime yaz.
- Ilk satir tam olarak `KARAR: GECTI` veya `KARAR: REVIZE GEREKIR` olsun.
- Sonra yalniz kritik kunye/baglam hatalari, eksik aleyhe ictihat, eksik tam
  metin ve gerekli duzeltmeleri listele. Stil onerisi verme. Dosya degistirme.
""".format(
        doctrine=doctrine(),
        question=question,
        report_path=report_path,
        citations_path=citations_path,
        max_calls=max_calls,
        max_words=max_words,
    )


def codex_command(model: str, effort: str, output_path: Path, schema: bool = False) -> List[str]:
    command = [
        "codex",
        "exec",
        "--ephemeral",
        "--model",
        model,
        "--config",
        'model_reasoning_effort="{}"'.format(effort),
        "--sandbox",
        "read-only",
        "--cd",
        str(ROOT),
    ]
    if schema:
        command.extend(["--output-schema", str(LUNA_SCHEMA_PATH)])
    command.extend(["--output-last-message", str(output_path), "-"])
    return command


def claude_command(model: str, effort: str) -> List[str]:
    return [
        "claude",
        "--print",
        "--model",
        model,
        "--effort",
        effort,
        "--permission-mode",
        "dontAsk",
        "--allowedTools",
        "Read",
        "mcp__yargi-mcp-pro__ictihat_ara",
        "mcp__yargi-mcp-pro__ictihat_getir",
        "mcp__yargi-mcp-pro__semantik_ictihat_ara",
        "mcp__yargi-mcp-pro__aym_ictihat_ara",
        "mcp__yargi-mcp-pro__kurum_karari_ara",
        "mcp__yargi-mcp-pro__kurum_karari_getir",
        "--output-format",
        "text",
        "--no-session-persistence",
    ]


def run_stage(
    name: str,
    model: str,
    command: Sequence[str],
    prompt: str,
    output_path: Path,
    timeout: int,
    capture_stdout: bool = False,
) -> Dict[str, object]:
    print("[{}] {} basliyor...".format(name, model), flush=True)
    started = time.monotonic()
    temp_path = output_path.with_suffix(output_path.suffix + ".tmp")
    if temp_path.exists():
        temp_path.unlink()
    adjusted = list(command)
    if not capture_stdout:
        adjusted[adjusted.index(str(output_path))] = str(temp_path)
    try:
        if capture_stdout:
            with temp_path.open("w", encoding="utf-8") as handle:
                result = subprocess.run(
                    adjusted,
                    cwd=str(ROOT),
                    input=prompt,
                    stdout=handle,
                    stderr=None,
                    text=True,
                    timeout=timeout,
                    check=False,
                )
        else:
            result = subprocess.run(
                adjusted,
                cwd=str(ROOT),
                input=prompt,
                text=True,
                timeout=timeout,
                check=False,
            )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(
            "{} zaman asimina ugradi ({} sn).".format(name, timeout)
        ) from exc
    duration = round(time.monotonic() - started, 1)
    if result.returncode:
        raise RuntimeError(
            "{} basarisiz (cikis kodu {}, {} sn).".format(
                name, result.returncode, duration
            )
        )
    if not temp_path.is_file() or not temp_path.read_text(encoding="utf-8").strip():
        raise RuntimeError("{} bos cikti uretti.".format(name))
    temp_path.replace(output_path)
    print("[{}] tamamlandi: {} ({} sn)".format(name, output_path.name, duration))
    return {
        "stage": name,
        "model": model,
        "status": "completed",
        "output": output_path.name,
        "duration_seconds": duration,
        "completed_at": now_iso(),
    }


def parse_luna(path: Path, limits: Dict[str, int]) -> Dict[str, object]:
    text = path.read_text(encoding="utf-8").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.DOTALL)
    payload = json.loads(text)
    query_count = int(payload.get("query_count", 0))
    full_text_count = int(payload.get("full_text_count", 0))
    citations = payload.get("atif_maddeleri")
    report = payload.get("report_markdown")
    if query_count < limits["min_queries"]:
        raise RuntimeError(
            "Luna sorgu esigi altinda: {}/{}".format(query_count, limits["min_queries"])
        )
    if full_text_count < limits["min_full_text"]:
        raise RuntimeError(
            "Luna tam metin esigi altinda: {}/{}".format(
                full_text_count, limits["min_full_text"]
            )
        )
    if not isinstance(citations, list) or not citations:
        raise RuntimeError("Luna atif_maddeleri listesi bos.")
    unverified = [
        item
        for item in citations
        if not isinstance(item, dict) or item.get("verified_full_text") is not True
    ]
    if unverified:
        raise RuntimeError(
            "Luna atif_maddeleri yalniz tam metni dogrulanmis kararlar icermeli."
        )
    if not isinstance(report, str) or len(report.strip()) < 500:
        raise RuntimeError("Luna report_markdown alani yetersiz.")
    return payload


def parse_claude_gate(text: str, max_words: int) -> str:
    if len(re.findall(r"\S+", text)) > max_words:
        return "LIMIT_ASILDI"
    lines = text.lstrip().splitlines()
    if not lines:
        return "PARSE_EDILEMEDI"
    match = re.fullmatch(r"KARAR:\s*(GECTI|REVIZE GEREKIR)", lines[0].strip())
    return match.group(1) if match else "PARSE_EDILEMEDI"


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(
        description="YargiMCP'yi Sol, Terra, Luna ve kisa Claude kapisiyla calistirir."
    )
    result.add_argument("soru", nargs="?", help="Hukuki soru veya kritik nokta")
    result.add_argument("--soru-dosyasi", type=Path, help="UTF-8 soru/vaka dosyasi")
    result.add_argument("--mod", choices=("derin", "hafif"), default="derin")
    result.add_argument("--cikti", type=Path, help="2B cikti dizini")
    result.add_argument("--zaman-asimi", type=int, default=1800)
    result.add_argument("--kuru-calistir", action="store_true")
    result.add_argument("--on-kontrol-yok", action="store_true")
    return result


def main() -> int:
    args = parser().parse_args()
    try:
        question = read_question(args)
        pipeline = load_routing()
        limits = thresholds(pipeline, args.mod)
        if args.zaman_asimi < 60:
            raise ValueError("--zaman-asimi en az 60 olmali.")
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as exc:
        print("Yapilandirma hatasi: {}".format(exc), file=sys.stderr)
        return 2

    timestamp = datetime.now().astimezone().strftime("%Y%m%d-%H%M%S")
    output_dir = (
        args.cikti
        or ROOT / "tmp" / "yargi-model-runs" / (timestamp + "-" + ascii_slug(question))
    ).resolve()
    stages = pipeline["stages"]
    if args.kuru_calistir:
        print("Mod: {} | Esik: {} sorgu / {} tam metin".format(
            args.mod, limits["min_queries"], limits["min_full_text"]
        ))
        print("Cikti: {}".format(output_dir))
        for stage in stages:
            print("{}. {} [{}] - {}".format(
                stage["order"], stage["model"], stage["engine"], stage["role"]
            ))
        return 0

    try:
        if not args.on_kontrol_yok:
            print("Oturum ve YargiMCP baglantilari kontrol ediliyor...", flush=True)
            preflight()
        output_dir.mkdir(parents=True, exist_ok=True)
    except (OSError, RuntimeError, subprocess.TimeoutExpired) as exc:
        print("On kontrol hatasi: {}".format(exc), file=sys.stderr)
        return 2

    sol, terra, luna, claude = stages
    sol_path = output_dir / "yargi-01-sol.md"
    terra_path = output_dir / "yargi-02-terra.md"
    luna_json_path = output_dir / ".yargi-03-luna.json"
    report_name = "yargi-bulgulari.md" if args.mod == "derin" else "01-Ictihat-taramasi.md"
    report_path = output_dir / report_name
    citations_path = output_dir / "atif-maddeleri.json"
    claude_path = output_dir / "yargi-04-claude-kalite.md"
    manifest_path = output_dir / "yargi-model-pipeline.json"
    manifest: Dict[str, object] = {
        "created_at": now_iso(),
        "question": question,
        "mode": args.mod,
        "thresholds": limits,
        "status": "running",
        "pipeline": stages,
        "stages": [],
    }
    atomic_json(manifest_path, manifest)

    try:
        stage_specs = [
            (
                "01-sol",
                sol,
                codex_command(sol["model"], sol.get("reasoning", "xhigh"), sol_path),
                sol_prompt(question, args.mod, limits),
                sol_path,
                False,
            ),
            (
                "02-terra",
                terra,
                codex_command(
                    terra["model"], terra.get("reasoning", "xhigh"), terra_path
                ),
                terra_prompt(question, args.mod, limits, sol_path),
                terra_path,
                False,
            ),
            (
                "03-luna",
                luna,
                codex_command(
                    luna["model"], luna.get("reasoning", "xhigh"), luna_json_path, True
                ),
                luna_prompt(
                    question, args.mod, limits, sol_path, terra_path, luna["model"]
                ),
                luna_json_path,
                False,
            ),
        ]
        for name, stage, command, prompt, path, capture in stage_specs:
            result = run_stage(
                name,
                stage["model"],
                command,
                prompt,
                path,
                args.zaman_asimi,
                capture_stdout=capture,
            )
            manifest["stages"].append(result)  # type: ignore[union-attr]
            atomic_json(manifest_path, manifest)

        luna_payload = parse_luna(luna_json_path, limits)
        atomic_text(report_path, luna_payload["report_markdown"].rstrip() + "\n")
        atomic_json(
            citations_path,
            {
                "schema_version": 1,
                "generated_at": now_iso(),
                "generated_by": luna["model"],
                "mode": args.mod,
                "kararlar": luna_payload["atif_maddeleri"],
            },
        )

        max_calls = int(pipeline.get("claude_max_mcp_calls", 2))
        max_words = int(pipeline.get("claude_max_words", 600))
        result = run_stage(
            "04-claude-kalite",
            claude["model"],
            claude_command(claude["model"], claude.get("reasoning", "high")),
            claude_prompt(
                question, report_path, citations_path, max_calls, max_words
            ),
            claude_path,
            args.zaman_asimi,
            capture_stdout=True,
        )
        manifest["stages"].append(result)  # type: ignore[union-attr]
    except (OSError, RuntimeError, ValueError, json.JSONDecodeError) as exc:
        manifest["status"] = "failed"
        manifest["error"] = str(exc)
        manifest["finished_at"] = now_iso()
        atomic_json(manifest_path, manifest)
        print("Pipeline durdu: {}".format(exc), file=sys.stderr)
        return 1

    gate_text = claude_path.read_text(encoding="utf-8")
    gate = parse_claude_gate(gate_text, max_words)
    manifest["claude_gate"] = gate
    manifest["final_report"] = report_path.name
    manifest["citations"] = citations_path.name
    manifest["status"] = "completed" if gate == "GECTI" else "review_required"
    manifest["finished_at"] = now_iso()
    atomic_json(manifest_path, manifest)

    print("Nihai Luna raporu: {}".format(report_path))
    print("Atif girdisi: {}".format(citations_path))
    print("Claude kalite kapisi: {} ({})".format(claude_path, gate))
    if gate != "GECTI":
        print("2C BASLAMAMALI: Claude kalite kapisi gecilmedi.", file=sys.stderr)
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
