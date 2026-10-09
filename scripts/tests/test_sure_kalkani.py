"""sure_kalkani.py testleri — 12-4 Süre Kalkanı satırlarının büro deposu ve pano görünümü."""
import copy
import json
from datetime import date

import pytest

import sure_kalkani as sk

BUGUN = date(2026, 10, 9)


def _satir(satir_id="2099-001:cevap_dilekcesi", hukuki=None, kosullu=None, durum="SÜRE-BEKLİYOR",
           gecmis=None, tedbir=None):
    return {
        "satir_id": satir_id, "kaynak": f"KALKAN#{satir_id}", "islem": satir_id.split(":")[1], "kol": "hmk",
        "hukuki_son_gun": hukuki,
        "kosullu_hesap": ({"tarih": kosullu, "uyarilar": [], "baslangic_durumu": "TEYIT-BEKLIYOR"}
                          if kosullu else None),
        "buro_tedbir_tarihi": tedbir, "hedef_gerekcesi": "taslak" if tedbir else None, "durum": durum,
        "kalan_gun": None, "esik": None, "hesap_kaynagi": {}, "bildirim_durumu": "PLANLANDI",
        "dis_senkron": "YAPILMADI", "gecmis": gecmis or [],
    }


def _sonraki(eski, **degisen):
    """sure_takvimi'nin güncel satırdan ürettiği yeni sürümü taklit eder: eski satır geçmişe taşınır,
    büroya ait alanlar (arsiv, dis_kayit) aracın yaptığı gibi düşer, dis_senkron YAPILMADI olur."""
    anlik = {k: copy.deepcopy(v) for k, v in eski.items() if k not in ("gecmis", "arsiv", "dis_kayit")}
    yeni = _satir(eski["satir_id"], **degisen)
    yeni["gecmis"] = [copy.deepcopy(g) for g in eski.get("gecmis", [])] + [anlik]
    return yeni


@pytest.fixture
def dava(tmp_path):
    klasor = tmp_path / "2099-001 Deneme Davası"
    klasor.mkdir()
    return klasor


def _depodaki(dava, satir_id):
    return sk._bul(sk.yukle(dava), satir_id)


def test_girdi_onceki_satiri_kendisi_ekler(dava):
    sk.kaydet(dava, _satir(kosullu="2026-10-20"))
    hesap = {"islem": "cevap_dilekcesi", "son_gun": "2026-10-21"}
    girdi = sk.girdi(dava, "2099-001:cevap_dilekcesi", hesap, bugun="2026-10-09")
    assert girdi["onceki"]["kosullu_hesap"]["tarih"] == "2026-10-20"
    assert girdi["bugun"] == "2026-10-09" and girdi["hesap"] is hesap


def test_girdi_ilk_kayitta_onceki_yok(dava):
    assert "onceki" not in sk.girdi(dava, "2099-001:istinaf", {"islem": "istinaf"}, bugun="2026-10-09")


def test_girdi_tedbir_hedefi_gerekcesiz_ve_son_gunden_sonra_reddedilir(dava):
    hesap = {"islem": "cevap_dilekcesi", "son_gun": "2026-10-20"}
    with pytest.raises(ValueError, match="gerekçesiz"):
        sk.girdi(dava, "2099-001:cevap_dilekcesi", hesap, buro_hedefi="2026-10-15")
    with pytest.raises(ValueError, match="sonraya"):
        sk.girdi(dava, "2099-001:cevap_dilekcesi", hesap, buro_hedefi="2026-10-21", gerekce="hazırlık")


def test_girdi_arac_hatasini_gosterir(dava):
    with pytest.raises(ValueError, match="sure_hesapla hatası"):
        sk.girdi(dava, "2099-001:istinaf", {"hata": "geçersiz işlem kodu"})


def test_girdi_arsivli_satiri_bayraksiz_yeniden_acmaz(dava):
    sk.kaydet(dava, _satir("2099-001:istinaf", hukuki="2026-10-12", durum="açık"))
    sk.arsivle(dava, "2099-001:istinaf", "istinaf dilekçesi gönderildi")
    with pytest.raises(ValueError, match="arşivde"):
        sk.girdi(dava, "2099-001:istinaf", {"islem": "istinaf"})
    assert sk.girdi(dava, "2099-001:istinaf", {"islem": "istinaf"}, arsivden_cikar=True)["onceki"]["durum"] == sk.ARSIV


def test_kaydet_ayni_satir_tekrari_tek_satir_kalir(dava):
    sk.kaydet(dava, _satir(kosullu="2026-10-20"))
    sk.kaydet(dava, _satir(kosullu="2026-10-20"))
    assert len(sk.yukle(dava)["satirlar"]) == 1


