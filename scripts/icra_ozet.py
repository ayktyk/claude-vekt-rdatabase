#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""icra_ozet.py — Yargı PRO uygulamasına alınmış icra dosyalarından taraf, son durum ve mal varlığı bulgusu çıkarır.

UYAP'a GİTMEZ: yalnız klon klasöründeki dosya-bilgileri.md, safahat.md, uyap-project.json ve evrakın metin karşılığı
okunur. Avukat talimatı (2026-10-09): "icra takiplerinde tarafları, son durumu, borçlunun sorgularında mal varlığı
çıktı mı, onu da yaz".
Sınır: Yargı PRO komut satırında borçlu sorgusu (TAKBİS, EGM, SGK, banka) yapan komut yoktur; sistem yeni sorgu
yapmaz. Bulgu yalnız dosyaya kaydedilmiş sorgu ve cevap evrakından gelir. "Sorgu evrakı yok" ile "mal varlığı yok"
aynı şey değildir; her bulgu evrak türü ve tarihiyle yazılır, okunamayan evrak "belirsiz" kalır.

Kullanım:
  python scripts/icra_ozet.py [--json]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import uyap_ortak as uo  # noqa: E402
from paths import aktif_davalar  # noqa: E402

BURO_VEKILI = "YEŞİLKAYA"
ESKI_GUN = 180
KATEGORILER = {
    "tasinmaz": r"Taşınmaz Bilgisi|Takbis|TAKBİS|Taşınmaz Sahiplik|Taşınmaz Şerh",
    "arac": r"Taşıt|Araç|EGM",
    "banka": r"89/1 Haciz İhbarnamesi Cevab|Bankadan Gelen Cevap",
    "sgk": r"SGK Bilgi|SGK Sorgu|İşveren Cevab",
    "fiili": r"Haciz Tutanağı|Kıymet Takdiri(?! Talebi)|Satış Bedeli|İhtiyati Haciz Kararı|Dosya Alacağı Haciz Bilgileri",
}
# OCR toleransı: taranmış cevaplarda "rastlanılmamıştır" sıkça "aastlanılmamlştlr" gibi ilk harfi bozuk okunur
YOK_RE = re.compile(r"r?astlan\w*ma(m|d)|bulunma(ma|mis|di)|ulasilama|kaydi (yok|bulunama)|kaydina r?astlan\w*ma"
                    r"|mal varligi kaydina ulasilama|hesab\w* (yok|bulunma)")
# Olumlu: haczin/blokenin İŞLENDİĞİ (fiil kökünden hemen sonra olumlu ek; "işlenememiştir" eşleşmez).
# 2026-10-09 dersi: "tutarlar üzerine ... hacziniz işlenmiştir" önceki kalıpla tanınmıyordu ve olumsuz sayılıyordu.
VAR_BANKA_RE = re.compile(r"hac(i)?z\w*\s+(islemi\s+)?(islen|konul|uygulan|tesis edil|tatbik edil)(mis|mistir|mustur|di|dir)"
                          r"|bloke\s+(konul|edil|yapil)(mus|mis|mustur|mistir|du|di)|bloke(li)? tutar"
                          r"|takas mahsup haklarindan sonra hukum ifade etmek uzere|kesinti yapil(mis|di)|haczedil(mis|di)")
OLUMSUZ_FIIL_RE = re.compile(r"(konul|uygulan|yapil|tesis|islen|edil)ama")
# 89/1 ihbarnamesinin kendi metni ("borçlunun sizdeki alacağı üzerine ... haciz konulmuştur") cevabın içinde de geçer;
# bu kalıp bankanın cevabı sayılmaz.
IHBARNAME_RE = re.compile(r"sizdeki alaca|odeme yapmayiniz|bu ihbarname|ihbarnamenin teblig")
CEVAP_RE = re.compile(r"bankamiz|nezdinde|kurumumuz|sirketimiz|arastirma\w* yapil|kayitlarimiz")
PLAKA_RE = re.compile(r"\b\d{2}\s?[A-ZÇĞİÖŞÜ]{1,3}\s?\d{2,4}\b")


