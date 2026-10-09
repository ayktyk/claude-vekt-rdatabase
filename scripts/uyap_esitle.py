#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""uyap_esitle.py — UYAP dosyalarını Yargı PRO masaüstü uygulamasına YAVAŞ MODDA alır (büyük eşitleme).

Avukat talimatı (2026-10-09): "hepsini bir yerde topla ve büyük bir eşitleme yapalım" · "kısıtlı indirmeye uyarak
yavaşça indir, ban yemeyelim" · "uzun da sürse dikkatli yavaşça indir". Kural kaynağı: AGENTS.md -> "Yargı PRO
masaüstü komut satırı".

Yavaş mod kuralları:
- Aynı anda tek dosya; iki dosya arası 600-900 sn; günde en çok 8 dosya (sayım bu betiğin kaydından yapılır,
  aynı gün yeniden çalıştırmak kotayı aşmaz). 2026-10-09'da 15/gün hızında UYAP doğrulama (CAPTCHA) istedi.
- Uygulamanın kuyruğu veya arayüz işi doluyken yeni iş verilmez.
- Başarı dışındaki HER sonuçta (UYAP hatası, zaman aşımı, tanınmayan yanıt) o günkü çalışma durur; yalnız
  uygulamanın yerel girdi hatası (INVALID_INPUT) o dosyayı atlatır. UYAP doğrulama (CAPTCHA) isterse eşitleme
  KİLİTLENİR: avukat doğrulamayı uygulamada tamamlayıp açıkça onaylayana kadar (`devam --not`) başlamaz.
- `klonla` komutu iş bitince kendiliğinden dönmediği için iş, `isler` listesinden izlenir; iş bitip kuyruk boşalınca
  komut kapatılır.

Kullanım:
  python scripts/uyap_esitle.py plan               # adaylar ve bugünkü kalan kota (UYAP'a gitmez)
  python scripts/uyap_esitle.py calistir [--en-cok N]
  python scripts/uyap_esitle.py devam --not "<avukat onayı>"   # doğrulama kilidini açar
Kayıt: Aktif Davalar/00-uyap-esitleme-kaydi.jsonl
Adaylar: önbellekteki uygulamada olmayan hareketli dosyalar (önce icra, sonra hukuk ve ceza) + eski dava-cli klon
ağacı (Aktif Davalar/YargiPRO/Avukat UYAP). Uygulamada zaten olan dosya ve vatandaş portalı dosyası alınmaz.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
import subprocess
import sys
import time
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import uyap_ortak as uo  # noqa: E402
from paths import aktif_davalar, yargipro_cli  # noqa: E402

GUNLUK_DOSYA = 8
ARA_BEKLEME = (600, 900)
CAGRI_SURESI = 2700
KAYIT_ADI = "00-uyap-esitleme-kaydi.jsonl"
ONCELIK = {"İcra Dosyası": 0, "Hukuk Dava Dosyası": 1, "Ceza Dava Dosyası": 1, "Talimat Dosyası": 2}


def kayit_yolu() -> Path:
    return aktif_davalar() / KAYIT_ADI


def kayitlar(yol: Path | None = None) -> list[dict]:
    yol = yol or kayit_yolu()
    if not yol.exists():
        return []
    out = []
    for satir in yol.read_text(encoding="utf-8").splitlines():
        try:
            out.append(json.loads(satir))
        except ValueError:
            continue
    return out


def bugun_kalan(liste: list[dict], bugun: str, limit: int = GUNLUK_DOSYA) -> int:
    """Bugün kabul edilen klon sayısını kayıttan düşer; aynı gün tekrar çalıştırmak kotayı aşmaz."""
    yapilan = sum(1 for k in liste if k.get("kabul") and str(k.get("zaman", "")).startswith(bugun))
    return max(0, limit - yapilan)


def bugun_sinir_alindi_mi(liste: list[dict], bugun: str) -> bool:
    return any(k.get("sinir") and str(k.get("zaman", "")).startswith(bugun) for k in liste)


def kilitli_mi(liste: list[dict]) -> str:
    """Son kilit kaydından sonra avukatın 'devam' kaydı yoksa kilit nedeni döner (ör. UYAP_CAPTCHA)."""
    neden = ""
    for k in liste:
        if k.get("kilit"):
            neden = k["kilit"]
        if k.get("kilit_acildi"):
            neden = ""
    return neden


def anahtar(birim, no) -> tuple:
    return (uo.mahkeme_anahtar(birim), uo.dosya_no(no))


