"""isbu-ofis entegrasyonu: istemci (sahte HTTP), şema doğrulama, eşleştirme ve öneri planı.
Ağ yok; UYAP ve Yargı PRO uygulaması çağrılmaz. Örnek veriler uydurma (2099 dosya numaraları)."""
import io
import json
import urllib.error
from datetime import date

import pytest

import isbu_esitle as ie
import isbu_ofis as io_
import isbu_sema as sema

BUGUN = date(2099, 3, 10)
SAHTE_ANAHTAR = "isbu_sk_" + "A" * 43
U1 = "11111111-1111-1111-1111-111111111111"
U2 = "22222222-2222-2222-2222-222222222222"
U3 = "33333333-3333-3333-3333-333333333333"
U4 = "44444444-4444-4444-4444-444444444444"
U5 = "55555555-5555-5555-5555-555555555555"


# --- istemci -----------------------------------------------------------------------------------------------------

class _Yanit:
    def __init__(self, govde, durum=200):
        self._b = json.dumps(govde).encode("utf-8")
        self.status = durum

    def read(self):
        return self._b

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


class SahteAcici:
    """Sırayla yanıt/hata döndürür; gelen istekleri kaydeder."""

    def __init__(self, sira):
        self.sira = list(sira)
        self.istekler = []

    def __call__(self, istek, timeout=None):
        self.istekler.append(istek)
        x = self.sira.pop(0)
        if isinstance(x, Exception):
            raise x
        return _Yanit(x)


def _http_hata(kod, govde, retry_after=None):
    basliklar = {"Retry-After": str(retry_after)} if retry_after is not None else {}
    return urllib.error.HTTPError("https://x/api/integration/cases", kod, "hata", basliklar,
                                  io.BytesIO(json.dumps(govde).encode("utf-8")))


def _api(sira, **kw):
    acici = SahteAcici(sira)
    bekleyen = []
    api = io_.IsbuOfis(anahtar=SAHTE_ANAHTAR, taban="https://ornek.test/api/integration", opener=acici,
                       uyku=bekleyen.append, **kw)
    return api, acici, bekleyen


def test_get_bearer_basligi_ve_sorgu():
    api, acici, _ = _api([[{"id": U1}]])
    assert api.cases(include_closed=True) == [{"id": U1}]
    istek = acici.istekler[0]
    assert istek.get_method() == "GET"
    assert istek.full_url == "https://ornek.test/api/integration/cases?include_closed=1"
    assert istek.get_header("Authorization") == f"Bearer {SAHTE_ANAHTAR}"


def test_saglik_kimliksiz_ve_api_kokunde():
    api, acici, _ = _api([{"ok": True}])
    api.saglik()
    assert acici.istekler[0].full_url == "https://ornek.test/api/health"
    assert acici.istekler[0].get_header("Authorization") is None


def test_schema_not_ready_retry_after_ile_yeniden_denenir():
    api, acici, bekleyen = _api([_http_hata(503, {"code": "SCHEMA_NOT_READY"}, retry_after=30), []])
    assert api.pulse() == []
    assert len(acici.istekler) == 2 and bekleyen == [30.0]


def test_baglanti_hatasi_yeniden_denenir_sonra_anahtarsiz_hata():
    hata = urllib.error.URLError(f"timed out {SAHTE_ANAHTAR}")
    api, acici, bekleyen = _api([hata, hata, hata], deneme=3, bekleme=(1, 2))
    with pytest.raises(io_.IsbuHata) as e:
        api.pulse()
    assert len(acici.istekler) == 3 and bekleyen == [1.0, 2.0]
    assert SAHTE_ANAHTAR not in str(e.value)


def test_4xx_yeniden_denenmez_ve_anahtar_sizmaz():
    api, acici, _ = _api([_http_hata(401, {"error": "Geçersiz anahtar"})])
    with pytest.raises(io_.IsbuHata) as e:
        api.cases()
    assert len(acici.istekler) == 1 and e.value.durum == 401
    assert SAHTE_ANAHTAR not in str(e.value) and SAHTE_ANAHTAR not in repr(api)


