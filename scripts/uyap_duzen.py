#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""uyap_duzen.py — Yargı PRO klasörü ile Aktif Davalar klasörünü birlikte tutar (UYAP'a hiç gitmez).

Avukat talimatı (2026-10-11): "kopyala yap bağlama da yap işi şansa bırakmayalım; bir davayla ilgili çalışırken
proje hem aktif davalardaki klasöre hem de Yargı PRO'daki ilgili klasöre bakmalı; taşıdığım birkaçını ve Yargı PRO
içindeki ikinci Yargı PRO klasörünü düzenle, tek Yargı PRO klasöründe her şey düzenli olsun."

Düzen:
- Uygulamanın ağacı (`Aktif Davalar/YargiPRO`, uygulama ayarı `downloadBaseDir` = Aktif Davalar + kendi alt klasörü) tek UYAP
  kaynağıdır; yalnız uygulama yazar. Uygulama bu ağaçtaki klonu klasörden tanır (2026-10-11 denemesi: geri kopyalanan
  klon "yerelde", eksik evrak 0, ilk indirme tarihi korunmuş) ve sonraki eşitlemede yalnız yeni evrakı indirir.
- `toparla`: ağaç dışına düşmüş klonları (dava klasörüne taşınanlar, eski dava-cli ağacı, iç içe YargiPRO kopyaları)
  uygulama ağacındaki yerine KOPYALAR. Hedef varsa dokunmaz. Kaynak silinmez.
- `bagla`: dava klasörü ↔ UYAP dosyası bağlarını `Aktif Davalar/00-UYAP-DAVA-BAGLARI.json`'a yazar. Kaynak: dava
  klasörünün içinde bulunan klonlar (avukatın kendi yerleştirmesi) + eşleşme tablosunun A (kesin) bölümü.
  B (orta güven) bölümü ve aynı kodu taşıyan iki klasör bağlanmaz; teyit listesine yazılır.
- `kopyala`: her bağ için uygulama ağacındaki klonu `<dava>/UYAP/<klon adı>/` altına tek yönlü kopyalar (yalnız yeni
  veya değişmiş dosya; silme yok). Dava klasöründe başka yerde duran aynı klon önce bu yere taşınır. Her davaya
  `00-UYAP-KAYNAK.md` yazılır: Yargı PRO yolu + kopya yolu. Klondaki AGENTS.md / CLAUDE.md kopyalanmaz.
Hepsi varsayılan olarak kuru çalışır; `--uygula` ile yapar. Kayıt: `Aktif Davalar/00-uyap-duzen-kaydi.jsonl`.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import uyap_ortak as uo  # noqa: E402
from paths import aktif_davalar  # noqa: E402

PORTAL_KOK = {"avukat": "Avukat UYAP", "vatandas": "Vatandaş UYAP"}
GRUPLAR = ("Hukuk", "Ceza", "İcra", "İdari", "Arabuluculuk", "Talimat")
ATLA_KLASOR = ("evraklar", "_kaynak", "ilgili-dosyalar")
KOPYALANMAZ = {"AGENTS.md", "CLAUDE.md"}
BAG_ADI = "00-UYAP-DAVA-BAGLARI.json"
TEYIT_ADI = "00-UYAP-TEYIT-KARARLARI.json"
KAYIT_ADI = "00-uyap-duzen-kaydi.jsonl"
KAYNAK_ADI = "00-UYAP-KAYNAK.md"
KOPYA_KLASORU = "UYAP"
PORTAL_EKI = {"vatandas": "vatandaş"}
DAVA_KODU = re.compile(r"^\d{4}-\d{3}")
UZUN_ONEK = "\\\\?\\"


def uygulama_koku(ad: Path) -> Path:
    """2026-10-12: iç içe YargiPRO kaldırıldı; uygulama ayarı `downloadBaseDir` = Aktif Davalar, uygulama kendi
    `YargiPRO` klasörünü açar."""
    return ad / "YargiPRO"