def _tarih(metin) -> date | None:
    s = str(metin or "").strip()
    for bicim, uzunluk in (("%d/%m/%Y", 10), ("%d.%m.%Y", 10), ("%Y-%m-%d", 10)):
        try:
            return datetime.strptime(s[:uzunluk], bicim).date()
        except ValueError:
            continue
    return None


def _tablo(metin: str, baslik_ilk: str) -> list[list[str]]:
    """'| A | B |' tablolarından, ilk hücresi baslik_ilk olan başlığın altındaki satırlar."""
    satirlar, icinde = [], False
    for s in metin.splitlines():
        if not s.startswith("|"):
            if icinde and satirlar:
                break
            continue
        h = [x.strip() for x in s.strip().strip("|").split("|")]
        if h and h[0] == baslik_ilk:
            icinde = True
            continue
        if icinde and not set("".join(h)) <= set("-: "):
            satirlar.append(h)
    return satirlar


def dosya_bilgileri(metin: str) -> dict:
    alanlar = {h[0]: h[1] for h in _tablo(metin, "Alan") if len(h) >= 2}
    taraflar = [{"rol": h[0], "ad": h[1], "tip": h[2] if len(h) > 2 else "", "vekil": h[3] if len(h) > 3 else ""}
                for h in _tablo(metin, "Rol") if len(h) >= 2]
    return {"alanlar": alanlar, "taraflar": taraflar}


def safahat(metin: str) -> list[dict]:
    out = []
    for h in _tablo(metin, "Tarih"):
        if len(h) >= 3 and _tarih(h[0]):
            out.append({"tarih": _tarih(h[0]), "islem": re.sub(r"\s+", " ", h[1]), "aciklama": re.sub(r"\s+", " ", h[2])})
    return out


def sinifla(kategori: str, metin: str) -> str:
    """'var' | 'yok' | 'belirsiz' (haciz şerhi ve fiili haciz evrakı 'var' sayılır)."""
    ham = re.sub(r"\s+", " ", metin or "")
    t = uo.tr(ham)
    if kategori == "tasinmaz":
        if "haciz tesisi islemi" in t and "yapilmistir" in t:
            return "var"
        if "mal varligi kaydina ulasilama" in t or "kayit bulunama" in t:
            return "yok"
        if (re.search(r"ada\s*/\s*parsel\s*:\s*\d", t) or " aktif yukarida yer alan" in t
                or re.search(r"katmulkiyeti|katirtifaki|bagimsizbolum|bagblmno", t)):
            return "var"
        return "yok" if YOK_RE.search(t) else "belirsiz"
    if kategori == "arac":
        if YOK_RE.search(t):
            return "yok"
        return "var" if (PLAKA_RE.search(ham) and ("marka" in t or "plaka" in t)) or "mahrumiyet eklen" in t else "belirsiz"
    if kategori == "banka":
        # haczin işlendiğini söyleyen ifade, aynı cevaptaki "diğer hesap bulunmamaktadır" türü olumsuzlardan önce gelir
        for m in VAR_BANKA_RE.finditer(t):
            if not IHBARNAME_RE.search(t[max(0, m.start() - 220):m.end() + 60]):
                return "var"
        if IHBARNAME_RE.search(t) and not CEVAP_RE.search(t):
            return "belirsiz"  # yalnız ihbarname metni: cevap okunamadı
        return "yok" if (YOK_RE.search(t) or OLUMSUZ_FIIL_RE.search(t)) else "belirsiz"
    if kategori == "sgk":
        if "kaydi tespit edil" in t or "sigorta sicil" in t:
            return "var"
        return "yok" if YOK_RE.search(t) else "belirsiz"
    return "var"