def test_post_gonder_bayragi_olmadan_istek_atilmaz():
    api, acici, _ = _api([])
    with pytest.raises(io_.IsbuHata):
        api.post_proposals([{"kind": "x"}])
    with pytest.raises(io_.IsbuHata):
        api.post_proposals([{"kind": "x"}], gonder="evet")
    assert acici.istekler == []


def test_post_hatali_oge_hic_gonderilmez():
    api, acici, _ = _api([])
    with pytest.raises(io_.IsbuHata, match="şema"):
        api.post_proposals([{"kind": "hearing_upsert", "payload": {}}], gonder=True)
    assert acici.istekler == []


def test_post_acik_gonder_tek_deneme_ve_govde():
    item = ie.oge("hearing_upsert", "uyap:ref:durusma", U1, {"hearing_date": "2099-04-01T10:00:00+03:00"},
                  "UYAP: duruşma", "test", "uyap")
    api, acici, _ = _api([{"counts": {"created": 1}, "results": []}])
    sonuc = api.post_proposals([item], gonder=True)
    assert sonuc[0]["counts"] == {"created": 1}
    istek = acici.istekler[0]
    assert istek.get_method() == "POST" and istek.full_url.endswith("/proposals")
    assert json.loads(istek.data)["items"][0]["request_id"] == item["request_id"]


def test_anahtar_env_dosyasindan_okunur(tmp_path, monkeypatch):
    monkeypatch.delenv(io_.ANAHTAR_ADI, raising=False)
    (tmp_path / ".env").write_text(f"DIGER=1\n# yorum\n{io_.ANAHTAR_ADI}=\"{SAHTE_ANAHTAR}\"\n", encoding="utf-8")
    assert io_.anahtar_oku([tmp_path / "yok.env", tmp_path / ".env"]) == SAHTE_ANAHTAR
    with pytest.raises(io_.IsbuHata) as e:
        io_.anahtar_oku([tmp_path / "yok.env"])
    assert SAHTE_ANAHTAR not in str(e.value)


def test_request_id_deterministik_ve_sinirda():
    a = io_.request_id("case_upsert", "uyap:x", {"buro_kodu": "2099-001"}, {"id": U1})
    assert a == io_.request_id("case_upsert", "uyap:x", {"buro_kodu": "2099-001"}, {"id": U1})
    assert a != io_.request_id("case_upsert", "uyap:x", {"buro_kodu": "2099-002"}, {"id": U1})
    assert 8 <= len(a) <= 100 and a.startswith("isbu-")


# --- şema ----------------------------------------------------------------------------------------------------------

def test_bos_metin_gonderilmez_bilinmeyen_alan_reddedilir():
    temiz, h = sema.payload_temizle("case_upsert", {"buro_kodu": "  2099-001 ", "court_name": "   ", "description": None})
    assert temiz == {"buro_kodu": "2099-001"} and h == []
    _, h = sema.payload_temizle("case_upsert", {"musteri": "x"})
    assert any("bilinmeyen" in x for x in h)


def test_sure_ve_sonraki_adim_kurallari():
    _, h = sema.payload_temizle("deadline_upsert", {"title": "Cevap"})
    assert any("conditional" in x for x in h)
    t, h = sema.payload_temizle("deadline_upsert", {"title": "Cevap", "due_date": None, "conditional": True,
                                                     "condition": "tebliğ teyidi"})
    assert h == [] and "due_date" not in t
    _, h = sema.payload_temizle("deadline_upsert", {"title": "Cevap", "due_date": "2099-02-30"})
    assert h
    _, h = sema.payload_temizle("next_step", {"target": "workspace", "waiting_for": "  "})
    assert h
    _, h = sema.payload_temizle("hearing_upsert", {"hearing_date": "2099-04-01T10:00:00"})
    assert any("saat dilimli" in x for x in h)


def test_icra_verisi_bos_anahtar_atar_bilinmeyeni_reddeder():
    t, h = sema.payload_temizle("enforcement_upsert", {"data": {"alacak": "100 TL", "itiraz": "", "arac": None}})
    assert t == {"data": {"alacak": "100 TL"}} and h == []
    _, h = sema.payload_temizle("enforcement_upsert", {"data": {"klon": "x"}})
    assert h


