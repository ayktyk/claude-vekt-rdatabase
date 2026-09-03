#!/usr/bin/env python3
"""Ornek dilekce kutuphanesi ice aktarma.

UDF (UYAP) iskelet dilekceleri okur, metnini cikarir, okunabilir MD'ye cevirir,
orijinal UDF'i kopyalar ve dava turu -> ornek eslemesi indeksini uretir.

Kaynak: `hakandimdik.dilekceler.v2` klasoru (47 .udf).
Hedef : `sablonlar/dilekce-ornekleri/` (MD + UDF + index.json + INDEX.md).

Ilke: ornek dilekce bir FORM/ISKELET'tir; kunye ve olgu kaynagi DEGILDIR.
Spec : docs/superpowers/specs/2026-09-04-ornek-dilekce-kutuphanesi-design.md

Kullanim:
    python scripts/udf_ornek_ice_aktar.py \
        --kaynak ~/Desktop/hakandimdik.dilekceler.v2 \
        --hedef  sablonlar/dilekce-ornekleri

Yalniz Python standart kutuphanesi kullanir.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import unicodedata
import zipfile
from pathlib import Path

# --- Turkce -> ascii slug cevrimi (dosya adi mojibake'i dahil) ---
_HARF_MAP = {
    "ç": "c", "Ç": "c", "ğ": "g", "Ğ": "g", "ı": "i", "İ": "i",
    "ö": "o", "Ö": "o", "ş": "s", "Ş": "s", "ü": "u", "Ü": "u",
    "î": "i", "Î": "i", "â": "a", "Â": "a", "û": "u", "Û": "u",
}

# SONUC VE TALEP basligi varyantlari (buyuk/kucuk fark etmez)
_SONUC_ETIKETLERI = [
    "SONUÇ VE TALEP",
    "SONUÇ VE İSTEM",
    "NETİCE-İ TALEP",
    "NETİCEİ TALEP",
    "TALEP SONUCU",
    "TALEP VE SONUÇ",
    "SONUÇ",
]

# Bir sonraki ALLCAPS basligi (blok sonu tespiti icin)
_BASLIK_DESENI = re.compile(
    r"^\s*(KONU|HARCA ESAS DEĞER|AÇIKLAMALAR|HUKUK[İI] NEDENLER|"
    r"HUKUK[İI] DEL[İI]LLER|DEL[İI]LLER|SONUÇ|NETİCE|TALEP|EKLER)\b",
    re.MULTILINE,
)


def slugify(ad: str) -> str:
    """Dosya adini temiz ascii slug'a cevirir (uzanti haric)."""
    ad = ad.rsplit(".", 1)[0]  # uzantiyi at
    for tr, asc in _HARF_MAP.items():
        ad = ad.replace(tr, asc)
    # kalan birlesik isaretleri sok (NFKD)
    ad = unicodedata.normalize("NFKD", ad)
    ad = "".join(c for c in ad if not unicodedata.combining(c))
    ad = ad.lower()
    ad = re.sub(r"[^a-z0-9]+", "-", ad)
    return ad.strip("-")


def taraf_turet(dosya_adi: str) -> str | None:
    """Dosya adinin sonundan taraf bilgisini turetir: dava | cevap | None."""
    govde = dosya_adi.rsplit(".", 1)[0].lower()
    if govde.endswith("-dava"):
        return "dava"
    if govde.endswith("-cevap"):
        return "cevap"
    return None


def tur_ve_altkonu(slug: str, taraf: str | None) -> tuple[str, str]:
    """Slug'dan dava_turu (ilk token) ve alt_konu (ortadaki tokenlar) turetir."""
    parcalar = slug.split("-")
    dava_turu = parcalar[0] if parcalar else slug
    orta = parcalar[1:]
    if taraf in ("dava", "cevap") and orta and orta[-1] == taraf:
        orta = orta[:-1]
    alt_konu = "-".join(orta)
    return dava_turu, alt_konu


def metni_cikar(udf_yolu: Path) -> str:
    """UDF (zip) icindeki content.xml'den duz metni cikarir."""
    with zipfile.ZipFile(udf_yolu) as z:
        ham = z.read("content.xml").decode("utf-8", errors="replace")
    # 1) <content>...</content> tercih
    m = re.search(r"<content>(.*?)</content>", ham, re.S)
    govde = m.group(1) if m else ham
    # 2) CDATA sar/ac
    govde = govde.replace("<![CDATA[", "").replace("]]>", "")
    # 3) kalan xml etiketlerini sok
    govde = re.sub(r"<[^>]+>", "", govde)
    govde = html.unescape(govde)
    # 4) satir normalizasyonu (fazla bos satirlari 2'ye indir, satir sonu bosluk kirp)
    satirlar = [s.rstrip() for s in govde.splitlines()]
    metin = "\n".join(satirlar)
    metin = re.sub(r"\n{3,}", "\n\n", metin).strip()
    return metin


