"""Müvekkil bilgi formu üretici.

    python -m scripts.muvekkil_formu                # SADE form (varsayılan) -> sablonlar/muvekkil-formlari/
    python -m scripts.muvekkil_formu --detayli      # ayrıntılı form (schema_detayli.py), "-detayli" son ekiyle
    python -m scripts.muvekkil_formu --out <klasör>

Şema değişince (scripts/muvekkil_formu/schema.py) bu komut yeniden çalıştırılır;
iki format da aynı şemadan üretilir.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from . import brand, render_docx, render_pdf, schema, schema_detayli

STEM = "iscilik-alacaklari-muvekkil-bilgi-formu"


def wa_mesaj() -> str:
    b = brand.buro()
    return (
        "Sayın [Ad Soyad],\n\n"
        "Dosyanızı hazırlayabilmemiz için ekteki kısa formu doldurmanızı rica ederiz; "
        "yaklaşık 10 dakika sürer.\n\n"
        "• Telefonunuzda açıp cevapları doğrudan yazabilir ya da yazdırıp elle doldurup "
        "fotoğrafını gönderebilirsiniz.\n"
        "• Elinizdeki belgelerin (SGK dökümü, bordro, banka dökümü, mesajlar) fotoğrafını "
        "formla birlikte gönderin.\n"
        "• Bazı haklarınız için süre kısadır; formu en geç *__.__.____* tarihine kadar "
        "bu hattan geri iletin.\n\n"
        "İşverenin verdiği hiçbir kâğıdı bize danışmadan imzalamayın.\n\n"
        f"{b['avukat']}\n{b['buro']}\n{b['adres']}"
    )


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(brand.ROOT / "sablonlar" / "muvekkil-formlari"))
    ap.add_argument("--detayli", action="store_true", help="ayrıntılı (uzun) sürümü üret")
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    sch = schema_detayli if args.detayli else schema
    stem = STEM + ("-detayli" if args.detayli else "")

    pdf = out / f"{stem}.pdf"
    docx = out / f"{stem}.docx"
    txt = out / f"{STEM}-whatsapp-mesaji.txt"

    pages = render_pdf.render(pdf, sch)
    render_docx.render(docx, sch)
    txt.write_text(wa_mesaj(), encoding="utf-8")

    print(f"PDF  : {pdf}  ({pages} sayfa, doldurulabilir alanlar)")
    print(f"DOCX : {docx}")
    print(f"WA   : {txt}")
    print(f"Şema : {len(sch.SECTIONS)} bölüm, sürüm {sch.META['surum']}")


if __name__ == "__main__":
    main()
