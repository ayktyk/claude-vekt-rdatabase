"""
MD -> UDF Donusum Scripti (Nihai Dilekce Icin)

Nihai dilekce (v2, istinaf, temyiz) icin UYAP .udf ciktisi uretir.
Taslak asamalar (v1, usul, arastirma, briefing, vs.) icin UDF URETMEZ.

Mimari karar (22.04.2026 / iterasyon 2):
  Ilk iterasyon udf-cli'nin html2udf komutunu kullandi ama cikti
  "hepsi duz sol hizali, bold/underline yok, numarali paragraf plain"
  seklinde kabaydi. Referans dosya (2.udf) format_id=1.7, 2.5 cm
  kenar boslugu, ortalanmis bold baslik, bold+underline label + tab
  + value taraf bloklari, numarali paragraflar (Numbered=true,
  LeftIndent=25), bold+underline bolum basliklari, sag-hizali imza
  yapisina sahipti.

  Bu iterasyonda udf-cli bypass edildi. Dilekce-farkinda (structure-aware)
  bir Python UDF generator yazildi. Cikti 2.udf referansiyla goruntu
  seviyesinde eslesiyor.

Akis:
  1. MD dosyasini oku, YAML frontmatter'i soyutla.
  2. Dilekce-farkinda parser satir satir gezer:
     - Baslik satiri (first caps-line ending with MAHKEMESI/HAKIMLIGINE)
       -> Alignment=1 center, bold
     - "ESAS NO:" sag-hizali
     - "LABEL    : value" taraf bloklari (DAVACILAR, VEKILLERI, DAVALI,
       KONU, HARCA ESAS DAVA DEGERI vb.) -> bold+underline label + tab
       + value
     - Taraf blok devam satirlari (cok bosluk ile baslayan) -> Alignment=3
       plain, orijinal boslugu koru
     - Tum-kapital bolum basliklari (AÇIKLAMALAR, HUKUKİ DEĞERLENDİRME,
       HUKUKİ SEBEPLER, SONUÇ VE İSTEM, EKLER) -> bold+underline
     - Numarali paragraflar "N. text..." -> Numbered=true ListId=1
       ListLevel=1 LeftIndent=25.0 NumberType=NUMBER_TYPE_NUMBER_DOT
       (numara prefix'i metinden silinir, UDF niteliginden renderlenir)
     - Imza bloku (Av. ..., Vekili) -> Alignment=2 right, bold
     - Geri kalan duz metin -> Alignment=3 justify
     - Bos satir -> bos paragraf (Alignment=3, length=1 \n)
  3. `**bold**` ve `*italic*` Markdown markerlar inline olarak parse edilir.
  4. Offset'ler ve content run'lari tek CDATA metin uzerinden uretilir.
  5. UDF XML'i 2.udf sablonuyla emit edilir, ZIP icinde content.xml yazilir.
  6. Cikti dosyasi dogrulanir.

Kullanim:
    python md_to_udf.py <input.md> [output.udf]
"""

import io
import re
import sys
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional


PAGE_MARGIN_PT = 70.87

SECTION_HEADINGS = {
    "AÇIKLAMALAR",
    "HUKUKİ DEĞERLENDİRME",
    "HUKUKİ NEDENLER",
    "HUKUKİ SEBEPLER",
    "HUKUKİ DELİLLER",
    "DELİLLER",
    "SONUÇ VE İSTEM",
    "SONUÇ VE TALEP",
    "NETİCE-İ TALEP",
    "EKLER",
    "TALEP",
}

# Uppercase Turkish letters set
TR_UPPER = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZWXQ"


def strip_frontmatter(text: str) -> str:
    """YAML frontmatter blogunu (--- ... ---) kaldir."""
    if text.startswith("---"):
        end = text.find("---", 3)
        if end != -1:
            return text[end + 3 :].lstrip("\n")
    return text


def safe_cdata(s: str) -> str:
    """CDATA icinde literal `]]>` dizilimini escape et."""
    return s.replace("]]>", "]]]]><![CDATA[>")


# --- Inline text run (for bold/italic within a paragraph) ----------------

@dataclass
class InlineRun:
    text: str
    bold: bool = False
    italic: bool = False
    underline: bool = False


# --- Paragraph model ------------------------------------------------------

