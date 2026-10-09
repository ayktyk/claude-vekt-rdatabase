#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""excel_takip.py — VEGA_HUKUK_Is_Takibi.xlsx dosyasını UYAP önbelleğine göre günceller.

Avukat talimatı (2026-10-09): "en son yaptığımız bu exceli de buna göre güncelleyelim, CMK olanları katma".
Kurallar:
- Avukatın yazdığı hiçbir dolu hücre değiştirilmez; yalnız boş hücre doldurulur. Önce yedek alınır
  (`<ad>_eski_<YYYY-AA-GG>.xlsx`, o gün için bir kez).
- DOSYALAR: UYAP'ta etkin (son 30 günde hareketli veya uygulamada olan) ve listede olmayan dosya eklenir.
  CMK görevlendirmesi (eşleşme tablosunda "CMK", "zorunlu müdafi", "baro atama") eklenmez. Ceza dosyası yalnız
  büro klasörüne bağlıysa (eşleşme A/B) eklenir; değilse teyit listesine yazılır.
- Boş UYAP hücresine "Aykut" yazılır (uygulamanın UYAP oturumu); klasörü olup mahkeme / dosya no boş satır yalnız
  eşleşme tablosunun kesin (A) bölümünde tek karşılık varsa tamamlanır.
- Sonraki Duruşma: UYAP duruşma listesinden; hücre boşsa veya geçmiş tarihliyse yazılır. Excel'deki ileri tarih
  UYAP'takinden farklıysa değiştirilmez, raporda gösterilir.
- UYAP HAREKETLERİ sayfası her çalıştırmada yeniden yazılır (CMK ve teyit bekleyen ceza dosyaları hariç) ve en sona konur.
- Yazma Excel'in kendisiyle (COM, ayrı görünmez örnek) yapılır; açılır listeler ve koşullu biçimler korunur.

Kullanım:
  python scripts/excel_takip.py guncelle [--kuru] [--dosya <xlsx>]
"""
from __future__ import annotations

import argparse
import re
import shutil
import sys
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import uyap_ortak as uo  # noqa: E402
from paths import data_root  # noqa: E402

DOSYA_ADI = "VEGA_HUKUK_Is_Takibi.xlsx"
SAYFA = "DOSYALAR"
HAREKET_SAYFASI = "UYAP HAREKETLERİ"
ICRA_SAYFASI = "İCRA TAKİPLERİ"
ICRA_BASLIK = ("Klasör", "İcra Dairesi", "Dosya No", "Dosya Durumu", "Takip Türü", "Alacaklı", "Borçlu", "Rolümüz",
               "Alacak Toplamı", "Yapılmış Tahsilat", "Ödeme Emri / Tebliğ", "Borca İtiraz", "Kesinleşme", "Son İşlem",
               "Taşınmaz", "Araç", "Banka (89/1)", "SGK", "Fiili Haciz / Diğer", "Sorgu Önerisi", "Not")
UYAP_HESABI = "Aykut"
# DOSYALAR sütunları (1 tabanlı): A No · B Klasör · C Mahkeme · D Dosya No · E Müvekkil · F Karşı Taraf · G Konu ·
# H Durum · I Sorumlu · J UYAP · K Sonraki Duruşma · L Sonraki İşlem · M Hedef Tarih · N Not
S_KLASOR, S_MAHKEME, S_NO, S_MUV, S_KARSI, S_KONU, S_DURUM, S_UYAP, S_DURUSMA, S_NOT = 2, 3, 4, 5, 6, 7, 8, 10, 11, 14
KONU = {"İcra Dosyası": "İcra takibi", "Talimat Dosyası": "Talimat", "Ceza Dava Dosyası": "Ceza davası"}


def etkin_dosyalar(onbellek: dict) -> list[dict]:
    """Son 30 günde hareketli + uygulamada olan dosyalar; her biri için son anlamlı hareket."""
    etkin: dict = {}
    for x in (onbellek.get("hareketler") or {}).get("hareketler", []):
        k = (x.get("birimAdi"), uo.dosya_no(x.get("dosyaNo")))
        d = etkin.setdefault(k, {"birim": k[0], "no": k[1], "tur": x.get("dosyaTuru", ""), "son": None,
                                 "son_aciklama": "", "yerelde": bool(x.get("yerelde"))})
        t = uo.iso_tarih(x.get("tarih"))
        if t and x.get("aciklama") and (d["son"] is None or t > d["son"]):
            d["son"], d["son_aciklama"] = t, x["aciklama"]
    for x in (onbellek.get("dosyalarim") or {}).get("davalar", []):
        k = (x.get("birimAdi"), uo.dosya_no(x.get("dosyaNo")))
        birim = str(k[0] or "")
        tur = "Ceza Dava Dosyası" if "Ceza" in birim else ("İcra Dosyası" if "İcra Dairesi" in birim else "Hukuk Dava Dosyası")
        etkin.setdefault(k, {"birim": k[0], "no": k[1], "tur": tur, "son": None, "son_aciklama": "", "yerelde": True})
    return list(etkin.values())


def _ceza_mi(d: dict) -> bool:
    return str(d.get("tur", "")).startswith("Ceza") or "Ceza" in str(d.get("birim", ""))


def siniflandir(d: dict, eslesme: list[dict], cmk: list[dict] | None = None) -> str:
    """'cmk' | 'ceza-teyit' | 'ekle' — Excel'e girip girmeyeceği. cmk: avukatın CMK listesi (00-CMK-DOSYALARI.md)."""
    e = uo.eslesme_bul(eslesme, d["birim"], d["no"])
    if (e and e.get("cmk")) or uo.cmk_listede_mi(cmk or [], d["birim"], d["no"]):
        return "cmk"
    if _ceza_mi(d) and not (e and e.get("klasor")):
        return "ceza-teyit"
    return "ekle"