def mahkeme_bul(metin: str) -> str | None:
    """Metinde mahkeme/hakimlik/mudurluk basligini bulur."""
    for satir in metin.splitlines():
        s = satir.strip()
        if not s:
            continue
        buyuk = s.upper()
        if any(k in buyuk for k in ("MAHKEME", "HAKİML", "HAKIML", "MÜDÜRLÜ", "MUDURLU")):
            # "... SULH HUKUK MAHKEMESİ'NE" -> nokta/ekleri temizle
            temiz = s.lstrip(". ").strip()
            return temiz[:120]
    return None


def konu_bul(metin: str) -> str | None:
    m = re.search(r"^\s*KONU[^\S\n]*[:：]\s*(.+)", metin, re.MULTILINE)
    if m:
        return m.group(1).strip()[:200]
    return None


def sonuc_talep_bul(metin: str) -> str | None:
    """SONUC VE TALEP blogunu bulup ozetini (ilk ~240 karakter) doner."""
    ust = metin.upper()
    for etiket in _SONUC_ETIKETLERI:
        idx = ust.find(etiket)
        if idx == -1:
            continue
        # etiketten sonrasi
        kalan = metin[idx + len(etiket):]
        # bas ':' ve bosluklari at
        kalan = re.sub(r"^[^\S\n]*[:：]?\s*", "", kalan)
        # bir sonraki ust-baslik varsa orada kes
        sonraki = _BASLIK_DESENI.search(kalan)
        blok = kalan[: sonraki.start()] if sonraki else kalan
        blok = " ".join(blok.split())
        if blok:
            return blok[:240]
    return None


def frontmatter_yaz(veri: dict) -> str:
    """Basit, deterministik YAML frontmatter uretir (stdlib, sirali)."""
    sira = [
        "kaynak", "dava_turu", "alt_konu", "taraf", "mahkeme",
        "konu_ozet", "bolumler", "tur", "not",
    ]
    satirlar = ["---"]
    for anahtar in sira:
        if anahtar not in veri:
            continue
        deger = veri[anahtar]
        if deger is None:
            satirlar.append(f"{anahtar}: null")
        elif isinstance(deger, list):
            ic = ", ".join(deger)
            satirlar.append(f"{anahtar}: [{ic}]")
        else:
            s = str(deger).replace('"', "'")
            satirlar.append(f'{anahtar}: "{s}"')
    satirlar.append("---")
    return "\n".join(satirlar)


def bolumleri_tespit(metin: str) -> list[str]:
    """Metinde bulunan standart bolum basliklarini isaretler."""
    ust = metin.upper()
    bulunan = []
    kontrol = [
        ("KONU", "KONU"),
        ("HARCA_ESAS_DEGER", "HARCA ESAS DE"),
        ("ACIKLAMALAR", "AÇIKLAMALAR"),
        ("HUKUKI_NEDENLER", "HUKUK"),  # HUKUKI NEDENLER
        ("HUKUKI_DELILLER", "DEL"),    # HUKUKI DELILLER / DELILLER
    ]
    for etiket, ara in kontrol:
        if ara in ust:
            bulunan.append(etiket)
    if any(e in ust for e in [x.upper() for x in _SONUC_ETIKETLERI]):
        bulunan.append("SONUC_VE_TALEP")
    return bulunan


