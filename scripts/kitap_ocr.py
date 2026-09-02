#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
kitap_ocr.py — Taranmis PDF kitaplari icin sayfa referansli Turkce OCR.

Spec: docs/superpowers/specs/2026-09-02-tek-motor-agnostik-toparlama-design.md (Faz 0)

Neden gerekli:
  Hukuk Nosyonu Cilt I (Polat) PDF'inde metin katmani YOKTUR; 306 sayfanin tamami
  taranmis goruntudur. Kitaptan cikarilacak her kural sayfa referansli olmak
  zorunda oldugu icin (0-halusinasyon doktrini), OCR ciktisi sayfa sinirlarini
  KAYBETMEDEN uretilir.

SAYFA NUMARASI UYARISI:
  Bu script PDF sayfa INDEKSINI (1-tabanli) yazar: <!-- pdf:007 -->
  Kitabin BASILI sayfa numarasi bundan farkli olabilir (kapak + on sayfalar kaymasi).
  Derin okuma turunda basili numara tespit edilip esleme tablosu cikarilir;
  protokoldeki [s. NNN] atiflari BASILI numaraya gore yazilir.

Telif siniri:
  Cikti yalnizca tmp/ altinda kalir, repoya commit EDILMEZ, vektor DB'ye ATILMAZ.

Kullanim:
  python scripts/kitap_ocr.py <pdf> --cikti tmp/nosyon-ocr
  python scripts/kitap_ocr.py <pdf> --cikti tmp/nosyon-ocr --baslangic 1 --bitis 20
  python scripts/kitap_ocr.py <pdf> --cikti tmp/nosyon-ocr --dpi 400 --sayfalar 45,46,91
