"""Nihai belge + eşlik dosyası çifti (K2) ve UDF koruması testleri.

Dışarı giden belge (dilekçe v2, istinaf, ihtarname) UYAP'a temiz gider; SENTINEL,
Kaynak Doğrulama tablosu ve aleyhe beyanı eşlik eden kaynak doğrulama dosyasında durur.
"""
import pytest

import cikti_dogrula
import doktrin_contract as dc
import md_to_udf


def _eslik() -> str:
    return (
        dc.STANDARD_HEADER
        + "\n# Kaynak Doğrulama — dilekçe v2\n\n"
        "Aleyhe içtihat: YOK\n\n## Aleyhe İçtihat / Risk\nAleyhe karar aranmış, bulunamamıştır.\n\n"
        "## Kaynak Doğrulama\n"
        "| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |\n"
        "|--|--|--|--|--|\n"
        "| x | 3. HD 2023/616 E. 2023/2371 K. | 900 | «...» | ✓ Tam metin çekildi |\n"
    )


BELGE = (
    "İSTANBUL 10. TÜKETİCİ MAHKEMESİ SAYIN HÂKİMLİĞİNE\n\n"
    "1. Yargıtay 3. HD 2023/616 E., 2023/2371 K. sayılı kararı uyarınca talep yerindedir.\n"
)


def test_temiz_cift_gecer():
    assert cikti_dogrula.validate_pair(BELGE, _eslik(), denylist=[]) == []


def test_belgede_doktrin_izi_varsa_fail():
    fails = cikti_dogrula.validate_pair(dc.SENTINEL + "\n" + BELGE, _eslik(), denylist=[])
    assert any("Belgede" in f for f in fails)


def test_eslikte_tablo_yoksa_fail():
    eslik = _eslik().split("## Kaynak Doğrulama\n|")[0]
    fails = cikti_dogrula.validate_pair(BELGE, eslik, denylist=[])
    assert any("tablo" in f.lower() for f in fails)


def test_cli_eslik_modu(tmp_path):
    belge = tmp_path / "dilekce-v2.md"
    eslik = tmp_path / "dilekce-v2-kaynak-dogrulama.md"
    belge.write_text(BELGE, encoding="utf-8")
    eslik.write_text(_eslik(), encoding="utf-8")
    assert cikti_dogrula.main([str(belge), "--eslik", str(eslik)]) == 0


def test_udf_doktrin_izi_tasiyan_metni_reddeder(tmp_path):
    md = tmp_path / "dilekce-v2.md"
    md.write_text(BELGE + "\n" + _eslik(), encoding="utf-8")
    with pytest.raises(ValueError):
        md_to_udf.md_to_udf(md, tmp_path / "dilekce-v2.udf")
    assert not (tmp_path / "dilekce-v2.udf").exists()


def test_udf_temiz_metni_uretir(tmp_path):
    md = tmp_path / "dilekce-v2.md"
    govde = "".join(f"{i}. Somut olay anlatımı ve hukuki değerlendirme paragrafı burada yer alır.\n\n"
                    for i in range(1, 30))
    md.write_text("---\nstatus: TASLAK\n---\n" + BELGE + "\n" + govde, encoding="utf-8")
    cikti = md_to_udf.md_to_udf(md, tmp_path / "dilekce-v2.udf")
    assert cikti.exists()


def test_kunye_bicimleri_taniniyor():
    assert dc.body_has_kunye("HGK 2012/12-139 K.624 sayılı karar")
    assert dc.body_has_kunye("12.03.2024 tarihli ve 2023/616 E., 2023/2371 K. sayılı karar")
    assert not dc.body_has_kunye("Duruşma günü verilmesini talep ederiz.")


def test_atif_iceriyor():
    assert dc.atif_iceriyor("HMK m.139 uyarınca duruşma günü talep ederiz.")
    assert dc.atif_iceriyor("Yerleşik içtihat da bu yöndedir.")
    assert not dc.atif_iceriyor("Vekaletnamemiz ekte sunulmuştur.")


def test_sozlesme_madde_basliklari_atif_sayilmaz():
    sozlesme = ("MADDE 1 - TARAFLAR\nİşbu sözleşme aşağıdaki taraflar arasında imzalanmıştır.\n"
                "**Madde 2 – Konu**\nKiralanan taşınmazın kullanımı.\n## MADDE 3 - SÜRE\nBir yıldır.\n")
    assert not dc.atif_iceriyor(sozlesme)
    assert dc.atif_iceriyor(sozlesme + "Kira artışı TBK m.344 ile sınırlıdır.\n")
    assert dc.atif_iceriyor(sozlesme + "Taraflar 6098 sayılı Kanunun 344. maddesine tabidir.\n")


def test_taslak_satiri_ve_guven_notu_belgede_iz_sayilir():
    assert "TASLAK satırı" in dc.belge_izleri("TASLAK - Avukat onayina tabidir\n\n" + BELGE)
    assert dc.belge_izleri("GUVEN NOTU:\n- Risk flag: YOK\n\n" + BELGE)
    assert dc.belge_izleri("## AVUKAT İÇİN NOTLAR\n- takip\n")
    fails = cikti_dogrula.validate_pair("**TASLAK**\n" + BELGE, _eslik(), denylist=[])
    assert any("Belgede" in f for f in fails)


def test_frontmatter_taslak_durumu_iz_sayilmaz():
    assert dc.belge_izleri("---\nstatus: TASLAK\n---\n" + BELGE) == []