def _ozet_metni(kategori: str, bulgular: list[dict], bugun: date) -> str:
    if not bulgular:
        return "sorgu evrakı yok"
    bulgular = sorted(bulgular, key=lambda b: b["tarih"] or date.min)
    son = bulgular[-1]
    eski = son["tarih"] and (bugun - son["tarih"]).days > ESKI_GUN
    ek = " (6 aydan eski)" if eski else ""
    if kategori == "banka":
        say = {s: sum(1 for b in bulgular if b["sonuc"] == s) for s in ("var", "yok", "belirsiz")}
        return (f"{len(bulgular)} cevap: haciz işlendi {say['var']}, olumsuz {say['yok']}, okunamadı {say['belirsiz']}; "
                f"son {son['tarih']:%d.%m.%Y}{ek}")
    if kategori == "fiili":
        turler = sorted({b["tur"] for b in bulgular})
        return f"{len(bulgular)} evrak ({', '.join(turler)}); son {son['tarih']:%d.%m.%Y}"
    serh = [b for b in bulgular if "Şerh" in b["tur"] and b["sonuc"] == "var"]
    if serh:
        return f"VAR: haciz şerhi {serh[-1]['tarih']:%d.%m.%Y}; son sorgu {son['tarih']:%d.%m.%Y} ({son['sonuc']}){ek}"
    etiket = {"var": "VAR", "yok": "YOK", "belirsiz": "belirsiz"}[son["sonuc"]]
    return f"{etiket}: {son['tur']} {son['tarih']:%d.%m.%Y}{ek}" + (f" · toplam {len(bulgular)} evrak" if len(bulgular) > 1 else "")


def _oku(yol: Path) -> str:
    """Metin okur; Windows'ta 260 karakteri aşan yolda genişletilmiş önekle yeniden dener. Okunamazsa boş döner."""
    for aday in (str(yol), "\\\\?\\" + str(yol.resolve())):
        try:
            with open(aday, encoding="utf-8", errors="replace") as f:
                return f.read()
        except OSError:
            continue
    return ""


def evrak_metni(klon: Path, evrak: dict) -> str:
    """Evrakın metin karşılığı + varsa ek klasöründeki metinler (KEP zarfında asıl cevap ektedir).
    Metne çevrilememiş PDF gövdesi okunamaz sayılır."""
    md = klon / evrak["mdPath"] if evrak.get("mdPath") else None
    if not md:
        return ""
    parcalar = [_oku(md)]
    ekler = md.parent / (md.stem + "_ekler")
    if ekler.is_dir():
        parcalar += [_oku(x) for x in sorted(ekler.glob("*.md"))]
    return "\n".join(p for p in parcalar if not p.lstrip().startswith("%PDF"))