def plan_olustur(satirlar: dict, onbellek: dict, eslesme: list[dict], bugun: date, cmk: list[dict] | None = None) -> dict:
    """Excel'e dokunmadan yapılacak işlerin listesi. satirlar: {satır_no: [A..N değerleri]}."""
    dolu = [r for r, v in satirlar.items() if any(x not in (None, "") for x in v[1:])]
    plan = {"uyap_doldur": [], "tamamla": [], "ekle": [], "cmk": [], "ceza_teyit": [], "durusma": [],
            "durusma_farkli": [], "klasor_teyit": [], "son_dolu": max(dolu) if dolu else 1}
    # klasörü olup mahkeme / dosya no boş satırlar (yalnız eşleşme A, tek karşılık)
    for r in dolu:
        klasor, mah, no = satirlar[r][S_KLASOR - 1], satirlar[r][S_MAHKEME - 1], satirlar[r][S_NO - 1]
        if not klasor or (mah and no):
            continue
        adaylar = [e for e in eslesme if e["klasor"] == str(klasor)[:8]]
        kesin = [e for e in adaylar if e["bolum"] == "A"]
        ayni_klasor = [x for x in dolu if satirlar[x][S_KLASOR - 1] == klasor]
        if len(kesin) == 1 and len(ayni_klasor) == 1 and (not mah or uo.ayni_dosya(mah, kesin[0]["no"], kesin[0]["mahkeme"], kesin[0]["no"])):
            plan["tamamla"].append((r, None if mah else kesin[0]["mahkeme"], None if no else kesin[0]["no"]))
        elif adaylar:
            plan["klasor_teyit"].append(str(klasor))
    tamam = {r: (m, n) for r, m, n in plan["tamamla"]}

    def satir_bul(birim, no):
        for r in dolu:
            mah = satirlar[r][S_MAHKEME - 1] or (tamam.get(r) or (None, None))[0]
            dno = satirlar[r][S_NO - 1] or (tamam.get(r) or (None, None))[1]
            if mah and dno and uo.ayni_dosya(mah, dno, birim, no):
                return r
        return None

    for d in sorted(etkin_dosyalar(onbellek), key=lambda d: (d["tur"], str(d["birim"]), d["no"])):
        r = satir_bul(d["birim"], d["no"])
        if r:
            if satirlar[r][S_UYAP - 1] in (None, ""):
                plan["uyap_doldur"].append(r)
            continue
        sinif = siniflandir(d, eslesme, cmk)
        if sinif == "cmk":
            plan["cmk"].append(d)
        elif sinif == "ceza-teyit":
            plan["ceza_teyit"].append(d)
        else:
            e = uo.eslesme_bul(eslesme, d["birim"], d["no"]) or {}
            plan["ekle"].append({
                S_KLASOR: e.get("klasor", ""), S_MAHKEME: d["birim"], S_NO: d["no"],
                S_MUV: re.sub(r"\s*\(.*?\)\s*", " ", e.get("muvekkil", "")).strip(), S_KARSI: e.get("karsi", ""),
                S_KONU: KONU.get(d["tur"], "Hukuk davası"),
                S_DURUM: f"Son UYAP hareketi {d['son']:%d.%m.%Y}: {d['son_aciklama']}" if d["son"] else "",
                S_UYAP: UYAP_HESABI,
                S_NOT: f"UYAP'tan eklendi {bugun:%d.%m.%Y}; müvekkil ve konu teyit edilecek"})
    # duruşmalar: en yakın ileri tarih
    yakin: dict = {}
    for x in (onbellek.get("durusmalar") or {}).get("durusmalar", []):
        t = uo.tarih_saat(x.get("tarih"))
        if not t or t.date() < bugun:
            continue
        k = (x.get("birimAdi"), uo.dosya_no(x.get("dosyaNo")))
        if k not in yakin or t < yakin[k]:
            yakin[k] = t
    for (birim, no), t in yakin.items():
        r = satir_bul(birim, no)
        if not r:
            continue
        mevcut = satirlar[r][S_DURUSMA - 1]
        if mevcut in (None, "") or (isinstance(mevcut, datetime) and mevcut.date() < bugun):
            plan["durusma"].append((r, t))
        elif isinstance(mevcut, datetime) and mevcut.date() != t.date():
            plan["durusma_farkli"].append((r, mevcut, t))
    return plan


