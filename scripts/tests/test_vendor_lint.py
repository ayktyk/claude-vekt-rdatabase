"""vendor_lint testleri — kanonik yuzeylerde saglayici adi sizintisi.

Çalıştır: python -m pytest scripts/tests/test_vendor_lint.py -q
"""
import vendor_lint as vl


def test_saglayici_adi_yakalanir(tmp_path):
    d = tmp_path / "a.md"
    d.write_text("Bu asamayi Claude Fable 5 yurutur.", encoding="utf-8")
    assert vl.sizintilar(d) == [(1, "Claude")]


def test_birden_fazla_saglayici(tmp_path):
    d = tmp_path / "a.md"
    d.write_text("satir bir\nGemini ve Antigravity kullanilir\n", encoding="utf-8")
    bulgular = vl.sizintilar(d)
    assert (2, "Gemini") in bulgular
    assert (2, "Antigravity") in bulgular


def test_vendor_ok_isaretli_satir_muaf(tmp_path):
    d = tmp_path / "a.md"
    d.write_text(
        "2026-07-19'da Codex kaldirildi. <!-- vendor-ok: tarihce kaydi -->",
        encoding="utf-8",
    )
    assert vl.sizintilar(d) == []


def test_temiz_dosya_bos_doner(tmp_path):
    d = tmp_path / "a.md"
    d.write_text("ORKESTRATOR rolu ASAMA gecislerini yurutur.", encoding="utf-8")
    assert vl.sizintilar(d) == []


def test_kelime_sinirina_saygi(tmp_path):
    d = tmp_path / "a.md"
    d.write_text("Bu bir geminiyet ornegi degildir.", encoding="utf-8")
    assert vl.sizintilar(d) == []


def test_kucuk_harf_claude_de_yakalanir(tmp_path):
    # model id'leri kucuk harfle yazilir: claude-fable-5
    d = tmp_path / "a.md"
    d.write_text("model: claude-fable-5", encoding="utf-8")
    assert (1, "Claude") in vl.sizintilar(d)


def test_kod_blogu_icindeki_dosya_yolu_muaf(tmp_path):
    # .claude/ bir arac adaptoru dizinidir; yol olarak gecmesi sizinti degildir
    d = tmp_path / "a.md"
    d.write_text("Komut dosyasi: `.claude/commands/arastir.md`", encoding="utf-8")
    assert vl.sizintilar(d) == []
