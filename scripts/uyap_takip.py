#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""uyap_takip.py — Yargı PRO masaüstü uygulamasından günlük UYAP okuması ve pano için takip raporu.

Kural kaynağı: AGENTS.md -> "Yargı PRO masaüstü komut satırı" ve "Takip araçları".
- `oku` canlı UYAP okumasını günde BİR kez yapar ve Aktif Davalar/00-uyap-onbellek.json dosyasına yazar.
  `--supur` verilirse önce UYAP taraması yapılır (yalnız `/pano bugun` veya avukatın açık eşitleme komutuyla).
  UYAP_ISLEM_SINIRLI alınırsa kalan canlı okumalar o gün yapılmaz.
- `rapor` yalnız önbellekten çalışır (UYAP'a gitmez): Dikkat gerektiren olaylar, yaklaşan duruşmalar,
  uygulamada olmayan hareketli dosyalar, gelen evrak. CMK dosyaları da raporda yer alır ve işaretlenir.

Kullanım:
  python scripts/uyap_takip.py oku [--supur] [--zorla]
  python scripts/uyap_takip.py rapor [--gun 7] [--durusma-gun 14]
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import uyap_ortak as uo  # noqa: E402

YEREL_OKUMALAR = (("dosyalarim",), ("hareketler", "--gun", "30"), ("gelen-evraklar", "--gun", "30"))
CANLI_OKUMALAR = (("durusmalar",), ("icra",))
ANAHTAR = {"dosyalarim": "dosyalarim", "hareketler": "hareketler", "gelen-evraklar": "gelen",
           "durusmalar": "durusmalar", "icra": "icra"}


def oku(supur: bool = False, zorla: bool = False, yol: Path | None = None) -> dict:
    yol = yol or uo.onbellek_yolu()
    eski = uo.onbellek_oku(yol)
    bugun = uo.bugun_str()
    if eski.get("tarih") == bugun and not zorla:
        print(f"Bugün okunmuş ({eski.get('okundu')}); tarama ve canlı okuma tekrarlanmaz. Yeniden okumak için --zorla.")
        return eski
    veri = {"tarih": bugun, "okundu": datetime.now().isoformat(timespec="seconds"), "hatalar": {}}
    durum, _ = uo.oku("durum")
    veri["durum"] = durum
    if durum.get("_ham") or not (durum.get("uyapErisim") or {}).get("ok"):
        veri["hatalar"]["durum"] = "uygulama kapalı veya UYAP erişimi yok"
    if supur and not veri["hatalar"]:
        yanit, _ = uo.cli("supur", zaman=900)
        veri["supur"] = yanit
    for arglar in YEREL_OKUMALAR:
        yanit, kod = uo.oku(*arglar)
        veri[ANAHTAR[arglar[0]]] = yanit
        if kod != 0 or "_ham" in yanit:
            veri["hatalar"][arglar[0]] = uo.hata_kodu(yanit) or yanit.get("_ham", "okunamadı")
    sinir = False
    for arglar in CANLI_OKUMALAR:
        if sinir:
            veri["hatalar"][arglar[0]] = "UYAP sınırı nedeniyle bugün okunmadı"
            continue
        yanit, kod = uo.oku(*arglar)
        if uo.sinir_mi(yanit):
            sinir = True
            veri["hatalar"][arglar[0]] = uo.hata_kodu(yanit)
            continue
        veri[ANAHTAR[arglar[0]]] = yanit
    yol.write_text(json.dumps(veri, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"Önbellek yazıldı: {yol} · hata: {veri['hatalar'] or 'yok'}")
    return veri


def _liste(veri: dict, anahtar: str, alt: str) -> list[dict]:
    return [x for x in ((veri.get(anahtar) or {}).get(alt) or []) if isinstance(x, dict)]


def rapor(veri: dict, eslesme: list[dict], gun: int = 7, durusma_gun: int = 14, bugun: date | None = None,
          cmk: list[dict] | None = None) -> str:
    bugun = bugun or date.today()
    if not veri:
        return "## UYAP takibi\n\nÖnbellek yok: önce `python scripts/uyap_takip.py oku` çalıştırılır.\n"
    hareketler = _liste(veri, "hareketler", "hareketler")
    gelen = _liste(veri, "gelen", "hareketler")
    durusmalar = _liste(veri, "durusmalar", "durusmalar")
    yerel = _liste(veri, "dosyalarim", "davalar")
    sinir_tarihi = bugun - timedelta(days=gun)

    def etiket(x):
        e = uo.eslesme_bul(eslesme, x.get("birimAdi"), x.get("dosyaNo"))
        parca = []
        if e and e.get("klasor"):
            parca.append(e["klasor"])
        if (e and e.get("cmk")) or uo.cmk_listede_mi(cmk or [], x.get("birimAdi"), x.get("dosyaNo")):
            parca.append("CMK")
        if not x.get("yerelde"):
            parca.append("uygulamada değil")
        return " · ".join(parca)

    satirlar = [f"## UYAP takibi · önbellek {veri.get('tarih')} ({veri.get('okundu', '')[11:16]})", ""]
    if veri.get("tarih") != bugun.isoformat():
        satirlar += [f"**Önbellek bugüne ait değil ({veri.get('tarih')}); UYAP'ta yeni bir şey olmadığı anlamına gelmez.**", ""]
    if veri.get("hatalar"):
        satirlar += ["**Okunamayan kaynak (bu bölümler eksik olabilir):** "
                     + "; ".join(f"{k}: {v}" for k, v in veri["hatalar"].items()), ""]
    onemli = [x for x in hareketler if uo.dikkat(x.get("aciklama")) and (uo.iso_tarih(x.get("tarih")) or datetime.min).date() >= sinir_tarihi]
    onemli.sort(key=lambda x: str(x.get("tarih")), reverse=True)
    satirlar += [f"### Dikkat gerektiren UYAP olayları (son {gun} gün)", "",
                 "| Tarih | Mahkeme / Kurum | Dosya | Olay | Dikkat | Not |", "|---|---|---|---|---|---|"]
    satirlar += [f"| {str(x.get('tarih'))[:10]} | {x.get('birimAdi')} | {uo.dosya_no(x.get('dosyaNo'))} | {x.get('aciklama')} | "
                 f"{uo.dikkat(x.get('aciklama'))} | {etiket(x)} |" for x in onemli] or ["| — | — | — | — | — | — |"]
    yaklasan = []
    for d in durusmalar:
        t = uo.tarih_saat(d.get("tarih"))
        if t and bugun <= t.date() <= bugun + timedelta(days=durusma_gun):
            yaklasan.append((t, d))
    yaklasan.sort(key=lambda p: p[0])
    satirlar += ["", f"### Yaklaşan duruşmalar ({durusma_gun} gün)", "",
                 "| Tarih | Mahkeme | Dosya | İşlem | Not |", "|---|---|---|---|---|"]
    satirlar += [f"| {t:%d.%m.%Y %H:%M} | {d.get('birimAdi')} | {uo.dosya_no(d.get('dosyaNo'))} | {d.get('islemTuru') or ''} | {etiket(d)} |"
                 for t, d in yaklasan] or ["| — | — | — | — | — |"]
    bekleyen = {}
    for x in hareketler:
        if not x.get("yerelde"):
            bekleyen.setdefault((x.get("birimAdi"), uo.dosya_no(x.get("dosyaNo"))), x.get("dosyaTuru", ""))
    yeni_evrak = [x for x in gelen if (uo.iso_tarih(x.get("tarih")) or datetime.min).date() >= sinir_tarihi]
    satirlar += ["", "### Kapsam", "",
                 f"- Uygulamanın takip ettiği dosya: {len(yerel)}",
                 f"- Son 30 günde hareket görüp uygulamada olmayan dosya: {len(bekleyen)} "
                 "(yavaş eşitleme: `python scripts/uyap_esitle.py plan`)",
                 f"- Son {gun} günde gelen evrak kaydı: {len(yeni_evrak)}",
                 "- Tebligat (PTT, UETS) hareket akışında görünmez; dosya evrak listesinden izlenir. KEP UYAP dışıdır."]
    return "\n".join(satirlar) + "\n"


def main(argv: list[str]) -> int:
    for akim in (sys.stdout, sys.stderr):
        try:
            akim.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    ap = argparse.ArgumentParser(prog="uyap_takip.py")
    alt = ap.add_subparsers(dest="komut", required=True)
    o = alt.add_parser("oku")
    o.add_argument("--supur", action="store_true")
    o.add_argument("--zorla", action="store_true")
    r = alt.add_parser("rapor")
    r.add_argument("--gun", type=int, default=7)
    r.add_argument("--durusma-gun", type=int, default=14)
    args = ap.parse_args(argv)
    try:
        if args.komut == "oku":
            oku(args.supur, args.zorla)
        else:
            print(rapor(uo.onbellek_oku(), uo.eslesme_satirlari(), args.gun, args.durusma_gun, cmk=uo.cmk_listesi()), end="")
        return 0
    except (OSError, ValueError) as hata:
        print(f"HATA: {hata}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