def hareket_satirlari(onbellek: dict, eslesme: list[dict], cmk: list[dict] | None = None) -> list[tuple]:
    out = []
    for x in sorted((onbellek.get("hareketler") or {}).get("hareketler", []), key=lambda x: str(x.get("tarih")), reverse=True):
        if not x.get("aciklama"):
            continue
        d = {"birim": x.get("birimAdi"), "no": uo.dosya_no(x.get("dosyaNo")), "tur": x.get("dosyaTuru", "")}
        if siniflandir(d, eslesme, cmk) != "ekle":
            continue
        e = uo.eslesme_bul(eslesme, d["birim"], d["no"]) or {}
        out.append((uo.iso_tarih(x.get("tarih")), d["birim"], d["no"], d["tur"], x.get("aciklama", ""),
                    uo.dikkat(x.get("aciklama")), e.get("klasor", ""), "Evet" if x.get("yerelde") else "Hayır"))
    return out


def icra_plani(satirlar: dict, ozetler: list[dict]) -> dict:
    """İcra özetlerinden DOSYALAR'a yazılacaklar: boş taraf hücresi ve yalnız sistemin eklediği satırın durumu."""
    dolu = [r for r, v in satirlar.items() if any(x not in (None, "") for x in v[1:])]
    plan = {"taraf": [], "durum": [], "klasor": {}}
    for o in ozetler:
        r = next((r for r in dolu if satirlar[r][S_MAHKEME - 1] and satirlar[r][S_NO - 1]
                  and uo.ayni_dosya(satirlar[r][S_MAHKEME - 1], satirlar[r][S_NO - 1], o["birim"], o["no"])), None)
        if not r:
            continue
        plan["klasor"][(o["birim"], o["no"])] = satirlar[r][S_KLASOR - 1] or ""
        muv = o["muvekkil"] if satirlar[r][S_MUV - 1] in (None, "") else None
        karsi = o["karsi_taraf"] if satirlar[r][S_KARSI - 1] in (None, "") else None
        if muv or karsi:
            plan["taraf"].append((r, muv, karsi))
        if str(satirlar[r][S_NOT - 1] or "").startswith("UYAP'tan eklendi") and o["son_islem"]:
            plan["durum"].append((r, f"{o['dosya_durumu'] or 'Durum bilinmiyor'}; son işlem {o['son_islem']}"
                                     + (f"; borca itiraz {o['itiraz']}" if o["itiraz"] != "yok" else "")))
    return plan


def icra_satirlari(ozetler: list[dict], klasorler: dict, bugun: date) -> list[tuple]:
    return [(klasorler.get((o["birim"], o["no"]), ""), o["birim"], o["no"], o["dosya_durumu"], o["takip_turu"],
             o["alacakli"], o["borclu"], o["rolumuz"], o["alacak"], o["tahsilat"], o["odeme_emri"], o["itiraz"],
             o["kesinlesme"], o["son_islem"], o["tasinmaz"], o["arac"], o["banka"], o["sgk"], o["fiili"],
             o["sorgu_onerisi"], o["not"]) for o in sorted(ozetler, key=lambda o: (str(o["birim"]), o["no"]))]