def adaylar(onbellek: dict, eski_klonlar: list[dict], gecmis: list[dict]) -> list[dict]:
    """Uygulamada olmayan dosyalar, öncelik sırasıyla; daha önce kabul edilenler ve tekrarlar çıkarılır."""
    yerel = {anahtar(d.get("birimAdi"), d.get("dosyaNo")) for d in (onbellek.get("dosyalarim") or {}).get("davalar", [])}
    alinmis = {anahtar(k.get("birim"), k.get("dosyaNo")) for k in gecmis if k.get("kabul")}
    sonuc, gorulen = [], set()
    hareketli = []
    for x in (onbellek.get("hareketler") or {}).get("hareketler", []):
        if not x.get("yerelde"):
            hareketli.append({"birim": x.get("birimAdi"), "dosyaNo": uo.dosya_no(x.get("dosyaNo")),
                              "tur": x.get("dosyaTuru", ""), "kaynak": "hareket"})
    hareketli.sort(key=lambda a: ONCELIK.get(a["tur"], 3))
    eski = [{"birim": e.get("mahkeme"), "dosyaNo": uo.dosya_no(e.get("esasNo")), "tur": e.get("tur", ""),
             "kaynak": "eski-klon"} for e in eski_klonlar if e.get("portal") != "vatandas"]
    for a in hareketli + eski:
        k = anahtar(a["birim"], a["dosyaNo"])
        if not a["birim"] or k in yerel or k in alinmis or k in gorulen:
            continue
        gorulen.add(k)
        sonuc.append(a)
    return sonuc


