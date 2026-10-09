"""motor.py testleri — aktif motor kaydi/okuma.

Çalıştır: python -m pytest scripts/tests/test_motor.py -q
"""
import json

import motor


def _harita_yaz(tmp_path, aktif=None):
    veri = {
        "roller": {
            "ORKESTRATOR": {"aciklama": "orkestrasyon"},
            "ARASTIRMACI": {"aciklama": "mcp"},
            "MUHAKEME": {"aciklama": "hukuki uretim"},
            "DENETCI": {"aciklama": "bagimsiz denetim"},
        }
    }
    if aktif is not None:
        veri["aktif_motor"] = aktif
    yol = tmp_path / "motor-haritasi.json"
    yol.write_text(json.dumps(veri, ensure_ascii=False), encoding="utf-8")
    return yol


def test_bildirilmemis_motor_bildirilmedi_doner(tmp_path):
    yol = _harita_yaz(tmp_path)
    assert motor.aktif_motor(yol) == "bildirilmedi"


def test_ayarlanan_motor_okunur(tmp_path):
    yol = _harita_yaz(tmp_path)
    motor.motor_ayarla("ornek-model-1", yol)
    assert motor.aktif_motor(yol) == "ornek-model-1"


def test_ayarlama_rolleri_bozmaz(tmp_path):
    yol = _harita_yaz(tmp_path)
    motor.motor_ayarla("ornek-model-2", yol)
    veri = json.loads(yol.read_text(encoding="utf-8"))
    assert set(veri["roller"]) == {"ORKESTRATOR", "ARASTIRMACI", "MUHAKEME", "DENETCI"}


def test_frontmatter_damgasi_uretilir(tmp_path):
    yol = _harita_yaz(tmp_path, aktif="ornek-model-3")
    damga = motor.frontmatter_damgasi("usul_raporu", yol)
    assert "engine: ornek-model-3" in damga
    assert "task_type: usul_raporu" in damga
    assert "status: TASLAK" in damga


def test_bos_dosya_cokmez(tmp_path):
    yol = tmp_path / "yok.json"
    assert motor.aktif_motor(yol) == "bildirilmedi"


def test_bos_string_bildirilmedi_sayilir(tmp_path):
    yol = _harita_yaz(tmp_path, aktif="   ")
    assert motor.aktif_motor(yol) == "bildirilmedi"


def test_repo_motor_haritasi_gecerli_json():
    # 2026-09-03'te _history satırlarına HTML yorumu eklenmiş, dosya geçersiz JSON olmuştu
    json.loads(motor.VARSAYILAN_HARITA.read_text(encoding="utf-8"))


def test_gecersiz_json_ayarla_ile_ezilmez(tmp_path):
    yol = tmp_path / "motor-haritasi.json"
    bozuk = '{"roller": {"A": 1}, "x": 1, <!-- yorum -->}'
    yol.write_text(bozuk, encoding="utf-8")
    import pytest
    with pytest.raises(ValueError):
        motor.motor_ayarla("deneme", yol)
    assert yol.read_text(encoding="utf-8") == bozuk


def test_cli_ayarla_bozuk_haritada_hata_kodu_doner(tmp_path, monkeypatch, capsys):
    yol = tmp_path / "motor-haritasi.json"
    bozuk = '{"roller": {}, <!-- yorum -->}'
    yol.write_text(bozuk, encoding="utf-8")
    monkeypatch.setattr(motor, "VARSAYILAN_HARITA", yol)
    assert motor.main(["ayarla", "deneme"]) == 1
    assert yol.read_text(encoding="utf-8") == bozuk
