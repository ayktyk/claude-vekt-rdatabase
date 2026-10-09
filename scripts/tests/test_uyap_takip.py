"""UYAP takip araçlarının saf mantığı: eşleştirme, CMK ayrımı, yavaş eşitleme kotası, Excel planı, pano raporu.
Masaüstü araç ve Excel çağrılmaz."""
import base64
import json
from datetime import date, datetime

import excel_takip as et
import uyap_esitle as ue
import uyap_ortak as uo
import uyap_takip as ut

BUGUN = date(2026, 10, 9)


def test_mahkeme_adi_kisaltma_ve_bicim_farkini_esler():
    assert uo.ayni_dosya("İstanbul Anadolu 12. İş Mahkemesi", "2099/391", "Anadolu 12. İş Mah.", "2099/0391")
    assert uo.ayni_dosya("Gaziosmanpaşa 2. Asliye Hukuk Mahkemesi", "2099/460", "GOP 2. Asliye Hukuk", "2099-460")
    assert uo.ayni_dosya("(Kapatılan)Bakırköy 4. Asliye Ticaret Mahkemesi", "2099/664",
                         "Bakırköy 4. Asliye Ticaret Mah.", "2099/664")
    assert uo.ayni_dosya("İSTANBUL 20. İCRA DAİRESİ", "2099/39171", "İstanbul 20. İcra Dairesi", "2099/39171")


def test_farkli_numara_tur_veya_yer_eslesmez():
    assert not uo.ayni_dosya("Bakırköy 12. Asliye Hukuk Mahkemesi", "2099/5", "Bakırköy 13. Asliye Hukuk", "2099/5")
    assert not uo.ayni_dosya("Bakırköy 12. Asliye Hukuk Mahkemesi", "2099/5", "Bakırköy 12. Asliye Ceza", "2099/5")
    assert not uo.ayni_dosya("Bakırköy 12. Asliye Hukuk Mahkemesi", "2099/5", "Kartal 12. Asliye Hukuk", "2099/5")
    assert not uo.ayni_dosya("Bakırköy 12. Asliye Hukuk Mahkemesi", "2099/5", "Bakırköy 12. Asliye Hukuk", "2099/6")


def test_cmk_gorevlendirmesi_tespiti():
    assert uo.cmk_mi("Örnek K. (CMK sanık müdafii)")
    assert uo.cmk_mi("A. B. (zorunlu müdafi)")
    assert uo.cmk_mi("C. D. (baro atamalı müdafi)")
    assert not uo.cmk_mi("E. F. (sanık müdafii)")
    assert not uo.cmk_mi("")


def test_dikkat_etiketleri():
    assert uo.dikkat("Gerekçeli Karar Hazırlandı").startswith("Karar")
    assert uo.dikkat("Duruşma Günü Kaydedildi") == "Yeni duruşma günü"
    assert uo.dikkat("BAM Dosya Gönderme Formu Kaydedildi.") == "Kanun yolu aşaması"
    assert uo.dikkat("Harç Masraf Reddiyatı İçin Gerekli Hesaplama Yapıldı") == ""


