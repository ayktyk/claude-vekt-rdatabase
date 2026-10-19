#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""isbu_ofis.py — isbu-ofis (avukatın web iş takip uygulaması) asistan entegrasyonu istemcisi.

Sözleşme: isbu-ofis `docs/ENTEGRASYON.md` §2 (asistan uçları) ve `shared/src/integration.ts` (öneri şemaları).
Plan: docs/superpowers/specs/2026-10-10-isbu-ofis-entegrasyon-plani.md (Aşama 2).

- Kimlik: `Authorization: Bearer isbu_sk_...`. Anahtar sırasıyla ISBU_OFIS_API_KEY ortam değişkeninden, repo kökündeki
  `.env`'den, `config/.env`'den okunur. Anahtar hiçbir çıktıya, loga, hata mesajına yazılmaz.
- Okuma uçları (GET) uzun zaman aşımı ve yeniden denemeyle çağrılır (Render ücretsiz plan uykudan 60 sn+ uyanır);
  503 SCHEMA_NOT_READY ve 5xx'te `Retry-After` kadar beklenir.
- Yazma yalnız öneridir (`POST /proposals`) ve yalnız `gonder=True` açık çağrısıyla yapılır; varsayılan kuru
  çalışmadır. Öneri avukat uygulamada onaylamadan hiçbir kayda dokunmaz (K3).
- `request_id` deterministiktir: aynı tür + external_ref + case_ref + payload aynı kimliği verir; tekrar gönderim
  sunucuda `duplicate` olur, yığılma yapmaz. İçerik değişirse kimlik değişir.

Kullanım (yalnız okuma):
  python scripts/isbu_ofis.py saglik
  python scripts/isbu_ofis.py oku cases|pulse|hearings|deadlines|collections|proposals|changes [--json]
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
VARSAYILAN_TABAN = "https://isbu-ofis-api.onrender.com/api/integration"
ANAHTAR_ADI = "ISBU_OFIS_API_KEY"
TABAN_ADI = "ISBU_OFIS_API_URL"
ZAMAN_ASIMI = 120
DENEME = 4
BEKLEME = (5, 15, 30)
PARTI = 200  # ENTEGRASYON: items en çok 200


class IsbuHata(Exception):
    """isbu-ofis çağrı hatası. Mesajda anahtar YOK; yalnız yöntem, yol, durum kodu ve sunucunun hata metni."""

    def __init__(self, mesaj: str, durum: int | None = None, govde=None):
        super().__init__(mesaj)
        self.durum = durum
        self.govde = govde


def _env_dosyasi_oku(yol: Path, ad: str) -> str:
    if not yol.is_file():
        return ""
    for satir in yol.read_text(encoding="utf-8-sig", errors="replace").splitlines():
        s = satir.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, v = s.split("=", 1)
        if k.strip().removeprefix("export ").strip() == ad:
            return v.strip().strip('"').strip("'")
    return ""


def anahtar_oku(env_yollari: list[Path] | None = None) -> str:
    deger = os.environ.get(ANAHTAR_ADI, "").strip()
    if deger:
        return deger
    for yol in env_yollari if env_yollari is not None else [REPO_ROOT / ".env", REPO_ROOT / "config" / ".env"]:
        deger = _env_dosyasi_oku(yol, ANAHTAR_ADI)
        if deger:
            return deger
    raise IsbuHata(f"{ANAHTAR_ADI} bulunamadı (ortam değişkeni, .env veya config/.env)")


