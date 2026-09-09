"""Müvekkil bilgi formu üretici.

    python -m scripts.muvekkil_formu                # sablonlar/muvekkil-formlari/ altına PDF + DOCX + WhatsApp mesajı
    python -m scripts.muvekkil_formu --out <klasör>

Şema değişince (scripts/muvekkil_formu/schema.py) bu komut yeniden çalıştırılır;
iki format da aynı şemadan üretilir.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from . import brand, render_docx, render_pdf, schema

STEM = "iscilik-alacaklari-muvekkil-bilgi-formu"


def wa_mesaj() -> str:
    b = brand.buro()
    return (
        "Sayın [Ad Soyad],\n\n"
        "İşçilik alacaklarınızla ilgili dosyanızı eksiksiz hazırlayabilmemiz için ekteki "
        "*Müvekkil Bilgi Formu*'nu doldurmanızı rica ederiz.\n\n"
        "• Formu telefonunuzda Word veya Google Dokümanlar ile açıp cevapları doğrudan "
        "yazabilirsiniz. Dilerseniz PDF'i yazdırıp elle doldurup fotoğrafını gönderebilirsiniz.\n"
        "• Tarihleri mümkün olduğunca gün.ay.yıl olarak tam yazınız; bazı haklarınız kanuni "
        "sürelere bağlıdır.\n"
        "• Elinizdeki belgelerin (SGK hizmet dökümü, bordrolar, banka dökümü, yazışmalar) "
        "fotoğraf veya PDF'ini formla birlikte gönderiniz.\n"
        "• Lütfen formu en geç *__.__.____* tarihine kadar bu hattan geri iletiniz.\n\n"
        "İşverenle ilgili herhangi bir belge imzalamadan önce bize danışmanızı önemle rica ederiz.\n\n"
        f"{b['avukat']}\n{b['buro']}\n{b['adres']}"
    )


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(brand.ROOT / "sablonlar" / "muvekkil-formlari"))
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    pdf = out / f"{STEM}.pdf"
    docx = out / f"{STEM}.docx"
    txt = out / f"{STEM}-whatsapp-mesaji.txt"

    pages = render_pdf.render(pdf)
    render_docx.render(docx)
    txt.write_text(wa_mesaj(), encoding="utf-8")

    print(f"PDF  : {pdf}  ({pages} sayfa, doldurulabilir alanlar)")
    print(f"DOCX : {docx}")
    print(f"WA   : {txt}")
    print(f"Şema : {len(schema.SECTIONS)} bölüm, sürüm {schema.META['surum']}")


if __name__ == "__main__":
    main()