def test_oge_dogrulama_case_ref_ve_alanlar():
    item = ie.oge("case_upsert", "uyap:x", U1, {"buro_kodu": "2099-001"}, "özet", "gerekçe", "uyap")
    assert sema.oge_dogrula(item) == []
    assert sema.oge_dogrula({**item, "source": "excel"})
    assert sema.oge_dogrula({**item, "case_ref": {"case_number": "2099/1"}})
    assert sema.oge_dogrula({**item, "payload": {"buro_kodu": " 2099-001 "}})  # temizlenmemiş payload


# --- envanter, eşleştirme, plan ------------------------------------------------------------------------------------

def _env():
    onbellek = {
        "dosyalarim": {"davalar": [{"birimAdi": "İstanbul 20. İcra Dairesi", "dosyaNo": "2099/500", "portal": "avukat"}]},
        "hareketler": {"hareketler": [
            {"birimAdi": "Bakırköy 3. İş Mahkemesi", "dosyaNo": "2099/10", "tarih": "2099-03-05",
             "aciklama": "Gerekçeli Karar Hazırlandı", "dosyaTuru": "Hukuk Dava Dosyası"},
            {"birimAdi": "Kartal 2. Sulh Hukuk Mahkemesi", "dosyaNo": "2099/77", "tarih": "2099-03-01",
             "aciklama": "Dosya incelendi", "dosyaTuru": "Hukuk Dava Dosyası"}]},
        "durusmalar": {"durusmalar": [
            {"birimAdi": "Bakırköy 3. İş Mahkemesi", "dosyaNo": "2099/10", "tarih": "2099-04-02T07:30:00.000Z",
             "islemTuru": "Duruşma"},
            {"birimAdi": "Bakırköy 3. İş Mahkemesi", "dosyaNo": "2099/10", "tarih": "2099-01-02T07:30:00.000Z"}]},
    }
    eslesme = [{"bolum": "A", "klasor": "2099-001", "mahkeme": "Bakırköy 3. İş Mah.", "no": "2099/10", "muvekkil": "",
                "karsi": "", "cmk": False},
               {"bolum": "B", "klasor": "2099-002", "mahkeme": "Kartal 2. Sulh Hukuk", "no": "2099/77", "muvekkil": "",
                "karsi": "", "cmk": False}]
    cmk = [{"mahkeme": "Gaziosmanpaşa 5. Ağır Ceza Mahkemesi", "no": "2099/161"}]
    klonlar = [{"mahkeme": "İSTANBUL 20. İCRA DAİRESİ", "no": "2099/500", "portal": "avukat", "icra": True,
                "klon": "/klon/icra500", "klasor": "2099-003"}]
    klasorler = {"2099-001": ["2099-001 A"], "2099-002": ["2099-002 B"], "2099-003": ["2099-003 C"],
                 "2099-004": ["2099-004 D"], "2099-008": ["2099-008 E", "2099-008 F"]}
    return ie.envanter(onbellek, eslesme, cmk, klonlar, klasorler, [])


def _davalar():
    return [
        {"id": U1, "caseNumber": "2099/10", "courtName": "Bakırköy 3. İş Mahkemesi", "status": "active",
         "flags": ["sirada_is_yok"], "workspace": None},
        {"id": U2, "caseNumber": "2099/500", "courtName": "İstanbul 20. İcra Dairesi", "status": "active", "flags": []},
        {"id": U3, "caseNumber": "2099/77", "courtName": None, "status": "active", "flags": []},
        {"id": U4, "caseNumber": "2099/999", "courtName": "Ankara 1. Asliye Hukuk", "status": "active", "flags": []},
        {"id": U5, "buroKodu": "2099-004", "status": "active", "flags": []},
    ]


def test_envanter_kaynaklari_birlestirir_ve_cakismayi_isaretler():
    env = _env()
    icra = next(k for k in env["dosyalar"] if k["no"] == "2099/500")
    assert icra["buro_kodu"] == "2099-003" and icra["icra"] and {"onbellek", "klon"} <= set(icra["kaynaklar"])
    kartal = next(k for k in env["dosyalar"] if k["no"] == "2099/77")
    assert kartal["buro_kodu"] == "" and kartal["klasor_teyitsiz"] == ["2099-002"]  # B bölümü kesin sayılmaz
    assert env["cakisan_kodlar"] == ["2099-008"]
    assert next(k for k in env["dosyalar"] if k["no"] == "2099/161")["cmk"]
    assert icra["external_ref"] == ie.uyap_ref("istanbul 20. icra dairesi", "2099/0500")