def test_kaydet_gecmisi_kisaltan_satiri_reddeder(dava):
    ilk = _satir(kosullu="2026-10-20")
    sk.kaydet(dava, ilk)
    sk.kaydet(dava, _sonraki(ilk, kosullu="2026-10-21"))
    with pytest.raises(ValueError, match="korumuyor"):
        sk.kaydet(dava, _satir(kosullu="2026-10-21"))


def test_kaydet_tarih_degisip_eski_surum_tasinmadiysa_reddeder(dava):
    ilk = _satir(kosullu="2026-10-20")
    sk.kaydet(dava, ilk)
    with pytest.raises(ValueError, match="geçmişe taşınmamış"):
        sk.kaydet(dava, _satir(kosullu="2026-10-21"))
    sk.kaydet(dava, _sonraki(ilk, kosullu="2026-10-21"))
    assert _depodaki(dava, "2099-001:cevap_dilekcesi")["kosullu_hesap"]["tarih"] == "2026-10-21"


def test_kaydet_arada_arsivlenen_satiri_eski_girdiyle_ezemez(dava):
    ilk = _satir("2099-001:istinaf", hukuki="2026-10-20", durum="açık")
    sk.kaydet(dava, ilk)
    eski_girdiden = _sonraki(ilk, hukuki="2026-10-20", durum="açık", tedbir="2026-10-15")
    sk.arsivle(dava, "2099-001:istinaf", "istinaf dilekçesi gönderildi")
    with pytest.raises(ValueError, match="bu arada değişmiş|geçmişi korumuyor|taşınmamış"):
        sk.kaydet(dava, eski_girdiden)
    satir = _depodaki(dava, "2099-001:istinaf")
    assert satir["durum"] == sk.ARSIV and satir["arsiv"]["not"] == "istinaf dilekçesi gönderildi"


def test_kaydet_buro_alanlarini_gecmiste_korur_ve_tarih_degisince_takvimi_eski_sayar(dava):
    ilk = _satir("2099-001:istinaf", hukuki="2026-10-20", durum="açık")
    sk.kaydet(dava, ilk)
    sk.senkron(dava, "2099-001:istinaf", "etkinlik-1")
    guncel = _depodaki(dava, "2099-001:istinaf")
    sk.kaydet(dava, _sonraki(guncel, hukuki="2026-10-16", durum="açık"))
    satir = _depodaki(dava, "2099-001:istinaf")
    assert satir["dis_senkron"] == "ESKİ" and satir["dis_kayit"]["etkinlik_tarihi"] == "2026-10-20"
    assert satir["gecmis"][-1]["dis_kayit"]["kimlik"] == "etkinlik-1"
    assert satir["gecmis"][-1]["dis_senkron"] == "YAPILDI"
    sonuc = sk.liste(dava.parent, BUGUN)
    assert "ESKİ" in sk._md(sonuc)


def test_kaydet_ayni_tarihle_yeniden_hesap_takvim_kaydini_korur(dava):
    ilk = _satir("2099-001:istinaf", hukuki="2026-10-20", durum="açık")
    sk.kaydet(dava, ilk)
    sk.senkron(dava, "2099-001:istinaf", "etkinlik-1")
    guncel = _depodaki(dava, "2099-001:istinaf")
    sk.kaydet(dava, _sonraki(guncel, hukuki="2026-10-20", durum="açık"))
    satir = _depodaki(dava, "2099-001:istinaf")
    assert satir["dis_senkron"] == "YAPILDI" and satir["dis_kayit"]["kimlik"] == "etkinlik-1"


def test_kaydet_sure_takvimi_satiri_olmayani_reddeder(dava):
    bozuk = _satir()
    bozuk["kaynak"] = "KALKAN#baska"
    with pytest.raises(ValueError, match="KALKAN"):
        sk.kaydet(dava, bozuk)
    with pytest.raises(ValueError, match="eksik alan"):
        sk.kaydet(dava, {"satir_id": "x"})
    with pytest.raises(ValueError, match="sure_takvimi hatası"):
        sk.kaydet(dava, {"hata": "girdi bozuk"})


def test_kaydet_tarih_ve_tedbir_kurallarini_denetler(dava):
    with pytest.raises(ValueError, match="geçerli tarih"):
        sk.kaydet(dava, _satir("2099-001:istinaf", hukuki="20.10.2026", durum="açık"))
    sonra = _satir("2099-001:istinaf", hukuki="2026-10-20", durum="açık", tedbir="2026-10-25")
    with pytest.raises(ValueError, match="sonraya"):
        sk.kaydet(dava, sonra)
    gerekcesiz = _satir("2099-001:istinaf", hukuki="2026-10-20", durum="açık", tedbir="2026-10-15")
    gerekcesiz["hedef_gerekcesi"] = ""
    with pytest.raises(ValueError, match="gerekçesiz"):
        sk.kaydet(dava, gerekcesiz)


