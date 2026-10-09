"""akis.py testleri — dava akış kaydı (00-AKIS.md + .akis.json).

Çalıştır: python -m pytest scripts/tests/test_akis.py -q
"""
import json

import pytest

import akis


def _tam_akis_0_2(klasor):
    akis.baslat(klasor, mod="tam", is_tanimi="cevap dilekçesi")
    for n in (0, 1, 2):
        akis.asama(klasor, n, durum="bitti")


def test_baslat_dosyalari_olusturur(tmp_path):
    klasor = tmp_path / "2026-016 Ornek Dava"
    klasor.mkdir()
    akis.baslat(klasor, mod="tam", is_tanimi="cevap dilekçesi")
    assert (klasor / "00-AKIS.md").exists()
    assert (klasor / ".akis.json").exists()
    durum = json.loads((klasor / ".akis.json").read_text(encoding="utf-8"))
    assert durum["mod"] == "tam"
    assert durum["dava_id"] == "2026-016"
    assert set(durum["asamalar"]) == {str(i) for i in range(8)}
    md = (klasor / "00-AKIS.md").read_text(encoding="utf-8")
    assert "TAM" in md and "cevap dilekçesi" in md


def test_olmayan_klasorde_baslat_hata_verir(tmp_path):
    with pytest.raises(FileNotFoundError):
        akis.baslat(tmp_path / "2026-016", mod="tam", is_tanimi="x")
    assert not (tmp_path / "2026-016").exists()


def test_mod_planlari(tmp_path):
    akis.baslat(tmp_path, mod="hizli", is_tanimi="duruşma günü talebi")
    assert akis.plan(akis.yukle(tmp_path)) == [0, 1, 2, 5, 7]
    akis.baslat(tmp_path, mod="tam", is_tanimi="duruşma günü talebi")
    assert akis.plan(akis.yukle(tmp_path)) == list(range(8))


def test_asama_guncelle_ve_sonraki(tmp_path):
    _tam_akis_0_2(tmp_path)
    akis.denetim(tmp_path, nokta="K1", dosya="02-Arastirma/arastirma-raporu.md", karar="YESIL")
    assert akis.sonraki(akis.yukle(tmp_path)) == 3
    akis.asama(tmp_path, 3, durum="atlandi", not_="avukat atla dedi")
    assert akis.sonraki(akis.yukle(tmp_path)) == 4


def test_mevcut_cikti_tamamlanmis_sayilir(tmp_path):
    akis.baslat(tmp_path, mod="tam", is_tanimi="x")
    akis.asama(tmp_path, 0, durum="mevcut", cikti="00-Briefing.md")
    assert akis.sonraki(akis.yukle(tmp_path)) == 1


def test_hepsi_bitince_sonraki_none(tmp_path):
    akis.baslat(tmp_path, mod="hizli", is_tanimi="x")
    for n in (0, 1, 2, 5, 7):
        akis.asama(tmp_path, n, durum="bitti")
    assert akis.sonraki(akis.yukle(tmp_path)) is None


def test_gecersiz_asama_durumu_reddedilir(tmp_path):
    akis.baslat(tmp_path, mod="tam", is_tanimi="x")
    with pytest.raises(ValueError):
        akis.asama(tmp_path, 2, durum="yarim")
    with pytest.raises(ValueError):
        akis.asama(tmp_path, 9, durum="bitti")


def test_denetim_kaydi_eklenir_ve_render_edilir(tmp_path):
    akis.baslat(tmp_path, mod="tam", is_tanimi="x")
    akis.denetim(tmp_path, nokta="K1", dosya="02-Arastirma/arastirma-raporu.md",
                 karar="KIRMIZI", tur=1, bulgu=4)
    akis.denetim(tmp_path, nokta="K1", dosya="02-Arastirma/arastirma-raporu.md",
                 karar="YESIL", tur=2, bulgu=0)
    durum = akis.yukle(tmp_path)
    assert [d["karar"] for d in durum["denetimler"]] == ["KIRMIZI", "YESIL"]
    md = (tmp_path / "00-AKIS.md").read_text(encoding="utf-8")
    assert "K1" in md and "YEŞİL" in md and "KIRMIZI" in md


def test_gecersiz_karar_ve_nokta_reddedilir(tmp_path):
    akis.baslat(tmp_path, mod="tam", is_tanimi="x")
    with pytest.raises(ValueError):
        akis.denetim(tmp_path, nokta="K1", dosya="a.md", karar="BELKI")
    with pytest.raises(ValueError):
        akis.denetim(tmp_path, nokta="K9", dosya="a.md", karar="SARI")


