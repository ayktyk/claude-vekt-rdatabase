"""icra_ozet.py ve excel_takip icra planı testleri: taraflar, son durum, mal varlığı sınıflandırması (UYAP'a gitmez)."""
import json
from datetime import date

import excel_takip as et
import icra_ozet as io

BUGUN = date(2026, 10, 9)

DOSYA_BILGILERI = """# Dosya Bilgileri

| Alan | Değer |
| --- | --- |
| Dosya durumu | Açık |
| Takibin türü | İlamlı Takip |
| Alacak toplamı | 100000.00 TL |
| Yapılmış tahsilat | 0.00 TL |

## Taraflar

| Rol | Ad | Tip | Vekil |
| --- | --- | --- | --- |
| Alacaklı | ALİ VELİ | Kişi | AYKUT YEŞİLKAYA |
| Borçlu | ÖRNEK GIDA A.Ş. | Kurum | BAŞKA AVUKAT |
"""

SAFAHAT = """# Safahat

| Tarih | İşlem | Açıklama | Birim |
| --- | --- | --- | --- |
| 09.10.2026 | Dosya Kesinleşme Bilgi Girişi | Takip kesinleşti | İstanbul 20. İcra Dairesi |
| 01.10.2026 | Ödeme Emri Tebliğ Edildi | Ödeme emri tebliğ | İstanbul 20. İcra Dairesi |
| 30.09.2026 | Dosyanın Açılması |  | İstanbul 20. İcra Dairesi |
"""


def _klon(tmp_path, evraklar):
    k = tmp_path / "İstanbul 20. İcra Dairesi 2099-39171"
    (k / "evraklar").mkdir(parents=True)
    (k / "dosya-bilgileri.md").write_text(DOSYA_BILGILERI, encoding="utf-8")
    (k / "safahat.md").write_text(SAFAHAT, encoding="utf-8")
    kayit = []
    for i, (tur, tarih, metin) in enumerate(evraklar):
        yol = f"evraklar/{i}.md"
        (k / yol).write_text(metin, encoding="utf-8")
        kayit.append({"tur": tur, "tarih": tarih, "mdPath": yol})
    (k / "uyap-project.json").write_text(json.dumps({"mahkeme": "İstanbul 20. İcra Dairesi", "esasNo": "2099/39171",
                                                     "isIcra": True, "evraklar": kayit, "uyapEvrakSayisi": len(kayit)},
                                                    ensure_ascii=False), encoding="utf-8")
    return k


def test_taraflar_ve_alanlar_okunur():
    b = io.dosya_bilgileri(DOSYA_BILGILERI)
    assert b["alanlar"]["Dosya durumu"] == "Açık" and b["alanlar"]["Alacak toplamı"] == "100000.00 TL"
    assert [(t["rol"], t["vekil"]) for t in b["taraflar"]] == [("Alacaklı", "AYKUT YEŞİLKAYA"), ("Borçlu", "BAŞKA AVUKAT")]


def test_tasinmaz_siniflandirma():
    assert io.sinifla("tasinmaz", "TAKBİS ... D u r u m 1 24976109 X Sultangazi 785 17 BagimsizBolum DÜKKAN 0,00 Aktif Yukarıda yer alan bilgiler") == "var"
    assert io.sinifla("tasinmaz", "Kişiye ait sorgu sonucu herhangi bir mal varlığı kaydına ulaşılamamıştır.") == "yok"
    assert io.sinifla("tasinmaz", "aşağıdaki tabloda belirtilen taşınmazlara İcrai Haciz Tesisi işlemi yukarıdaki tarih ile yapılmıştır") == "var"


def test_arac_siniflandirma():
    assert io.sinifla("arac", "yapılan sorgulama sonucunda ilgili tarafa ait araç kaydına rastlanmamıştır.") == "yok"
    assert io.sinifla("arac", "PLAKA : 34DUM97 MARKA : MERCEDES MODEL : 1977") == "var"


