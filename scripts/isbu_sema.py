#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""isbu_sema.py — isbu-ofis öneri (proposal) şemalarının Python karşılığı.

Kaynak: isbu-ofis `shared/src/integration.ts` (`proposalPayloadSchemas`, `proposalItemSchema`, `caseRefSchema`).
Sunucu aynı denetimi zaten yapar; burada amaç hatalı öğeyi göndermeden yakalamak ve "boş değer gönderme"
kuralını uygulamaktır: metin alanı trim sonrası boşsa alan payload'dan çıkarılır (sunucuda da "gönderilmemiş"
sayılır), `None` değer hiç gönderilmez. Bilinmeyen alan reddedilir (zod `.strict()`).
Şema isbu-ofis tarafında değişirse bu dosya da güncellenir (test: test_isbu_esitle.py).
"""
from __future__ import annotations

import re
from datetime import date

KINDS = ("case_upsert", "hearing_upsert", "deadline_upsert", "diary_add", "enforcement_upsert", "task_add",
         "next_step", "status_change")
SOURCES = ("uyap", "kalkan", "icra_ozet", "asistan")
CASE_STATUS = ("active", "istinafta", "yargıtayda", "passive", "closed", "won", "lost", "settled")
CASE_TYPE = ("iscilik_alacagi", "bosanma", "velayet", "mal_paylasimi", "kira", "tuketici", "icra", "ceza", "idare",
             "diger")
PRIORITY = ("low", "medium", "high", "urgent")
CASE_UPSERT_FIELDS = ("title", "case_number", "court_name", "case_type", "custom_case_type", "description",
                      "start_date", "buro_kodu", "contracted_fee", "is_cmk_assignment")
ENFORCEMENT_KEYS = ("alacakli", "borclu", "rolumuz", "alacak", "tahsilat", "odeme_emri", "itiraz", "kesinlesme",
                    "son_islem", "tasinmaz", "arac", "banka", "sgk", "fiili", "sorgu_onerisi", "not")

_GUN_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_ZAMAN_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$")
_UUID_RE = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
_TUTAR_RE = re.compile(r"^\d+(\.\d{1,2})?$")


def gun_mu(v) -> bool:
    if not isinstance(v, str) or not _GUN_RE.match(v):
        return False
    try:
        date.fromisoformat(v)
        return True
    except ValueError:
        return False


def zaman_mi(v) -> bool:
    return isinstance(v, str) and bool(_ZAMAN_RE.match(v)) and gun_mu(v[:10])


# alan türleri: ("text", max) opsiyonel boşalabilen metin · ("str", min, max) zorunlu-biçimli metin ·
# ("enum", değerler) · ("bool",) · ("day",) · ("datetime",) · ("day_or_dt", nullable) · ("uuid",) ·
# ("amount",) · ("overwrite",) · ("enf_data",)
SEMALAR: dict[str, dict[str, tuple]] = {
    "case_upsert": {
        "title": ("str", 3, 500), "client_id": ("uuid",), "client_name": ("str", 2, 255),
        "case_number": ("text", 100), "court_name": ("text", 255), "case_type": ("enum", CASE_TYPE),
        "custom_case_type": ("text", 255), "description": ("text", 10000), "start_date": ("day",),
        "status": ("enum", CASE_STATUS), "buro_kodu": ("text", 20), "contracted_fee": ("amount",),
        "is_cmk_assignment": ("bool",), "overwrite": ("overwrite",),
    },
    "hearing_upsert": {
        "hearing_date": ("datetime",), "court_room": ("text", 100), "judge": ("text", 255), "notes": ("text", 5000),
        "result": ("enum", ("pending", "completed", "postponed", "cancelled")),
    },
    "deadline_upsert": {
        "title": ("str", 1, 450), "due_date": ("day_or_dt", True), "conditional": ("bool",),
        "condition": ("text", 500), "description": ("text", 5000), "priority": ("enum", PRIORITY),
        "legal_basis": ("text", 200), "deadline_category": ("text", 40),
        "deadline_severity": ("enum", ("hak_dusurucu", "zamanasimi", "usul")), "trigger_event_date": ("day",),
        "trigger_event_label": ("text", 200), "status": ("enum", ("pending", "completed", "cancelled")),
    },
    "diary_add": {
        "title": ("text", 255), "content": ("str", 1, 10000), "occurred_at": ("datetime",),
        "next_step": ("text", 2000), "next_step_due_date": ("day",),
    },
    "enforcement_upsert": {"data": ("enf_data",), "source_ref": ("text", 200)},
    "task_add": {
        "title": ("str", 1, 500), "description": ("text", 5000), "due_date": ("day_or_dt", True),
        "priority": ("enum", PRIORITY), "category": ("enum", ("dava", "cmk", "arabuluculuk", "genel")),
    },
    "next_step": {
        "target": ("enum", ("workspace", "diary")), "stage": ("text", 120), "waiting_for": ("text", 500),
        "check_date": ("day",), "next_step": ("text", 2000), "next_step_due_date": ("day",),
    },
    "status_change": {"status": ("enum", CASE_STATUS), "close_date": ("day",), "note": ("text", 2000)},
}
ZORUNLU = {"hearing_upsert": ("hearing_date",), "deadline_upsert": ("title",), "diary_add": ("content",),
           "enforcement_upsert": ("data",), "task_add": ("title",), "status_change": ("status",)}


def _json_degeri_mi(v, derinlik: int = 0) -> bool:
    if derinlik > 20:
        return False
    if v is None or isinstance(v, (bool, int, float)):
        return True
    if isinstance(v, str):
        return len(v) <= 5000
    if isinstance(v, list):
        return len(v) <= 200 and all(_json_degeri_mi(x, derinlik + 1) for x in v)
    if isinstance(v, dict):
        return all(isinstance(k, str) and _json_degeri_mi(x, derinlik + 1) for k, x in v.items())
    return False


def _alan(ad: str, tur: tuple, v, hatalar: list[str]):
    """Alanı doğrular; (değer, gönderilsin_mi) döner."""
    t = tur[0]
    if t == "text":
        if not isinstance(v, str):
            hatalar.append(f"{ad}: metin olmalı")
            return None, False
        s = v.strip()
        if len(s) > tur[1]:
            hatalar.append(f"{ad}: en çok {tur[1]} karakter")
        return s, bool(s)
    if t == "str":
        if not isinstance(v, str) or not (tur[1] <= len(v.strip()) <= tur[2]):
            hatalar.append(f"{ad}: {tur[1]}-{tur[2]} karakter metin olmalı")
            return None, False
        return v.strip(), True
    if t == "enum":
        if v not in tur[1]:
            hatalar.append(f"{ad}: geçersiz değer {v!r}")
        return v, True
    if t == "bool":
        if not isinstance(v, bool):
            hatalar.append(f"{ad}: true/false olmalı")
        return v, True
    if t == "day":
        if not gun_mu(v):
            hatalar.append(f"{ad}: YYYY-AA-GG olmalı")
        return v, True
    if t == "datetime":
        if not zaman_mi(v):
            hatalar.append(f"{ad}: saat dilimli ISO 8601 olmalı")
        return v, True
    if t == "day_or_dt":
        if v is None:
            return None, False  # null gönderilmez (boş değer kuralı)
        if not (gun_mu(v) or zaman_mi(v)):
            hatalar.append(f"{ad}: YYYY-AA-GG veya saat dilimli ISO olmalı")
        return v, True
    if t == "uuid":
        if not isinstance(v, str) or not _UUID_RE.match(v):
            hatalar.append(f"{ad}: uuid olmalı")
        return v, True
    if t == "amount":
        if not isinstance(v, str) or not _TUTAR_RE.match(v):
            hatalar.append(f"{ad}: tutar '123' veya '123.45' biçiminde olmalı")
        return v, True
    if t == "overwrite":
        if not isinstance(v, list) or len(v) > 20 or any(x not in CASE_UPSERT_FIELDS for x in v):
            hatalar.append(f"{ad}: yalnız {', '.join(CASE_UPSERT_FIELDS)}")
        return v, bool(v)
    if t == "enf_data":
        if not isinstance(v, dict):
            hatalar.append(f"{ad}: nesne olmalı")
            return None, False
        bilinmeyen = sorted(set(v) - set(ENFORCEMENT_KEYS))
        if bilinmeyen:
            hatalar.append(f"{ad}: bilinmeyen anahtar {', '.join(bilinmeyen)}")
        temiz = {}
        for k, x in v.items():
            if x is None or (isinstance(x, str) and not x.strip()):
                continue  # boş değer gönderilmez
            if not _json_degeri_mi(x):
                hatalar.append(f"{ad}.{k}: geçersiz JSON değeri (metin en çok 5000)")
            temiz[k] = x.strip() if isinstance(x, str) else x
        return temiz, True
    raise ValueError(f"bilinmeyen alan türü {t}")


def payload_temizle(kind: str, payload: dict) -> tuple[dict, list[str]]:
    """Payload'ı şemaya göre doğrular ve boş değerleri çıkarır. (temiz_payload, hatalar)."""
    hatalar: list[str] = []
    if kind not in SEMALAR:
        return {}, [f"kind geçersiz: {kind!r}"]
    if not isinstance(payload, dict):
        return {}, ["payload nesne olmalı"]
    sema = SEMALAR[kind]
    bilinmeyen = sorted(set(payload) - set(sema))
    if bilinmeyen:
        hatalar.append(f"bilinmeyen alan: {', '.join(bilinmeyen)}")
    temiz: dict = {}
    for ad, v in payload.items():
        if ad not in sema or v is None:
            continue
        deger, gonder = _alan(ad, sema[ad], v, hatalar)
        if gonder:
            temiz[ad] = deger
    for ad in ZORUNLU.get(kind, ()):
        if ad not in temiz:
            hatalar.append(f"{ad}: zorunlu")
    if kind == "deadline_upsert" and not temiz.get("due_date") and not temiz.get("conditional"):
        hatalar.append("due_date: süre tarihi yoksa conditional=true ve koşul metni gönderilmeli")
    if kind == "next_step":
        hedef = temiz.get("target", "workspace")
        if hedef == "workspace" and not any(temiz.get(k) for k in ("stage", "waiting_for", "check_date")):
            hatalar.append("workspace için stage/waiting_for/check_date gerekli")
        if hedef == "diary" and not temiz.get("next_step"):
            hatalar.append("diary için next_step gerekli")
    return temiz, hatalar


