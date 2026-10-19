"""isbu_mcp.py: okuma araçları süzer, öneri aracı varsayılan kuru çalışır ve ağa gitmez."""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
pytest.importorskip("mcp")
import isbu_mcp as im  # noqa: E402

ID = "11111111-2222-3333-4444-555555555555"


class SahteApi:
    def __init__(self):
        self.gonderilen = []

    def cases(self, include_closed=False):
        return [{"id": ID, "buroKodu": "2099-016", "title": "Şaşmaz Tüketici", "clientName": "İBRAHİM ŞAŞMAZ",
                 "courtName": "İstanbul 10. Tüketici Mahkemesi", "caseNumber": "2099/619", "workspace": {"x": 1}},
                {"id": "x", "buroKodu": "2099-050", "title": "İşçilik", "clientName": "MUSTAFA"}]

    def pulse(self):
        return [{"id": ID, "flags": ["atil"]}, {"id": "x", "flags": []}]

    def post_proposals(self, items, gonder=False):
        self.gonderilen += items
        return [{"http": 200, "accepted": len(items)}]


@pytest.fixture()
def sahte(monkeypatch):
    s = SahteApi()
    monkeypatch.setattr(im, "_api", s)
    return s


def test_dava_aramasi_turkce_buyuk_kucuk_harf_duyarsiz_ve_kisa_alanli(sahte):
    sonuc = im.isbu_davalar("şaşmaz")
    assert sonuc["toplam"] == 1 and sonuc["davalar"][0]["buroKodu"] == "2099-016"
    assert "workspace" not in sonuc["davalar"][0]
    assert im.isbu_davalar("2099-050")["toplam"] == 1


def test_nabiz_varsayilan_yalniz_uyarili(sahte):
    assert im.isbu_nabiz()["toplam"] == 1 and im.isbu_nabiz(False)["toplam"] == 2


def test_oneri_varsayilan_kuru_calisir_gonder_ile_kuyruga_gider(sahte):
    a = dict(tur="diary_add", external_ref="test:1", dava_id=ID, payload={"content": "UYAP: bilirkişi raporu geldi"},
             ozet="Bilirkişi raporu", gerekce="UYAP hareketi")
    kuru = im.isbu_oneri(**a)
    assert kuru["kuru_calisma"] and kuru["oneri"]["kind"] == "diary_add" and not sahte.gonderilen
    assert im.isbu_oneri(**a, gonder=True)["gonderildi"][0]["accepted"] == 1 and len(sahte.gonderilen) == 1
    assert "hata" in im.isbu_oneri("yok_tur", "t", ID, {}, "o", "g")
