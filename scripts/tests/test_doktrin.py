"""Doktrin kontratı + doktrin_lint + cikti_dogrula testleri (trust-gate çekirdeği).

Çalıştır: python -m pytest scripts/tests/test_doktrin.py -q
"""
from pathlib import Path

import doktrin_contract as dc
import doktrin_lint
import cikti_dogrula

ROOT = Path(__file__).resolve().parent.parent.parent
PREAMBLE = ROOT / "prompts" / "_doktrin-preamble.md"


# --- Kontrat self-consistency ---

def test_preamble_dosyasi_var_ve_tam():
    assert PREAMBLE.exists(), "prompts/_doktrin-preamble.md yok"
    text = PREAMBLE.read_text(encoding="utf-8")
    assert dc.has_sentinel(text)
    assert dc.missing_clauses(text) == [], f"preamble eksik clause: {dc.missing_clauses(text)}"


def test_standard_header_tam():
    assert dc.has_sentinel(dc.STANDARD_HEADER)
    assert dc.missing_clauses(dc.STANDARD_HEADER) == []


def test_standard_header_kaynak_tablo_grameri():
    # STANDARD_HEADER tablo kolon adlarını anar (gramer referansı)
    for col in dc.KAYNAK_TABLE_KEY_COLUMNS:
        assert col in dc.STANDARD_HEADER


# --- Yardımcılar ---

def test_kaynak_table_tespiti():
    iyi = "| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |\n|--|--|--|--|--|"
    assert dc.has_kaynak_table(iyi)
    assert not dc.has_kaynak_table("normal metin")


def test_aleyhe_beyani_tespiti():
    assert dc.has_aleyhe_declaration("... Aleyhe içtihat: YOK ...")
    assert dc.has_aleyhe_declaration("Aleyhe içtihat: VAR (9.HD 2024/123)")
    assert not dc.has_aleyhe_declaration("aleyhe konusu hiç geçmiyor")


def test_banned_phrase_tespiti():
    assert "garantili kazanım" in dc.find_banned_phrases("size garantili kazanım sunuyoruz")
    assert dc.find_banned_phrases("dengeli, kaynaklı bir analiz") == []


def test_kunye_tespiti():
    assert dc.body_has_kunye("Yargıtay 9. HD E.2024/123 K.2024/456")
    assert not dc.body_has_kunye("genel hukuki açıklama, künye yok")


# --- doktrin_lint (prompt-side) ---

def test_lint_temiz_dosya_pass(tmp_path):
    f = tmp_path / "x.md"
    f.write_text(dc.STANDARD_HEADER + "\nGörev: ...\n", encoding="utf-8")
    assert doktrin_lint.check_prompt_file(f) == []


def test_lint_bos_dosya_fail(tmp_path):
    f = tmp_path / "y.md"
    f.write_text("Görev: bir şey yap (doktrin yok)\n", encoding="utf-8")
    probs = doktrin_lint.check_prompt_file(f)
    assert probs and any("SENTINEL" in p for p in probs)


def test_lint_fence_devir_blok(tmp_path):
    f = tmp_path / "ANTIGRAVITY.md"
    content = (
        "# Doc\n\nprose doktrin özeti UYDURMA YARGITAY ...\n\n"
        "```\nANTIGRAVITY'YE YAPISTIRILACAK:\nDava-ID: x\n"
        + dc.STANDARD_HEADER
        + "\nGorev: ...\n```\n"
    )
    f.write_text(content, encoding="utf-8")
    assert doktrin_lint.check_fence_file(f) == []

    # Doktrin yalnız prose'ta, fenced devir bloğunda YOKSA → FAIL
    f2 = tmp_path / "ANTIGRAVITY.md"
    f2.write_text(
        "prose UYDURMA YARGITAY ALINTISI UYDURULAMAZ BAĞLAM KORUNMALI LEHE YORUM YASAK "
        "KAYNAK YOK ÇİFT KAYNAK KAYNAK DOĞRULAMA ALEYHE İÇTİHAT <!-- DOKTRIN-PREAMBLE v1 -->\n\n"
        "```\nANTIGRAVITY'YE YAPISTIRILACAK:\nDava-ID: x\nGorev: doktrinsiz blok\n```\n",
        encoding="utf-8",
    )
    assert doktrin_lint.check_fence_file(f2), "fence dışı doktrin sayılmamalı"