def request_id(kind: str, external_ref: str, payload: dict, case_ref: dict | None = None) -> str:
    """Deterministik kimlik: 'isbu-' + sha256(kanonik içerik)[:40] (45 karakter; sözleşme 8-100)."""
    kanonik = json.dumps({"k": kind, "r": external_ref, "c": case_ref or {}, "p": payload},
                         ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return "isbu-" + hashlib.sha256(kanonik.encode("utf-8")).hexdigest()[:40]


def _maskele(metin: str, anahtar: str) -> str:
    """Sunucudan dönen metinde anahtar geçerse (olmamalı) gizlenir."""
    s = str(metin)
    if anahtar:
        s = s.replace(anahtar, "<gizli>")
    return re.sub(r"isbu_sk_[A-Za-z0-9_\-]+", "isbu_sk_<gizli>", s)


class _YonlendirmeYok(urllib.request.HTTPRedirectHandler):
    """Yönlendirme izlenmez: Authorization başlığı başka bir adrese taşınmasın."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: D401
        return None


_VARSAYILAN_ACICI = urllib.request.build_opener(_YonlendirmeYok()).open


class IsbuOfis:
    """İnce HTTP istemcisi. `opener` testlerde sahte yanıt vermek için değiştirilir (ağ yok)."""

    def __init__(self, anahtar: str | None = None, taban: str | None = None, zaman_asimi: int = ZAMAN_ASIMI,
                 deneme: int = DENEME, bekleme: tuple = BEKLEME, opener=None, uyku=time.sleep):
        self._anahtar = anahtar if anahtar is not None else anahtar_oku()
        self.taban = (taban or os.environ.get(TABAN_ADI) or VARSAYILAN_TABAN).rstrip("/")
        self.zaman_asimi = zaman_asimi
        self.deneme = max(1, deneme)
        self.bekleme = bekleme
        self._ac = opener or _VARSAYILAN_ACICI
        self._uyku = uyku

    def __repr__(self) -> str:  # anahtar repr'de görünmez
        return f"IsbuOfis(taban={self.taban!r})"

    # --- alt katman ---------------------------------------------------------------------------------------------

    def _istek(self, yontem: str, yol: str, sorgu: dict | None = None, govde=None, yetkili: bool = True):
        url = (self.taban if yetkili else self.taban.rsplit("/integration", 1)[0]) + yol
        temiz = {k: v for k, v in (sorgu or {}).items() if v not in (None, "")}
        if temiz:
            url += "?" + urllib.parse.urlencode(temiz)
        basliklar = {"Accept": "application/json", "User-Agent": "buro-isbu-esitle/1"}
        veri = None
        if govde is not None:
            veri = json.dumps(govde, ensure_ascii=False).encode("utf-8")
            basliklar["Content-Type"] = "application/json; charset=utf-8"
        if yetkili:
            basliklar["Authorization"] = f"Bearer {self._anahtar}"
        return urllib.request.Request(url, data=veri, headers=basliklar, method=yontem)

    def _cagir(self, yontem: str, yol: str, sorgu: dict | None = None, govde=None, yetkili: bool = True,
               tekrar: bool = True):
        son_hata = None
        deneme = self.deneme if tekrar else 1
        for n in range(deneme):
            istek = self._istek(yontem, yol, sorgu, govde, yetkili)
            try:
                with self._ac(istek, timeout=self.zaman_asimi) as yanit:
                    ham = yanit.read().decode("utf-8", "replace")
                    durum = getattr(yanit, "status", 200)
                return durum, (json.loads(ham) if ham.strip() else None)
            except urllib.error.HTTPError as h:
                ham = h.read().decode("utf-8", "replace") if h.fp else ""
                try:
                    gov = json.loads(ham) if ham.strip() else None
                except ValueError:
                    gov = {"_ham": ham[:300]}
                if h.code == 207:
                    return 207, gov
                hata_metni = _maskele((gov or {}).get("error") or (gov or {}).get("code") or ham[:200], self._anahtar) \
                    if isinstance(gov, dict) else _maskele(ham[:200], self._anahtar)
                son_hata = IsbuHata(f"{yontem} {yol} -> HTTP {h.code}: {hata_metni}", h.code, gov)
                gecici = h.code >= 500 or h.code == 429
                if not gecici or n == deneme - 1:
                    raise son_hata from None
                bekle = self._retry_after(h.headers.get("Retry-After") if h.headers else None, n)
            except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as h:
                neden = getattr(h, "reason", h)
                son_hata = IsbuHata(f"{yontem} {yol} -> bağlantı hatası: {_maskele(neden, self._anahtar)}")
                if n == deneme - 1:
                    raise son_hata from None
                bekle = self._retry_after(None, n)
            self._uyku(bekle)
        raise son_hata or IsbuHata(f"{yontem} {yol} başarısız")

    def _retry_after(self, deger, n: int) -> float:
        try:
            if deger is not None:
                return min(float(deger), 120.0)
        except ValueError:
            pass
        return float(self.bekleme[min(n, len(self.bekleme) - 1)]) if self.bekleme else 0.0

    def get(self, yol: str, **sorgu):
        return self._cagir("GET", yol, sorgu)[1]

    # --- okuma uçları -------------------------------------------------------------------------------------------

    def saglik(self):
        """GET /api/health (kimliksiz) — Render'ı uyandırır."""
        return self._cagir("GET", "/health", yetkili=False)[1]

    def cases(self, include_closed: bool = False) -> list[dict]:
        return self.get("/cases", include_closed="1" if include_closed else None) or []

    def case(self, case_id: str) -> dict:
        if not re.fullmatch(r"[0-9a-fA-F-]{36}", str(case_id or "")):
            raise IsbuHata(f"geçersiz dava id: {case_id!r}")
        return self.get(f"/cases/{case_id}") or {}

    def pulse(self) -> list[dict]:
        return self.get("/pulse") or []

    def hearings_upcoming(self, days: int = 30) -> list[dict]:
        return self.get("/hearings/upcoming", days=int(days)) or []

    def deadlines(self, days: int = 60) -> list[dict]:
        return self.get("/deadlines", days=int(days)) or []

    def collections_outstanding(self) -> dict:
        return self.get("/collections/outstanding") or {}

    def proposals(self, status: str = "all", since: str | None = None) -> list[dict]:
        return self.get("/proposals", status=status, since=since) or []

    def changes(self, since: str | None = None, cursor: str | None = None, limit: int | None = None) -> dict:
        if not since and not cursor:
            raise IsbuHata("changes için since (ISO) ya da cursor gerekir")
        return self.get("/changes", cursor=cursor, since=None if cursor else since, limit=limit) or {}

    def changes_hepsi(self, since: str, en_cok_sayfa: int = 50) -> dict:
        """İmleçle tüm sayfaları toplar (truncated=false olana kadar)."""
        toplam = {"cases": [], "hearings": [], "tasks": [], "diary": []}
        yanit = self.changes(since=since)
        for _ in range(en_cok_sayfa):
            for k in toplam:
                toplam[k] += yanit.get(k) or []
            if not yanit.get("truncated"):
                break
            yanit = self.changes(cursor=yanit["next_cursor"])
        toplam["next_cursor"] = yanit.get("next_cursor")
        return toplam

    # --- öneri gönderme (YAZMA — yalnız açık çağrıyla) ----------------------------------------------------------

    def post_proposals(self, items: list[dict], gonder: bool = False) -> list[dict]:
        """Önerileri gönderir. `gonder=True` verilmezse HİÇBİR istek atılmaz ve IsbuHata yükselir.
        Her öğe önce Python tarafında şemaya göre doğrulanır; hatalı öğe varsa hiçbir şey gönderilmez."""
        if gonder is not True:
            raise IsbuHata("kuru çalışma: öneri gönderimi için açık gonder=True (CLI'da --gonder) gerekir")
        import isbu_sema
        hatalar = [f"{i}: {h}" for i, it in enumerate(items) for h in isbu_sema.oge_dogrula(it)]
        if hatalar:
            raise IsbuHata("şema doğrulaması başarısız, gönderilmedi: " + "; ".join(hatalar[:10]))
        sonuclar = []
        for i in range(0, len(items), PARTI):
            durum, gov = self._cagir("POST", "/proposals", govde={"items": items[i:i + PARTI]}, tekrar=False)
            sonuclar.append({"http": durum, **(gov or {})})
        return sonuclar


def _main(argv: list[str]) -> int:
    for akim in (sys.stdout, sys.stderr):
        try:
            akim.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    import argparse
    ap = argparse.ArgumentParser(prog="isbu_ofis.py", description="isbu-ofis okuma istemcisi (yalnız GET)")
    alt = ap.add_subparsers(dest="komut", required=True)
    alt.add_parser("saglik")
    o = alt.add_parser("oku")
    o.add_argument("uc", choices=["cases", "pulse", "hearings", "deadlines", "collections", "proposals", "changes"])
    o.add_argument("--since", default="")
    o.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)
    try:
        api = IsbuOfis()
        if args.komut == "saglik":
            print(json.dumps(api.saglik(), ensure_ascii=False))
            return 0
        veri = {"cases": lambda: api.cases(include_closed=True), "pulse": api.pulse,
                "hearings": lambda: api.hearings_upcoming(365), "deadlines": lambda: api.deadlines(3650),
                "collections": api.collections_outstanding, "proposals": api.proposals,
                "changes": lambda: api.changes_hepsi(args.since or "2026-01-01T00:00:00Z")}[args.uc]()
        if args.json:
            print(json.dumps(veri, ensure_ascii=False, indent=1))
        else:
            n = len(veri) if isinstance(veri, list) else {k: len(v) for k, v in veri.items() if isinstance(v, list)}
            print(f"{args.uc}: {n}")
        return 0
    except IsbuHata as h:
        print(f"HATA: {h}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
