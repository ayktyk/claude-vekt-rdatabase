"""havuz_kontrol.py testleri — ara çıktılarda künye havuzu ve alıntı kontrolü.

Ara çıktı (usul, stratejik analiz, dilekçe v1, savunma) yalnız K1'den geçmiş
araştırma raporunun Kaynak Doğrulama tablosundaki künye ve alıntılara dayanabilir.
"""
import havuz_kontrol as hk

BASLIK = "| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |\n|---|---|---|---|---|\n"

HAVUZ = (
    "# Araştırma Raporu\n\n## Kaynak Doğrulama\n" + BASLIK
    + "| a | Yargıtay 1. HD E.2022/6636 K.2023/2697 | 917964600 | «ayırtım gücü bulunmayan kimsenin "
      "geçerli bir iradesinin bulunmaması nedeniyle» | ✓ Tam metin |\n"
    + "| b | TMK m.15 | mevzuatgov:kanun:5:4721:m15 | «ayırt etme gücü bulunmayan kimsenin fiilleri "
      "hukukî sonuç doğurmaz» | ✓ |\n"
)


def _yaz(tmp_path, ad, metin):
    yol = tmp_path / ad
    yol.write_text(metin, encoding="utf-8")
    return yol


def test_havuzdaki_alinti_ve_kunye_gecer(tmp_path):
    havuz = _yaz(tmp_path, "rapor.md", HAVUZ)
    ara = _yaz(tmp_path, "strateji.md",
               "4D: Daire «geçerli bir iradesinin bulunmaması» ifadesini kullanmıştır.\n\n"
               + BASLIK + "| x | 1. HD | 917964600 | «geçerli bir iradesinin bulunmaması» | ✓ |\n")
    sonuc = hk.kontrol(ara, [havuz])
    assert sonuc.hatalar == []


def test_uydurma_alinti_yakalanir(tmp_path):
    havuz = _yaz(tmp_path, "rapor.md", HAVUZ)
    ara = _yaz(tmp_path, "strateji.md", "Yargıtay «bu cümle kararda hiç yoktur» demiştir.\n")
    sonuc = hk.kontrol(ara, [havuz])
    assert any("alıntı" in h for h in sonuc.hatalar)


def test_havuz_disi_kunye_yakalanir(tmp_path):
    havuz = _yaz(tmp_path, "rapor.md", HAVUZ)
    ara = _yaz(tmp_path, "usul.md", BASLIK + "| x | 9. HD | 123456 | — | ✓ |\n")
    sonuc = hk.kontrol(ara, [havuz])
    assert any("123456" in h for h in sonuc.hatalar)


def test_damgali_havuz_disi_kunye_uyari_olur(tmp_path):
    havuz = _yaz(tmp_path, "rapor.md", HAVUZ)
    ara = _yaz(tmp_path, "usul.md", BASLIK + "| x | 9. HD | 123456 | — | DOĞRULANMAMIŞ — HAVUZ DIŞI |\n")
    sonuc = hk.kontrol(ara, [havuz])
    assert sonuc.hatalar == []
    assert any("123456" in u for u in sonuc.uyarilar)


def test_ek_havuz_dosyasi_okunur(tmp_path):
    havuz = _yaz(tmp_path, "rapor.md", HAVUZ)
    ek = _yaz(tmp_path, "ek.md", BASLIK + "| c | 3. HD | 555 | «ek havuzdaki cümle» | ✓ |\n")
    ara = _yaz(tmp_path, "v1.md", "«ek havuzdaki cümle»\n\n" + BASLIK + "| x | 3. HD | 555 | «ek havuzdaki cümle» | ✓ |\n")
    assert hk.kontrol(ara, [havuz, ek]).hatalar == []


def test_uc_noktali_alinti_parcalari_havuzda(tmp_path):
    havuz = _yaz(tmp_path, "rapor.md", HAVUZ)
    ara = _yaz(tmp_path, "v1.md", "«ayırtım gücü bulunmayan … iradesinin bulunmaması»\n")
    assert hk.kontrol(ara, [havuz]).hatalar == []


def test_cli_exit_kodlari(tmp_path):
    havuz = _yaz(tmp_path, "rapor.md", HAVUZ)
    iyi = _yaz(tmp_path, "iyi.md", "«hukukî sonuç doğurmaz»\n")
    kotu = _yaz(tmp_path, "kotu.md", "«uydurma cümle»\n")
    assert hk.main([str(iyi), "--havuz", str(havuz)]) == 0
    assert hk.main([str(kotu), "--havuz", str(havuz)]) == 1


def test_dogrulanmasi_gerekir_damgasi_da_uyari_olur(tmp_path):
    havuz = _yaz(tmp_path, "rapor.md", HAVUZ)
    ara = _yaz(tmp_path, "4a.md", BASLIK + "| x | 9. HD | 777 | — | [DOGRULANMASI GEREKIR] |\n")
    sonuc = hk.kontrol(ara, [havuz])
    assert sonuc.hatalar == []
    assert any("777" in u for u in sonuc.uyarilar)
