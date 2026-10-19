"""uyap_duzen.py: klonlar uygulama ağacına kopyalanır (silme yok), dava ↔ UYAP bağı kurulur, kopya tek yönlüdür."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uyap_duzen as ud  # noqa: E402
import uyap_esitle as ue  # noqa: E402

HESAP = "AVUKAT TEST"


def _klon(yol: Path, mahkeme: str, no: str, portal=None, evrak=2, son="2026-08-01T00:00:00Z") -> Path:
    yol.mkdir(parents=True)
    proje = {"mahkeme": mahkeme, "esasNo": no, "evraklar": [{}] * evrak, "lastSyncedAt": son}
    if portal:
        proje["portal"] = portal
    (yol / "uyap-project.json").write_text(json.dumps(proje, ensure_ascii=False), encoding="utf-8")
    (yol / "evraklar").mkdir()
    for i in range(evrak):
        (yol / "evraklar" / f"{i}.udf").write_text(str(i), encoding="utf-8")
    (yol / "AGENTS.md").write_text("klon talimatı", encoding="utf-8")
    return yol


def _agac(tmp_path: Path) -> Path:
    ad = tmp_path / "Aktif Davalar"
    app = ad / "YargiPRO" / "Avukat UYAP" / HESAP
    _klon(app / "Hukuk" / "ASLİYE HUKUK MAHKEMESİ" / "Bakırköy 12. Asliye Hukuk Mahkemesi 2099-5",
          "Bakırköy 12. Asliye Hukuk Mahkemesi", "2099/5")
    eski = ad / "0ESKİ" / "YargiPRO-eski" / "Avukat UYAP" / HESAP / "Hukuk" / "ASLİYE HUKUK MAHKEMESİ"
    _klon(eski / "Akif Test - Bakırköy 12. Asliye Hukuk Mahkemesi 2099-5", "Bakırköy 12. Asliye Hukuk Mahkemesi", "2099/5")
    _klon(eski / "Muazzez Test - Körfez 2. Asliye Hukuk Mahkemesi 2099-169", "Körfez 2. Asliye Hukuk Mahkemesi",
          "2099/169", evrak=3, son="2026-08-01T00:00:00Z")
    _klon(ad / "2099-032 Test Cevap" / "DAVA DOSYASI EVRAKLARI", "Körfez 2. Asliye Hukuk Mahkemesi", "2099/169",
          evrak=5, son="2026-09-01T00:00:00Z")
    _klon(ad / "2099-058 Test Mal Rejimi" / "EMİNE TEST" / "Hukuk" / "Çayeli Asliye Hukuk Mahkemesi 2099-60",
          "Çayeli Asliye Hukuk Mahkemesi", "2099/60", portal="vatandas")
    return ad


def test_yaprak_adi_muvekkil_onekini_atar():
    b = {"mahkeme": "Körfez 2. Asliye Hukuk Mahkemesi", "no": "2099/169"}
    assert ud.yaprak_adi("Muazzez Test - Körfez 2. Asliye Hukuk Mahkemesi 2099-169", b) == \
        "Körfez 2. Asliye Hukuk Mahkemesi 2099-169"
    assert ud.yaprak_adi("DAVA DOSYASI EVRAKLARI", b) == "Körfez 2. Asliye Hukuk Mahkemesi 2099-169"


def test_toparla_uygulamadakine_dokunmaz_en_gunceli_kopyalar_kaynagi_silmez(tmp_path):
    ad = _agac(tmp_path)
    plan = ud.toparla_plani(ad)
    hedefler = {Path(k["hedef"]).relative_to(ad / "YargiPRO").as_posix(): k for k in plan["kopya"]}
    assert set(hedefler) == {
        f"Avukat UYAP/{HESAP}/Hukuk/ASLİYE HUKUK MAHKEMESİ/Körfez 2. Asliye Hukuk Mahkemesi 2099-169",
        "Vatandaş UYAP/EMİNE TEST/Hukuk/Çayeli Asliye Hukuk Mahkemesi 2099-60"}
    korfez = hedefler[f"Avukat UYAP/{HESAP}/Hukuk/ASLİYE HUKUK MAHKEMESİ/Körfez 2. Asliye Hukuk Mahkemesi 2099-169"]
    assert "DAVA DOSYASI EVRAKLARI" in korfez["kaynak"]["yol"]  # son eşitlemesi en yeni olan seçilir
    assert len(plan["mevcut"]) == 1 and not plan["elle"]  # Bakırköy 12 uygulamada var: ikinci kopya açılmaz
    ud.toparla(ad, uygula=True)
    assert (ad / "2099-032 Test Cevap" / "DAVA DOSYASI EVRAKLARI" / "uyap-project.json").exists()
    assert not ud.toparla_plani(ad)["kopya"]


def test_bag_ve_kopya_dava_icindeki_klonu_UYAP_altina_toplar(tmp_path):
    ad = _agac(tmp_path)
    ud.toparla(ad, uygula=True)
    eslesme = [{"bolum": "A", "klasor": "2099-032", "mahkeme": "Körfez 2. Asliye Hukuk", "no": "2099/169"},
               {"bolum": "B", "klasor": "2099-058", "mahkeme": "Rize 2. Asliye Hukuk", "no": "2099/515"}]
    plan = ud.bag_plani(ad, eslesme)
    assert [b["kaynak"] for b in plan["baglar"]["2099-032 Test Cevap"]] == ["dava klasöründe klon"]
    assert len(plan["teyit"]) == 1
    ud.kopyala(ad, uygula=True, baglar=plan["baglar"])
    dava = ad / "2099-058 Test Mal Rejimi"
    kopya = dava / "UYAP" / "Çayeli Asliye Hukuk Mahkemesi 2099-60"
    assert (kopya / "evraklar" / "1.udf").exists()
    assert not (dava / "EMİNE TEST" / "Hukuk" / "Çayeli Asliye Hukuk Mahkemesi 2099-60").exists()
    assert "YargiPRO" in (dava / "00-UYAP-KAYNAK.md").read_text(encoding="utf-8")
    yeni = ad / "YargiPRO" / "Vatandaş UYAP" / "EMİNE TEST" / "Hukuk" / \
        "Çayeli Asliye Hukuk Mahkemesi 2099-60" / "evraklar" / "yeni.udf"
    yeni.write_text("yeni evrak", encoding="utf-8")
    assert ud.kopyala(ad, uygula=True, baglar=plan["baglar"])["dosya"] == 1
    assert (kopya / "evraklar" / "yeni.udf").read_text(encoding="utf-8") == "yeni evrak"


def test_avukat_teyidi_evet_baglar_hayir_listeden_cikarir(tmp_path):
    ad = tmp_path / "Aktif Davalar"
    for d in ("2099-008 Faruk Test", "2099-008 Soner Test", "2099-036 Tapu Test"):
        (ad / d).mkdir(parents=True)
    eslesme = [{"bolum": "A", "klasor": "2099-008", "mahkeme": "İstanbul 12. İş", "no": "2099/307"},
               {"bolum": "B", "klasor": "2099-036", "mahkeme": "İstanbul 39. Asliye Hukuk", "no": "2099/230"},
               {"bolum": "B", "klasor": "2099-036", "mahkeme": "Rize 2. Asliye Hukuk", "no": "2099/515"}]
    kararlar = [{"klasor": "2099-008", "mahkeme": "İstanbul 12. İş", "no": "2099/307", "karar": "evet",
                 "dava": "2099-008 Faruk Test"},
                {"klasor": "2099-036", "mahkeme": "İstanbul 39. Asliye Hukuk", "no": "2099/230", "karar": "evet"},
                {"klasor": "2099-036", "mahkeme": "Rize 2. Asliye Hukuk", "no": "2099/515", "karar": "hayir"}]
    plan = ud.bag_plani(ad, eslesme, kararlar)
    assert [b["no"] for b in plan["baglar"]["2099-008 Faruk Test"]] == ["2099/307"]
    assert [b["kaynak"] for b in plan["baglar"]["2099-036 Tapu Test"]] == ["avukat teyidi"]
    assert not plan["teyit"] and [r["no"] for r in plan["reddedilen"]] == ["2099/515"]


def test_kopya_klon_talimat_dosyasini_almaz(tmp_path):
    kaynak = _klon(tmp_path / "k", "X 1. Asliye Hukuk Mahkemesi", "2099/1")
    assert ud.esitle_dosyalar(kaynak, tmp_path / "h", uygula=True) == 3  # proje + 2 evrak; AGENTS.md yok
    assert not (tmp_path / "h" / "AGENTS.md").exists()


def test_esitleme_diskteki_klonu_yeniden_indirmez(monkeypatch):
    monkeypatch.setattr(ue, "ALINAN_DOSYA_TURLERI", None)
    eski = [{"mahkeme": "Kartal 2. Asliye Hukuk Mahkemesi", "esasNo": "2099/7", "portal": None, "evrak": 12}]
    diskte = [{"mahkeme": "Kartal 2. Asliye Hukuk Mahkemesi", "no": "2099/7"}]
    assert ue.adaylar({}, eski, [], diskte) == []


def test_iki_portaldaki_ayni_dosya_ayri_kopyalara_gider(tmp_path):
    ad = tmp_path / "Aktif Davalar"
    app = ad / "YargiPRO"
    m, no = "Gaziosmanpaşa 1. İcra Hukuk Mahkemesi", "2099/708"
    _klon(app / "Avukat UYAP" / HESAP / "Hukuk" / "İCRA HUKUK MAHKEMESİ" / f"{m} 2099-708", m, no, evrak=2)
    _klon(app / "Vatandaş UYAP" / "ARİF TEST" / "Hukuk" / f"{m} 2099-708", m, no, portal="vatandas", evrak=3)
    (ad / "2099-008 Test").mkdir()
    baglar = {"2099-008 Test": [{"mahkeme": m, "no": no, "portal": "avukat", "kaynak": "t"},
                                {"mahkeme": m, "no": no, "portal": "vatandas", "kaynak": "t"}]}
    assert ud.kopyala(ad, uygula=True, baglar=baglar)["dosya"] == 7  # 3 + 4: üst üste yazma yok
    uyap = ad / "2099-008 Test" / "UYAP"
    assert sorted(p.name for p in uyap.iterdir()) == [f"{m} 2099-708", f"{m} 2099-708 (vatandaş)"]
    assert ud.kopyala(ad, uygula=True, baglar=baglar)["dosya"] == 0  # ikinci çalıştırmada iş kalmaz


def test_kesilen_kopya_yeniden_calistirmada_tamamlanir(tmp_path):
    ad = _agac(tmp_path)
    plan = ud.toparla_plani(ad)
    k = next(x for x in plan["kopya"] if "Körfez" in x["hedef"])
    ud._kaydet(ad, {"islem": "toparla-basladi", "kaynak": k["kaynak"]["yol"], "hedef": k["hedef"]})
    Path(k["hedef"]).mkdir(parents=True)  # yarım: klasör açıldı, dosya yok
    yeni = ud.toparla_plani(ad)
    assert any(x["hedef"] == k["hedef"] and x.get("yarim") for x in yeni["kopya"])
    ud.toparla(ad, uygula=True)
    assert (Path(k["hedef"]) / "uyap-project.json").exists()
    assert not ud.toparla_plani(ad)["kopya"]


def test_cmk_klasoru_02CMK_altinda_baglanir_ve_kopyalanir(tmp_path):
    """02CMK/CMK-<no> … klasörü dava klasörü sayılır; bağ anahtarı göreli yoldur, CMK-1 ile CMK-15 karışmaz."""
    ad = tmp_path / "Aktif Davalar"
    _klon(ad / "YargiPRO" / "Avukat UYAP" / HESAP / "Ceza" / "AĞIR CEZA MAHKEMESİ" / "Gaziosmanpaşa 4. Ağır Ceza Mahkemesi 2099-143",
          "Gaziosmanpaşa 4. Ağır Ceza Mahkemesi", "2099/143")
    for d in ("02CMK/... CMK-15 UYUŞTURUCU ÖRNEK", "02CMK/CMK-1 BAŞKA", "02CMK/CMK-18"):
        (ad / d).mkdir(parents=True)
    eslesme = [{"bolum": "A", "klasor": "CMK-15", "mahkeme": "GOP 4. Ağır Ceza", "no": "2099/143"}]
    plan = ud.bag_plani(ad, eslesme, [])
    anahtar = "02CMK/... CMK-15 UYUŞTURUCU ÖRNEK"
    assert [b["kaynak"] for b in plan["baglar"][anahtar]] == ["eşleşme tablosu A"]
    assert not plan["teyit"]
    ud.kopyala(ad, uygula=True, baglar=plan["baglar"])
    kopya = ad / anahtar / "UYAP" / "Gaziosmanpaşa 4. Ağır Ceza Mahkemesi 2099-143"
    assert (kopya / "evraklar" / "1.udf").exists()
    assert (ad / anahtar / "00-UYAP-KAYNAK.md").exists()