def _proje(yol: Path) -> dict:
    try:
        return json.loads((yol / "uyap-project.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def klonlar(kok: Path, haric: tuple[Path, ...] = ()) -> list[Path]:
    """uyap-project.json taşıyan klasörler; klonun içine ve hariç köklere inilmez."""
    out = []
    for dp, dn, fn in os.walk(kok):
        p = Path(dp)
        if any(p == h for h in haric):
            dn[:] = []
            continue
        if "uyap-project.json" in fn:
            out.append(p)
            dn[:] = []
            continue
        dn[:] = [d for d in dn if d not in ATLA_KLASOR]
    return out


def bilgi(yol: Path) -> dict:
    j = _proje(yol)
    portal = j.get("portal") or ("vatandas" if "Vatandaş UYAP" in yol.parts else "avukat")
    return {"yol": str(yol), "mahkeme": j.get("mahkeme") or "", "no": uo.dosya_no(j.get("esasNo")), "portal": portal,
            "evrak": len(j.get("evraklar") or []), "son": str(j.get("lastSyncedAt") or j.get("clonedAt") or "")}


def tur_haritasi(uygulama: Path, digerleri: list[Path]) -> dict:
    """Mahkeme türü anahtarı -> (grup, tür klasörü); uygulamanın kendi adlandırmasından öğrenilir."""
    harita = {}
    for y in klonlar(uygulama) + digerleri:
        parca = y.parts
        if "Avukat UYAP" not in parca:
            continue
        i = parca.index("Avukat UYAP")
        if len(parca) - i == 5 and parca[i + 2] in GRUPLAR:
            tur = uo.mahkeme_anahtar(_proje(y).get("mahkeme"))[1]
            if tur:
                harita.setdefault(tur, (parca[i + 2], parca[i + 3]))
    return harita


def yaprak_adi(ad: str, b: dict) -> str:
    """Uygulamanın adlandırması '<mahkeme> <yıl-no>[ - ( birleşen )]'; eski ağaçtaki 'Müvekkil - ' öneki atılır,
    adı mahkemeyle başlamayan klasöre (ör. 'DAVA DOSYASI EVRAKLARI') ad yeniden kurulur."""
    if b["mahkeme"] and b["mahkeme"] in ad:
        return ad[ad.index(b["mahkeme"]):]
    return f"{b['mahkeme']} {b['no'].replace('/', '-')}"


def anahtar(b: dict) -> tuple:
    a = uo.mahkeme_anahtar(b["mahkeme"])
    return a[0], a[1], tuple(sorted(a[2])), b["no"], b["portal"]


def hedef_yol(b: dict, uygulama: Path, harita: dict, avukat_hesabi: str) -> Path | None:
    """Klonun uygulama ağacındaki yeri; çıkarılamazsa None (rapora 'elle' diye düşer)."""
    parca = Path(b["yol"]).parts
    yaprak = yaprak_adi(parca[-1], b)
    for kok in PORTAL_KOK.values():
        if kok in parca:
            return uygulama.joinpath(*parca[parca.index(kok):-1], yaprak)
    if b["portal"] == "vatandas":
        for i in range(len(parca) - 2, 0, -1):
            if parca[i] in GRUPLAR:
                return uygulama.joinpath("Vatandaş UYAP", *parca[i - 1:-1], yaprak)
        return None
    tur = uo.mahkeme_anahtar(b["mahkeme"])[1]
    if tur not in harita or not b["mahkeme"] or not b["no"]:
        return None
    grup, tur_klasoru = harita[tur]
    return uygulama / "Avukat UYAP" / avukat_hesabi / grup / tur_klasoru / yaprak


def yarim_kalanlar(ad: Path) -> set[str]:
    """Kaydında başladığı yazılıp bittiği yazılmamış hedefler (kesilen çalıştırma); yeniden çalıştırmada eksikleri
    tamamlanır."""
    yol = ad / KAYIT_ADI
    acik: set[str] = set()
    if yol.exists():
        for satir in yol.read_text(encoding="utf-8").splitlines():
            try:
                k = json.loads(satir)
            except ValueError:
                continue
            if k.get("islem") == "toparla-basladi":
                acik.add(k.get("hedef", ""))
            elif k.get("islem") == "toparla":
                acik.discard(k.get("hedef", ""))
    return acik


def toparla_plani(ad: Path) -> dict:
    uygulama = uygulama_koku(ad)
    disarida = [y for y in klonlar(ad, haric=(uygulama,)) if KOPYA_KLASORU not in y.relative_to(ad).parts[1:2]]
    hesaplar = [p.name for p in (uygulama / "Avukat UYAP").iterdir() if p.is_dir()] if (uygulama / "Avukat UYAP").exists() else []
    harita = tur_haritasi(uygulama, disarida)
    adaylar: dict[str, list[dict]] = {}
    elle = []
    for y in disarida:
        b = bilgi(y)
        h = hedef_yol(b, uygulama, harita, hesaplar[0] if len(hesaplar) == 1 else "")
        if h is None or (b["portal"] == "avukat" and len(hesaplar) != 1 and "Avukat UYAP" not in y.parts):
            elle.append(b)
            continue
        adaylar.setdefault(str(h), []).append(b)
    uygulamada = {anahtar(bilgi(y)): y for y in klonlar(uygulama)}
    gruplar: dict[tuple, list[tuple[str, dict]]] = {}
    for h, kaynaklar in adaylar.items():
        for b in kaynaklar:
            gruplar.setdefault(anahtar(b), []).append((h, b))
    yarim = yarim_kalanlar(ad)
    kopya, mevcut = [], []
    for k, liste in sorted(gruplar.items(), key=lambda x: x[1][0][0]):
        h, en_iyi = max(liste, key=lambda x: (x[1]["son"], x[1]["evrak"]))
        if h in yarim:
            kopya.append({"hedef": h, "kaynak": en_iyi, "diger": len(liste) - 1, "yarim": True})
        elif k in uygulamada or Path(h).exists():
            mevcut.append({"hedef": str(uygulamada.get(k, h)), "kaynak": en_iyi, "diger": len(liste) - 1})
        else:
            kopya.append({"hedef": h, "kaynak": en_iyi, "diger": len(liste) - 1})
    return {"kopya": kopya, "mevcut": mevcut, "elle": elle}


def _kaydet(ad: Path, satir: dict) -> None:
    with (ad / KAYIT_ADI).open("a", encoding="utf-8") as f:
        f.write(json.dumps({"zaman": datetime.now().isoformat(timespec="seconds"), **satir}, ensure_ascii=False) + "\n")


def toparla(ad: Path, uygula: bool, en_cok: int | None = None) -> dict:
    """`en_cok`: bu çalıştırmada en çok kaç klon (avukat talimatı 2026-10-11: belleği yormamak için 20'şerli parça).
    Yarım kalanlar önce tamamlanır."""
    plan = toparla_plani(ad)
    sira = sorted(plan["kopya"], key=lambda k: not k.get("yarim"))
    for k in sira[:en_cok] if en_cok else sira:
        print(f"{'KOPYA' if uygula else 'kuru '} {k['kaynak']['evrak']:>4} evrak  {Path(k['hedef']).relative_to(ad)}"
              f"  <- {Path(k['kaynak']['yol']).relative_to(ad)}", flush=True)
        if uygula:
            _kaydet(ad, {"islem": "toparla-basladi", "kaynak": k["kaynak"]["yol"], "hedef": k["hedef"]})
            esitle_dosyalar(Path(k["kaynak"]["yol"]), Path(k["hedef"]), True, sadece_eksik=True, atla=frozenset())
            _kaydet(ad, {"islem": "toparla", "kaynak": k["kaynak"]["yol"], "hedef": k["hedef"]})
    yapilan = min(len(sira), en_cok) if en_cok else len(sira)
    print(f"\nBu parça {yapilan} · sonra kalan {len(sira) - (yapilan if uygula else 0)} · uygulamada zaten var {len(plan['mevcut'])} · elle bakılacak {len(plan['elle'])}")
    for b in plan["elle"]:
        print(f"  ELLE: {b['mahkeme']} {b['no']} ({b['portal']})  {Path(b['yol']).relative_to(ad)}")
    return plan


# --- bağlar ----------------------------------------------------------------------------------------------------

def dava_klasorleri(ad: Path) -> list[Path]:
    """Kökteki `2026-0xx …` klasörleri + `02CMK/CMK-<no> …` klasörleri (CMK dosyaları, avukat talimatı 2026-10-13)."""
    kok = sorted(p for p in ad.iterdir() if p.is_dir() and DAVA_KODU.match(p.name))
    cmk = ad / uo.CMK_KLASORU
    return kok + (sorted(p for p in cmk.iterdir() if p.is_dir() and uo.CMK_KODU.search(p.name)) if cmk.is_dir() else [])


def dava_anahtari(ad: Path, dava: Path) -> str:
    """Bağ anahtarı Aktif Davalar'a göreli yoldur; kök klasörde klasör adının kendisi."""
    return dava.relative_to(ad).as_posix()


def teyit_kararlari(ad: Path) -> list[dict]:
    yol = ad / TEYIT_ADI
    return json.loads(yol.read_text(encoding="utf-8"))["kararlar"] if yol.exists() else []


def _karar(kararlar: list[dict], e: dict) -> dict | None:
    return next((k for k in kararlar if k["klasor"] == e["klasor"]
                 and uo.ayni_dosya(k["mahkeme"], k["no"], e["mahkeme"], e["no"])), None)


def bag_plani(ad: Path, eslesme: list[dict] | None = None, kararlar: list[dict] | None = None) -> dict:
    """Teyit gereken satırlarda avukatın kararı (`00-UYAP-TEYIT-KARARLARI.json`) uygulanır: `evet` bağlanır (aynı kodu
    taşıyan iki klasörde `dava` alanı hangisi olduğunu söyler), `hayir` bir daha teyide çıkmaz."""
    kararlar = teyit_kararlari(ad) if kararlar is None else kararlar
    davalar = dava_klasorleri(ad)
    kod_say: dict[str, int] = {}
    for d in davalar:
        kod_say[uo.klasor_kodu(d.name)] = kod_say.get(uo.klasor_kodu(d.name), 0) + 1
    baglar: dict[str, list[dict]] = {}
    teyit, reddedilen = [], []

    def ekle(dava: str, mahkeme, no, portal, kaynak):
        liste = baglar.setdefault(dava, [])
        if not any(uo.ayni_dosya(mahkeme, no, x["mahkeme"], x["no"]) and x["portal"] == portal for x in liste):
            liste.append({"mahkeme": mahkeme, "no": uo.dosya_no(no), "portal": portal, "kaynak": kaynak})

    for d in davalar:
        for y in klonlar(d):
            b = bilgi(y)
            if b["mahkeme"] and b["no"]:
                ekle(dava_anahtari(ad, d), b["mahkeme"], b["no"], b["portal"], "dava klasöründe klon")
    for e in (uo.eslesme_satirlari() if eslesme is None else eslesme):
        if not e["klasor"]:
            continue
        adaylar = [d for d in davalar if uo.klasor_kodu(d.name) == e["klasor"]]
        if e["bolum"] != "A" or len(adaylar) != 1:
            k = _karar(kararlar, e)
            dava = k and (k.get("dava") or (dava_anahtari(ad, adaylar[0]) if len(adaylar) == 1 else None))
            if k and k["karar"] == "hayir":
                reddedilen.append(e)
            elif k and k["karar"] == "evet" and dava and (ad / dava).is_dir():
                ekle(dava, e["mahkeme"], e["no"], "avukat", "avukat teyidi")
            else:
                teyit.append({**e, "neden": "orta güven" if e["bolum"] != "A" else f"{len(adaylar)} klasör eşleşti"})
            continue
        ekle(dava_anahtari(ad, adaylar[0]), e["mahkeme"], e["no"], "avukat", "eşleşme tablosu A")
    return {"baglar": baglar, "teyit": teyit, "reddedilen": reddedilen}


def uygulama_dizini(ad: Path) -> list[dict]:
    return [bilgi(y) for y in klonlar(uygulama_koku(ad))]


def bag_kaynagi(bag: dict, dizin: list[dict]) -> dict | None:
    eslesen = [b for b in dizin if uo.ayni_dosya(bag["mahkeme"], bag["no"], b["mahkeme"], b["no"])]
    ayni_portal = [b for b in eslesen if b["portal"] == bag["portal"]]
    return (ayni_portal or eslesen or [None])[0]


def uzun(p) -> str:
    """Windows 260 karakter yol sınırını aşmak için genişletilmiş yol (2026-10-11: uygulama ağacı bir kat derin
    olduğundan uzun evrak adları sınırı aştı, kopya yarım kaldı)."""
    s = os.path.abspath(str(p))
    if os.name != "nt" or s.startswith(UZUN_ONEK):
        return s
    return UZUN_ONEK + "UNC" + s[1:] if s.startswith("\\\\") else UZUN_ONEK + s


def _degismis(kaynak: str, hedef: str, sadece_eksik: bool) -> bool:
    if not os.path.exists(hedef):
        return True
    if sadece_eksik:
        return False
    a, b = os.stat(kaynak), os.stat(hedef)
    return a.st_size != b.st_size or a.st_mtime > b.st_mtime + 2


def esitle_dosyalar(kaynak: Path, hedef: Path, uygula: bool, sadece_eksik: bool = False,
                    atla: frozenset | set = KOPYALANMAZ) -> int:
    """Tek yönlü kopya; silme yok. `sadece_eksik`: hedefte bulunan dosyaya hiç dokunulmaz (uygulama ağacı için)."""
    kok_k, kok_h = uzun(kaynak), uzun(hedef)
    sayi = 0
    for dp, _, fn in os.walk(kok_k):
        for f in fn:
            if f in atla:
                continue
            k = os.path.join(dp, f)
            h = os.path.join(kok_h, os.path.relpath(k, kok_k))
            if _degismis(k, h, sadece_eksik):
                sayi += 1
                if uygula:
                    os.makedirs(os.path.dirname(h), exist_ok=True)
                    shutil.copy2(k, h)
    return sayi


def kaynak_notu(dava: Path, satirlar: list[tuple[dict, dict | None]]) -> str:
    out = [f"# UYAP kaynakları — {dava.name}", "",
           "Bu dosyayı `scripts/uyap_duzen.py kopyala` yazar; elle düzenlenmez. Davayla çalışırken iki yer birlikte okunur:",
           "Yargı PRO klasörü (uygulamanın güncel kopyası, yalnız uygulama yazar) ve buradaki `UYAP/` kopyası.", "",
           "| Dosya | Portal | Yargı PRO klasörü | Dava klasöründeki kopya | Bağ kaynağı |", "|---|---|---|---|---|"]
    for bag, b, kopya_adi in satirlar:
        yol = b["yol"] if b else "YOK — uygulamada henüz indirilmemiş"
        kopya = f"{KOPYA_KLASORU}/{kopya_adi}" if b else "-"
        out.append(f"| {bag['mahkeme']} {bag['no']} | {bag['portal']} | `{yol}` | `{kopya}` | {bag['kaynak']} |")
    return "\n".join(out) + "\n"


def dava_icinde_klon(dava: Path, mahkeme, no, portal) -> Path | None:
    """Dava klasöründe UYAP/ dışında duran aynı klon (avukatın elle taşıdığı)."""
    for y in klonlar(dava):
        if y.relative_to(dava).parts[0] == KOPYA_KLASORU:
            continue
        b = bilgi(y)
        if b["portal"] == portal and uo.ayni_dosya(mahkeme, no, b["mahkeme"], b["no"]):
            return y
    return None


def kopya_adlari(eslesme: list[tuple[dict, dict | None]]) -> list[str | None]:
    """Aynı dosya iki portaldan (avukat + vatandaş) inmişse klasör adları çakışır; avukat dışındaki kopya portal
    ekiyle ayrılır (2026-10-12: 2026-008'de iki klon aynı UYAP/ klasörüne sırayla yazıyordu)."""
    adlar = [Path(b["yol"]).name if b else None for _, b in eslesme]
    sayac = Counter(a for a in adlar if a)
    return [a if not a or sayac[a] == 1 or b["portal"] in (None, "avukat") else f"{a} ({PORTAL_EKI.get(b['portal'], b['portal'])})"
            for a, (_, b) in zip(adlar, eslesme)]


def kopyala(ad: Path, uygula: bool, baglar: dict | None = None) -> dict:
    if baglar is None:
        yol = ad / BAG_ADI
        baglar = json.loads(yol.read_text(encoding="utf-8"))["baglar"] if yol.exists() else bag_plani(ad)["baglar"]
    dizin = uygulama_dizini(ad)
    ozet = {"dava": 0, "dosya": 0, "tasinan": 0, "eksik": []}
    for dava_adi, liste in sorted(baglar.items()):
        dava = ad / dava_adi
        if not dava.is_dir():
            continue
        eslesme = [(bag, bag_kaynagi(bag, dizin)) for bag in liste]
        satirlar = [(bag, b, a) for (bag, b), a in zip(eslesme, kopya_adlari(eslesme))]
        for bag, b, kopya_adi in satirlar:
            if not b:
                ozet["eksik"].append(f"{dava_adi}: {bag['mahkeme']} {bag['no']}")
                continue
            hedef = dava / KOPYA_KLASORU / kopya_adi
            if not hedef.exists():
                eski = dava_icinde_klon(dava, bag["mahkeme"], bag["no"], b["portal"])
                if eski:
                    print(f"{'TAŞI ' if uygula else 'kuru '} {dava_adi}: {eski.relative_to(dava)} -> {hedef.relative_to(dava)}")
                    ozet["tasinan"] += 1
                    if uygula:
                        os.makedirs(uzun(hedef.parent), exist_ok=True)
                        shutil.move(uzun(eski), uzun(hedef))
                        _kaydet(ad, {"islem": "dava-ici-tasima", "kaynak": str(eski), "hedef": str(hedef)})
            n = esitle_dosyalar(Path(b["yol"]), hedef, uygula)
            ozet["dosya"] += n
            if n:
                print(f"{'KOPYA' if uygula else 'kuru '} {dava_adi}: {Path(b['yol']).name} — {n} dosya")
        if uygula:
            (dava / KAYNAK_ADI).write_text(kaynak_notu(dava, satirlar), encoding="utf-8")
        ozet["dava"] += 1
    print(f"\nDava {ozet['dava']} · kopyalanacak/kopyalanan dosya {ozet['dosya']} · dava içinde yerine taşınan klon "
          f"{ozet['tasinan']} · uygulamada henüz olmayan bağ {len(ozet['eksik'])}")
    for e in ozet["eksik"]:
        print(f"  İNMEMİŞ: {e}")
    return ozet


def main(argv: list[str]) -> int:
    for akim in (sys.stdout, sys.stderr):
        try:
            akim.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    ap = argparse.ArgumentParser(prog="uyap_duzen.py")
    alt = ap.add_subparsers(dest="komut", required=True)
    for ad in ("toparla", "bagla", "kopyala"):
        alt.add_parser(ad).add_argument("--uygula", action="store_true")
    alt.choices["toparla"].add_argument("--en-cok", type=int)
    args = ap.parse_args(argv)
    ad = aktif_davalar()
    if args.komut == "toparla":
        toparla(ad, args.uygula, args.en_cok)
    elif args.komut == "bagla":
        plan = bag_plani(ad)
        for dava, liste in sorted(plan["baglar"].items()):
            print(f"{dava}: " + "; ".join(f"{b['mahkeme']} {b['no']} ({b['portal']}, {b['kaynak']})" for b in liste))
        print(f"\nBağlı dava {len(plan['baglar'])} · teyit bekleyen satır {len(plan['teyit'])}")
        for t in plan["teyit"]:
            print(f"  TEYİT: {t['klasor']} ↔ {t['mahkeme']} {t['no']} ({t['neden']})")
        if args.uygula:
            (ad / BAG_ADI).write_text(json.dumps({"guncelleme": datetime.now().isoformat(timespec="seconds"),
                                                  "baglar": plan["baglar"], "teyit": plan["teyit"],
                                                  "reddedilen": plan["reddedilen"]},
                                                 ensure_ascii=False, indent=1), encoding="utf-8")
            print(f"Yazıldı: {BAG_ADI}")
    else:
        kopyala(ad, args.uygula)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