def test_tur_gecmisten_hesaplanir(tmp_path):
    akis.baslat(tmp_path, mod="tam", is_tanimi="x")
    akis.denetim(tmp_path, nokta="K1", dosya="r.md", karar="KIRMIZI")
    akis.denetim(tmp_path, nokta="K1", dosya="r.md", karar="SARI")
    assert [d["tur"] for d in akis.yukle(tmp_path)["denetimler"]] == [1, 2]


def test_verilen_tur_gecmisle_uyusmazsa_hata(tmp_path):
    akis.baslat(tmp_path, mod="tam", is_tanimi="x")
    akis.denetim(tmp_path, nokta="K1", dosya="r.md", karar="KIRMIZI", tur=1)
    with pytest.raises(ValueError):
        akis.denetim(tmp_path, nokta="K1", dosya="r.md", karar="SARI", tur=1)


def test_dorduncu_tur_avukat_talimati_ister(tmp_path):
    akis.baslat(tmp_path, mod="tam", is_tanimi="x")
    for karar in ("KIRMIZI", "SARI", "SARI"):
        akis.denetim(tmp_path, nokta="K2", dosya="d.md", karar=karar)
    with pytest.raises(ValueError):
        akis.denetim(tmp_path, nokta="K2", dosya="d.md", karar="SARI")
    akis.denetim(tmp_path, nokta="K2", dosya="d.md", karar="SARI", avukat_talimati=True)
    assert akis.yukle(tmp_path)["denetimler"][-1]["tur"] == 4


def test_negatif_bulgu_reddedilir(tmp_path):
    akis.baslat(tmp_path, mod="tam", is_tanimi="x")
    with pytest.raises(ValueError):
        akis.denetim(tmp_path, nokta="K1", dosya="r.md", karar="SARI", bulgu=-1)


def test_k1_yesil_degilse_asama3_engellenir(tmp_path):
    _tam_akis_0_2(tmp_path)
    akis.denetim(tmp_path, nokta="K1", dosya="r.md", karar="SARI")
    assert "K1" in (akis.engel(akis.yukle(tmp_path)) or "")
    akis.denetim(tmp_path, nokta="K1", dosya="r.md", karar="YESIL")
    assert akis.engel(akis.yukle(tmp_path)) is None


def test_k1_kaydi_yoksa_da_engellenir(tmp_path):
    _tam_akis_0_2(tmp_path)
    assert "K1" in (akis.engel(akis.yukle(tmp_path)) or "")


def test_ks_yesil_degilse_asama5_engellenir(tmp_path):
    _tam_akis_0_2(tmp_path)
    akis.denetim(tmp_path, nokta="K1", dosya="r.md", karar="YESIL")
    for n in (3, 4):
        akis.asama(tmp_path, n, durum="bitti")
    akis.denetim(tmp_path, nokta="KS", dosya="s.md", karar="KIRMIZI")
    assert "KS" in (akis.engel(akis.yukle(tmp_path)) or "")


def test_hizli_modda_k1_ve_ks_aranmaz(tmp_path):
    akis.baslat(tmp_path, mod="hizli", is_tanimi="x")
    for n in (0, 1, 2):
        akis.asama(tmp_path, n, durum="bitti")
    durum = akis.yukle(tmp_path)
    assert akis.engel(durum) is None
    assert akis.sonraki(durum) == 5


def test_k2_olmadan_akis_tamamlanmaz(tmp_path):
    akis.baslat(tmp_path, mod="hizli", is_tanimi="x")
    for n in (0, 1, 2, 5, 7):
        akis.asama(tmp_path, n, durum="bitti")
    assert "K2" in (akis.engel(akis.yukle(tmp_path)) or "")
    with pytest.raises(ValueError):
        akis.denetim(tmp_path, nokta="K2", dosya="d.md", karar="UYGULANMAZ")
    akis.denetim(tmp_path, nokta="K2", dosya="d.md", karar="UYGULANMAZ",
                 not_="atıfsız usul belgesi; yalnız yapısal kapı")
    assert akis.engel(akis.yukle(tmp_path)) is None


def test_ayni_is_ikinci_baslat_durumu_korur(tmp_path):
    akis.baslat(tmp_path, mod="tam", is_tanimi="x")
    akis.asama(tmp_path, 0, durum="bitti")
    akis.baslat(tmp_path, mod="hizli", is_tanimi="x")
    durum = akis.yukle(tmp_path)
    assert durum["asamalar"]["0"]["durum"] == "bitti"
    assert durum["mod"] == "hizli"
    assert any("mod" in o["olay"] for o in durum["olaylar"])


