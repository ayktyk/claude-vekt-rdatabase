"""udf_ornek_ice_aktar.py testleri (stdlib unittest)."""
import json
import sys
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import udf_ornek_ice_aktar as u  # noqa: E402


ORNEK_METIN = """\
... SULH HUKUK MAHKEMESİ'NE


DAVACI		: ... (TC NO: ...)
VEKİLİ 		: Avukat ...
DAVALI 		: ...

KONU 		: Kira bedelinin tespiti istemidir.

HARCA ESAS DEĞER	: ... TL.

AÇIKLAMALAR 	:

1.	Müvekkil ile davalı arasında kira sözleşmesi imzalanmıştır.

HUKUKİ NEDENLER 	: 6098 sayılı Kanun m. 344/3, 345.

HUKUKİ DELİLLER 	: Kira sözleşmesi, emsal rayiç.

SONUÇ VE TALEP 	: Yukarıda açıklanan nedenlerle; kira bedelinin NET 25.000,00 TL olarak tespitine, yargılama giderleri ile vekalet ücretinin davalıya yükletilmesine karar verilmesini vekaleten arz ve talep ederiz.
"""


def _udf_yaz(yol: Path, metin: str) -> None:
    icerik = f"<template><content><![CDATA[{metin}]]></content></template>"
    with zipfile.ZipFile(yol, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("content.xml", icerik.encode("utf-8"))


class SlugTest(unittest.TestCase):
    def test_turkce_ve_mojibake_temizlenir(self):
        self.assertEqual(u.slugify("kira-icra-13îrnek-itiraziniptali-dava.udf"),
                         "kira-icra-13irnek-itiraziniptali-dava")
        self.assertEqual(u.slugify("tasinmaz-tapuiptaltescil-onalçm.udf"),
                         "tasinmaz-tapuiptaltescil-onalcm")

    def test_ascii_disi_kalmaz(self):
        s = u.slugify("miras-tenkis-Çekişmeli-dava.udf")
        self.assertTrue(all(ord(c) < 128 for c in s), s)
        self.assertNotIn("--", s)


class TarafTest(unittest.TestCase):
    def test_dava_cevap_yok(self):
        self.assertEqual(u.taraf_turet("is-iseiade-dava.udf"), "dava")
        self.assertEqual(u.taraf_turet("kira-tahliye-10yil-cevap.udf"), "cevap")
        self.assertIsNone(u.taraf_turet("tasinmaz-muhdesatinaidiyeti.udf"))


class TurAltkonuTest(unittest.TestCase):
    def test_ilk_token_tur_orta_altkonu(self):
        slug = "kira-kirabedelininbelirlenmesi-kiratespit-dava"
        tur, alt = u.tur_ve_altkonu(slug, "dava")
        self.assertEqual(tur, "kira")
        self.assertEqual(alt, "kirabedelininbelirlenmesi-kiratespit")

    def test_taraf_altkonudan_dusulur(self):
        tur, alt = u.tur_ve_altkonu("is-iseiade-dava", "dava")
        self.assertEqual(tur, "is")
        self.assertEqual(alt, "iseiade")


class CikarimTest(unittest.TestCase):
    def setUp(self):
        import tempfile
        td = tempfile.TemporaryDirectory()
        self.addCleanup(td.cleanup)
        self.tmp = Path(td.name)
        self.kaynak = self.tmp / "kaynak"
        self.hedef = self.tmp / "hedef"
        self.kaynak.mkdir()
        _udf_yaz(self.kaynak / "kira-kirabedelininbelirlenmesi-kiratespit-dava.udf",
                 ORNEK_METIN)

    def test_konu_ve_sonuc_dogru_ayiklanir(self):
        kayit = u.bir_dosya_isle(
            self.kaynak / "kira-kirabedelininbelirlenmesi-kiratespit-dava.udf",
            self._hedef_hazir(),
        )
        self.assertEqual(kayit["konu"], "Kira bedelinin tespiti istemidir.")
        self.assertIn("NET 25.000,00 TL", kayit["sonuc_talep_ozet"])
        self.assertIn("vekalet ücreti", kayit["sonuc_talep_ozet"])
        self.assertIn("SULH HUKUK", kayit["mahkeme"])

    def test_md_ve_udf_yazilir(self):
        u.bir_dosya_isle(
            self.kaynak / "kira-kirabedelininbelirlenmesi-kiratespit-dava.udf",
            self._hedef_hazir(),
        )
        md = self.hedef / "kira-kirabedelininbelirlenmesi-kiratespit-dava.md"
        udf = self.hedef / "kira-kirabedelininbelirlenmesi-kiratespit-dava.udf"
        self.assertTrue(md.exists())
        self.assertTrue(udf.exists())
        icerik = md.read_text(encoding="utf-8")
        self.assertIn('dava_turu: "kira"', icerik)
        self.assertIn("ISKELET/FORM", icerik)
        self.assertIn("SONUC_VE_TALEP", icerik)  # bolumler listesi

    def test_indeks_butunlugu_ve_idempotent(self):
        i1 = u.calistir(self.kaynak, self._hedef_hazir(), "2026-09-04")
        self.assertEqual(i1["toplam"], 1)
        self.assertIn("kira", i1["turler"])
        # ikinci calistirma ayni index.json'u uretmeli
        onceki = (self.hedef / "index.json").read_text(encoding="utf-8")
        u.calistir(self.kaynak, self.hedef, "2026-09-04")
        sonraki = (self.hedef / "index.json").read_text(encoding="utf-8")
        self.assertEqual(onceki, sonraki)
        veri = json.loads(sonraki)
        self.assertEqual(veri["turler"]["kira"][0]["taraf"], "dava")

    def _hedef_hazir(self) -> Path:
        self.hedef.mkdir(exist_ok=True)
        return self.hedef


if __name__ == "__main__":
    unittest.main()
