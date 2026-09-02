"""protokol_kontrol testleri — her adim sayfa referansli veya [SISTEM EKI].

Çalıştır: python -m pytest scripts/tests/test_protokol_kontrol.py -q
"""
import protokol_kontrol as pk


def test_sayfa_referansli_adim_gecer(tmp_path):
    d = tmp_path / "p.md"
    d.write_text(
        "# Protokol\n\n### Adım 1 — Maddi olayın tespiti [s. 143]\n\nmetin\n",
        encoding="utf-8",
    )
    assert pk.etiketsiz_adimlar(d) == []


def test_sistem_eki_adim_gecer(tmp_path):
    d = tmp_path / "p.md"
    d.write_text(
        "# Protokol\n\n### Adım 2 — UYAP evrak tasnifi [SİSTEM EKİ]\n\nmetin\n",
        encoding="utf-8",
    )
    assert pk.etiketsiz_adimlar(d) == []


def test_etiketsiz_adim_yakalanir(tmp_path):
    d = tmp_path / "p.md"
    d.write_text("# Protokol\n\n### Adım 3 — Delil toplama\n\nmetin\n", encoding="utf-8")
    bulgular = pk.etiketsiz_adimlar(d)
    assert len(bulgular) == 1
    assert "Adım 3" in bulgular[0][1]


def test_h2_ve_h1_adim_sayilmaz(tmp_path):
    d = tmp_path / "p.md"
    d.write_text("# Başlık\n\n## Bölüm\n\n### Adım 1 — X [s. 10]\n", encoding="utf-8")
    assert pk.etiketsiz_adimlar(d) == []


def test_pdf_referansi_da_gecerli(tmp_path):
    d = tmp_path / "p.md"
    d.write_text("### Adım 1 — Önsözden [pdf s. 7]\n", encoding="utf-8")
    assert pk.etiketsiz_adimlar(d) == []


def test_birden_fazla_etiketsiz_adim(tmp_path):
    d = tmp_path / "p.md"
    d.write_text(
        "### Adım 1 — A [s. 10]\n### Adım 2 — B\n### Adım 3 — C\n", encoding="utf-8"
    )
    assert len(pk.etiketsiz_adimlar(d)) == 2


def test_kod_blogu_icindeki_h3_sayilmaz(tmp_path):
    # Protokol içinde örnek şablon gösterilirken ### kullanılabilir
    d = tmp_path / "p.md"
    d.write_text(
        "### Adım 1 — A [s. 10]\n\n```\n### Adım N — sablon\n```\n", encoding="utf-8"
    )
    assert pk.etiketsiz_adimlar(d) == []