@dataclass
class Para:
    """Generic paragraph with inline runs."""
    runs: List[InlineRun] = field(default_factory=list)
    alignment: int = 3  # 0=left, 1=center, 2=right, 3=justify
    numbered: bool = False
    left_indent: Optional[float] = None

    @property
    def text(self) -> str:
        return "".join(r.text for r in self.runs)

    def total_length(self) -> int:
        """Total char length including trailing \n (added by emitter)."""
        return sum(len(r.text) for r in self.runs) + 1  # +1 for \n


# --- Inline markdown parser ----------------------------------------------

_INLINE_RE = re.compile(
    r"(\*\*\*(?P<bi>.+?)\*\*\*|"          # ***bold italic***
    r"\*\*(?P<b>.+?)\*\*|"                 # **bold**
    r"\*(?P<i>.+?)\*)",                    # *italic*
    re.DOTALL,
)


def parse_inline(text: str, base_bold: bool = False, base_italic: bool = False,
                 base_underline: bool = False) -> List[InlineRun]:
    """Parse a single line's inline markdown into runs."""
    runs: List[InlineRun] = []
    pos = 0
    for m in _INLINE_RE.finditer(text):
        if m.start() > pos:
            runs.append(InlineRun(text[pos : m.start()],
                                  bold=base_bold, italic=base_italic,
                                  underline=base_underline))
        if m.group("bi") is not None:
            runs.append(InlineRun(m.group("bi"),
                                  bold=True, italic=True,
                                  underline=base_underline))
        elif m.group("b") is not None:
            runs.append(InlineRun(m.group("b"),
                                  bold=True, italic=base_italic,
                                  underline=base_underline))
        elif m.group("i") is not None:
            runs.append(InlineRun(m.group("i"),
                                  bold=base_bold, italic=True,
                                  underline=base_underline))
        pos = m.end()
    if pos < len(text):
        runs.append(InlineRun(text[pos:],
                              bold=base_bold, italic=base_italic,
                              underline=base_underline))
    return runs


# --- Structure-aware line classifier --------------------------------------