def test_eslestirme_tahmin_yapmaz():
    s = ie.eslestir(_davalar(), _env())
    eslesen = {e["dava"]["id"]: e for e in s["eslesen"]}
    assert set(eslesen) == {U1, U2, U5}
    assert eslesen[U1]["dosya"]["buro_kodu"] == "2099-001"
    assert eslesen[U5]["dosya"].get("yalniz_klasor")
    assert [b["dava"]["id"] for b in s["belirsiz"]] == [U3]  # mahkeme adı yok
    assert [d["id"] for d in s["isbu_yok"]] == [U4]
    assert {k["no"] for k in s["buro_yok"]} == {"2099/161"}
    assert [y["buro_kodu"] for y in s["klasor_yok"]] == ["2099-002", "2099-008"]


def test_ayni_dosyaya_iki_dava_belirsiz_olur():
    d = _davalar()[0]
    s = ie.eslestir([d, {**d, "id": U4}], _env())
    assert s["eslesen"] == [] and len(s["belirsiz"]) == 2


def test_cakisan_buro_kodu_eslestirilmez():
    s = ie.eslestir([{"id": U1, "buroKodu": "2099-008", "status": "active"}], _env())
    assert s["eslesen"] == [] and "birden çok klasörde" in s["belirsiz"][0]["neden"]


def _plan(kalkan=None, icra=None, detaylar=None, davalar=None):
    s = ie.eslestir(davalar or _davalar(), _env())
    return ie.plan_kur(s, detaylar or {}, kalkan or {}, icra or {}, BUGUN), s


def test_plan_dava_bilgisi_yalniz_bos_alanlar_ve_gecmis_durusma_yok():
    plan, _ = _plan()
    u1 = [i for i in plan["items"] if i["case_ref"]["id"] == U1]
    case = next(i for i in u1 if i["kind"] == "case_upsert")
    assert case["payload"] == {"buro_kodu": "2099-001"}  # esas no / mahkeme zaten dolu
    assert case["external_ref"] == ie.uyap_ref("Bakırköy 3. İş Mahkemesi", "2099/10")
    durusma = [i for i in u1 if i["kind"] == "hearing_upsert"]
    assert [d["payload"]["hearing_date"] for d in durusma] == ["2099-04-02T10:30:00+03:00"]
    assert all(sema.oge_dogrula(i) == [] for i in plan["items"])


def test_plan_sure_yalniz_kalkandan_kaynak_yoksa_oneri_yok():
    plan, _ = _plan()
    assert not [i for i in plan["items"] if i["kind"] == "deadline_upsert"]
    r = next(r for r in plan["dosyalar"] if r["case_id"] == U1)
    assert any(x.startswith("süre: Süre Kalkanı kaydı yok") for x in r["kaynak_yok"])
    assert any("Karar" in x for x in r["notlar"])  # süre doğurabilecek olay gösterilir, tarih uydurulmaz


def test_plan_kalkan_kesin_ve_kosullu_satir():
    kalkan = {"2099-001": [
        {"satir_id": "2099-001:istinaf", "islem": "İstinaf başvurusu", "durum": "aktif", "hukuki_son_gun": "2099-03-20",
         "kosullu_hesap": None},
        {"satir_id": "2099-001:cevap", "islem": "Cevap", "durum": "aktif", "hukuki_son_gun": None,
         "kosullu_hesap": {"tarih": "2099-03-25", "baslangic_durumu": "tebliğ teyitsiz"}},
        {"satir_id": "2099-001:eski", "islem": "Eski", "durum": "arşiv", "hukuki_son_gun": "2099-01-01"}]}
    plan, _ = _plan(kalkan=kalkan)
    sure = {i["external_ref"]: i["payload"] for i in plan["items"] if i["kind"] == "deadline_upsert"}
    assert set(sure) == {"kalkan:2099-001:istinaf", "kalkan:2099-001:cevap"}
    assert sure["kalkan:2099-001:istinaf"]["due_date"] == "2099-03-20"
    assert sure["kalkan:2099-001:cevap"]["conditional"] is True and "due_date" not in sure["kalkan:2099-001:cevap"]


