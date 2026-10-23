"""uyap_esitle.py 2026-10-12 eklemeleri: uygulama listesinden yeni indirme, avukatın atladığı dosyalar, güncelleme sırası."""
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uyap_esitle as ue  # noqa: E402

SIMDI = datetime(2099, 10, 12, 9, 0)


def _kayit(birim, no, durum="Açık", yerel=True, portal="avukat"):
    d = {"birimAdi": birim, "dosyaNo": no, "dosyaDurum": durum, "portal": portal}
    if yerel:
        d["yerel"] = {"yol": "x"}
    return d


def test_uygulama_listesinde_olup_inmeyen_dosya_aday_olur_atlananlar_alinmaz(monkeypatch):
    monkeypatch.setattr(ue, "ALINAN_DOSYA_TURLERI", None)
    liste = [_kayit("Bakırköy 12. Asliye Hukuk Mahkemesi", "2099/5"),
             _kayit("Gaziosmanpaşa 1. İcra Hukuk Mahkemesi", "2099/720", yerel=False),
             _kayit("İstanbul Bölge Adliye Mahkemesi 62. Hukuk Dairesi", "2099/1661", "Karara Çıkmış", yerel=False),
             _kayit("Bakırköy 4. İcra Dairesi", "2099/10915", "Açık (Durdurulmuş : Takibe İtiraz)", yerel=False),
             _kayit("Arabuluculuk Daire Başkanlığı", "2099/72120", yerel=False),
             _kayit("İstanbul 18. Ağır Ceza Mahkemesi", "2099/85", yerel=False),
             _kayit("Kartal 1. Sulh Hukuk Mahkemesi", "2099/9", yerel=False, portal="vatandas")]
    monkeypatch.setattr(ue, "ATLANAN_DOSYALAR", (("Bakırköy 4. İcra Dairesi", "2099/10915"),))
    adaylar = ue.adaylar({}, [], [], [], liste)
    assert [a["dosyaNo"] for a in adaylar] == ["2099/720", "2099/1661"]  # karara çıkmış sona
    assert all(a["kaynak"] == "uygulama-listesi" for a in adaylar)


def test_uygulama_listesindeki_yerel_dosya_hareketli_olsa_da_yeniden_indirilmez(monkeypatch):
    monkeypatch.setattr(ue, "ALINAN_DOSYA_TURLERI", None)
    onbellek = {"hareketler": {"hareketler": [{"birimAdi": "Bakırköy 12. Asliye Hukuk Mahkemesi", "dosyaNo": "2099/5",
                                               "dosyaTuru": "Hukuk Dava Dosyası", "yerelde": False}]}}
    assert ue.adaylar(onbellek, [], [], [], [_kayit("Bakırköy 12. Asliye Hukuk Mahkemesi", "2099/5")]) == []


def _yerel(birim, no, son="2099-09-01T10:00:00Z", inmeyen=0, kalici=0, portal="avukat"):
    return {"birimAdi": birim, "dosyaNo": no, "portal": portal, "caseRef": f"c1.{no}", "yerelde": True,
            "inmeyenSayisi": inmeyen, "inmeyen": {"hedeflenebilir": inmeyen - kalici, "kalici": kalici, "anahtarsiz": 0},
            "klonlanmaAt": "2099-08-01T10:00:00Z", **({"sonEsitlemeAt": son} if son else {})}


def test_guncelleme_sirasi_hareket_eksik_sonra_en_eski_esitlenen():
    yerel = [_yerel("Kartal 2. Asliye Hukuk Mahkemesi", "2099/7", son="2099-10-11T10:00:00Z"),  # taze, iş yok
             _yerel("Bakırköy 12. Asliye Hukuk Mahkemesi", "2099/5", son="2099-08-20T10:00:00Z"),
             _yerel("İstanbul 13. İş Mahkemesi", "2099/265", son=None),  # hiç eşitlenmemiş: klonlanma tarihi esas
             _yerel("İstanbul 8. İcra Dairesi", "2099/40316", inmeyen=12),
             _yerel("İstanbul 22. İş Mahkemesi", "2099/235"),  # karara çıkmış, hareketsiz: alınmaz
             _yerel("İstanbul 16. Aile Mahkemesi", "2099/760", son="2099-10-11T10:00:00Z"),  # sonradan hareket
             _yerel("Gaziosmanpaşa 5. Ağır Ceza Mahkemesi", "2099/154", son="2099-08-01T10:00:00Z"),
             _yerel("Bakırköy 2. Tüketici Mahkemesi", "2099/288", inmeyen=4, kalici=4)]  # yalnız kalıcı: eksik sayılmaz
    kayit = [_kayit("İstanbul 22. İş Mahkemesi", "2099/235", "Karara Çıkmış")]
    onbellek = {"hareketler": {"hareketler": [
        {"birimAdi": "İstanbul 16. Aile Mahkemesi", "dosyaNo": "2099/760", "tarih": "2099-10-11T16:00:00+03:00"},
        {"birimAdi": "Kartal 2. Asliye Hukuk Mahkemesi", "dosyaNo": "2099/7", "tarih": "2099-10-01T16:00:00+03:00"}]}}
    adaylar = ue.guncelleme_adaylari(yerel, kayit, onbellek, [], SIMDI)
    assert [(a["dosyaNo"], a["kaynak"]) for a in adaylar] == [
        ("2099/760", "hareket"), ("2099/40316", "eksik"), ("2099/265", "eski-esitleme"),
        ("2099/5", "eski-esitleme"), ("2099/288", "eski-esitleme")]
    assert all(a["islem"] == "esitle" and a["caseRef"].startswith("c1.") for a in adaylar)