def test_yazma_basarisizsa_gecici_dosya_kalmaz(dava, monkeypatch):
    def bozuk_replace(*_):
        raise PermissionError("salt okunur")
    monkeypatch.setattr(sk.os, "replace", bozuk_replace)
    with pytest.raises(ValueError, match="depo yazılamadı"):
        sk.kaydet(dava, _satir(kosullu="2026-10-20"))
    assert not list(dava.glob("*.tmp"))


def test_arsivle_satiri_silmez_listeden_dusurur(dava):
    sk.kaydet(dava, _satir(hukuki="2026-10-12", durum="açık"))
    with pytest.raises(ValueError, match="gerekçesi"):
        sk.arsivle(dava, "2099-001:cevap_dilekcesi", " ")
    sk.arsivle(dava, "2099-001:cevap_dilekcesi", "cevap dilekçesi UYAP'tan gönderildi")
    satir = sk.yukle(dava)["satirlar"][0]
    assert satir["durum"] == sk.ARSIV and satir["hukuki_son_gun"] == "2026-10-12"
    assert satir["gecmis"][-1]["durum"] == "açık"
    assert sk.liste(dava.parent, BUGUN)["kesin"] == []


def test_senkron_yalniz_kesin_satirda_ve_kimlikle(dava):
    sk.kaydet(dava, _satir(kosullu="2026-10-20"))
    with pytest.raises(ValueError, match="kesin son gün"):
        sk.senkron(dava, "2099-001:cevap_dilekcesi", "etkinlik-1")
    sk.kaydet(dava, _satir("2099-001:istinaf", hukuki="2026-10-23", durum="açık"))
    with pytest.raises(ValueError, match="kimliği zorunlu"):
        sk.senkron(dava, "2099-001:istinaf", "")
    sk.senkron(dava, "2099-001:istinaf", "etkinlik-1")
    satir = _depodaki(dava, "2099-001:istinaf")
    assert satir["dis_senkron"] == "YAPILDI" and satir["dis_kayit"]["kimlik"] == "etkinlik-1"
    assert satir["dis_kayit"]["etkinlik_tarihi"] == "2026-10-23" and satir["bildirim_durumu"] == "PLANLANDI"


@pytest.mark.parametrize("kalan, beklenen", [
    (-8, "geçti"), (0, "T-0 bugün"), (1, "T-1 kritik"), (6, "T-7 uyarı"), (7, "T-7 uyarı"),
    (8, "T-30 bilgi"), (30, "T-30 bilgi"), (31, "—"),
])
def test_esik(kalan, beklenen):
    assert sk.esik(kalan) == beklenen


def test_liste_kesin_kosullu_tarihsiz_ayri_ve_kosulluya_esik_yok(dava):
    sk.kaydet(dava, _satir("2099-001:istinaf", hukuki="2026-10-15", durum="açık", tedbir="2026-10-13"))
    sk.kaydet(dava, _satir("2099-001:cevap_dilekcesi", kosullu="2026-10-20"))
    sk.kaydet(dava, _satir("2099-001:tanik_adres_tamamlama"))
    sk.kaydet(dava, _satir("2099-001:temyiz", hukuki="2027-01-30", durum="açık"))
    sonuc = sk.liste(dava.parent, BUGUN, gun=30)
    assert [(r["islem"], r["kalan_gun"], r["esik"]) for r in sonuc["kesin"]] == [("istinaf", 6, "T-7 uyarı")]
    assert sonuc["kesin"][0]["tedbir_hedefi"] == "2026-10-13"
    assert [r["islem"] for r in sonuc["kosullu"]] == ["cevap_dilekcesi"]
    assert "esik" not in sonuc["kosullu"][0] and "kalan_gun" not in sonuc["kosullu"][0]
    assert [r["islem"] for r in sonuc["tarihsiz"]] == ["tanik_adres_tamamlama"]


def test_liste_kosullu_satiri_ufuk_disinda_da_gosterir(dava):
    sk.kaydet(dava, _satir("2099-001:cevap_dilekcesi", kosullu="2026-11-20"))
    assert [r["kosullu_tarih"] for r in sk.liste(dava.parent, BUGUN, gun=30)["kosullu"]] == ["2026-11-20"]


