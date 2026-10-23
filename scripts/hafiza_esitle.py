#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""hafiza_esitle.py — Claude Code proje hafızasını (auto-memory) Windows PC ile MacBook arasında Google Drive
üzerinden eşitler.

Neden git değil: hafıza notları dava ayrıntısı ve müvekkil adı içerir; GitHub deposu herkese açıktır (KVKK).
Drive veri kökü (`config/paths.json` → data_root) iki makinede de senkron ve büroya özeldir.

Ayna: <data_root>/Sistem/claude-hafiza/  (config `hafiza_ayna` ile değiştirilebilir)
  _durum/<makine>.json  her makinenin son eşitlemede gördüğü hal (üç yönlü karşılaştırmanın tabanı)
  _eski/<tarih>/        üzerine yazılan ya da silinen her sürümün yedeği (hiçbir şey kalıcı silinmez)

Kural (yerel L, ayna A, bu makinenin son eşitlemedeki hali T):
  L == A               -> değişiklik yok
  yalnız L değişmiş    -> L aynaya (L silinmişse aynadaki kopya _eski/'ye taşınır)
  yalnız A değişmiş    -> A yerele (A'da silinmişse yerel kopya _eski/'ye yedeklenip silinir)
  ikisi de değişmiş    -> MEMORY.md satır birleşimi; öteki dosyalarda yeni olan kazanır, diğeri _eski/'ye
  ilk eşitleme (T yok) -> yalnız bir tarafta olan kopyalanır; ikisinde farklıysa yeni olan kazanır

Kullanım:
  python scripts/hafiza_esitle.py durum                      # yapılacakları gösterir, dokunmaz
  python scripts/hafiza_esitle.py esitle                     # iki yönlü eşitler
  python scripts/hafiza_esitle.py esitle --hafiza <klasör>   # hafıza klasörü otomatik bulunamazsa
Oturum başında ve sonunda bir kez çalıştırmak yeterli. Yeni makinede önce depoda bir kez Claude Code açılır
(proje klasörü `~/.claude/projects/<anahtar>/` o zaman oluşur), sonra `esitle`.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import re
import shutil
import sys
import unicodedata
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from paths import REPO_ROOT, _load_cfg, data_root  # noqa: E402

INDEKS = "MEMORY.md"
VARSAYILAN_AYNA = "Sistem/claude-hafiza"
LINK_RE = re.compile(r"\]\(([^)\s]+\.md)\)")


# --- konumlar ----------------------------------------------------------------------------------------------------

def _claude_koku() -> Path:
    return Path(os.environ.get("CLAUDE_CONFIG_DIR") or Path.home() / ".claude")


def proje_anahtari(yol: str) -> str:
    """Claude Code proje klasör adı: yolda harf/rakam dışındaki her karakter '-' olur
    (D:\\projelerim\\...\\Eski Claude antıgravıty -> D--projelerim-...-Eski-Claude-ant-grav-ty)."""
    return re.sub(r"[^A-Za-z0-9]", "-", yol)


def hafiza_klasoru(acik: str | None = None) -> Path:
    if acik:
        return Path(acik).expanduser()
    projeler = _claude_koku() / "projects"
    for bicim in ("NFC", "NFD"):  # macOS yolları NFD gelebilir
        aday = projeler / proje_anahtari(unicodedata.normalize(bicim, str(REPO_ROOT)))
        if aday.is_dir():
            return aday / "memory"
    # depo farklı bir yoldan (bağlantı, farklı büyük/küçük harf) açılmışsa: adı depo adıyla biten TEK klasör
    son = proje_anahtari(unicodedata.normalize("NFC", REPO_ROOT.name))
    tek = [p for p in projeler.glob("*") if p.is_dir() and p.name.endswith(son)] if projeler.is_dir() else []
    if len(tek) == 1:
        print(f"Not: proje klasörü ada göre bulundu: {tek[0].name}")
        return tek[0] / "memory"
    raise RuntimeError(
        f"Bu depo için Claude Code proje klasörü yok: {projeler / proje_anahtari(str(REPO_ROOT))}\n"
        "  Önce depoda bir kez Claude Code açın (klasör o zaman oluşur) ya da --hafiza <klasör> verin.")


def ayna_klasoru() -> Path:
    alt = _load_cfg().get("hafiza_ayna") or VARSAYILAN_AYNA
    return data_root() / alt


def makine_adi() -> str:
    return re.sub(r"[^A-Za-z0-9_-]", "-", platform.node() or "makine")[:60]


# --- yardımcılar -------------------------------------------------------------------------------------------------

def _ozet(yol: Path) -> str | None:
    return hashlib.sha256(yol.read_bytes()).hexdigest() if yol.is_file() else None


def _dosyalar(klasor: Path) -> dict[str, Path]:
    if not klasor.is_dir():
        return {}
    return {p.name: p for p in klasor.iterdir() if p.is_file() and not p.name.startswith((".", "~$"))}


def _yedekle(kaynak: Path, ayna: Path, etiket: str) -> None:
    hedef = ayna / "_eski" / datetime.now().strftime("%Y-%m-%d") / \
        f"{datetime.now():%H%M%S}-{makine_adi()}-{etiket}-{kaynak.name}"
    hedef.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(kaynak, hedef)


def _satir_anahtari(satir: str) -> tuple[str, str]:
    m = LINK_RE.search(satir)
    return ("link", m.group(1)) if m else ("satir", satir.strip())


def indeks_birlestir(yeni: str, eski: str, mevcut: set[str]) -> str:
    """MEMORY.md iki tarafta da değiştiyse: yeni olanın satırları + eskide olup yenide olmayan satırlar.
    Hedef dosyası artık hiçbir tarafta olmayan bağlantı satırları atılır."""
    sonuc, gorulen = [], set()
    for satir in yeni.splitlines() + eski.splitlines():
        if not satir.strip():
            if sonuc and sonuc[-1].strip():
                sonuc.append(satir)
            continue
        k = _satir_anahtari(satir)
        if k in gorulen or (k[0] == "link" and Path(k[1]).name not in mevcut):
            continue
        gorulen.add(k)
        sonuc.append(satir)
    return "\n".join(sonuc).rstrip("\n") + "\n"


# --- eşitleme ----------------------------------------------------------------------------------------------------

def planla(yerel: Path, ayna: Path, taban: dict[str, str]) -> list[tuple[str, str]]:
    """[(ad, işlem)] işlem: aynaya | yerele | aynadan-sil | yerelden-sil | birlestir | catisma-yerel | catisma-ayna"""
    L, A = _dosyalar(yerel), _dosyalar(ayna)
    plan = []
    for ad in sorted(set(L) | set(A) | set(taban)):
        hl, ha, ht = (_ozet(L[ad]) if ad in L else None), (_ozet(A[ad]) if ad in A else None), taban.get(ad)
        if hl == ha:
            continue
        if ht is not None and hl == ht:          # yalnız ayna değişmiş
            plan.append((ad, "yerele" if ha else "yerelden-sil"))
        elif ht is not None and ha == ht:        # yalnız yerel değişmiş
            plan.append((ad, "aynaya" if hl else "aynadan-sil"))
        elif hl is None:                         # yerelde yok (ilk eşitleme ya da yerelde silinip aynada değişmiş)
            plan.append((ad, "yerele"))
        elif ha is None:
            plan.append((ad, "aynaya"))
        elif ad == INDEKS:
            plan.append((ad, "birlestir"))
        else:                                    # iki tarafta da farklı: yeni olan kazanır
            plan.append((ad, "catisma-yerel" if L[ad].stat().st_mtime >= A[ad].stat().st_mtime else "catisma-ayna"))
    return plan


def uygula(plan: list[tuple[str, str]], yerel: Path, ayna: Path) -> None:
    for ad, islem in sorted(plan, key=lambda x: x[0] == INDEKS):  # MEMORY.md en sona
        y, a = yerel / ad, ayna / ad
        if islem in ("aynaya", "catisma-yerel"):
            if a.exists():
                _yedekle(a, ayna, "ayna")
            shutil.copy2(y, a)
        elif islem in ("yerele", "catisma-ayna"):
            if y.exists():
                _yedekle(y, ayna, "yerel")
            shutil.copy2(a, y)
        elif islem == "aynadan-sil":
            _yedekle(a, ayna, "ayna-silindi")
            a.unlink()
        elif islem == "yerelden-sil":
            _yedekle(y, ayna, "yerel-silindi")
            y.unlink()
        elif islem == "birlestir":
            yeni_y = y.stat().st_mtime >= a.stat().st_mtime
            mevcut = set(_dosyalar(yerel)) | set(_dosyalar(ayna))
            metin = indeks_birlestir((y if yeni_y else a).read_text(encoding="utf-8"),
                                     (a if yeni_y else y).read_text(encoding="utf-8"), mevcut)
            _yedekle(y, ayna, "yerel")
            _yedekle(a, ayna, "ayna")
            y.write_text(metin, encoding="utf-8")
            shutil.copy2(y, a)


def calistir(komut: str, hafiza: str | None) -> int:
    yerel, ayna = hafiza_klasoru(hafiza), ayna_klasoru()
    if not data_root().exists():
        raise RuntimeError(f"Drive veri kökü erişilemiyor: {data_root()} (Google Drive açık mı?)")
    durum_yolu = ayna / "_durum" / f"{makine_adi()}.json"
    taban = json.loads(durum_yolu.read_text(encoding="utf-8")).get("dosyalar", {}) if durum_yolu.is_file() else {}
    plan = planla(yerel, ayna, taban)
    print(f"Hafıza: {yerel}\nAyna:   {ayna}\nMakine: {makine_adi()} · son eşitleme kaydı: {'var' if taban else 'yok (ilk eşitleme)'}")
    sayim: dict[str, int] = {}
    for ad, islem in plan:
        sayim[islem] = sayim.get(islem, 0) + 1
        print(f"  {islem:<14} {ad}")
    print("Değişiklik yok." if not plan else "Toplam: " + ", ".join(f"{k} {v}" for k, v in sorted(sayim.items())))
    if komut == "durum":
        return 0
    yerel.mkdir(parents=True, exist_ok=True)
    ayna.mkdir(parents=True, exist_ok=True)
    uygula(plan, yerel, ayna)
    son = {ad: _ozet(p) for ad, p in _dosyalar(yerel).items()}
    durum_yolu.parent.mkdir(parents=True, exist_ok=True)
    durum_yolu.write_text(json.dumps({"tarih": datetime.now().isoformat(timespec="seconds"), "dosyalar": son},
                                     ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Eşitlendi: {len(son)} dosya.")
    return 0


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(prog="hafiza_esitle.py")
    ap.add_argument("komut", choices=("durum", "esitle"))
    ap.add_argument("--hafiza", help="Claude Code hafıza klasörü (otomatik bulunamazsa)")
    a = ap.parse_args(argv)
    try:
        return calistir(a.komut, a.hafiza)
    except RuntimeError as h:
        print(f"[HATA] {h}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
