"""UYAP ek boyutu siniri: EKLER kokundeki PDF'leri olcer, 10 MB'i asanlari sikistirir.

Kullanim:
    python scripts/ek_sikistir.py "<dava-klasoru>\\03-Sentez-ve-Dilekce\\EKLER" [--limit-mb 10] [--kuru]

- Asil dosya once EKLER/_sikistirma-oncesi/ altina md5 kontrollu yedeklenir (UYAP'a yuklenmez).
- Gomulu gorseller JPEG'e cevrilir, cozunurluk kademeli dusurulur (q70/150dpi -> q60/130 -> q50/110),
  hedef: sinirin %90'inin altina inmek. Sayfa sayisi degismez; metin katmani ve etiketler korunur.
- UDF ve e-imzali dosyalara dokunulmaz (yalniz *.pdf).
- Cikti: her dosya icin boyut; sikistirilanlar icin yeni md5 (00-EKLER-saglama.md'ye islenir).
"""
import argparse
import hashlib
import shutil
import sys
from pathlib import Path

import fitz  # PyMuPDF

KADEMELER = [(70, 150), (60, 130), (50, 110)]


def md5(p: Path) -> str:
    return hashlib.md5(p.read_bytes()).hexdigest()


def sikistir(src: Path, quality: int, dpi: int) -> Path:
    doc = fitz.open(src)
    if hasattr(doc, "rewrite_images"):
        doc.rewrite_images(dpi_threshold=dpi + 1, dpi_target=dpi, quality=quality,
                           lossy=True, lossless=True, set_to_gray=False)
    else:  # eski PyMuPDF
        for page in doc:
            for img in page.get_images(full=True):
                pix = fitz.Pixmap(doc, img[0])
                if pix.n - pix.alpha >= 4:
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                page.replace_image(img[0], stream=pix.tobytes("jpeg", jpg_quality=quality))
    out = src.with_suffix(".tmp.pdf")
    doc.save(out, garbage=4, deflate=True, deflate_images=True, deflate_fonts=True)
    doc.close()
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("klasor")
    ap.add_argument("--limit-mb", type=float, default=10.0)
    ap.add_argument("--kuru", action="store_true", help="yalniz olc, degistirme")
    a = ap.parse_args()
    E = Path(a.klasor)
    if not E.is_dir():
        print(f"[FAIL] klasor yok: {E}"); return 1
    limit = int(a.limit_mb * 1024 * 1024)
    bak_dir = E / "_sikistirma-oncesi"
    buyuk = 0
    for src in sorted(E.glob("*.pdf")):
        size = src.stat().st_size
        if size <= limit:
            print(f"OK    {size/1048576:6.2f} MB  {src.name}")
            continue
        buyuk += 1
        print(f"BUYUK {size/1048576:6.2f} MB  {src.name}")
        if a.kuru:
            continue
        bak_dir.mkdir(exist_ok=True)
        bak = bak_dir / src.name
        if not bak.exists():
            shutil.copy2(src, bak)
            if md5(bak) != md5(src):
                print("[FAIL] yedek md5 uyusmadi"); return 1
        sayfa = len(fitz.open(src))
        out = None
        for q, d in KADEMELER:
            if out and out.exists():
                out.unlink()
            out = sikistir(src, q, d)
            n = out.stat().st_size
            print(f"      q={q} dpi={d}: {n/1048576:6.2f} MB")
            if n <= limit * 0.9:
                break
        if out.stat().st_size > limit:
            print(f"[FAIL] {src.name} sinirin altina inmedi; bolme gerekir"); out.unlink(); return 1
        if len(fitz.open(out)) != sayfa:
            print("[FAIL] sayfa sayisi degisti"); out.unlink(); return 1
        src.unlink(); out.rename(src)
        print(f"      yeni md5 {md5(src)}  {src.stat().st_size/1048576:.2f} MB  (sayfa {sayfa}; yedek _sikistirma-oncesi/)")
    for u in E.glob("*.udf"):
        print(f"UDF   {u.stat().st_size/1048576:6.2f} MB  {u.name}  (dokunulmadi)")
    print(f"[{'OK' if buyuk == 0 or not a.kuru else 'UYARI'}] siniri asan PDF sayisi: {buyuk}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