def dosya_ozeti(klon: Path, bugun: date | None = None) -> dict:
    bugun = bugun or date.today()
    proje = json.loads((klon / "uyap-project.json").read_text(encoding="utf-8"))
    bilgi = dosya_bilgileri((klon / "dosya-bilgileri.md").read_text(encoding="utf-8")) if (klon / "dosya-bilgileri.md").exists() \
        else {"alanlar": {}, "taraflar": []}
    saf = safahat((klon / "safahat.md").read_text(encoding="utf-8")) if (klon / "safahat.md").exists() else []
    evraklar = proje.get("evraklar") or []
    bulgular = {k: [] for k in KATEGORILER}
    itiraz, teblig = [], []
    for e in evraklar:
        tur, tarih = str(e.get("tur") or ""), _tarih(e.get("tarih"))
        if re.search(r"İtiraz Talebi|Borca İtiraz", tur):
            itiraz.append(tarih)
        if re.search(r"Tebliğ Mazbatası", tur):
            teblig.append(tarih)
        for kat, desen in KATEGORILER.items():
            if re.search(desen, tur) and not re.search(r"Talebi$|Talebi-|Yazısı$", tur):
                metin = evrak_metni(klon, e)
                bulgular[kat].append({"tur": tur[:45], "tarih": tarih, "sonuc": sinifla(kat, metin) if metin else "belirsiz"})
                break
    taraflar = bilgi["taraflar"]
    bizim = [t for t in taraflar if BURO_VEKILI in t.get("vekil", "").upper()]
    karsi = [t for t in taraflar if t not in bizim]
    son = max(saf, key=lambda s: s["tarih"]) if saf else None
    odeme = [s for s in saf if "tebli" in uo.tr(s["islem"] + " " + s["aciklama"]) and
             re.search(r"odeme|icra emri", uo.tr(s["islem"] + " " + s["aciklama"]))]
    kesin = [s for s in saf if "kesinle" in uo.tr(s["islem"] + " " + s["aciklama"])]
    eksik = proje.get("uyapEvrakSayisi") not in (None, len(evraklar))
    oneriler = []
    for kat, ad in (("tasinmaz", "tapu"), ("arac", "araç"), ("banka", "banka 89/1"), ("sgk", "SGK")):
        b = sorted(bulgular[kat], key=lambda x: x["tarih"] or date.min)
        if not b or (b[-1]["tarih"] and (bugun - b[-1]["tarih"]).days > ESKI_GUN):
            oneriler.append(ad)
    return {
        "birim": proje.get("mahkeme"), "no": uo.dosya_no(proje.get("esasNo")), "klon": str(klon),
        "dosya_durumu": bilgi["alanlar"].get("Dosya durumu", ""), "takip_turu": bilgi["alanlar"].get("Takibin türü", ""),
        "alacak": bilgi["alanlar"].get("Alacak toplamı", ""), "tahsilat": bilgi["alanlar"].get("Yapılmış tahsilat", ""),
        "alacakli": ", ".join(t["ad"] for t in taraflar if t["rol"].startswith("Alacak")),
        "borclu": ", ".join(t["ad"] for t in taraflar if t["rol"].startswith("Borç")),
        "rolumuz": ", ".join(sorted({t["rol"] for t in bizim})) + (" vekili" if bizim else ""),
        "muvekkil": ", ".join(t["ad"] for t in bizim), "karsi_taraf": ", ".join(t["ad"] for t in karsi),
        "odeme_emri": f"{odeme[0]['tarih']:%d.%m.%Y} {odeme[0]['islem']}" if odeme else
                      (f"son tebliğ mazbatası {max(d for d in teblig if d):%d.%m.%Y}" if any(teblig) else ""),
        "itiraz": ", ".join(f"{d:%d.%m.%Y}" for d in sorted(d for d in itiraz if d)) or "yok",
        "kesinlesme": f"{kesin[0]['tarih']:%d.%m.%Y}" if kesin else "",
        "son_islem": f"{son['tarih']:%d.%m.%Y} {son['islem']}" if son else "",
        **{kat: _ozet_metni(kat, bulgular[kat], bugun) for kat in KATEGORILER},
        "sorgu_onerisi": ("güncel sorgu evrakı yok: " + ", ".join(oneriler)) if oneriler else "",
        "not": (f"EKSİK KLON: {len(evraklar)}/{proje.get('uyapEvrakSayisi')} evrak indi; eşitleme kilidi açılınca tamamlanır"
                if eksik else ""),
    }


def icra_klonlari(kok: Path | None = None) -> list[Path]:
    kok = kok or aktif_davalar() / "YargiPRO"
    out = []
    for p in sorted(kok.rglob("uyap-project.json")):
        try:
            if json.loads(p.read_text(encoding="utf-8")).get("isIcra"):
                out.append(p.parent)
        except (ValueError, OSError):
            continue
    return out


def main(argv: list[str]) -> int:
    for akim in (sys.stdout, sys.stderr):
        try:
            akim.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    ap = argparse.ArgumentParser(prog="icra_ozet.py")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)
    ozetler = [dosya_ozeti(k) for k in icra_klonlari()]
    if args.json:
        print(json.dumps(ozetler, ensure_ascii=False, indent=1))
    else:
        for o in ozetler:
            print(f"{o['birim']} {o['no']} · {o['dosya_durumu']} · son: {o['son_islem']}\n"
                  f"  taşınmaz: {o['tasinmaz']} | araç: {o['arac']} | banka: {o['banka']} | SGK: {o['sgk']}"
                  + (f"\n  {o['not']}" if o["not"] else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
