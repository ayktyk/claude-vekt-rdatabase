"""referans_kontrol testleri — repo içi dosya referansları kırık mı.

Çalıştır: python -m pytest scripts/tests/test_referans_kontrol.py -q
"""
import referans_kontrol as rk


def test_backtick_referansi_bulunur(tmp_path):
    (tmp_path / "var.md").write_text("içerik", encoding="utf-8")
    kaynak = tmp_path / "kaynak.md"
    kaynak.write_text("Şuna bak: `var.md` ve `yok.md`", encoding="utf-8")

    kirik = rk.kirik_referanslar(kaynak, tmp_path)

    assert "yok.md" in kirik
    assert "var.md" not in kirik


def test_markdown_link_referansi_bulunur(tmp_path):
    (tmp_path / "var.md").write_text("içerik", encoding="utf-8")
    kaynak = tmp_path / "kaynak.md"
    kaynak.write_text("[iyi](var.md) ve [kotu](yok.md)", encoding="utf-8")

    kirik = rk.kirik_referanslar(kaynak, tmp_path)

    assert "yok.md" in kirik
    assert "var.md" not in kirik


def test_url_ve_drive_yolu_yoksayilir(tmp_path):
    kaynak = tmp_path / "kaynak.md"
    kaynak.write_text(
        "https://ornek.com/a.md ve `G:\\Drive'im\\Hukuk Burosu\\x.md` ve `C:/gecici/y.md`",
        encoding="utf-8",
    )

    assert rk.kirik_referanslar(kaynak, tmp_path) == []


def test_glob_ve_placeholder_yoksayilir(tmp_path):
    kaynak = tmp_path / "kaynak.md"
    kaynak.write_text(
        "`ajanlar/*/SKILL.md` ve `playbook/{dava-turu}.md` ve `03-Sentez/dilekce-v1.md`",
        encoding="utf-8",
    )

    assert rk.kirik_referanslar(kaynak, tmp_path) == []


def test_tarama_kirik_olmayan_repoda_bos_doner(tmp_path):
    (tmp_path / "a.md").write_text("`b.md`", encoding="utf-8")
    (tmp_path / "b.md").write_text("son", encoding="utf-8")

    assert rk.tara([tmp_path / "a.md"], tmp_path) == {}


# --- Gürültü ayıklama (gerçek repoda ölçüldü: 313 yanlış pozitif) ---

def test_nokta_ile_baslayan_yol_bozulmaz(tmp_path):
    gizli = tmp_path / ".claude" / "skills"
    gizli.mkdir(parents=True)
    (gizli / "SKILL.md").write_text("x", encoding="utf-8")
    kaynak = tmp_path / "k.md"
    kaynak.write_text("`.claude/skills/SKILL.md`", encoding="utf-8")

    assert rk.kirik_referanslar(kaynak, tmp_path) == []


def test_at_isaretli_referans_cozulur(tmp_path):
    (tmp_path / "ajanlar").mkdir()
    (tmp_path / "ajanlar" / "doktrin.md").write_text("x", encoding="utf-8")
    kaynak = tmp_path / "k.md"
    kaynak.write_text("Oku: `@ajanlar/doktrin.md`", encoding="utf-8")

    assert rk.kirik_referanslar(kaynak, tmp_path) == []


def test_bare_isim_repoda_varsa_gecerli(tmp_path):
    (tmp_path / "scripts").mkdir()
    (tmp_path / "scripts" / "arac.py").write_text("x", encoding="utf-8")
    kaynak = tmp_path / "k.md"
    kaynak.write_text("`arac.py` calistir", encoding="utf-8")

    assert rk.kirik_referanslar(kaynak, tmp_path) == []


def test_bare_isim_repoda_yoksa_kirik(tmp_path):
    kaynak = tmp_path / "k.md"
    kaynak.write_text("`tasinmis-dosya.md`", encoding="utf-8")

    assert "tasinmis-dosya.md" in rk.kirik_referanslar(kaynak, tmp_path)


def test_asama_cikti_dosyalari_yoksayilir(tmp_path):
    kaynak = tmp_path / "k.md"
    kaynak.write_text("`atif-maddeleri.json` ve `dilekce-v1.md` uretilir", encoding="utf-8")

    assert rk.kirik_referanslar(kaynak, tmp_path) == []


def test_ciplak_uzanti_yoksayilir(tmp_path):
    kaynak = tmp_path / "k.md"
    kaynak.write_text("Dosya `.md` uzantili olmali", encoding="utf-8")

    assert rk.kirik_referanslar(kaynak, tmp_path) == []