def test_banka_siniflandirma_ve_ihbarname_tuzagi():
    olumlu = ("tutarlar üzerine bankamızın rehin, hapis ve takas mahsup haklarından sonra hüküm ifade etmek üzere "
              "hacziniz işlenmiştir. Diğer hesabı bulunmamaktadır.")
    assert io.sinifla("banka", olumlu) == "var"
    ocr = "Bankamız nezdinde gerekli araştırma yapılmış olup herhangi bir hesap, hak veya alacağına aastlanılmamlştlr."
    assert io.sinifla("banka", ocr) == "yok"
    ihbarname = "Yukarıda adı yazılı borçlunun sizdeki alacağı üzerine 01/08/2023 tarihinde haciz konulmuştur. Ödeme yapmayınız."
    assert io.sinifla("banka", ihbarname) == "belirsiz"
    assert io.sinifla("banka", "Bankamızda hacziniz işlenememiştir, hesap bulunmamaktadır.") == "yok"
    assert io.sinifla("banka", "KEP Paketi ektedir.") == "belirsiz"


def test_dosya_ozeti_taraf_durum_ve_mal_varligi(tmp_path):
    k = _klon(tmp_path, [
        ("Taşınmaz Bilgisi Raporu", "21/01/2019", "TAKBİS 0,00 Aktif Yukarıda yer alan bilgiler"),
        ("89/1 Haciz İhbarnamesi Cevabı", "15/08/2026", "Bankamız nezdinde araştırma yapılmış olup hesabına rastlanmamıştır."),
        ("Borca İtiraz Talebi", "02/10/2026", "itiraz ediyoruz"),
        ("Taşınmaz Şerh Ekleme Yazısı", "01/03/2025", "talep yazısı (sonuç değil)"),
    ])
    o = io.dosya_ozeti(k, BUGUN)
    assert o["muvekkil"] == "ALİ VELİ" and o["karsi_taraf"] == "ÖRNEK GIDA A.Ş." and o["rolumuz"] == "Alacaklı vekili"
    assert o["dosya_durumu"] == "Açık" and o["son_islem"].startswith("09.10.2026 Dosya Kesinleşme")
    assert o["kesinlesme"] == "09.10.2026" and o["itiraz"] == "02.10.2026"
    assert o["odeme_emri"].startswith("01.10.2026")
    assert o["tasinmaz"].startswith("VAR") and "6 aydan eski" in o["tasinmaz"]
    assert o["banka"].startswith("1 cevap: haciz işlendi 0, olumsuz 1")
    assert o["arac"] == "sorgu evrakı yok" and "araç" in o["sorgu_onerisi"] and "tapu" in o["sorgu_onerisi"]
    assert o["not"] == ""


def test_eksik_klon_isaretlenir(tmp_path):
    k = _klon(tmp_path, [])
    proje = json.loads((k / "uyap-project.json").read_text(encoding="utf-8"))
    proje["uyapEvrakSayisi"] = 421
    (k / "uyap-project.json").write_text(json.dumps(proje, ensure_ascii=False), encoding="utf-8")
    assert io.dosya_ozeti(k, BUGUN)["not"].startswith("EKSİK KLON: 0/421")


def test_excel_icra_plani_yalniz_bos_hucreyi_ve_sistem_satirini_gunceller(tmp_path):
    o = io.dosya_ozeti(_klon(tmp_path, []), BUGUN)
    satirlar = {r: [None] * 14 for r in range(2, 302)}
    satirlar[2] = [None, "2099-004", "İstanbul 20. İcra Dairesi", "2099/39171", "Avukatın yazdığı ad", None, None,
                   "avukatın durumu", None, None, None, None, None, None]
    satirlar[3] = [None, None, "İstanbul 20. İcra Dairesi", "2099/39171", None, None, None, "Son UYAP hareketi ...",
                   None, "Aykut", None, None, None, "UYAP'tan eklendi 09.10.2026; ..."]
    plan = et.icra_plani(satirlar, [o])
    assert plan["taraf"] == [(2, None, "ÖRNEK GIDA A.Ş.")]
    assert plan["durum"] == []
    satirlar[2] = [None] * 14
    plan = et.icra_plani(satirlar, [o])
    assert plan["taraf"] == [(3, "ALİ VELİ", "ÖRNEK GIDA A.Ş.")]
    assert plan["durum"][0][0] == 3 and plan["durum"][0][1].startswith("Açık; son işlem 09.10.2026")
    satir = et.icra_satirlari([o], plan["klasor"], BUGUN)[0]
    assert satir[1] == "İstanbul 20. İcra Dairesi" and satir[5] == "ALİ VELİ" and len(satir) == len(et.ICRA_BASLIK)
