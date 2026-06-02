"""maske.py KVKK round-trip + regex testleri (KVKK-kritik).

Çalıştır: python -m pytest scripts/tests/test_maske.py -q
"""
import pytest

import maske


@pytest.fixture
def sistem(tmp_path, monkeypatch):
    # config/masks kirletmemek için dict'i tmp'ye yönlendir
    monkeypatch.setattr(maske, "CONFIG_DIR", tmp_path)
    return maske.MaskeSistem("pytest")


# --- Telefon (boşluksuz format zaten yakalanmalı — FC düzeltmesi) ---

def test_telefon_bosluksuz_maskelenir(sistem):
    out = sistem.mask_text("İletişim: 05051234567")
    assert "05051234567" not in out


def test_telefon_bosluklu_maskelenir(sistem):
    out = sistem.mask_text("İletişim: 0505 123 45 67")
    assert "0505 123 45 67" not in out


# --- TC checksum ---

def test_gecerli_tc_maskelenir(sistem):
    # 10000000078 checksum-geçerli
    out = sistem.mask_text("TC: 10000000078")
    assert "10000000078" not in out


def test_gecersiz_tc_maskelenmez(sistem):
    # 11111111111 checksum-geçersiz → maskelenmez
    out = sistem.mask_text("Numara: 11111111111")
    assert "11111111111" in out


# --- Ölü NOTER/ARABULUCULUK regex kaldırıldı: kamuya açık sayılar bozulmaz ---

def test_esas_no_ve_tutar_maskelenmez(sistem):
    metin = "Dava E.2026/12345 K.2024/678, talep 50000 TL"
    out = sistem.mask_text(metin)
    assert "2026/12345" in out, "dava esas no maskelenmemeli"
    assert "50000" in out, "tutar maskelenmemeli"


def test_dead_regex_kaldirildi():
    assert not hasattr(maske, "NOTER_YEVMIYE_REGEX"), "ölü NOTER regex kaldırılmalı"
    assert not hasattr(maske, "ARABULUCULUK_DOSYA_REGEX"), "ölü ARABULUCULUK regex kaldırılmalı"


# --- Unmask prefix-çakışması ([MUVEKKIL_1] vs [MUVEKKIL_11]) ---

def test_unmask_prefix_collision_yok(sistem):
    sistem.dict_data["isimler"] = {"Ali": "[MUVEKKIL_1]", "Veli": "[MUVEKKIL_11]"}
    text = "[MUVEKKIL_11] ve [MUVEKKIL_1] görüştü"
    assert sistem.unmask_text(text) == "Veli ve Ali görüştü"


# --- Round-trip identity ---

def test_roundtrip_identity(sistem):
    sistem.add_isim("Ahmet Yılmaz", "muvekkil")
    sistem.add_isim("Mehmet Demir", "karsi_taraf")
    orig = "Ahmet Yılmaz, Mehmet Demir'e karşı. TC: 10000000078, Tel: 05051234567"
    masked = sistem.mask_text(orig)
    assert "Ahmet Yılmaz" not in masked
    assert "10000000078" not in masked
    assert sistem.unmask_text(masked) == orig
