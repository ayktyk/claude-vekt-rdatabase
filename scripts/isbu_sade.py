#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""isbu_sade.py — isbu-ofis'e giden önerilerin SADE metin standardı (avukat kararı 20.10.2026).

Ölçü, avukatın iş takip Excel'indeki bir satırdır (VEGA HUKUK .xlsx, DOSYALAR sayfası):
  Müvekkil · Karşı Taraf · Mahkeme · Dosya No · Konu · Aşama · Özet (2-3 satır) · Sıradaki İş (tek satır).

Kurallar:
- `summary` (uygulamada kalın başlık): tek satır, Excel satırı gibi. "Müvekkil – Karşı taraf · Mahkeme No · Konu".
- `reason` (uygulamada "Gerekçe:"): en çok iki kısa cümle; önce "Sıradaki iş: …", sonra kaynak tek kelimeyle
  ("Excel satır 12", "UYAP duruşma listesi"). Yoksa yalnız kaynak.
- Sistem dili YASAK: dış kimlik (uyap:avukat:…), KALKAN#, request_id, external_ref, eslesme-C, önbellek, klon,
  case_upsert gibi tür adları, "dış kimlik bağlama", "uyap_ortak", dosya/klasör yolları, kısa UUID'ler.
- `description` / `next_step` / `waiting_for` payload metinleri de aynı kurala tabidir (avukat bunları ekranda görür).

`denetle()` bu kuralı zorlar: isbu_esitle.oge() her öneriyi buradan geçirir; ihlal ValueError olur.
"""
from __future__ import annotations

import re

JARGON = [
    (re.compile(r"uyap:(avukat|vatandas|vatandaş):", re.I), "dış kimlik (uyap:…)"),
    (re.compile(r"KALKAN#", re.I), "KALKAN#"),
    (re.compile(r"\b(request_id|external_ref|case_ref|external[_ ]ref)\b", re.I), "API alan adı"),
    (re.compile(r"\beslesme-[A-Z]\b"), "eşleşme tablosu kodu"),
    (re.compile(r"\b(case_upsert|hearing_upsert|deadline_upsert|diary_add|enforcement_upsert|task_add|next_step|"
                r"status_change)\b"), "öneri türü adı"),
    (re.compile(r"uyap_ortak|isbu_esitle|isbu_sema|icra_ozet\b|uyap_esitle", re.I), "betik adı"),
    (re.compile(r"dış kimlik", re.I), "dış kimlik"),
    (re.compile(r"önbelle[kğ]", re.I), "önbellek"),
    (re.compile(r"\bklon(u|dan|daki|lar)?\b", re.I), "klon"),
    (re.compile(r"[A-Za-z]:\\|/Aktif Davalar/|\\Aktif Davalar\\"), "dosya yolu"),
    (re.compile(r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b", re.I), "UUID"),
    (re.compile(r"\bisbu-[0-9a-f]{40}\b"), "istek kimliği"),
]
OZET_SINIR = 1000
GEREKCE_SINIR = 400  # Excel "Sıradaki İş" hücresi ölçüsünde; şema 5000'e izin verir ama avukat kısa istiyor


def denetle(metin: str | None, alan: str = "metin") -> list[str]:
    """Metindeki sistem dilini listeler (boş liste = sade)."""
    s = str(metin or "")
    return [f"{alan}: {ad}" for desen, ad in JARGON if desen.search(s)]


def denetle_oge(oge: dict) -> list[str]:
    """Öneri öğesinin avukata görünen bütün metinlerini denetler."""
    h = denetle(oge.get("summary"), "summary") + denetle(oge.get("reason"), "reason")
    if len(str(oge.get("reason") or "")) > GEREKCE_SINIR:
        h.append(f"reason: {GEREKCE_SINIR} karakterden uzun (Excel 'Sıradaki İş' ölçüsü)")
    p = oge.get("payload") or {}
    for alan in ("description", "next_step", "waiting_for", "notes", "content", "title", "condition", "note"):
        if isinstance(p.get(alan), str):
            h += denetle(p[alan], f"payload.{alan}")
    return h


def _temiz(*parcalar) -> list[str]:
    return [re.sub(r"\s+", " ", str(x)).strip() for x in parcalar if x is not None and str(x).strip()]


def tek_satir(metin, sinir: int = 300) -> str:
    """Çok satırlı Excel hücresini tek satıra indirir."""
    s = re.sub(r"\s*\n+\s*", " · ", str(metin or "").strip())
    s = re.sub(r"\s+", " ", s)
    return (s[: sinir - 1] + "…") if len(s) > sinir else s


def ozet_satiri(muvekkil, karsi_taraf=None, mahkeme=None, dosya_no=None, konu=None, asama=None) -> str:
    """Excel satırı gibi tek satır başlık: 'Müvekkil – Karşı taraf · Mahkeme No · Konu · Aşama'."""
    taraflar = " – ".join(_temiz(muvekkil, karsi_taraf))
    yer = " ".join(_temiz(mahkeme, dosya_no))
    parcalar = [p for p in (taraflar, yer, *_temiz(konu, asama)) if p]
    return tek_satir(" · ".join(parcalar), OZET_SINIR)


def gerekce(siradaki_is=None, kaynak: str = "") -> str:
    """'Sıradaki iş: … (Excel satır 12)' — sıradaki iş yoksa yalnız kaynak."""
    s = tek_satir(siradaki_is, GEREKCE_SINIR - 40) if siradaki_is else ""
    kaynak = tek_satir(kaynak, 60)
    if s and kaynak:
        return f"Sıradaki iş: {s} ({kaynak})"
    if s:
        return f"Sıradaki iş: {s}"
    return kaynak


def ozet_metni(ozet, sinir: int = 1500) -> str:
    """Excel 'Özet' hücresi: satırlar korunur, fazlası kırpılır (description alanı için)."""
    s = "\n".join(l.strip() for l in str(ozet or "").splitlines() if l.strip())
    return (s[: sinir - 1] + "…") if len(s) > sinir else s


KONU_TURU = {  # Excel 'Konu' -> isbu case_type (+ özel tür)
    "işçilik alacağı": ("iscilik_alacagi", ""), "işe iade": ("iscilik_alacagi", "İşe iade"),
    "iş kazası": ("diger", "İş kazası"), "boşanma / aile": ("bosanma", ""), "miras": ("diger", "Miras"),
    "taşınmaz / tapu": ("diger", "Taşınmaz / tapu"), "kira": ("kira", ""), "tüketici": ("tuketici", ""),
    "araç / sigorta tazminat": ("diger", "Araç / sigorta tazminat"),
    "trafik kazası tazminat": ("diger", "Trafik kazası tazminat"),
    "alacak / itirazın iptali": ("diger", "Alacak / itirazın iptali"), "icra takibi": ("icra", ""),
    "icra şikâyeti": ("icra", "İcra şikâyeti"), "icra şikayeti": ("icra", "İcra şikâyeti"), "ceza": ("ceza", ""),
    "idari / sgk": ("idare", ""), "diğer": ("diger", ""),
}


def _katla(s) -> str:
    """Türkçe küçük harf: Python'da 'İ'.lower() 'i̇' (i + U+0307) verir; önce İ/I eşlenir."""
    return re.sub(r"\s+", " ", str(s or "").replace("İ", "i").replace("I", "ı").lower().strip())


_KONU_KATLI = {_katla(k): v for k, v in KONU_TURU.items()}


def dava_turu(konu) -> tuple[str, str]:
    return _KONU_KATLI.get(_katla(konu), ("diger", str(konu or "").strip()))