def _sayfa(wb, ad: str):
    """Sayfayı bulur ya da açar ve en sona alır.
    Dikkat: Excel'de Move() hedefsiz çağrılırsa sayfayı YENİ bir çalışma kitabına taşır (2026-10-09 hatası);
    bu yüzden yalnız 'önüne taşı' (Before) biçimi kullanılır: önce son sayfanın önüne, sonra son sayfa onun önüne."""
    adlar = [s.Name for s in wb.Worksheets]
    if ad in adlar:
        wb.Worksheets(ad).Cells.Clear()
    else:
        yeni = wb.Worksheets.Add()
        yeni.Name = ad
    try:
        if wb.Worksheets(wb.Worksheets.Count).Name != ad:
            wb.Worksheets(ad).Move(wb.Worksheets(wb.Worksheets.Count))
            wb.Worksheets(wb.Worksheets.Count).Move(wb.Worksheets(ad))
    except Exception:  # noqa: BLE001 — sayfa sırası kozmetiktir, güncellemeyi durdurmaz
        pass
    return wb.Worksheets(ad)


def uygula(yol: Path, kuru: bool = False) -> dict:
    import win32com.client as w

    import icra_ozet
    onbellek = uo.onbellek_oku()
    if not onbellek:
        print("UYAP önbelleği yok: yalnız icra özeti işlenir (`python scripts/uyap_takip.py oku` sonrası tam güncelleme).")
    ozetler = [icra_ozet.dosya_ozeti(k) for k in icra_ozet.icra_klonlari()]
    eslesme = uo.eslesme_satirlari()
    cmk = uo.cmk_listesi()
    bugun = date.today()
    yedek = yol.with_name(f"{yol.stem}_eski_{bugun.isoformat()}{yol.suffix}")
    if not kuru and not yedek.exists():
        shutil.copy2(yol, yedek)
    xl = w.DispatchEx("Excel.Application")
    xl.Visible, xl.DisplayAlerts = False, False
    try:
        wb = xl.Workbooks.Open(str(yol), 0, kuru)
        if not kuru and wb.ReadOnly:
            wb.Close(False)
            raise ValueError("Excel dosyası salt okunur açıldı (başka biri açık tutuyor olabilir); yazılmadı")
        ws = wb.Worksheets(SAYFA)
        veri = ws.Range("A1:N301").Value
        satirlar = {r: list(veri[r - 1]) for r in range(2, 302)}
        plan = plan_olustur(satirlar, onbellek, eslesme, bugun, cmk) if onbellek else \
            {"uyap_doldur": [], "tamamla": [], "ekle": [], "cmk": [], "ceza_teyit": [], "durusma": [],
             "durusma_farkli": [], "klasor_teyit": [], "son_dolu": 1}
        hsat = hareket_satirlari(onbellek, eslesme, cmk) if onbellek else []
        iplan = icra_plani(satirlar, ozetler)
        isat = icra_satirlari(ozetler, iplan["klasor"], bugun)
        if not kuru:
            for r in plan["uyap_doldur"]:
                ws.Cells(r, S_UYAP).Value = UYAP_HESABI
            for r, mah, no in plan["tamamla"]:
                if mah:
                    ws.Cells(r, S_MAHKEME).Value = mah
                if no:
                    ws.Cells(r, S_NO).Value = no
            r = plan["son_dolu"]
            for degerler in plan["ekle"]:
                r += 1
                for sutun, deger in degerler.items():
                    if deger:
                        ws.Cells(r, sutun).Value = deger
            for satir, muv, karsi in iplan["taraf"]:
                if muv:
                    ws.Cells(satir, S_MUV).Value = muv
                if karsi:
                    ws.Cells(satir, S_KARSI).Value = karsi
            for satir, durum in iplan["durum"]:
                ws.Cells(satir, S_DURUM).Value = durum
            if isat:
                ish = _sayfa(wb, ICRA_SAYFASI)
                son = len(isat) + 1
                ish.Range(ish.Cells(1, 1), ish.Cells(1, len(ICRA_BASLIK))).Value = (ICRA_BASLIK,)
                ish.Range(ish.Cells(2, 1), ish.Cells(son, len(ICRA_BASLIK))).Value = isat
                ish.Range(ish.Cells(1, 1), ish.Cells(1, len(ICRA_BASLIK))).Font.Bold = True
                ish.Range(ish.Cells(1, 1), ish.Cells(son, len(ICRA_BASLIK))).AutoFilter(1)
                ish.Columns.AutoFit()
                for sutun in range(1, len(ICRA_BASLIK) + 1):
                    if ish.Columns(sutun).ColumnWidth > 45:
                        ish.Columns(sutun).ColumnWidth = 45
                ish.Range(ish.Cells(2, 1), ish.Cells(son, len(ICRA_BASLIK))).WrapText = True
                ish.Cells(son + 2, 1).Value = (
                    "Kaynak: Yargı PRO uygulamasına alınmış icra dosyalarının evrakı (UYAP'a yeni sorgu yapılmadı). "
                    "'Sorgu evrakı yok' mal varlığı yok demek değildir; 6 aydan eski sorgu işaretlenir; okunamayan evrak açılıp okunmalıdır.")
            if not onbellek:
                wb.Worksheets(SAYFA).Activate()
                wb.Save()
                wb.Close(False)
                plan.update(hareket_satiri=0, icra_satiri=len(isat), icra_taraf=len(iplan["taraf"]), icra_durum=len(iplan["durum"]))
                return plan
            guncel = ws.Range("A1:N301").Value
            plan_durusma = plan_olustur({k: list(guncel[k - 1]) for k in range(2, 302)}, onbellek, eslesme, bugun, cmk)["durusma"]
            for satir, t in plan_durusma:
                ws.Cells(satir, S_DURUSMA).Value = t
            sh = _sayfa(wb, HAREKET_SAYFASI)
            baslik = ("Tarih", "Mahkeme / Kurum", "Dosya No", "Dosya Türü", "UYAP Hareketi", "Dikkat", "Klasör", "Uygulamada")
            sh.Range("A1:H1").Value = (baslik,)
            if hsat:
                sh.Range(f"A2:H{len(hsat) + 1}").Value = hsat
                sh.Range(f"A2:A{len(hsat) + 1}").NumberFormat = "dd.mm.yyyy"
            sh.Range("A1:H1").Font.Bold = True
            sh.Range("J1").Value = (f"Kaynak: Yargı PRO masaüstü uygulaması, son 30 gün UYAP hareketleri; önbellek "
                                    f"{onbellek.get('tarih')}. CMK ve teyit bekleyen ceza dosyaları hariç.")
            sh.Range(f"A1:H{max(len(hsat), 1) + 1}").AutoFilter(1)
            sh.Columns("A:H").AutoFit()
            if sh.Columns("E").ColumnWidth > 60:
                sh.Columns("E").ColumnWidth = 60
            wb.Worksheets(SAYFA).Activate()
            wb.Save()
        wb.Close(False)
    finally:
        xl.Quit()
    plan.update(hareket_satiri=len(hsat), icra_satiri=len(isat), icra_taraf=len(iplan["taraf"]), icra_durum=len(iplan["durum"]))
    return plan


