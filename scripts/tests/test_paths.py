"""paths.py testleri — dava klasörü çözümleme (Aktif Davalar/<dava-id …>).

Gerçek klasör adları "2099-016 Örnek Müvekkil Kaza" biçimindedir; dava-id ile
çağrıldığında tek eşleşen klasör bulunmalı, belirsizlikte hata verilmelidir.
"""
import pytest

import paths


def _kur(tmp_path, monkeypatch, *adlar):
    monkeypatch.setenv("HUKUK_BUROSU_ROOT", str(tmp_path))
    kok = tmp_path / "Aktif Davalar"
    kok.mkdir()
    for ad in adlar:
        (kok / ad).mkdir()
    return kok


def test_dava_id_onekiyle_tek_klasor_bulunur(tmp_path, monkeypatch):
    kok = _kur(tmp_path, monkeypatch, "2099-016 Örnek Müvekkil Kaza", "2099-0160 Baska")
    assert paths.dava_dir("2099-016") == kok / "2099-016 Örnek Müvekkil Kaza"


def test_bitisik_yazilmis_ad_da_bulunur(tmp_path, monkeypatch):
    kok = _kur(tmp_path, monkeypatch, "2099-036Tapu İptal")
    assert paths.dava_dir("2099-036") == kok / "2099-036Tapu İptal"


def test_tam_ad_dogrudan_doner(tmp_path, monkeypatch):
    kok = _kur(tmp_path, monkeypatch, "2099-016 Örnek Müvekkil Kaza")
    assert paths.dava_dir("2099-016 Örnek Müvekkil Kaza") == kok / "2099-016 Örnek Müvekkil Kaza"


def test_eslesme_yoksa_yeni_dava_yolu_doner(tmp_path, monkeypatch):
    kok = _kur(tmp_path, monkeypatch)
    assert paths.dava_dir("2099-099 Yeni - Kira") == kok / "2099-099 Yeni - Kira"


def test_birden_cok_eslesmede_hata(tmp_path, monkeypatch):
    _kur(tmp_path, monkeypatch, "2099-008 Birinci", "2099-008 İkinci")
    with pytest.raises(ValueError):
        paths.dava_dir("2099-008")


def test_cli_belirsiz_dava_exit1(tmp_path, monkeypatch, capsys):
    _kur(tmp_path, monkeypatch, "2099-008 Birinci", "2099-008 İkinci")
    assert paths._main(["dava", "2099-008"]) == 1
    assert "2099-008" in capsys.readouterr().err


def test_yargipro_cli_ortam_degiskeni_once_gelir(tmp_path, monkeypatch):
    arac = tmp_path / "yargipro.cmd"
    monkeypatch.setenv("YARGIPRO_CLI", str(arac))
    assert paths.yargipro_cli() == arac


def test_yargipro_cli_tanimsizsa_anlasilir_hata(monkeypatch):
    monkeypatch.delenv("YARGIPRO_CLI", raising=False)
    monkeypatch.setattr(paths, "_load_cfg", lambda: {"yargipro_cli": {}})
    with pytest.raises(RuntimeError):
        paths.yargipro_cli()