def is_title_line(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    if not stripped.isupper() and not all(
        c in TR_UPPER or c.isspace() or c in "'.-" for c in stripped
    ):
        return False
    # ends with standard dilekce title suffixes
    upper = stripped.upper()
    return any(
        upper.endswith(suf)
        for suf in (
            "MAHKEMESİ'NE",
            "MAHKEMESINE",
            "HAKİMLİĞİNE",
            "HAKIMLIGINE",
            "KURULU'NA",
            "KURULUNA",
            "DAİRESİ'NE",
            "DAİRESİNE",
            "BAŞKANLIĞI'NA",
            "BASKANLIGINA",
        )
    )


# Party label pattern: ALL CAPS WORD(S) + >=2 spaces + ":" + rest
# (visually aligned — DAVACILAR, VEKILLERI, DAVALI, KONU etc.)
_LABEL_VALUE_RE = re.compile(
    r"^([A-ZĞÜŞİÖÇ][A-ZĞÜŞİÖÇ \-]{1,40}?)\s{2,}:\s*(.*)$"
)

# Inline label pattern: ALL CAPS WORD(S) + ":" (no spaces) + rest
# (e.g., "HUKUKİ NEDENLER: 6098 s. TBK m.344 ve m.345...")
_INLINE_LABEL_RE = re.compile(
    r"^([A-ZĞÜŞİÖÇ][A-ZĞÜŞİÖÇ ]{3,40}?):\s+(.+)$"
)

# Trailing-colon section heading: "SONUÇ VE İSTEM:" alone on its line
_COLON_HEADING_RE = re.compile(
    r"^([A-ZĞÜŞİÖÇ][A-ZĞÜŞİÖÇ ]{3,40}?):\s*$"
)

# Numbered paragraph
_NUMBERED_RE = re.compile(r"^(\d+)\.\s+(.+)$")

# Right-aligned ESAS NO line: many leading spaces + "ESAS NO:" or similar
_ESAS_NO_RE = re.compile(r"^\s{10,}.*ESAS NO:.*$")

# Signature detection
_SIG_RE = re.compile(r"^\s*(Av\.|Vekili|Davacı Vekili|Davalı Vekili|Müdafi)", re.IGNORECASE)


def is_section_heading(line: str) -> bool:
    stripped = line.strip()
    return stripped in SECTION_HEADINGS


# --- Parse MD into paragraph list -----------------------------------------

def parse_md_to_paras(md_text: str) -> List[Para]:
    lines = md_text.split("\n")
    paras: List[Para] = []
    i = 0
    n = len(lines)

    # Eat leading blank lines (add as blank paras)
    while i < n and not lines[i].strip():
        paras.append(Para(runs=[InlineRun("")], alignment=3))
        i += 1

    # Title (first non-blank line)
    if i < n and is_title_line(lines[i]):
        title = lines[i].strip()
        paras.append(Para(
            runs=[InlineRun(title, bold=True)],
            alignment=1,
        ))
        i += 1

    # Main content loop
    while i < n:
        line = lines[i]
        stripped = line.strip()

        # Blank line
        if not stripped:
            paras.append(Para(runs=[InlineRun("")], alignment=3))
            i += 1
            continue

        # "ESAS NO:" right-aligned
        if _ESAS_NO_RE.match(line):
            m = re.match(r"^\s+(.*)$", line)
            text = m.group(1) if m else stripped
            paras.append(Para(
                runs=parse_inline(text),
                alignment=2,
            ))
            i += 1
            continue

        # Section heading (known set — AÇIKLAMALAR, EKLER etc.)
        if is_section_heading(line):
            paras.append(Para(
                runs=[InlineRun(stripped, bold=True, underline=True)],
                alignment=3,
            ))
            i += 1
            continue

        # Trailing-colon heading: "SONUÇ VE İSTEM:" alone on line
        m_ch = _COLON_HEADING_RE.match(line)
        if m_ch and m_ch.group(1).strip() in SECTION_HEADINGS:
            paras.append(Para(
                runs=[InlineRun(stripped, bold=True, underline=True)],
                alignment=3,
            ))
            i += 1
            continue

        # Party label pattern (visually aligned): "LABEL   : value"
        m = _LABEL_VALUE_RE.match(line)
        if m:
            label = m.group(1).strip()
            value = m.group(2)
            runs: List[InlineRun] = [InlineRun(label, bold=True, underline=True)]
            runs.append(InlineRun("\t"))  # tab separator
            runs.append(InlineRun(": "))
            runs.extend(parse_inline(value))
            paras.append(Para(runs=runs, alignment=3))
            i += 1
            continue

        # Inline label pattern (tight): "HUKUKİ NEDENLER: content"
        m_il = _INLINE_LABEL_RE.match(line)
        if m_il:
            label = m_il.group(1).strip()
            value = m_il.group(2)
            runs = [InlineRun(label, bold=True, underline=True)]
            runs.append(InlineRun(": "))
            runs.extend(parse_inline(value))
            paras.append(Para(runs=runs, alignment=3))
            i += 1
            continue

        # Numbered paragraph "N. text..."
        m = _NUMBERED_RE.match(line)
        if m:
            content = m.group(2)
            # Check if subsequent lines continue this paragraph (no blank, not new pattern)
            j = i + 1
            while j < n:
                nxt = lines[j]
                nxt_s = nxt.strip()
                if not nxt_s:
                    break
                if _NUMBERED_RE.match(nxt):
                    break
                if _LABEL_VALUE_RE.match(nxt):
                    break
                if is_section_heading(nxt):
                    break
                # Continuation line: append with space
                content += " " + nxt_s
                j += 1
            paras.append(Para(
                runs=parse_inline(content),
                alignment=3,
                numbered=True,
                left_indent=25.0,
            ))
            i = j
            continue

        # Signature line detection FIRST (before indent-continuation,
        # because signature lines typically have heavy leading padding).
        if re.match(r"^\s*(Davacı|Davacılar|Davalı|Davalılar|Müvekkil|Müdafi)?\s*Vekili\s*$", line, re.IGNORECASE):
            paras.append(Para(
                runs=[InlineRun(stripped, bold=True)],
                alignment=2,
            ))
            i += 1
            # Right-align the immediately following Av. ... line(s) too
            while i < n:
                nxt = lines[i]
                if re.match(r"^\s*Av\.\s+", nxt) and not _LABEL_VALUE_RE.match(nxt):
                    paras.append(Para(
                        runs=[InlineRun(nxt.strip(), bold=True)],
                        alignment=2,
                    ))
                    i += 1
                else:
                    break
            continue

        # Party block continuation line (leading spaces >= 3) —
        # keep alignment=3, preserve leading spacing (so Av./name/address
        # lines inside VEKILLERI/DAVACILAR blocks stay left-indented).
        if line.startswith("   "):
            paras.append(Para(
                runs=parse_inline(line.rstrip()),
                alignment=3,
            ))
            i += 1
            continue

        # EK-N entries: each "Ek-N : ..." line stays as its own paragraph
        # (not merged into a running paragraph).
        if re.match(r"^Ek[- ]?\d+\s*:", stripped):
            paras.append(Para(
                runs=parse_inline(stripped),
                alignment=3,
            ))
            i += 1
            continue

        # Regular justified paragraph — might span multiple lines until
        # blank or structural change
        content = stripped
        j = i + 1
        while j < n:
            nxt = lines[j]
            nxt_s = nxt.strip()
            if not nxt_s:
                break
            if _NUMBERED_RE.match(nxt):
                break
            if _LABEL_VALUE_RE.match(nxt):
                break
            if is_section_heading(nxt):
                break
            if re.match(r"^\s*(Davacı|Davacılar|Davalı|Davalılar|Müvekkil|Müdafi)?\s*Vekili\s*$", nxt, re.IGNORECASE):
                break
            if is_title_line(nxt):
                break
            if nxt.startswith("   "):
                break
            if _INLINE_LABEL_RE.match(nxt):
                break
            if _COLON_HEADING_RE.match(nxt) and _COLON_HEADING_RE.match(nxt).group(1).strip() in SECTION_HEADINGS:
                break
            if re.match(r"^Ek[- ]?\d+\s*:", nxt_s):
                break
            content += " " + nxt_s
            j += 1
        paras.append(Para(
            runs=parse_inline(content),
            alignment=3,
        ))
        i = j

    # Trim trailing blank paragraphs (max 1)
    while len(paras) >= 2 and not paras[-1].text and not paras[-2].text:
        paras.pop()

    return paras


# --- UDF XML emitter ------------------------------------------------------

def _emit_run_xml(run: InlineRun, cursor: int) -> tuple:
    """Return (xml_fragment, chars_consumed). Handles tabs as <tab> element."""
    if run.text == "\t":
        attrs = []
        if run.bold:
            attrs.append('bold="true"')
        if run.italic:
            attrs.append('italic="true"')
        if run.underline:
            attrs.append('underline="true"')
        attr_str = (" " + " ".join(attrs)) if attrs else ""
        xml = f'<tab{attr_str} startOffset="{cursor}" length="1" />'
        return xml, 1
    # Normal content element
    attrs = []
    if run.bold:
        attrs.append('bold="true"')
    if run.italic:
        attrs.append('italic="true"')
    if run.underline:
        attrs.append('underline="true"')
    attr_str = (" " + " ".join(attrs)) if attrs else ""
    n = len(run.text)
    xml = f'<content{attr_str} startOffset="{cursor}" length="{n}" />'
    return xml, n


def emit_udf_xml(paras: List[Para]) -> str:
    """Emit 2.udf-style content.xml from paragraph list."""
    # Full text: each paragraph's runs concatenated, followed by \n
    text_parts: List[str] = []
    para_xmls: List[str] = []
    cursor = 0

    for para in paras:
        runs_xml: List[str] = []
        if not para.runs or (len(para.runs) == 1 and para.runs[0].text == ""):
            # Blank paragraph: just the \n
            text_parts.append("\n")
            runs_xml.append(f'<content startOffset="{cursor}" length="1" />')
            cursor += 1
        else:
            # Emit each run, then append \n as part of last run or as separate
            for run in para.runs:
                if not run.text:
                    continue
                xml_frag, consumed = _emit_run_xml(run, cursor)
                runs_xml.append(xml_frag)
                text_parts.append(run.text)
                cursor += consumed
            # Append newline as a tiny content element (matches 2.udf style:
            # the trailing \n is part of the paragraph's last content or as
            # a separate short content). Simplest: add 1-char content.
            text_parts.append("\n")
            runs_xml.append(f'<content startOffset="{cursor}" length="1" />')
            cursor += 1

        # Paragraph opening tag
        attrs = []
        if para.alignment != 0:
            attrs.append(f'Alignment="{para.alignment}"')
        if para.numbered:
            attrs.append('Numbered="true"')
            attrs.append('ListId="1"')
            attrs.append('ListLevel="1"')
            if para.left_indent is not None:
                attrs.append(f'LeftIndent="{para.left_indent}"')
            attrs.append('NumberType="NUMBER_TYPE_NUMBER_DOT"')
        elif para.left_indent is not None:
            attrs.append(f'LeftIndent="{para.left_indent}"')
        attr_str = (" " + " ".join(attrs)) if attrs else ""
        para_xmls.append(f"<paragraph{attr_str}>{''.join(runs_xml)}</paragraph>")

    full_text = "".join(text_parts)
    # Remove trailing newline to avoid phantom paragraph
    if full_text.endswith("\n"):
        # keep it — UDF spec permits trailing \n
        pass

    m_str = f"{PAGE_MARGIN_PT:.3f}"
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8" ?>',
        '<template format_id="1.7">',
        f'<content><![CDATA[{safe_cdata(full_text)}]]></content>',
        '<properties>',
        f'<pageFormat mediaSizeName="1" leftMargin="{m_str}" rightMargin="{m_str}" topMargin="{m_str}" bottomMargin="{m_str}" paperOrientation="1" headerFOffset="20.0" footerFOffset="20.0" />',
        '</properties>',
        '<elements resolver="hvl-default">',
        "\n".join(para_xmls),
        '</elements>',
        '<styles>',
        '<style name="default" description="Geçerli" family="Dialog" size="12" bold="false" italic="false" foreground="-13421773" FONT_ATTRIBUTE_KEY="javax.swing.plaf.FontUIResource[family=Dialog,name=Dialog,style=plain,size=12]" />',
        '<style name="hvl-default" family="Times New Roman" size="12" description="Gövde" />',
        '</styles>',
        '</template>',
    ]
    return "\n".join(xml_lines)