"""

from __future__ import annotations

import argparse
import io
import os
import sys
import time
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.exit("HATA: PyMuPDF yok. Kurulum: pip install pymupdf")

try:
    import pytesseract
    from PIL import Image
except ImportError:
    sys.exit("HATA: pytesseract veya Pillow yok. Kurulum: pip install pytesseract pillow")


# Tesseract binary'si PATH'te olmayabilir (Windows kurulumu genelde PATH'e yazmaz).
TESSERACT_ADAYLARI = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
    "/opt/homebrew/bin/tesseract",
    "/usr/local/bin/tesseract",
    "/usr/bin/tesseract",
]


def tesseract_bul() -> str:
    """Tesseract binary yolunu cozumler; bulunamazsa aciklayici hata verir."""
    ortam = os.environ.get("TESSERACT_CMD")
    if ortam and Path(ortam).exists():
        return ortam
    for aday in TESSERACT_ADAYLARI:
        if aday and Path(aday).exists():
            return aday
    from shutil import which

    yol = which("tesseract")
    if yol:
        return yol
    sys.exit(
        "HATA: tesseract bulunamadi.\n"
        "  Windows: winget install UB-Mannheim.TesseractOCR\n"
        "  macOS:   brew install tesseract tesseract-lang\n"
        "  Ya da TESSERACT_CMD ortam degiskenine tam yolu yaz."
    )


def dil_dogrula(lang: str) -> None:
    """Istenen dil paketi kurulu mu kontrol eder (tur yoksa cikti coper olur)."""
    try:
        mevcut = set(pytesseract.get_languages(config=""))
    except Exception:
        return  # eski pytesseract; sessizce gec
    eksik = [d for d in lang.split("+") if d not in mevcut]
    if eksik:
        sys.exit(
            f"HATA: tesseract dil paketi eksik: {', '.join(eksik)}\n"
            f"  Kurulu diller: {', '.join(sorted(mevcut))}\n"
            "  Turkce icin 'tur.traineddata' dosyasi tessdata klasorune konmali."
        )


def sayfa_listesi(args, toplam: int) -> list[int]:
    """--sayfalar veya --baslangic/--bitis argumanlarindan 0-tabanli indeks listesi."""
    if args.sayfalar:
        secili = []
        for parca in args.sayfalar.split(","):
            parca = parca.strip()
            if not parca:
                continue
            if "-" in parca:
                a, b = parca.split("-", 1)
                secili.extend(range(int(a), int(b) + 1))
            else:
                secili.append(int(parca))
        return [n - 1 for n in secili if 1 <= n <= toplam]
    bas = max(1, args.baslangic) - 1
    bit = min(toplam, args.bitis or toplam)
    return list(range(bas, bit))


def sayfa_ocr(sayfa, dpi: int, lang: str) -> str:
    """Tek sayfayi goruntuye cevirip OCR eder."""
    olcek = dpi / 72.0
    pix = sayfa.get_pixmap(matrix=fitz.Matrix(olcek, olcek), colorspace=fitz.csGRAY)
    goruntu = Image.open(io.BytesIO(pix.tobytes("png")))
    return pytesseract.image_to_string(goruntu, lang=lang).strip()


def supheli_mi(metin: str) -> bool:
    """
    Kaba OCR kalite sezgisi. Turkce metinde beklenen: makul uzunluk + harf orani.
    Bos ya da simge cöplügü sayfalar [OCR SUPHELI] etiketi alir; o sayfaya
    dayanan kural DOGRULANMADAN kullanilmaz (spec 3.4.1).
    """
    if len(metin) < 80:
        return True
    harf = sum(1 for k in metin if k.isalpha())
    return (harf / max(1, len(metin))) < 0.55


def main() -> int:
    ap = argparse.ArgumentParser(description="Taranmis PDF icin sayfa referansli Turkce OCR")
    ap.add_argument("pdf", help="Kaynak PDF yolu")
    ap.add_argument("--cikti", default="tmp/nosyon-ocr", help="Cikti klasoru (varsayilan: tmp/nosyon-ocr)")
    ap.add_argument("--dpi", type=int, default=300, help="Render cozunurlugu (varsayilan: 300)")
    ap.add_argument("--lang", default="tur", help="Tesseract dili (varsayilan: tur)")
    ap.add_argument("--baslangic", type=int, default=1, help="Baslangic sayfasi (1-tabanli, dahil)")
    ap.add_argument("--bitis", type=int, default=0, help="Bitis sayfasi (1-tabanli, dahil; 0 = son)")
    ap.add_argument("--sayfalar", default="", help="Tekil sayfa/araliklar: '45,46,91-95'")
    ap.add_argument("--parca", type=int, default=25, help="Kac sayfada bir parca dosya yazilsin")
    args = ap.parse_args()

    pdf_yolu = Path(args.pdf)
    if not pdf_yolu.exists():
        sys.exit(f"HATA: PDF bulunamadi: {pdf_yolu}")

    pytesseract.pytesseract.tesseract_cmd = tesseract_bul()
    dil_dogrula(args.lang)

    cikti = Path(args.cikti)
    cikti.mkdir(parents=True, exist_ok=True)

    belge = fitz.open(pdf_yolu)
    hedefler = sayfa_listesi(args, belge.page_count)
    if not hedefler:
        sys.exit("HATA: islenecek sayfa yok.")

    print(f"[kitap_ocr] kaynak      : {pdf_yolu.name}")
    print(f"[kitap_ocr] toplam sayfa: {belge.page_count}")
    print(f"[kitap_ocr] islenecek   : {len(hedefler)} sayfa (dpi={args.dpi}, lang={args.lang})")
    print(f"[kitap_ocr] cikti       : {cikti}", flush=True)

    basladi = time.time()
    supheliler: list[int] = []
    tampon: list[str] = []
    parca_no = 1
    parca_bas = hedefler[0] + 1

    def parcayi_yaz(son_sayfa: int) -> None:
        nonlocal tampon, parca_no, parca_bas
        if not tampon:
            return
        ad = cikti / f"parca-{parca_no:02d}_s{parca_bas:03d}-{son_sayfa:03d}.md"
        ad.write_text("\n".join(tampon), encoding="utf-8")
        print(f"[kitap_ocr] yazildi: {ad.name}", flush=True)
        tampon = []
        parca_no += 1
        parca_bas = son_sayfa + 1

    for sira, indeks in enumerate(hedefler, start=1):
        pdf_sayfa = indeks + 1
        try:
            metin = sayfa_ocr(belge[indeks], args.dpi, args.lang)
        except Exception as hata:  # tek sayfa patlarsa tum is durmasin
            metin = ""
            print(f"[kitap_ocr] HATA s.{pdf_sayfa}: {hata}", flush=True)

        etiket = ""
        if supheli_mi(metin):
            supheliler.append(pdf_sayfa)
            etiket = " [OCR SUPHELI]"

        tampon.append(f"\n<!-- pdf:{pdf_sayfa:03d} -->{etiket}\n")
        tampon.append(metin if metin else "_(bos veya okunamadi)_")

        if sira % args.parca == 0:
            parcayi_yaz(pdf_sayfa)
        if sira % 10 == 0 or sira == len(hedefler):
            gecen = time.time() - basladi
            hiz = gecen / sira
            kalan = hiz * (len(hedefler) - sira)
            print(
                f"[kitap_ocr] {sira}/{len(hedefler)} sayfa · "
                f"{gecen/60:.1f} dk gecti · ~{kalan/60:.1f} dk kaldi",
                flush=True,
            )

    parcayi_yaz(hedefler[-1] + 1)

    ozet = [
        "# OCR Ozeti",
        "",
        f"- Kaynak: `{pdf_yolu.name}`",
        f"- PDF toplam sayfa: {belge.page_count}",
        f"- Islenen sayfa: {len(hedefler)}",
        f"- DPI: {args.dpi} · Dil: {args.lang}",
        f"- Sure: {(time.time()-basladi)/60:.1f} dk",
        f"- Supheli sayfa sayisi: {len(supheliler)}",
        "",
        "## Supheli sayfalar (PDF indeksi)",
        "",
        (", ".join(str(s) for s in supheliler) if supheliler else "_yok_"),
        "",
        "> Supheli sayfalara dayanan hicbir kural dogrulanmadan kullanilamaz.",
        "> Yeniden deneme: `--sayfalar <liste> --dpi 400`",
        "",
        "## Sayfa numarasi uyarisi",
        "",
        "Bu ciktidaki `<!-- pdf:NNN -->` isaretleri PDF sayfa INDEKSIDIR.",
        "Kitabin BASILI sayfa numarasi farkli olabilir. Derin okuma turunda",
        "esleme tablosu cikarilir; protokoldeki `[s. NNN]` atiflari BASILI",
        "numaraya gore yazilir.",
    ]
    (cikti / "00-OZET.md").write_text("\n".join(ozet), encoding="utf-8")

    print(f"[kitap_ocr] BITTI · supheli sayfa: {len(supheliler)} · ozet: {cikti/'00-OZET.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