# --- cikti_dogrula (output-side) ---

def _temiz_cikti() -> str:
    return (
        dc.STANDARD_HEADER
        + "\n# Rapor\n\nHukuki değerlendirme...\n\n"
        "Aleyhe içtihat: YOK\n\n## Aleyhe İçtihat / Risk\nBu konuda aleyhe içtihat aranmış, bulunamamıştır.\n\n"
        "## Kaynak Doğrulama\n"
        "| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |\n"
        "|--|--|--|--|--|\n"
        "| x | 9.HD 2024/1 | bedesten:abc | «...» | ✓ Tam metin çekildi |\n"
    )


def test_cikti_temiz_pass():
    assert cikti_dogrula.validate_text(_temiz_cikti(), denylist=[]) == []


def test_cikti_sentinel_yok_fail():
    metin = _temiz_cikti().replace(dc.SENTINEL, "")
    fails = cikti_dogrula.validate_text(metin, denylist=[])
    assert any("SENTINEL" in f for f in fails)


def test_cikti_banned_phrase_fail():
    metin = _temiz_cikti() + "\nMüvekkil garantili kazanım elde edecek.\n"
    fails = cikti_dogrula.validate_text(metin, denylist=[])
    assert any("TBB" in f for f in fails)


def test_cikti_kvkk_gecerli_tc_fail():
    # 10000000078 checksum-geçerli bir TC'dir → leak sayılmalı
    metin = _temiz_cikti() + "\nMüvekkil TC: 10000000078\n"
    fails = cikti_dogrula.validate_text(metin, denylist=[])
    assert any("TC" in f for f in fails)


def test_cikti_baro_no_false_positive_yok():
    # Avukatın baro sicil no'su (20096838578) checksum-geçerli AMA allowlist'te → flag YOK
    assert "20096838578" in dc.ALLOWLIST_NUMBERS
    metin = _temiz_cikti() + "\nAv. Aykut Yeşilkaya, Baro Sicil: 20096838578\n"
    fails = cikti_dogrula.validate_text(metin, denylist=[])
    assert not any("TC" in f for f in fails), f"baro no yanlış flag'lendi: {fails}"


def test_cikti_kamuya_acik_esas_no_flaglenmez():
    # Dava esas no / tutar gibi KAMUYA AÇIK sayılar KVKK leak DEĞİL
    metin = _temiz_cikti() + "\nDava E.2026/12345, talep 50000 TL.\n"
    fails = cikti_dogrula.validate_text(metin, denylist=[])
    assert not any("TC" in f or "IBAN" in f for f in fails), f"kamuya açık sayı flag'lendi: {fails}"


# --- 9. clause: çıkarım geçerliliği (2026-09-02) ---

def test_dokuzuncu_clause_kontratta_var():
    assert "ÇIKARIM GEÇERLİLİĞİ" in dc.REQUIRED_CLAUSE_TOKENS
    assert len(dc.REQUIRED_CLAUSE_TOKENS) == 9


def test_dokuzuncu_clause_standard_headerda_var():
    assert "ÇIKARIM GEÇERLİLİĞİ" in dc.STANDARD_HEADER
    assert dc.missing_clauses(dc.STANDARD_HEADER) == []


def test_dokuzuncu_clause_preamblede_var():
    text = PREAMBLE.read_text(encoding="utf-8")
    assert "ÇIKARIM GEÇERLİLİĞİ" in text
    assert dc.missing_clauses(text) == []


def test_eksik_dokuzuncu_clause_yakalanir():
    eski = dc.STANDARD_HEADER.replace("ÇIKARIM GEÇERLİLİĞİ", "xxx")
    assert "ÇIKARIM GEÇERLİLİĞİ" in dc.missing_clauses(eski)