def case_ref_dogrula(ref) -> list[str]:
    if not isinstance(ref, dict):
        return ["case_ref nesne olmalı"]
    h = []
    bilinmeyen = sorted(set(ref) - {"id", "external_ref", "buro_kodu", "case_number", "court_name"})
    if bilinmeyen:
        h.append(f"case_ref bilinmeyen alan: {', '.join(bilinmeyen)}")
    if "id" in ref and not (isinstance(ref["id"], str) and _UUID_RE.match(ref["id"])):
        h.append("case_ref.id uuid olmalı")
    for k, en in (("external_ref", 200), ("buro_kodu", 20), ("case_number", 100), ("court_name", 255)):
        if k in ref and not (isinstance(ref[k], str) and 1 <= len(ref[k].strip()) <= en):
            h.append(f"case_ref.{k}: 1-{en} karakter")
    if not (ref.get("id") or ref.get("external_ref") or ref.get("buro_kodu")
            or (ref.get("case_number") and ref.get("court_name"))):
        h.append("case_ref: id, external_ref, buro_kodu veya case_number+court_name gerekir")
    return h


def oge_dogrula(oge) -> list[str]:
    """POST /proposals öğesinin tamamını doğrular (proposalItemSchema + tür payload şeması)."""
    if not isinstance(oge, dict):
        return ["öğe nesne olmalı"]
    h = []
    bilinmeyen = sorted(set(oge) - {"kind", "external_ref", "case_ref", "payload", "summary", "reason", "source",
                                    "request_id"})
    if bilinmeyen:
        h.append(f"bilinmeyen öğe alanı: {', '.join(bilinmeyen)}")
    if oge.get("kind") not in KINDS:
        h.append(f"kind geçersiz: {oge.get('kind')!r}")
    if oge.get("source") not in SOURCES:
        h.append(f"source geçersiz: {oge.get('source')!r}")
    for k, alt, ust in (("external_ref", 1, 200), ("summary", 1, 1000), ("request_id", 8, 100)):
        v = oge.get(k)
        if not (isinstance(v, str) and alt <= len(v.strip()) <= ust):
            h.append(f"{k}: {alt}-{ust} karakter")
    if "reason" in oge and not (isinstance(oge["reason"], str) and len(oge["reason"].strip()) <= 5000):
        h.append("reason: en çok 5000 karakter")
    if "case_ref" in oge:
        h += case_ref_dogrula(oge["case_ref"])
    if oge.get("kind") in KINDS:
        temiz, ph = payload_temizle(oge["kind"], oge.get("payload"))
        h += [f"payload.{x}" for x in ph]
        if temiz != oge.get("payload"):
            h.append("payload temizlenmemiş (boş değer veya kırpılmamış metin var)")
    return h
