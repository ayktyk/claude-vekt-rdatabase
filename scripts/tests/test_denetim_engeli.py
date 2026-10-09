"""Denetim noktası çıktısı YEŞİL almadan DOCX/UDF üretilmez (AGENTS.md "Drive'a yazılmaz")."""
import pytest

import akis
import md_to_udf

GOVDE = "".join(f"{i}. Somut olay anlatımı ve hukuki değerlendirme paragrafı burada yer alır.\n\n"
                for i in range(1, 30))
BELGE = "İSTANBUL 10. TÜKETİCİ MAHKEMESİ SAYIN HÂKİMLİĞİNE\n\n" + GOVDE


def _dava(tmp_path, mod="tam"):
    akis.baslat(tmp_path, mod=mod, is_tanimi="cevap dilekçesi")
    klasor = tmp_path / "03-Sentez-ve-Dilekce"
    klasor.mkdir()
    belge = klasor / "dilekce-v2.md"
    belge.write_text(BELGE, encoding="utf-8")
    return belge


def _serbest_not(tmp_path):
    yol = tmp_path / "05-Durusma-Notlari" / "not.md"
    yol.parent.mkdir()
    yol.write_text("Duruşma notu.\n", encoding="utf-8")
    return yol


def test_akis_kaydi_yoksa_engel_yok(tmp_path):
    belge = tmp_path / "dilekce-v2.md"
    belge.write_text(BELGE, encoding="utf-8")
    assert akis.denetim_engeli(belge) is None


def test_k2_kaydi_yoksa_udf_uretilmez(tmp_path):
    belge = _dava(tmp_path)
    assert "K2" in (akis.denetim_engeli(belge) or "")
    with pytest.raises(ValueError):
        md_to_udf.md_to_udf(belge, belge.with_suffix(".udf"))
    assert not belge.with_suffix(".udf").exists()


def test_k2_kirmizi_engeller_yesil_serbest_birakir(tmp_path):
    belge = _dava(tmp_path)
    akis.denetim(tmp_path, nokta="K2", dosya=str(belge), karar="KIRMIZI")
    assert "KIRMIZI" in (akis.denetim_engeli(belge) or "")
    akis.denetim(tmp_path, nokta="K2", dosya="03-Sentez-ve-Dilekce/dilekce-v2.md", karar="YESIL")
    assert akis.denetim_engeli(belge) is None
    assert md_to_udf.md_to_udf(belge, belge.with_suffix(".udf")).exists()


def test_denetim_noktasi_olmayan_dosya_serbest(tmp_path):
    _dava(tmp_path)
    assert akis.denetim_engeli(_serbest_not(tmp_path)) is None


def test_hizli_modda_hafif_rapor_engellenmez(tmp_path):
    akis.baslat(tmp_path, mod="hizli", is_tanimi="duruşma günü talebi")
    rapor = tmp_path / "02-Arastirma" / "arastirma-raporu.md"
    rapor.parent.mkdir()
    rapor.write_text("Hafif rapor.\n", encoding="utf-8")
    assert akis.denetim_engeli(rapor) is None


def test_md_to_docx_engelli_dosyayi_atlar(tmp_path):
    md_to_docx = pytest.importorskip("md_to_docx")
    _dava(tmp_path)
    _serbest_not(tmp_path)
    adlar = {p.name for p in md_to_docx.convert_folder(tmp_path)}
    assert "not.docx" in adlar
    assert "dilekce-v2.docx" not in adlar