# --- Validation -----------------------------------------------------------

def validate_udf(udf_path: Path, min_size: int = 1024) -> None:
    if not udf_path.exists():
        raise FileNotFoundError(f"UDF olusturulamadi: {udf_path}")
    size = udf_path.stat().st_size
    if size < min_size:
        raise ValueError(f"UDF cok kucuk ({size} byte) — icerik bos olabilir.")
    if not zipfile.is_zipfile(udf_path):
        raise ValueError(f"UDF gecerli bir ZIP degil: {udf_path}")
    with zipfile.ZipFile(udf_path, "r") as z:
        names = z.namelist()
        if "content.xml" not in names:
            raise ValueError(f"UDF icinde content.xml yok: {names}")
        xml = z.read("content.xml").decode("utf-8", errors="replace")
        if "<![CDATA[" not in xml:
            raise ValueError("content.xml'de CDATA bloku yok.")
        if "<paragraph" not in xml:
            raise ValueError("content.xml'de hic paragraph elementi yok.")
        if re.search(r"---\s*\nmodel:", xml) or re.search(r"run_id:\s*\d{4}-", xml):
            raise ValueError(
                "YAML frontmatter UDF govdesine kacmis — strip_frontmatter calismadi."
            )


# --- Main pipeline --------------------------------------------------------

