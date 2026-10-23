#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""isbu_mcp.py — isbu-ofis için MCP sunucusu: asistan isbu-ofis'i Yargı PRO araçları gibi kullanır.

Avukat onayı 2026-10-12 ("özellikle isbu ofis mcp iyi olacak"); plan Aşama 3
(docs/superpowers/specs/2026-10-10-isbu-ofis-entegrasyon-plani.md).

- Okuma araçları serbesttir: dava listesi ve arama, dava ayrıntısı, dosya nabzı, yaklaşan duruşmalar, süreli işler,
  açık tahsilat, öneriler, avukatın son değişiklikleri.
- Yazma YALNIZ öneridir (K3): `isbu_oneri` varsayılan olarak kuru çalışır ve öneriyi gösterir; `gonder=true` ile
  öneri kuyruğuna gider, avukat uygulamada onaylamadan hiçbir kayda dokunmaz. Doğrudan kayıt yazan araç yoktur.
- Anahtar `isbu_ofis.anahtar_oku()` ile okunur; hiçbir araç çıktısına yazılmaz.

Çalıştırma: `python scripts/isbu_mcp.py` (stdio). Kayıt: repo kökü `.mcp.json` -> "isbu-ofis".
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mcp.server.fastmcp import FastMCP  # noqa: E402

import isbu_ofis  # noqa: E402

mcp = FastMCP("isbu-ofis")
_api: isbu_ofis.IsbuOfis | None = None
DAVA_ALANLARI = ("id", "buroKodu", "title", "clientName", "courtName", "caseNumber", "caseType", "status",
                 "isCmkAssignment", "lastActivityAt", "nextItem", "openBalance", "flags")


def api() -> isbu_ofis.IsbuOfis:
    global _api
    if _api is None:
        _api = isbu_ofis.IsbuOfis()
    return _api


def _kisa(d: dict) -> dict:
    return {k: d.get(k) for k in DAVA_ALANLARI if d.get(k) not in (None, "", [], {})}


def _tr(metin) -> str:
    return str(metin or "").replace("İ", "i").replace("I", "ı").lower()


def _hata(h: Exception) -> dict:
    return {"hata": str(h)}


@mcp.tool()
def isbu_davalar(arama: str = "", kapali_dahil: bool = False, en_cok: int = 100) -> dict:
    """isbu-ofis dava listesi (kısa alanlar). `arama`: büro kodu (2026-016), müvekkil, başlık, mahkeme veya esas no
    içinde geçen metin; boşsa hepsi. Dava kimliği (`id`) diğer araçlarda kullanılır."""
    try:
        davalar = api().cases(include_closed=kapali_dahil)
    except isbu_ofis.IsbuHata as h:
        return _hata(h)
    if arama.strip():
        a = _tr(arama.strip())
        davalar = [d for d in davalar if any(a in _tr(d.get(k)) for k in
                                              ("buroKodu", "clientName", "title", "courtName", "caseNumber"))]
    return {"toplam": len(davalar), "davalar": [_kisa(d) for d in davalar[:max(1, en_cok)]]}


@mcp.tool()
def isbu_dava(dava_id: str) -> dict:
    """Tek davanın ayrıntısı: müvekkil, duruşmalar, işler, süreler, günlük, tahsilat (isbu-ofis kaydı olduğu gibi)."""
    try:
        return api().case(dava_id)
    except isbu_ofis.IsbuHata as h:
        return _hata(h)


@mcp.tool()
def isbu_nabiz(yalniz_uyarili: bool = True) -> dict:
    """Dosya Nabzı: her dosyanın son hareketi, sıradaki işi, açık bakiyesi ve uyarıları (atıl, sıradaki iş yok,
    tahsilat bekliyor, kapanmaya hazır, süre yaklaşıyor). Varsayılan: yalnız uyarısı olan dosyalar."""
    try:
        nabiz = api().pulse()
    except isbu_ofis.IsbuHata as h:
        return _hata(h)
    if yalniz_uyarili:
        nabiz = [n for n in nabiz if n.get("flags")]
    return {"toplam": len(nabiz), "dosyalar": nabiz}


@mcp.tool()
def isbu_durusmalar(gun: int = 30) -> dict:
    """Önümüzdeki `gun` gün içindeki duruşmalar (tarih, mahkeme, salon, dava)."""
    try:
        return {"durusmalar": api().hearings_upcoming(gun)}
    except isbu_ofis.IsbuHata as h:
        return _hata(h)


@mcp.tool()
def isbu_sureli_isler(gun: int = 60) -> dict:
    """Önümüzdeki `gun` gün içinde son günü gelen süreli işler (kesin ve koşullu)."""
    try:
        return {"sureli_isler": api().deadlines(gun)}
    except isbu_ofis.IsbuHata as h:
        return _hata(h)


@mcp.tool()
def isbu_tahsilatlar() -> dict:
    """Açık tahsilat ve vadesi geçmiş taksitler."""
    try:
        return api().collections_outstanding()
    except isbu_ofis.IsbuHata as h:
        return _hata(h)


@mcp.tool()
def isbu_oneriler(durum: str = "pending") -> dict:
    """Asistanın öneri kuyruğu. durum: pending | approved | rejected | applied | superseded | all."""
    try:
        return {"oneriler": api().proposals(durum)}
    except isbu_ofis.IsbuHata as h:
        return _hata(h)


@mcp.tool()
def isbu_degisiklikler(since: str) -> dict:
    """Avukatın `since` (ISO zaman, ör. 2026-10-12T00:00:00Z) sonrasında uygulamada yaptığı değişiklikler:
    davalar, duruşmalar, işler, günlük."""
    try:
        return api().changes_hepsi(since)
    except isbu_ofis.IsbuHata as h:
        return _hata(h)


@mcp.tool()
def isbu_oneri(tur: str, external_ref: str, dava_id: str, payload: dict, ozet: str, gerekce: str,
               kaynak: str = "asistan", gonder: bool = False) -> dict:
    """isbu-ofis'e ÖNERİ yazar (kayda doğrudan yazmaz; avukat uygulamada onaylar).
    tur: case_upsert | hearing_upsert | deadline_upsert | diary_add | enforcement_upsert | task_add | ...
    external_ref: tekrar güvenliği anahtarı (aynı ref için bekleyen öneri güncellenir). kaynak: uyap | kalkan |
    icra_ozet | asistan. `gonder=false` (varsayılan) yalnız şemaya göre doğrulanmış öneriyi gösterir; avukat
    görmeden `gonder=true` kullanılmaz.
    SADE STANDART (20.10.2026, docs/isbu-oneri-sade-standart.md): ozet = Excel satırı gibi tek satır
    ("Müvekkil – Karşı taraf · Mahkeme No · Konu"), gerekce = "Sıradaki iş: … (kaynak)"; dış kimlik, KALKAN#,
    tür/betik adı, önbellek/klon gibi sistem dili yasak — ihlalde öneri reddedilir (isbu_sade.denetle_oge)."""
    import isbu_esitle
    try:
        oge = isbu_esitle.oge(tur, external_ref, dava_id, payload, ozet, gerekce, kaynak)
    except ValueError as h:
        return _hata(h)
    if not gonder:
        return {"kuru_calisma": True, "oneri": oge}
    try:
        return {"gonderildi": api().post_proposals([oge], gonder=True)}
    except isbu_ofis.IsbuHata as h:
        return _hata(h)


if __name__ == "__main__":
    mcp.run()