def test_liste_tedbir_hedefi_yakinsa_uzak_son_gunu_de_gosterir(dava):
    sk.kaydet(dava, _satir("2099-001:temyiz", hukuki="2026-12-31", durum="açık", tedbir="2026-10-20"))
    assert [r["islem"] for r in sk.liste(dava.parent, BUGUN, gun=30)["kesin"]] == ["temyiz"]


def test_liste_gecen_sureyi_gosterir(dava):
    sk.kaydet(dava, _satir("2099-001:istinaf", hukuki="2026-10-01", durum="geçti"))
    assert sk.liste(dava.parent, BUGUN)["kesin"][0]["esik"] == "geçti"


def test_liste_bozuk_depoyu_ve_kayitsiz_davayi_saklamaz(tmp_path):
    (tmp_path / "2099-002 Kayıtsız").mkdir()
    bozuk = tmp_path / "2099-003 Bozuk"
    bozuk.mkdir()
    (bozuk / sk.DOSYA).write_text("{bozuk", encoding="utf-8")
    sonuc = sk.liste(tmp_path, BUGUN)
    assert sonuc["taranan"] == 2 and sonuc["kayitli"] == 0
    assert sonuc["okunamadi"] and sonuc["okunamadi"][0].startswith("2099-003 Bozuk")
    metin = sk._md(sonuc)
    assert "OKUNAMAYAN DEPO" in metin and "süre yok sayılmaz" in metin


def test_liste_bozuk_satir_diger_sureleri_dusurmez(tmp_path):
    iyi = tmp_path / "2099-004 İyi"
    iyi.mkdir()
    sk.kaydet(iyi, _satir("2099-004:istinaf", hukuki="2026-10-10", durum="açık"))
    kotu = tmp_path / "2099-005 Elle Bozulmuş"
    kotu.mkdir()
    depo = {"surum": 1, "satirlar": [_satir("2099-005:istinaf", durum="açık"), None]}
    depo["satirlar"][0]["hukuki_son_gun"] = "20.10.2026"
    (kotu / sk.DOSYA).write_text(json.dumps(depo, ensure_ascii=False), encoding="utf-8")
    surumsuz = tmp_path / "2099-006 Sürümsüz"
    surumsuz.mkdir()
    (surumsuz / sk.DOSYA).write_text(json.dumps({"surum": None, "satirlar": []}), encoding="utf-8")
    sonuc = sk.liste(tmp_path, BUGUN)
    assert [r["esik"] for r in sonuc["kesin"]] == ["T-1 kritik"]
    assert len(sonuc["okunamadi"]) == 3


def test_liste_olmayan_dava_klasorunde_hata_verir(tmp_path):
    with pytest.raises(FileNotFoundError):
        sk.liste(tmp_path, BUGUN, dava=str(tmp_path / "yok"))


def test_json_oku_utf16_ve_bomlu_utf8_okur(tmp_path):
    veri = {"durum": "SÜRE-BEKLİYOR"}
    (tmp_path / "u16.json").write_bytes(json.dumps(veri, ensure_ascii=False).encode("utf-16"))
    (tmp_path / "bom.json").write_bytes(b"\xef\xbb\xbf" + json.dumps(veri, ensure_ascii=False).encode("utf-8"))
    assert sk._json_oku(tmp_path / "u16.json") == veri == sk._json_oku(tmp_path / "bom.json")


def test_cli_girdi_cikti_kaydet_ve_liste(dava, tmp_path, capsys):
    hesap_yolu, girdi_yolu, satir_yolu = tmp_path / "hesap.json", tmp_path / "girdi.json", tmp_path / "satir.json"
    hesap_yolu.write_text(json.dumps({"islem": "istinaf", "son_gun": "2026-10-10"}), encoding="utf-8")
    assert sk.main(["girdi", str(dava), "--satir-id", "2099-001:istinaf", "--hesap", str(hesap_yolu),
                    "--cikti", str(girdi_yolu), "--bugun", "2026-10-09"]) == 0
    assert json.loads(girdi_yolu.read_text(encoding="utf-8"))["satir_id"] == "2099-001:istinaf"
    satir_yolu.write_text(json.dumps(_satir("2099-001:istinaf", hukuki="2026-10-10", durum="açık")),
                          encoding="utf-8")
    assert sk.main(["kaydet", str(dava), str(satir_yolu)]) == 0
    capsys.readouterr()
    assert sk.main(["liste", "--kok", str(dava.parent), "--bugun", "2026-10-09", "--json"]) == 0
    veri = json.loads(capsys.readouterr().out)
    assert veri["kesin"][0]["esik"] == "T-1 kritik"
    assert sk.main(["arsivle", str(dava), "2099-001:yok", "--not", "x"]) == 1
    assert sk.main(["liste", "--dava", str(tmp_path / "yok")]) == 1