def md_to_udf(md_path: Path, udf_path: Path) -> Path:
    """MD dosyasini structure-aware UDF'e cevir."""
    if not md_path.exists():
        raise FileNotFoundError(f"Girdi MD yok: {md_path}")

    raw = md_path.read_text(encoding="utf-8")
    clean = strip_frontmatter(raw)
    paras = parse_md_to_paras(clean)
    xml = emit_udf_xml(paras)

    udf_path.parent.mkdir(parents=True, exist_ok=True)

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zout:
        zout.writestr("content.xml", xml.encode("utf-8"))
    udf_path.write_bytes(buf.getvalue())

    validate_udf(udf_path)
    return udf_path


def main() -> int:
    if len(sys.argv) < 2:
        print("Kullanim: python md_to_udf.py <input.md> [output.udf]")
        return 1

    md_path = Path(sys.argv[1])
    if len(sys.argv) >= 3:
        udf_path = Path(sys.argv[2])
    else:
        udf_path = md_path.with_suffix(".udf")

    try:
        out = md_to_udf(md_path, udf_path)
    except FileNotFoundError as e:
        print(f"[HATA] {e}")
        return 1
    except ValueError as e:
        print(f"[HATA] {e}")
        return 1

    size = out.stat().st_size
    print(f"[OK] UDF uretildi: {out}  ({size} byte)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