def test_dosya_kimligi_cozumu():
    ham = json.dumps({"portal": "avukat", "birimAdi": "Afyonkarahisar Tüketici Mahkemesi", "dosyaNo": "2099/480"},
                     ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    ref = "c1." + base64.urlsafe_b64encode(ham).decode().rstrip("=")
    assert uo.caseref_coz(ref)["dosyaNo"] == "2099/480"
    assert uo.caseref_coz("bozuk") == {}


def test_tarih_saat_utc_yerel_saate_cevrilir():
    t = uo.tarih_saat("2026-10-13T07:30:00.000Z")
    assert t.tzinfo is None and t.date() == date(2026, 10, 13)
    assert uo.tarih_saat("2026-10-13 10:30") == datetime(2026, 10, 13, 10, 30)
    assert uo.tarih_saat("") is None


def _eslesme_md(tmp_path):
    yol = tmp_path / "eslesme.md"
    yol.write_text("\n".join([
        "# Tablo", "## A) KESİN EŞLEŞMELER", "| Manuel Klasör | UYAP Klasörü | Müvekkil (Rolümüz) | Karşı Taraf |",
        "|---|---|---|---|", "| 2099-001 Örnek Taşınmaz | Bakırköy 12. Asliye Hukuk 2099-5 | X. Y. (davacı) | Z. W. |",
        "## B) ORTA GÜVEN", "| 2099-028 Örnek Ceza | GOP 4. Ağır Ceza 2099-143 | K. M. (sanık müdafii) | — |",
        "## C) UYAP'TA VAR", "### Ceza (CMK / zorunlu müdafilik ağırlıklı)", "| UYAP Klasörü | Müvekkil (Rol) | Not |",
        "|---|---|---|", "| GOP 1. Ağır Ceza 2099-123 | P. R. (CMK sanık müdafii) | — |",
        "| GOP 5. Ağır Ceza 2099-161 | S. T. | — |", "### Hukuk / İdare", "| UYAP Klasörü | Müvekkil (Rol) | Karşı Taraf |",
        "|---|---|---|", "| İstanbul 13. İş 2099-265 | U. V. (davacı) | N. |"]), encoding="utf-8")
    return uo.eslesme_satirlari(yol)


def test_eslesme_tablosu_okunur(tmp_path):
    es = _eslesme_md(tmp_path)
    assert [(e["bolum"], e["klasor"], e["no"], e["cmk"]) for e in es] == [
        ("A", "2099-001", "2099/5", False), ("B", "2099-028", "2099/143", False),
        ("C", "", "2099/123", True), ("C", "", "2099/161", False), ("H", "", "2099/265", False)]


def test_ceza_dosyasi_yalniz_buro_klasorune_bagliysa_excele_girer(tmp_path):
    es = _eslesme_md(tmp_path)
    cmk = {"birim": "Gaziosmanpaşa 1. Ağır Ceza Mahkemesi", "no": "2099/123", "tur": "Ceza Dava Dosyası"}
    rolsuz = {"birim": "Gaziosmanpaşa 5. Ağır Ceza Mahkemesi", "no": "2099/161", "tur": "Ceza Dava Dosyası"}
    vekaletli = {"birim": "Gaziosmanpaşa 4. Ağır Ceza Mahkemesi", "no": "2099/143", "tur": "Ceza Dava Dosyası"}
    bilinmeyen = {"birim": "Kırklareli 1. Asliye Ceza Mahkemesi", "no": "2098/389", "tur": "Ceza Dava Dosyası"}
    hukuk = {"birim": "İstanbul 13. İş Mahkemesi", "no": "2099/265", "tur": "Hukuk Dava Dosyası"}
    assert [et.siniflandir(d, es) for d in (cmk, rolsuz, vekaletli, bilinmeyen, hukuk)] == [
        "cmk", "ceza-teyit", "ekle", "ceza-teyit", "ekle"]


def _onbellek():
    return {
        "tarih": "2026-10-09", "okundu": "2026-10-09T17:30:00",
        "hareketler": {"hareketler": [
            {"birimAdi": "İstanbul 13. İş Mahkemesi", "dosyaNo": "2099/265", "dosyaTuru": "Hukuk Dava Dosyası",
             "tarih": "2026-09-29T10:00:00", "aciklama": "İstinaf Formu Kaydı Yapıldı", "yerelde": False},
            {"birimAdi": "Gaziosmanpaşa 1. Ağır Ceza Mahkemesi", "dosyaNo": "2099/123", "dosyaTuru": "Ceza Dava Dosyası",
             "tarih": "2026-10-05T10:00:00", "aciklama": "Gerekçeli Karar Hazırlandı", "yerelde": False},
            {"birimAdi": "İstanbul Anadolu 12. İş Mahkemesi", "dosyaNo": "2099/391", "dosyaTuru": "Hukuk Dava Dosyası",
             "tarih": "2026-10-08T10:00:00", "aciklama": "Duruşma Günü Kaydedildi", "yerelde": True},
            {"birimAdi": "İstanbul 20. İcra Dairesi", "dosyaNo": "2099/39171", "dosyaTuru": "İcra Dosyası",
             "tarih": "2026-10-07T10:00:00", "aciklama": "Genel Müzekkere Hazırlandı", "yerelde": False}]},
        "gelen": {"hareketler": []},
        "dosyalarim": {"davalar": [{"birimAdi": "İstanbul Anadolu 12. İş Mahkemesi", "dosyaNo": "2099/391", "portal": "avukat"}]},
        "durusmalar": {"durusmalar": [
            {"birimAdi": "İstanbul Anadolu 12. İş Mahkemesi", "dosyaNo": "2099/391", "tarih": "2026-10-14T10:30:00",
             "islemTuru": "Duruşma", "yerelde": True},
            {"birimAdi": "İstanbul 13. İş Mahkemesi", "dosyaNo": "2099/265", "tarih": "2026-10-20T09:00:00",
             "islemTuru": "Duruşma", "yerelde": False}]},
        "hatalar": {},
    }


def _excel_satirlari():
    satirlar = {r: [None] * 14 for r in range(2, 302)}
    satirlar[2] = [None, "2099-002", "Anadolu 12. İş Mah.", "2099/391", "D. E.", "ÖRNEK MARKET", "İşçilik", "Tanık", None,
                   None, None, None, None, None]
    satirlar[3] = [None, "2099-001", None, None, "X. Y.", None, "Tespit", None, None, None, None, None, None, None]
    satirlar[4] = [None, "2099-050", "İstanbul 13. İş Mah.", "2099/265", "U. V.", None, None, None, None, "Aykut",
                   datetime(2026, 10, 22), None, None, None]
    return satirlar


def test_excel_plani_bos_hucreyi_doldurur_dolu_hucreye_dokunmaz(tmp_path):
    es = _eslesme_md(tmp_path)
    plan = et.plan_olustur(_excel_satirlari(), _onbellek(), es, BUGUN)
    assert plan["uyap_doldur"] == [2]
    assert plan["tamamla"] == [(3, "Bakırköy 12. Asliye Hukuk", "2099/5")]
    assert [d[et.S_MAHKEME] for d in plan["ekle"]] == ["İstanbul 20. İcra Dairesi"]
    assert plan["ekle"][0][et.S_KONU] == "İcra takibi" and plan["ekle"][0][et.S_UYAP] == "Aykut"
    assert [d["no"] for d in plan["cmk"]] == ["2099/123"]
    assert plan["durusma"] == [(2, datetime(2026, 10, 14, 10, 30))]
    assert plan["durusma_farkli"] == [(4, datetime(2026, 10, 22), datetime(2026, 10, 20, 9, 0))]


def test_hareket_sayfasi_cmk_dosyasini_almaz(tmp_path):
    es = _eslesme_md(tmp_path)
    satirlar = et.hareket_satirlari(_onbellek(), es)
    assert "2099/123" not in [s[2] for s in satirlar]
    assert any(s[5] == "Kanun yolu aşaması" for s in satirlar)


def test_yavas_esitleme_kotasi_ayni_gun_tekrarinda_asilmaz():
    gecmis = [{"kabul": True, "zaman": "2026-10-09T10:00:00"}] * 4 + [{"kabul": False, "zaman": "2026-10-09T11:00:00"},
                                                                       {"kabul": True, "zaman": "2026-10-08T10:00:00"}]
    assert ue.bugun_kalan(gecmis, "2026-10-09") == ue.GUNLUK_DOSYA - 4
    assert ue.bugun_kalan([{"kabul": True, "zaman": "2026-10-09T10:00:00"}] * 20, "2026-10-09") == 0
    assert not ue.bugun_sinir_alindi_mi(gecmis, "2026-10-09")
    assert ue.bugun_sinir_alindi_mi([{"sinir": True, "zaman": "2026-10-09T12:00:00"}], "2026-10-09")


def test_esitleme_adaylari_oncelikli_ve_tekrarsiz():
    gecmis = [{"kabul": True, "birim": "İstanbul 8. İcra Dairesi", "dosyaNo": "2099/39152"}]
    onbellek = _onbellek()
    onbellek["hareketler"]["hareketler"].append(
        {"birimAdi": "İstanbul 8. İcra Dairesi", "dosyaNo": "2099/39152", "dosyaTuru": "İcra Dosyası", "yerelde": False})
    eski = [{"mahkeme": "İstanbul 13. İş Mahkemesi", "esasNo": "2099/265", "portal": None},
            {"mahkeme": "Bakırköy 12. Asliye Hukuk Mahkemesi", "esasNo": "2099/5", "portal": None},
            {"mahkeme": "Kartal 1. Sulh Hukuk Mahkemesi", "esasNo": "2098/9", "portal": "vatandas"}]
    adaylar = ue.adaylar(onbellek, eski, gecmis)
    assert [(a["dosyaNo"], a["kaynak"]) for a in adaylar] == [
        ("2099/39171", "hareket"), ("2099/265", "hareket"), ("2099/123", "hareket"), ("2099/5", "eski-klon")]


def test_pano_raporu_dikkat_durusma_ve_kapsam(tmp_path):
    es = _eslesme_md(tmp_path)
    metin = ut.rapor(_onbellek(), es, gun=7, durusma_gun=14, bugun=BUGUN)
    assert "Gerekçeli Karar Hazırlandı" in metin and "CMK" in metin
    assert "14.10.2026 10:30" in metin and "uygulamada değil" in metin
    assert "Tebligat (PTT, UETS)" in metin and "KEP UYAP dışıdır" in metin
    eski = dict(_onbellek(), tarih="2026-10-01")
    assert "bugüne ait değil" in ut.rapor(eski, es, bugun=BUGUN)
    assert "Önbellek yok" in ut.rapor({}, es, bugun=BUGUN)

def test_toplu_is_basari_disindaki_her_sonucta_durur():
    captcha = {"durum": "hata", "hata": {"code": "UYAP_CAPTCHA", "message": "UYAP doğrulama istiyor"}}
    assert uo.durma_nedeni(captcha, 1) == "UYAP_CAPTCHA" and uo.kilit_gerekir_mi("UYAP_CAPTCHA")
    assert uo.durma_nedeni({"hata": {"code": "INVALID_INPUT"}}, 2) == ""
    assert uo.durma_nedeni({"_zaman_asimi": "x"}, -2) == "zaman aşımı"
    assert uo.durma_nedeni({"_ham": "?"}, 1) == "tanınmayan yanıt"
    assert uo.durma_nedeni({"durum": "hata"}, 1) != ""
    assert uo.durma_nedeni({"hata": {"code": "YENI_BILINMEYEN_KOD"}}, 1) == "YENI_BILINMEYEN_KOD"
    assert uo.durma_nedeni({"is": "x", "durum": "hazir"}, 0) == ""
    assert not uo.kilit_gerekir_mi("zaman aşımı")


def test_dogrulama_kilidi_avukat_onayina_kadar_surer():
    kilitli = [{"kabul": True, "zaman": "2026-10-09T18:00:00"},
               {"sinir": True, "kilit": "UYAP_CAPTCHA", "zaman": "2026-10-09T20:27:10"}]
    assert ue.kilitli_mi(kilitli) == "UYAP_CAPTCHA"
    assert ue.kilitli_mi(kilitli + [{"kilit_acildi": True, "not": "doğrulama tamam, devam", "zaman": "2026-10-10T09:00:00"}]) == ""
    assert ue.kilitli_mi([]) == ""


def test_cmk_listesi_excele_almaz_ve_panoda_isaretler(tmp_path):
    liste_yolu = tmp_path / "cmk.md"
    liste_yolu.write_text("\n".join(["# CMK", "| Mahkeme | Dosya No | Kaynak |", "|---|---|---|",
                                      "| Gaziosmanpaşa 7. Ağır Ceza Mahkemesi | 2099/44 | avukat |",
                                      "| İstanbul 13. İş Mahkemesi | 2099/265 | avukat |"]), encoding="utf-8")
    cmk = uo.cmk_listesi(liste_yolu)
    assert [c["no"] for c in cmk] == ["2099/44", "2099/265"]
    es = _eslesme_md(tmp_path)
    ceza = {"birim": "Gaziosmanpaşa 7. Ağır Ceza Mahkemesi", "no": "2099/44", "tur": "Ceza Dava Dosyası"}
    hukuk = {"birim": "İstanbul 13. İş Mahkemesi", "no": "2099/265", "tur": "Hukuk Dava Dosyası"}
    assert et.siniflandir(ceza, es) == "ceza-teyit" and et.siniflandir(ceza, es, cmk) == "cmk"
    assert et.siniflandir(hukuk, es, cmk) == "cmk"
    assert "2099/265" not in [s[2] for s in et.hareket_satirlari(_onbellek(), es, cmk)]
    metin = ut.rapor(_onbellek(), es, gun=30, bugun=BUGUN, cmk=cmk)
    istinaf = next(s for s in metin.splitlines() if "İstinaf Formu" in s)
    assert "CMK" in istinaf
    assert uo.cmk_listesi(tmp_path / "yok.md") == []