def ozet(plan: dict, kuru: bool) -> str:
    ad = lambda d: f"{d['birim']} {d['no']}"  # noqa: E731
    return "\n".join([
        f"{'KURU — yazılmadı' if kuru else 'YAZILDI'}: eklenen {len(plan['ekle'])}, UYAP hücresi {len(plan['uyap_doldur'])}, "
        f"mahkeme/no tamamlanan {len(plan['tamamla'])}, duruşma {len(plan['durusma'])}, hareket satırı {plan.get('hareket_satiri', 0)}",
        f"İCRA: sayfa satırı {plan.get('icra_satiri', 0)}, taraf yazılan satır {plan.get('icra_taraf', 0)}, durum güncellenen {plan.get('icra_durum', 0)}",
        f"CMK (eklenmedi): {[ad(d) for d in plan['cmk']]}",
        f"Ceza, teyit bekliyor (eklenmedi): {[ad(d) for d in plan['ceza_teyit']]}",
        f"Eşleşmesi teyit isteyen klasör: {sorted(set(plan['klasor_teyit']))}",
        f"Excel'deki duruşma tarihi UYAP'tan farklı (değiştirilmedi): "
        f"{[(r, f'{m:%d.%m.%Y}', f'{t:%d.%m.%Y}') for r, m, t in plan['durusma_farkli']]}",
    ])


def main(argv: list[str]) -> int:
    for akim in (sys.stdout, sys.stderr):
        try:
            akim.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    ap = argparse.ArgumentParser(prog="excel_takip.py")
    alt = ap.add_subparsers(dest="komut", required=True)
    g = alt.add_parser("guncelle")
    g.add_argument("--kuru", action="store_true")
    g.add_argument("--dosya", default="")
    args = ap.parse_args(argv)
    yol = Path(args.dosya) if args.dosya else data_root() / DOSYA_ADI
    try:
        print(ozet(uygula(yol, args.kuru), args.kuru))
        return 0
    except (OSError, ValueError) as hata:
        print(f"HATA: {hata}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