def test_plan_icra_yalniz_degisen_anahtarlar():
    ref = ie.uyap_ref("İstanbul 20. İcra Dairesi", "2099/500")
    ozet = {"alacak": "1.000 TL", "itiraz": "yok", "arac": "", "borclu": "B", "klon": "/x", "birim": "İst"}
    detay = {U2: {"enforcement": {"data": {"alacak": "1.000 TL"}}, "hearings": [], "openDeadlines": []}}
    plan, _ = _plan(icra={ref: ozet}, detaylar=detay)
    icra = [i for i in plan["items"] if i["kind"] == "enforcement_upsert"]
    assert len(icra) == 1 and icra[0]["payload"]["data"] == {"itiraz": "yok", "borclu": "B"}
    assert icra[0]["source"] == "icra_ozet"


def test_plan_sonraki_adim_uyap_dikkat_olayindan_tarihsiz():
    plan, _ = _plan()
    adim = [i for i in plan["items"] if i["kind"] == "next_step"]
    assert len(adim) == 1 and adim[0]["case_ref"]["id"] == U1
    assert "check_date" not in adim[0]["payload"] and adim[0]["payload"]["waiting_for"].startswith("Karar")


def test_plan_kapali_dava_ve_cmk_isareti():
    d = [{"id": U1, "caseNumber": "2099/10", "courtName": "Bakırköy 3. İş Mahkemesi", "status": "closed"},
         {"id": U2, "caseNumber": "2099/161", "courtName": "Gaziosmanpaşa 5. Ağır Ceza", "status": "active",
          "isCmkAssignment": False}]
    plan, _ = _plan(davalar=d)
    assert all(i["case_ref"]["id"] != U1 for i in plan["items"])
    cmk = next(i for i in plan["items"] if i["case_ref"]["id"] == U2 and i["kind"] == "case_upsert")
    assert cmk["payload"]["is_cmk_assignment"] is True and cmk["payload"]["overwrite"] == ["is_cmk_assignment"]


def test_tr_iso_saat_dilimi_ve_yalniz_gun():
    assert ie.tr_iso("2099-04-02T07:30:00.000Z") == "2099-04-02T10:30:00+03:00"
    assert ie.tr_iso("2099-04-02 10:30") == "2099-04-02T10:30:00+03:00"
    assert ie.tr_iso("2099-04-02") is None  # saat bilinmiyor: uydurulmaz


def test_raporlar_sayilari_ve_kuru_ibaresini_yazar():
    plan, s = _plan()
    md = ie.md_plan(plan, s, BUGUN)
    assert "KURU ÇALIŞMA" in md and f"önerilecek öğe: **{len(plan['items'])}**" in md
    md2 = ie.md_eslesme(s, _env(), ["önbellek · icra: okunmadı"], BUGUN)
    assert "Eşleşen: **3**" in md2 and "Belirsiz: **1**" in md2 and "2099-008" in md2


class _SahteApi:
    def __init__(self):
        self.post = 0

    def saglik(self):
        return {}

    def cases(self, include_closed=False):
        return _davalar()

    def case(self, i):
        return {"hearings": [], "openDeadlines": [], "enforcement": None}

    def post_proposals(self, items, gonder=False):
        self.post += 1
        return []


def test_calistir_kuru_hic_gondermez(tmp_path, monkeypatch):
    monkeypatch.setattr(ie, "yerel_kaynaklar", lambda: (_env(), []))
    monkeypatch.setattr(ie, "kalkan_oku", lambda s, k: ({}, []))
    monkeypatch.setattr(ie, "icra_oku", lambda s, b: ({}, []))
    api = _SahteApi()
    ozet = ie.calistir("plan", tmp_path, api=api, bugun=BUGUN)
    assert api.post == 0 and ozet["eslesen"] == 3 and ozet["oge"] > 0
    veri = json.loads((tmp_path / "plan.json").read_text(encoding="utf-8"))
    assert veri["kuru"] is True and len(veri["items"]) == ozet["oge"]
    assert (tmp_path / "eslesme.md").exists() and (tmp_path / "plan.md").exists()
