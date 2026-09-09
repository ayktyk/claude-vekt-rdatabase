"""Doldurulabilir (AcroForm) PDF üretici — Vega Hukuk müvekkil bilgi formu.

İki geçişli render: ilk geçiş sayfa sayısını bulur, ikinci geçiş "Sayfa n / N"
ile dosyaya yazar. Tüm yerleşim tek canvas üzerinde akış mantığıyla çizilir.
"""
from __future__ import annotations

import io
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.acroform import PDFFromString
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from . import brand, schema

W, H = A4
ML = MR = 42
CW = W - ML - MR
TOP_BAND = 50
Y_TOP = H - TOP_BAND - 24
Y_BOTTOM = 56
LABEL_COL = 205
FIELD_H = 19
GAP = 7

C_NAVY = HexColor(brand.NAVY)
C_GOLD = HexColor(brand.GOLD)
C_CREAM = HexColor(brand.CREAM)
C_INK = HexColor(brand.INK)
C_MUTED = HexColor(brand.MUTED)
C_LINE = HexColor(brand.LINE)
C_FIELD = HexColor(brand.FIELD_BG)
C_GREY = HexColor(brand.GREY_BG)

_FONTS_READY = False


def _fonts() -> None:
    global _FONTS_READY
    if _FONTS_READY:
        return
    for name, path in brand.FONT_FILES.items():
        pdfmetrics.registerFont(TTFont(name, str(path)))
    _FONTS_READY = True