def bir_dosya_isle(udf_yolu: Path, hedef: Path) -> dict:
    """Tek UDF'i isler: MD + UDF yazar, indeks kaydini doner."""
    dosya_adi = udf_yolu.name
    slug = slugify(dosya_adi)
    taraf = taraf_turet(dosya_adi)
    dava_turu, alt_konu = tur_ve_altkonu(slug, taraf)

    metin = metni_cikar(udf_yolu)
    mahkeme = mahkeme_bul(metin)
    konu = konu_bul(metin)
    sonuc = sonuc_talep_bul(metin)
    bolumler = bolumleri_tespit(metin)

    fm = {
        "kaynak": dosya_adi,
        "dava_turu": dava_turu,
        "alt_konu": alt_konu,
        "taraf": taraf,
        "mahkeme": mahkeme,
        "konu_ozet": konu,
        "bolumler": bolumler,
        "tur": "ornek-dilekce",
        "not": "ISKELET/FORM — kunye ve olgu kaynagi DEGILDIR.",
    }

    md = frontmatter_yaz(fm) + "\n\n" + metin + "\n"
    (hedef / f"{slug}.md").write_text(md, encoding="utf-8")
    shutil.copy2(udf_yolu, hedef / f"{slug}.udf")

    return {
        "slug": slug,
        "dava_turu": dava_turu,
        "alt_konu": alt_konu,
        "taraf": taraf,
        "mahkeme": mahkeme,
        "konu": konu,
        "sonuc_talep_ozet": sonuc,
    }


def indeks_uret(kayitlar: list[dict], kaynak_ad: str, tarih: str) -> dict:
    turler: dict[str, list[dict]] = {}
    for k in sorted(kayitlar, key=lambda x: x["slug"]):
        turler.setdefault(k["dava_turu"], []).append({
            "slug": k["slug"],
            "alt_konu": k["alt_konu"],
            "taraf": k["taraf"],
            "konu": k["konu"],
            "sonuc_talep_ozet": k["sonuc_talep_ozet"],
        })
    return {
        "uretim_tarihi": tarih,
        "kaynak_klasor": kaynak_ad,
        "toplam": len(kayitlar),
        "turler": turler,
    }


def index_md_uret(indeks: dict) -> str:
    satirlar = [
        "# Ornek Dilekce Kutuphanesi — Indeks",
        "",
        f"- Kaynak: `{indeks['kaynak_klasor']}`",
        f"- Toplam ornek: **{indeks['toplam']}**",
        f"- Uretim: {indeks['uretim_tarihi']}",
        "",
        "> Ornek dilekce bir FORM/ISKELET'tir. Bolum sirasi, KONU kalibi ve",
        "> SONUC VE TALEP yapisi referans alinir; kunye ve olgu kaynagi DEGILDIR.",
        "> Doktrin kapilari (kunye dogrulama + DENETCI) aynen calisir.",
        "",
    ]
    for tur in sorted(indeks["turler"]):
        kayitlar = indeks["turler"][tur]
        satirlar.append(f"## {tur}  ({len(kayitlar)})")
        satirlar.append("")
        satirlar.append("| slug | alt konu | taraf | KONU |")
        satirlar.append("|---|---|---|---|")
        for k in kayitlar:
            konu = (k["konu"] or "").replace("|", "/")
            satirlar.append(
                f"| `{k['slug']}` | {k['alt_konu']} | {k['taraf'] or '-'} | {konu} |"
            )
        satirlar.append("")
    return "\n".join(satirlar)


def calistir(kaynak: Path, hedef: Path, tarih: str) -> dict:
    hedef.mkdir(parents=True, exist_ok=True)
    udf_dosyalari = sorted(kaynak.glob("*.udf"))
    if not udf_dosyalari:
        raise SystemExit(f"Kaynak klasorde .udf bulunamadi: {kaynak}")
    kayitlar = [bir_dosya_isle(u, hedef) for u in udf_dosyalari]
    indeks = indeks_uret(kayitlar, kaynak.name, tarih)
    (hedef / "index.json").write_text(
        json.dumps(indeks, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (hedef / "INDEX.md").write_text(index_md_uret(indeks) + "\n", encoding="utf-8")
    return indeks


def main() -> None:
    ap = argparse.ArgumentParser(description="Ornek dilekce kutuphanesi ice aktarma")
    ap.add_argument(
        "--kaynak", required=True, type=Path,
        help="UDF ornek dilekcelerinin bulundugu klasor",
    )
    ap.add_argument(
        "--hedef", type=Path, default=Path("sablonlar/dilekce-ornekleri"),
        help="Cikti klasoru (varsayilan: sablonlar/dilekce-ornekleri)",
    )
    ap.add_argument(
        "--tarih", default="2026-09-04",
        help="Indeks uretim tarihi damgasi (deterministik cikti icin)",
    )
    args = ap.parse_args()
    kaynak = args.kaynak.expanduser()
    indeks = calistir(kaynak, args.hedef, args.tarih)
    print(f"OK — {indeks['toplam']} ornek islendi -> {args.hedef}")
    for tur in sorted(indeks["turler"]):
        print(f"  {tur}: {len(indeks['turler'][tur])}")


if __name__ == "__main__":
    main()