def test_bu_betikle_guncellenen_dosya_yeniden_alinmaz():
    yerel = [_yerel("Bakırköy 12. Asliye Hukuk Mahkemesi", "2099/5", son="2099-08-20T10:00:00Z")]
    gecmis = [{"islem": "esitle", "kabul": True, "birim": "Bakırköy 12. Asliye Hukuk Mahkemesi", "dosyaNo": "2099/5",
               "zaman": "2099-10-12T08:00:00"}]
    assert ue.guncelleme_adaylari(yerel, [], {}, gecmis, SIMDI) == []


def test_ortak_kota_klon_ve_esitlemeyi_birlikte_sayar():
    gecmis = [{"kabul": True, "zaman": "2099-10-12T09:00:00"},
              {"islem": "esitle", "kabul": True, "zaman": "2099-10-12T10:00:00"}]
    assert ue.bugun_kalan(gecmis, "2099-10-12", 8) == 6


def test_bu_betikle_yakin_zamanda_esitlenen_eksikli_dosya_her_gun_yeniden_alinmaz():
    yerel = [_yerel("İstanbul 8. İcra Dairesi", "2099/40316", inmeyen=3)]
    gecmis = [{"islem": "esitle", "kabul": True, "birim": "İstanbul 8. İcra Dairesi", "dosyaNo": "2099/40316",
               "zaman": "2099-10-10T08:00:00"}]
    assert ue.guncelleme_adaylari(yerel, [], {}, gecmis, SIMDI) == []
    assert [a["kaynak"] for a in ue.guncelleme_adaylari(yerel, [], {}, [], SIMDI)] == ["eksik"]


def test_ara_bekleme_onceki_calistirmadaki_son_denemeden_sayilir():
    gecmis = [{"zaman": "2099-10-12T08:50:00", "kod": 0, "yanit": {}}, {"kilit_acildi": True, "zaman": "2099-10-12T08:59:00"}]
    assert ue.son_deneme(gecmis) == datetime(2099, 10, 12, 8, 50)
    assert ue.son_deneme([]) is None


def test_gecersiz_girdi_alan_dosya_yeniden_denenmez():
    gecmis = [{"birim": "Bakırköy 34. İş Mahkemesi", "dosyaNo": "2099/242", "kod": 2, "kabul": False,
               "caseRef": "c1.x", "yanit": {"hata": {"code": "INVALID_INPUT"}}}]
    liste = [{"birim": "Bakırköy 34. İş Mahkemesi", "dosyaNo": "2099/242"}, {"birim": "X 1. İş Mahkemesi", "dosyaNo": "2099/1"}]
    assert [a["dosyaNo"] for a in ue.denenmis_gecersizleri_cikar(liste, gecmis)] == ["2099/1"]


def test_caserefsiz_eski_girdi_hatasi_yeniden_denenir():
    """2026-10-20: araç caseRef zorunlu tuttuğu için eski parametreyle alınan INVALID_INPUT kalıcı ret sayılmaz."""
    gecmis = [{"birim": "Bakırköy 34. İş Mahkemesi", "dosyaNo": "2099/242", "kod": 2, "kabul": False,
               "yanit": {"hata": {"code": "INVALID_INPUT"}}}]
    liste = [{"birim": "Bakırköy 34. İş Mahkemesi", "dosyaNo": "2099/242"}]
    assert [a["dosyaNo"] for a in ue.denenmis_gecersizleri_cikar(liste, gecmis)] == ["2099/242"]


def test_gece_yarisindan_sonra_biten_calisma_ayni_sabah_surer():
    assert ue.sonraki_baslangic(datetime(2099, 10, 13, 0, 25), 9, 10) == datetime(2099, 10, 13, 9, 10)
    assert ue.sonraki_baslangic(datetime(2099, 10, 13, 15, 0), 9, 10) == datetime(2099, 10, 14, 9, 10)


def test_vatandas_portali_guncellenmez():
    """Avukat talimatı 2026-10-13: 'vatandaş uyaba gerek yok onu çıkar sıradan'."""
    yerel = [_yerel("İstanbul 10. Tüketici Mahkemesi", "2099/619", son=None, portal="vatandas"),
             _yerel("Bakırköy 12. Asliye Hukuk Mahkemesi", "2099/5", son=None)]
    assert [a["dosyaNo"] for a in ue.guncelleme_adaylari(yerel, [], {}, [], SIMDI)] == ["2099/5"]