class PdfForm:
    def __init__(self, target, total_pages: int | None = None):
        _fonts()
        self.c = canvas.Canvas(target, pagesize=A4)
        self.c.setTitle(f"{schema.META['baslik']} — {schema.META['alt_baslik']} · {brand.WORDMARK}")
        self.c.setAuthor(brand.buro()["avukat"])
        self.c.acroForm.extras["NeedAppearances"] = PDFFromString("true")
        self.total = total_pages
        self.page = 1
        self.y = Y_TOP
        self.n = 0
        self.buro = brand.buro()
        self._header()

    # ---- sayfa iskeleti -------------------------------------------------
    def _header(self) -> None:
        c = self.c
        c.setFillColor(C_NAVY)
        c.rect(0, H - TOP_BAND, W, TOP_BAND, stroke=0, fill=1)
        c.setFillColor(C_GOLD)
        c.rect(0, H - TOP_BAND - 1.5, W, 1.5, stroke=0, fill=1)
        c.setFillColor(C_CREAM)
        c.setFont("Georgia-Bold", 15)
        c.drawString(ML, H - 24, brand.WORDMARK)
        c.setFillColor(C_GOLD)
        c.setFont("Segoe", 6.3)
        x = ML
        for ch in brand.TAGLINE:
            c.drawString(x, H - 37, ch)
            x += pdfmetrics.stringWidth(ch, "Segoe", 6.3) + 1.6
        c.setFillColor(C_CREAM)
        c.setFont("Segoe-Semibold", 8.5)
        c.drawRightString(W - MR, H - 24, schema.META["baslik"])
        c.setFont("Segoe", 7.5)
        c.drawRightString(W - MR, H - 36, schema.META["alt_baslik"])

    def _footer(self) -> None:
        c = self.c
        c.setStrokeColor(C_GOLD)
        c.setLineWidth(0.6)
        c.line(ML, Y_BOTTOM - 16, W - MR, Y_BOTTOM - 16)
        c.setFillColor(C_MUTED)
        c.setFont("Segoe", 6.8)
        b = self.buro
        c.drawString(ML, Y_BOTTOM - 27, f'{b["avukat"]}  ·  {b["buro"]}  ·  {b["adres"]}')
        c.drawString(ML, Y_BOTTOM - 36, f'{b["site"]}  ·  {b["eposta"]}  ·  {b["baro"]}')
        pg = f"Sayfa {self.page}" + (f" / {self.total}" if self.total else "")
        c.setFont("Segoe-Semibold", 7)
        c.setFillColor(C_NAVY)
        c.drawRightString(W - MR, Y_BOTTOM - 27, pg)
        c.setFont("Segoe", 6.5)
        c.setFillColor(C_MUTED)
        c.drawRightString(W - MR, Y_BOTTOM - 36, f'Form sürümü {schema.META["surum"]}')

    def new_page(self) -> None:
        self._footer()
        self.c.showPage()
        self.page += 1
        self.y = Y_TOP
        self._header()

    def ensure(self, h: float) -> None:
        if self.y - h < Y_BOTTOM:
            self.new_page()

    def finish(self) -> int:
        self._footer()
        self.c.save()
        return self.page

    # ---- ilkel çizimler -------------------------------------------------
    def _name(self) -> str:
        self.n += 1
        return f"f{self.n:03d}"

    def text(self, x, y, s, font="Segoe", size=8.5, color=C_INK, right=False):
        self.c.setFont(font, size)
        self.c.setFillColor(color)
        (self.c.drawRightString if right else self.c.drawString)(x, y, s)

    def wrap(self, s, font, size, w) -> list[str]:
        return simpleSplit(s, font, size, w)

    def para(self, s, x, y_top, w, font="Segoe", size=8.5, color=C_INK, lead=None) -> float:
        lead = lead or size * 1.32
        lines = self.wrap(s, font, size, w)
        yy = y_top - size
        for ln in lines:
            self.text(x, yy, ln, font, size, color)
            yy -= lead
        return len(lines) * lead

    def field(self, x, y_top, w, h, multiline=False, tooltip=None):
        self.c.acroForm.textfield(
            name=self._name(), x=x, y=y_top - h, width=w, height=h,
            fillColor=C_FIELD, borderColor=C_LINE, borderWidth=0.5,
            fontName="Helvetica", fontSize=9, textColor=C_INK,
            fieldFlags="multiline" if multiline else "",
            maxlen=4000 if multiline else 300, tooltip=tooltip,
        )

    def checkbox(self, x, y_top, size=10, tooltip=None):
        self.c.acroForm.checkbox(
            name=self._name(), x=x, y=y_top - size, size=size,
            buttonStyle="check", borderColor=C_NAVY, borderWidth=0.7,
            fillColor=white, textColor=C_NAVY, fieldFlags="", tooltip=tooltip,
        )

    def box(self, x, y_top, w, h, fill=C_CREAM, stroke=None, bar=None, lw=0.8):
        c = self.c
        c.setFillColor(fill)
        if stroke:
            c.setStrokeColor(stroke)
            c.setLineWidth(lw)
        c.rect(x, y_top - h, w, h, stroke=1 if stroke else 0, fill=1)
        if bar:
            c.setFillColor(bar)
            c.rect(x, y_top - h, 3, h, stroke=0, fill=1)

    # ---- kapak blokları -------------------------------------------------
    def cover(self) -> None:
        c = self.c
        h = 96
        self.box(ML, self.y, CW, h, fill=C_NAVY)
        c.setStrokeColor(C_GOLD)
        c.setLineWidth(1)
        c.roundRect(ML + 8, self.y - h + 8, CW - 16, h - 16, 6, stroke=1, fill=0)
        self.text(ML + 26, self.y - 42, schema.META["baslik"], "Georgia-Bold", 22, C_CREAM)
        self.text(ML + 26, self.y - 66, schema.META["alt_baslik"], "Georgia", 14, C_GOLD)
        self.text(W - MR - 26, self.y - 78, f'Sürüm {schema.META["surum"]}', "Segoe", 7, C_GOLD, right=True)
        self.y -= h + 12
        self.y -= self.para(schema.META["aciklama"], ML, self.y, CW, "Segoe", 9.2, C_INK) + 10

        # Talimatlar
        lines_h = 0
        items = []
        for i, t in enumerate(schema.TALIMATLAR, 1):
            ls = self.wrap(t, "Segoe", 8.4, CW - 40)
            items.append(ls)
            lines_h += len(ls) * 11.2 + 3
        bh = lines_h + 26
        self.box(ML, self.y, CW, bh, fill=C_CREAM, bar=C_GOLD)
        self.text(ML + 14, self.y - 14, "FORMU DOLDURMADAN ÖNCE", "Segoe-Bold", 8, C_NAVY)
        yy = self.y - 28
        for i, ls in enumerate(items, 1):
            self.text(ML + 14, yy, f"{i}.", "Segoe-Semibold", 8.4, C_NAVY)
            for ln in ls:
                self.text(ML + 26, yy, ln, "Segoe", 8.4, C_INK)
                yy -= 11.2
            yy -= 3
        self.y -= bh + 10

        # Süre uyarısı
        su = schema.SURE_UYARISI
        items = [self.wrap(t, "Segoe", 8.4, CW - 44) for t in su["maddeler"]]
        bh = sum(len(ls) * 11.2 + 3 for ls in items) + 44
        self.box(ML, self.y, CW, bh, fill=white, stroke=C_GOLD, lw=1.2)
        self.text(ML + 14, self.y - 15, su["baslik"], "Segoe-Bold", 8.6, C_NAVY)
        yy = self.y - 30
        for ls in items:
            c.setFillColor(C_GOLD)
            c.circle(ML + 18, yy + 2.6, 1.8, stroke=0, fill=1)
            for ln in ls:
                self.text(ML + 26, yy, ln, "Segoe", 8.4, C_INK)
                yy -= 11.2
            yy -= 3
        self.text(ML + 14, yy - 4, su["son_satir"], "Segoe-Semibold", 8.4, C_NAVY)
        self.y -= bh + 14

    # ---- bölüm ve alanlar ----------------------------------------------
    def section(self, kod: str, baslik: str) -> None:
        self.ensure(125)  # başlık + ilk alan aynı sayfada kalsın
        c = self.c
        self.y -= 4
        c.setFillColor(C_GOLD)
        c.rect(ML, self.y - 15, 17, 17, stroke=0, fill=1)
        self.text(ML + 8.5 - pdfmetrics.stringWidth(kod, "Georgia-Bold", 10) / 2,
                  self.y - 11, kod, "Georgia-Bold", 10, C_NAVY)
        self.text(ML + 24, self.y - 11.5, baslik, "Georgia-Bold", 12.5, C_NAVY)
        c.setStrokeColor(C_GOLD)
        c.setLineWidth(0.7)
        c.line(ML, self.y - 20, W - MR, self.y - 20)
        self.y -= 30

    def _label_h(self, w, label, hint) -> float:
        h = len(self.wrap(label, "Segoe-Semibold", 8.5, w)) * 10.6
        if hint:
            h += len(self.wrap(hint, "Segoe", 7.2, w)) * 9
        return h

    def _label_block(self, x, y_top, w, label, hint) -> float:
        h = self.para(label, x, y_top, w, "Segoe-Semibold", 8.5, C_INK, lead=10.6)
        if hint:
            h += self.para(hint, x, y_top - h, w, "Segoe", 7.2, C_MUTED, lead=9)
        return h

    def f_text(self, label, hint=None) -> None:
        lh = self._label_h(LABEL_COL - 8, label, hint)
        rh = max(lh, FIELD_H)
        self.ensure(rh + GAP)
        self._label_block(ML, self.y, LABEL_COL - 8, label, hint)
        self.field(ML + LABEL_COL, self.y - (rh - FIELD_H) / 2, CW - LABEL_COL, FIELD_H, tooltip=label)
        self.y -= rh + GAP

    def f_pair(self, a, b) -> None:
        cw = (CW - 12) / 2
        lh = max(self._label_h(cw, lab, hint) for lab, hint in (a, b))
        rh = lh + 2 + FIELD_H
        self.ensure(rh + GAP)
        for i, (lab, hint) in enumerate((a, b)):
            x = ML + i * (cw + 12)
            self._label_block(x, self.y, cw, lab, hint)
            self.field(x, self.y - lh - 2, cw, FIELD_H, tooltip=lab)
        self.y -= rh + GAP

    def f_multi(self, label, lines, hint=None) -> None:
        lh = self._label_h(CW, label, hint)
        fh = lines * 13 + 6
        self.ensure(lh + 2 + fh + GAP)
        self._label_block(ML, self.y, CW, label, hint)
        self.field(ML, self.y - lh - 2, CW, fh, multiline=True, tooltip=label)
        self.y -= lh + 2 + fh + GAP

    def f_yesno(self, label, hint=None) -> None:
        lh = self._label_h(LABEL_COL - 8, label, hint)
        rh = max(lh, FIELD_H)
        self.ensure(rh + GAP)
        self._label_block(ML, self.y, LABEL_COL - 8, label, hint)
        yc = self.y - (rh - FIELD_H) / 2
        x = ML + LABEL_COL
        for opt in ("Evet", "Hayır"):
            self.checkbox(x, yc - 4, 10, tooltip=f"{label} — {opt}")
            self.text(x + 13, yc - 12, opt, "Segoe", 8.5, C_INK)
            x += 13 + pdfmetrics.stringWidth(opt, "Segoe", 8.5) + 12
        self.field(x + 2, yc, W - MR - x - 2, FIELD_H, tooltip=hint or "Açıklama")
        self.y -= rh + GAP

    def f_choice(self, label, options, other=False) -> None:
        ls = self.wrap(label, "Segoe-Semibold", 8.5, CW)
        lh = len(ls) * 10.6
        # akış yerleşimi
        rows, cur, cur_w = [], [], 0
        items = [(o, 13 + pdfmetrics.stringWidth(o, "Segoe", 8.5) + 14) for o in options]
        if other:
            items.append(("__other__", 13 + pdfmetrics.stringWidth("Diğer:", "Segoe", 8.5) + 6 + 110 + 14))
        for o, w in items:
            if cur and cur_w + w > CW:
                rows.append(cur)
                cur, cur_w = [], 0
            cur.append((o, w))
            cur_w += w
        if cur:
            rows.append(cur)
        rh = lh + 4 + len(rows) * 15
        self.ensure(rh + GAP)
        self.para(label, ML, self.y, CW, "Segoe-Semibold", 8.5, C_INK, lead=10.6)
        yy = self.y - lh - 4
        for row in rows:
            x = ML
            for o, w in row:
                self.checkbox(x, yy - 1, 10, tooltip=f"{label} — {o if o != '__other__' else 'Diğer'}")
                if o == "__other__":
                    self.text(x + 13, yy - 9, "Diğer:", "Segoe", 8.5, C_INK)
                    ox = x + 13 + pdfmetrics.stringWidth("Diğer:", "Segoe", 8.5) + 6
                    self.field(ox, yy + 2, 110, 13, tooltip="Diğer")
                else:
                    self.text(x + 13, yy - 9, o, "Segoe", 8.5, C_INK)
                x += w
            yy -= 15
        self.y -= rh + GAP

    def f_table(self, label, cols, nrows) -> None:
        n = len(cols)
        weights = [1.2, 1, 0.9, 1, 1.5] if n == 5 else ([0.8, 1, 1.6] if n == 3 else [1] * n)
        tot = sum(weights)
        widths = [CW * w / tot for w in weights]
        hh, rh = 16, 18
        self.ensure(12 + hh + rh * 2)
        self.para(label, ML, self.y, CW, "Segoe-Semibold", 8.5, C_INK, lead=10.6)
        self.y -= 14
        self._table_header(cols, widths, hh)
        self.y -= hh
        for r in range(nrows):
            if self.y - rh < Y_BOTTOM:
                self.new_page()
                self._table_header(cols, widths, hh)
                self.y -= hh
            x = ML
            for i, w in enumerate(widths):
                self.field(x, self.y, w, rh, tooltip=f"{cols[i]} — {r + 1}")
                x += w
            self.y -= rh
        self.y -= GAP + 2

    def _table_header(self, cols, widths, hh) -> None:
        self.box(ML, self.y, CW, hh, fill=C_NAVY)
        x = ML
        for col, w in zip(cols, widths):
            self.text(x + 4, self.y - 11, col, "Segoe-Semibold", 7.8, C_CREAM)
            x += w

    def f_docs(self, items) -> None:
        cols = [("Belge", CW - 60 - 88 - 44), ("Elimde var", 60), ("Temin edebilirim", 88), ("Yok", 44)]
        hh, rh = 16, 16
        self.ensure(hh + rh * 2)
        self._docs_header(cols, hh)
        self.y -= hh
        for i, it in enumerate(items):
            if self.y - rh < Y_BOTTOM:
                self.new_page()
                self._docs_header(cols, hh)
                self.y -= hh
            if i % 2 == 0:
                self.box(ML, self.y, CW, rh, fill=C_CREAM)
            self.text(ML + 4, self.y - 11, f"{i + 1}. {it}", "Segoe", 8.2, C_INK)
            x = ML + cols[0][1]
            for name, w in cols[1:]:
                self.checkbox(x + w / 2 - 5, self.y - 3, 10, tooltip=f"{it} — {name}")
                x += w
            self.y -= rh
        self.c.setStrokeColor(C_LINE)
        self.c.setLineWidth(0.5)
        self.c.line(ML, self.y, W - MR, self.y)
        self.y -= GAP + 2

    def _docs_header(self, cols, hh) -> None:
        self.box(ML, self.y, CW, hh, fill=C_NAVY)
        x = ML
        for name, w in cols:
            self.text(x + 4, self.y - 11, name, "Segoe-Semibold", 7.8, C_CREAM)
            x += w

    def f_note(self, s) -> None:
        ls = self.wrap(s, "Segoe", 8.3, CW - 24)
        bh = len(ls) * 11 + 12
        self.ensure(bh + GAP)
        self.box(ML, self.y, CW, bh, fill=C_CREAM, bar=C_GOLD)
        yy = self.y - 14
        for ln in ls:
            self.text(ML + 14, yy, ln, "Segoe", 8.3, C_INK)
            yy -= 11
        self.y -= bh + GAP

    # ---- kapanış blokları ----------------------------------------------
    def beyan(self) -> None:
        ls = self.wrap(schema.BEYAN, "Segoe", 8.4, CW - 24)
        bh = len(ls) * 11.2 + 24 + 70
        self.ensure(bh + 10)
        self.box(ML, self.y, CW, bh, fill=white, stroke=C_NAVY, lw=0.9)
        self.text(ML + 12, self.y - 15, "BEYAN VE İMZA", "Segoe-Bold", 8.6, C_NAVY)
        yy = self.y - 30
        for ln in ls:
            self.text(ML + 12, yy, ln, "Segoe", 8.4, C_INK)
            yy -= 11.2
        yy -= 6
        cw = (CW - 24 - 24) / 3
        for i, lab in enumerate(("Tarih", "Ad Soyad", "İmza")):
            x = ML + 12 + i * (cw + 12)
            self.text(x, yy - 8, lab, "Segoe-Semibold", 7.8, C_NAVY)
            if lab == "İmza":
                self.box(x, yy - 12, cw, 34, fill=C_FIELD, stroke=C_LINE, lw=0.5)
            else:
                self.field(x, yy - 12 - 7, cw, FIELD_H, tooltip=lab)
        self.y -= bh + 12

    def buro_kutusu(self) -> None:
        bk = schema.BURO_KUTUSU
        rows = bk["satirlar"]
        bh = 26 + len(rows) * 30 + 14 + len(bk["kontrol"]) * 13 + 8
        self.ensure(bh + 6)
        self.box(ML, self.y, CW, bh, fill=C_GREY, stroke=C_MUTED, lw=0.6)
        self.text(ML + 12, self.y - 15, bk["baslik"], "Segoe-Bold", 8.2, C_INK)
        yy = self.y - 26
        cw = (CW - 24 - 12) / 2
        for a, b in rows:
            for i, lab in enumerate((a, b)):
                x = ML + 12 + i * (cw + 12)
                self.text(x, yy - 8, lab, "Segoe", 7.3, C_INK)
                self.field(x, yy - 11, cw, 15, tooltip=lab)
            yy -= 30
        yy -= 4
        for k in bk["kontrol"]:
            self.checkbox(ML + 12, yy - 1, 9, tooltip=k)
            self.text(ML + 26, yy - 9, k, "Segoe", 7.6, C_INK)
            yy -= 13
        self.y -= bh + 6

    # ---- ana akış ------------------------------------------------------
    def build(self) -> int:
        self.cover()
        for sec in schema.SECTIONS:
            self.section(sec["kod"], sec["baslik"])
            for f in sec["alanlar"]:
                kind = f[0]
                if kind == "text":
                    self.f_text(f[1], f[2] if len(f) > 2 else None)
                elif kind == "date":
                    self.f_text(f[1], f[2] if len(f) > 2 else "GG.AA.YYYY")
                elif kind == "pair":
                    self.f_pair(f[1], f[2])
                elif kind == "multi":
                    self.f_multi(f[1], f[2], f[3] if len(f) > 3 else None)
                elif kind == "choice":
                    self.f_choice(f[1], f[2], f[3] if len(f) > 3 else False)
                elif kind == "yesno":
                    self.f_yesno(f[1], f[2] if len(f) > 2 else None)
                elif kind == "table":
                    self.f_table(f[1], f[2], f[3])
                elif kind == "docs":
                    self.f_docs(f[1])
                elif kind == "note":
                    self.f_note(f[1])
                else:
                    raise ValueError(f"bilinmeyen alan türü: {kind}")
        self.y -= 6
        self.beyan()
        self.buro_kutusu()
        return self.finish()


def render(out: Path) -> int:
    """İki geçişli üretim; toplam sayfa sayısını döner."""
    pages = PdfForm(io.BytesIO()).build()
    out.parent.mkdir(parents=True, exist_ok=True)
    PdfForm(str(out), total_pages=pages).build()
    return pages