def test_yeni_is_onceki_isi_arsivler_ve_sifirlar(tmp_path):
    akis.baslat(tmp_path, mod="tam", is_tanimi="dava dilekçesi")
    akis.asama(tmp_path, 0, durum="bitti")
    akis.denetim(tmp_path, nokta="K1", dosya="a.md", karar="YESIL")
    akis.evrak(tmp_path, kaynak="G:/YargiPRO/x")
    akis.baslat(tmp_path, mod="tam", is_tanimi="cevaba cevap")
    durum = akis.yukle(tmp_path)
    assert durum["asamalar"]["0"]["durum"] == "bekliyor"
    assert durum["denetimler"] == []
    assert durum["gecmis_isler"][0]["is"] == "dava dilekçesi"
    assert durum["evrak_kaynaklari"][0]["yol"] == "G:/YargiPRO/x"
    assert akis.sonraki(durum) == 0


def test_evrak_kaydi_mod_secilmedi_acar(tmp_path):
    akis.evrak(tmp_path, kaynak="G:/YargiPRO/Avukat UYAP/x")
    durum = akis.yukle(tmp_path)
    assert durum["mod"] == "secilmedi"
    assert akis.plan(durum) == []
    assert akis.sonraki(durum) is None
    assert "seçilmedi" in (tmp_path / "00-AKIS.md").read_text(encoding="utf-8")
    akis.baslat(tmp_path, mod="tam", is_tanimi="cevap dilekçesi")
    durum = akis.yukle(tmp_path)
    assert durum["mod"] == "tam" and len(durum["evrak_kaynaklari"]) == 1
    assert durum.get("gecmis_isler", []) == []


def test_evrak_kaynagi_tekrarsiz(tmp_path):
    akis.baslat(tmp_path, mod="tam", is_tanimi="x")
    akis.evrak(tmp_path, kaynak="G:/YargiPRO/Avukat UYAP/x")
    akis.evrak(tmp_path, kaynak="G:/YargiPRO/Avukat UYAP/x")
    assert len(akis.yukle(tmp_path)["evrak_kaynaklari"]) == 1


def test_hucredeki_satir_sonu_tabloyu_bozmaz(tmp_path):
    akis.baslat(tmp_path, mod="tam", is_tanimi="x")
    akis.asama(tmp_path, 0, durum="bitti", not_="birinci satır\nikinci | satır")
    md = (tmp_path / "00-AKIS.md").read_text(encoding="utf-8")
    satir = [s for s in md.splitlines() if s.startswith("| 0 |")][0]
    assert "birinci satır" in satir and "ikinci" in satir and "\\|" in satir


def test_cli_baslat_goster_sonraki(tmp_path, capsys):
    assert akis.main(["baslat", str(tmp_path), "--mod", "tam", "--is", "dava dilekçesi"]) == 0
    assert akis.main(["asama", str(tmp_path), "0", "--durum", "bitti"]) == 0
    assert akis.main(["sonraki", str(tmp_path)]) == 0
    assert akis.main(["goster", str(tmp_path)]) == 0
    out = capsys.readouterr().out
    assert "dava dilekçesi" in out
    assert "ASAMA 1" in out


def test_cli_sonraki_engelde_exit1(tmp_path, capsys):
    _tam_akis_0_2(tmp_path)
    assert akis.main(["sonraki", str(tmp_path)]) == 1
    assert "ENGEL" in capsys.readouterr().out


def test_kayit_yoksa_anlasilir_hata(tmp_path, capsys):
    assert akis.main(["goster", str(tmp_path)]) == 1
    assert "akış kaydı yok" in capsys.readouterr().err


def test_mutlak_ve_goreli_yol_ayni_dosya_sayilir(tmp_path):
    _tam_akis_0_2(tmp_path)
    mutlak = tmp_path / "02-Arastirma" / "arastirma-raporu.md"
    akis.asama(tmp_path, 2, durum="bitti", cikti=str(mutlak))
    assert akis.yukle(tmp_path)["asamalar"]["2"]["cikti"] == "02-Arastirma/arastirma-raporu.md"
    akis.denetim(tmp_path, nokta="K1", dosya="02-Arastirma/arastirma-raporu.md", karar="SARI")
    kayit = akis.denetim(tmp_path, nokta="K1", dosya=str(mutlak), karar="YESIL")
    assert [d["tur"] for d in kayit["denetimler"]] == [1, 2]
    assert akis.engel(akis.yukle(tmp_path)) is None


def test_ek_kirmizi_ise_gecis_engellenir(tmp_path):
    _tam_akis_0_2(tmp_path)
    akis.denetim(tmp_path, nokta="K1", dosya="02-Arastirma/arastirma-raporu.md", karar="YESIL")
    akis.denetim(tmp_path, nokta="EK", dosya="02-Arastirma/kunye-havuzu-ek.md", karar="KIRMIZI")
    assert "EK" in (akis.engel(akis.yukle(tmp_path)) or "")
    akis.denetim(tmp_path, nokta="EK", dosya="02-Arastirma/kunye-havuzu-ek.md", karar="YESIL")
    assert akis.engel(akis.yukle(tmp_path)) is None


