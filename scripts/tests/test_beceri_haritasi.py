"""beceri_haritasi.py testleri — 107 Yargı PRO becerisinin büro sistemindeki yeri."""
import json

import beceri_haritasi as bh


def test_gercek_harita_kontrolden_gecer():
    assert bh.kontrol(bh.yukle()) == []


def test_eslemede_yok_kalmadi():
    assert not [b["ad"] for b in bh.yukle()["beceriler"] if b["yer"] == "eslemede-yok"]


def test_asama5_icra_kolu_dilekce_ve_usul_ailesini_getirir():
    adlar = [ad for ad, _ in bh.asama_becerileri(bh.yukle(), 5, kol="İİK", mod="hizli")]
    assert "13-3-dilekce-turu-secimi" in adlar
    assert "3-4-takibe-itiraz-dilekceleri" in adlar
    assert "3-9-icra-usul-islemleri" in adlar
    assert "2-3-dava-cevap-dilekceleri" not in adlar


def test_kol_verilmezse_yalniz_ortak_beceriler():
    adlar = [ad for ad, _ in bh.asama_becerileri(bh.yukle(), 2)]
    assert "11-2-derin-emsal-taramasi" in adlar
    assert not any(ad.startswith(("1-", "2-", "3-", "4-", "5-", "6-")) for ad in adlar)


def test_karar_hatti_kolun_karar_sonrasi_ailesini_acar():
    _, adlar = bh.hat_becerileri(bh.yukle(), "karar", kol="cmk")
    assert "10-4-karar-cozumlemesi" in adlar and "1-7-ceza-karar-sonrasi" in adlar
    assert "5-5-aym-karar-sonrasi" not in adlar


def test_ara_istinaf():
    adlar = {b["ad"] for b in bh.ara(bh.yukle(), "istinaf")}
    assert {"2-6-hukuk-istinaf-temyiz", "1-6-ceza-istinaf-temyiz", "4-5-idare-istinaf-temyiz"} <= adlar


def test_kontrol_bozuk_haritayi_yakalar():
    veri = bh.yukle()
    veri["beceriler"].append(dict(veri["beceriler"][0]))
    veri["beceriler"][1]["yer"] = "bilinmeyen"
    veri["hatlar"][0]["beceriler"].append("99-9-uydurma")
    hatalar = bh.kontrol(veri)
    assert any("108" in h for h in hatalar)
    assert any("tekrarlanan" in h for h in hatalar)
    assert any("geçersiz yer" in h for h in hatalar)
    assert any("99-9-uydurma" in h for h in hatalar)


def test_kontrol_hat_ile_beceri_kaydinin_iki_yonlu_uyumunu_denetler():
    veri = bh.yukle()
    ozet = next(b for b in veri["beceriler"] if b["ad"] == "10-3-canli-dosya-ozeti")
    ozet["hatlar"] = [h for h in ozet["hatlar"] if h != "karar"]
    portfoy = next(b for b in veri["beceriler"] if b["ad"] == "18-5-dosya-portfoyu")
    portfoy["hatlar"].append("muzakere")
    hatalar = bh.kontrol(veri)
    assert any("hat karar: 10-3-canli-dosya-ozeti" in h for h in hatalar)
    assert any("18-5-dosya-portfoyu: 'muzakere'" in h for h in hatalar)


def test_cli(tmp_path, capsys):
    assert bh.main(["kontrol"]) == 0
    assert bh.main(["asama", "3", "--kol", "aym"]) == 0
    assert "5-1-aym-dosya-analizi" in capsys.readouterr().out
    assert bh.main(["hat", "olmayan-hat"]) == 1
    bozuk = tmp_path / "harita.json"
    bozuk.write_text(json.dumps({"beceriler": [], "hatlar": []}), encoding="utf-8")
    assert bh.main(["kontrol"], yol=bozuk) == 1