def eski_klonlar() -> list[dict]:
    kok = aktif_davalar() / "YargiPRO"
    out = []
    for p in kok.glob("*/**/uyap-project.json"):
        if p.relative_to(kok).parts[0] == "YargiPRO":
            continue
        try:
            j = json.loads(p.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            continue
        parca = p.relative_to(kok).parts
        out.append({"mahkeme": j.get("mahkeme"), "esasNo": j.get("esasNo"), "portal": j.get("portal"),
                    "tur": "Ceza Dava Dosyası" if len(parca) > 2 and parca[2] == "Ceza" else "Hukuk Dava Dosyası"})
    return out


def _uygulama_bos() -> bool:
    d, _ = uo.oku("durum")
    k, a = d.get("kuyruk") or {}, d.get("arayuzIsleri") or {}
    return (k.get("aktif", 0) + k.get("bekleyen", 0) + a.get("aktif", 0) + a.get("bekleyen", 0)) == 0


def _is_bul(birim, no):
    isler, _ = uo.oku("isler")
    for x in reversed(isler.get("isler", [])):
        ref = uo.caseref_coz(x.get("caseRef"))
        if x.get("tip") == "klonla" and ref.get("birimAdi") == birim and uo.dosya_no(ref.get("dosyaNo")) == uo.dosya_no(no):
            return x
    return None


def klonla(a: dict) -> tuple[dict, int]:
    """Komutu boş girdiyle başlatır; iş uygulamada bitip kuyruk boşalınca komutu kapatır."""
    kimlik = "klon-" + hashlib.sha1(f"{a['birim']}|{a['dosyaNo']}".encode("utf-8")).hexdigest()[:16]
    yol = str(yargipro_cli())
    surec = subprocess.Popen(["cmd", "/c", yol, "klonla", "--dosya-no", a["dosyaNo"], "--birim", a["birim"],
                              "--idempotency-key", kimlik], stdin=subprocess.DEVNULL,
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    bas = time.time()
    try:
        while time.time() - bas < CAGRI_SURESI:
            if surec.poll() is not None:
                metin = (surec.stdout.read() or b"").decode("utf-8", "replace").strip() or \
                        (surec.stderr.read() or b"").decode("utf-8", "replace").strip()
                try:
                    return json.loads(metin), surec.returncode
                except json.JSONDecodeError:
                    return {"_ham": metin[:300]}, surec.returncode
            time.sleep(20)
            is_ = _is_bul(a["birim"], a["dosyaNo"])
            if is_ and _uygulama_bos():
                yanit = {"is": is_.get("isId"), "durum": is_.get("durum"), "sure_sn": round(time.time() - bas)}
                if is_.get("hata"):
                    yanit["hata"] = is_["hata"]
                return yanit, 0 if is_.get("durum") == "hazir" else 1
        return {"_zaman_asimi": "çağrı süresi aşıldı; iş uygulamada sürüyor olabilir"}, -2
    finally:
        if surec.poll() is None:
            subprocess.run(["taskkill", "/PID", str(surec.pid), "/T", "/F"], capture_output=True)


def _kaydet(satir: dict) -> None:
    with kayit_yolu().open("a", encoding="utf-8") as f:
        f.write(json.dumps(satir, ensure_ascii=False) + "\n")


def calistir(en_cok: int | None = None) -> int:
    bugun = date.today().isoformat()
    gecmis = kayitlar()
    kilit = kilitli_mi(gecmis)
    if kilit:
        print(f"Eşitleme KİLİTLİ ({kilit}). Yargı PRO uygulamasındaki doğrulamayı avukat tamamlar ve açıkça onaylarsa: "
              "python scripts/uyap_esitle.py devam --not \"<avukat onayı>\"")
        return 0
    if bugun_sinir_alindi_mi(gecmis, bugun):
        print("Bugün UYAP sınır uyarısı veya hata alınmış; yeniden denenmez. Yarın devam.")
        return 0
    kalan = bugun_kalan(gecmis, bugun)
    if en_cok is not None:
        kalan = min(kalan, en_cok)
    liste = adaylar(uo.onbellek_oku(), eski_klonlar(), gecmis)
    print(f"Bugün kalan kota {kalan}; aday {len(liste)}", flush=True)
    yapilan = 0
    for a in liste:
        if yapilan >= kalan:
            break
        while not _uygulama_bos():
            time.sleep(60)
        yanit, kod = klonla(a)
        kabul = kod == 0 and isinstance(yanit, dict) and not ({"hata", "_ham", "_zaman_asimi"} & set(yanit))
        neden = "" if kabul else uo.durma_nedeni(yanit, kod)
        satir = {**a, "zaman": datetime.now().isoformat(timespec="seconds"), "kod": kod, "kabul": kabul,
                 "sinir": bool(neden), "yanit": yanit}
        if uo.kilit_gerekir_mi(neden):
            satir["kilit"] = neden
        _kaydet(satir)
        print(f"{datetime.now():%H:%M:%S} {'KABUL' if kabul else 'RED  '} {a['dosyaNo']:>12} {a['birim'][:44]}", flush=True)
        if neden:
            print(f"Eşitleme durdu ({neden}); bugün yeniden deneme yok"
                  + ("; avukat onayı olmadan yeniden başlamaz." if satir.get("kilit") else "."), flush=True)
            break
        yapilan += 1 if kabul else 0
        if yapilan < kalan:
            time.sleep(random.randint(*ARA_BEKLEME))
    print(f"Bitti: bu çalıştırmada kabul edilen {yapilan}", flush=True)
    return 0


def plan() -> int:
    bugun = date.today().isoformat()
    gecmis = kayitlar()
    liste = adaylar(uo.onbellek_oku(), eski_klonlar(), gecmis)
    print(f"Bugün kalan kota: {bugun_kalan(gecmis, bugun)} · bugün durdurma: {'VAR' if bugun_sinir_alindi_mi(gecmis, bugun) else 'yok'}"
          f" · kilit: {kilitli_mi(gecmis) or 'yok'}")
    print(f"Aday dosya: {len(liste)} (hareketli {sum(1 for a in liste if a['kaynak'] == 'hareket')}, "
          f"eski klon {sum(1 for a in liste if a['kaynak'] == 'eski-klon')})")
    print(f"Tahmini süre: günde {GUNLUK_DOSYA} dosyayla yaklaşık {-(-len(liste) // GUNLUK_DOSYA)} gün")
    return 0


def main(argv: list[str]) -> int:
    for akim in (sys.stdout, sys.stderr):
        try:
            akim.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    ap = argparse.ArgumentParser(prog="uyap_esitle.py")
    alt = ap.add_subparsers(dest="komut", required=True)
    alt.add_parser("plan")
    c = alt.add_parser("calistir")
    c.add_argument("--en-cok", type=int)
    d = alt.add_parser("devam")
    d.add_argument("--not", dest="not_", required=True)
    args = ap.parse_args(argv)
    try:
        if args.komut == "devam":
            if not args.not_.strip():
                raise ValueError("avukat onayı notu zorunlu")
            _kaydet({"zaman": datetime.now().isoformat(timespec="seconds"), "kilit_acildi": True, "not": args.not_.strip()})
            print("Kilit açıldı; sonraki çalıştırma yavaş modda başlar.")
            return 0
        return plan() if args.komut == "plan" else calistir(args.en_cok)
    except (OSError, ValueError, subprocess.SubprocessError) as hata:
        print(f"HATA: {hata}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