def test_istek_denetimi_kaydedilir_gecisi_durdurmaz(tmp_path):
    _tam_akis_0_2(tmp_path)
    akis.denetim(tmp_path, nokta="K1", dosya="02-Arastirma/arastirma-raporu.md", karar="YESIL")
    kayit = akis.denetim(tmp_path, nokta="ISTEK", dosya="01-Usul/usul-raporu.md", karar="SARI")
    assert kayit["denetimler"][-1]["nokta"] == "ISTEK"
    assert akis.engel(akis.yukle(tmp_path)) is None


def test_k2_her_dosyanin_son_karari_gecer_olmali(tmp_path):
    akis.baslat(tmp_path, mod="hizli", is_tanimi="x")
    for n in (0, 1, 2, 5, 7):
        akis.asama(tmp_path, n, durum="bitti")
    akis.denetim(tmp_path, nokta="K2", dosya="03-Sentez-ve-Dilekce/dilekce-v2.md", karar="KIRMIZI")
    akis.denetim(tmp_path, nokta="K2", dosya="04-Muvekkil-Belgeleri/muvekkil-bilgilendirme.md", karar="YESIL")
    sorun = akis.engel(akis.yukle(tmp_path)) or ""
    assert "K2" in sorun and "dilekce-v2.md" in sorun
    akis.denetim(tmp_path, nokta="K2", dosya="03-Sentez-ve-Dilekce/dilekce-v2.md", karar="YESIL")
    assert akis.engel(akis.yukle(tmp_path)) is None


def test_yesilden_sonra_tur_sayaci_sifirlanir(tmp_path):
    akis.baslat(tmp_path, mod="tam", is_tanimi="x")
    for _ in range(4):
        akis.denetim(tmp_path, nokta="EK", dosya="02-Arastirma/kunye-havuzu-ek.md", karar="YESIL")
    for karar in ("SARI", "YESIL", "SARI"):
        akis.denetim(tmp_path, nokta="K1", dosya="r.md", karar=karar)
    assert [d["tur"] for d in akis.yukle(tmp_path)["denetimler"]] == [1, 1, 1, 1, 1, 2, 1]


def test_kol_baslatta_kaydedilir_ve_gosterilir(tmp_path):
    akis.baslat(tmp_path, mod="tam", is_tanimi="ödeme emrine itiraz", kol="İİK")
    assert akis.yukle(tmp_path)["kol"] == "iik"
    assert "Yargı kolu:** İİK" in (tmp_path / "00-AKIS.md").read_text(encoding="utf-8")


def test_gecersiz_kol_reddedilir(tmp_path):
    with pytest.raises(ValueError):
        akis.baslat(tmp_path, mod="tam", is_tanimi="x", kol="vergi")


def test_kol_degistir_olay_yazar(tmp_path):
    akis.baslat(tmp_path, mod="tam", is_tanimi="x", kol="hmk")
    kayit = akis.kol_degistir(tmp_path, "iyuk", not_="idari işlem")
    assert kayit["kol"] == "iyuk"
    assert any("İYUK" in o["olay"] for o in kayit["olaylar"])


def test_kolsuz_eski_kayit_yuklenir(tmp_path):
    akis.baslat(tmp_path, mod="tam", is_tanimi="x")
    yol = tmp_path / ".akis.json"
    veri = json.loads(yol.read_text(encoding="utf-8"))
    veri.pop("kol", None)
    yol.write_text(json.dumps(veri), encoding="utf-8")
    assert akis.yukle(tmp_path)["kol"] == ""


def test_hat_olayi_kaydedilir_kayit_yoksa_acilir(tmp_path):
    kayit = akis.olay_ekle(tmp_path, "durusma", "celse kartı hazırlandı",
                           cikti=str(tmp_path / "05-Durusma-Notlari" / "celse-karti.md"))
    assert kayit["mod"] == "secilmedi"
    son = kayit["olaylar"][-1]["olay"]
    assert "[hat: durusma]" in son and "05-Durusma-Notlari/celse-karti.md" in son
    with pytest.raises(ValueError):
        akis.olay_ekle(tmp_path, "", "x")


def test_cli_olay(tmp_path, capsys):
    assert akis.main(["olay", str(tmp_path), "karar çözümlendi", "--hat", "karar"]) == 0
    assert "[hat: karar]" in (tmp_path / "00-AKIS.md").read_text(encoding="utf-8")
