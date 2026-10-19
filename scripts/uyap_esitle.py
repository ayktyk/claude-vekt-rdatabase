#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""uyap_esitle.py — UYAP dosyalarını Yargı PRO masaüstü uygulamasına YAVAŞ MODDA alır (büyük eşitleme).

Avukat talimatı (2026-10-09): "hepsini bir yerde topla ve büyük bir eşitleme yapalım" · "kısıtlı indirmeye uyarak
yavaşça indir, ban yemeyelim" · "uzun da sürse dikkatli yavaşça indir". Kural kaynağı: AGENTS.md -> "Yargı PRO
masaüstü komut satırı".

Yavaş mod kuralları:
- Aynı anda tek dosya; iki dosya arası 1200-1800 sn; günde en çok 4 dosya (sayım bu betiğin kaydından yapılır,
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
ağacı (2026-10-12'den beri Aktif Davalar/0ESKİ/YargiPRO-eski-agac-2026-10-12). Sıra (avukat talimatı 2026-10-10 "az evrak olan dosyalardan başla"):
evrak sayısı eski klondan bilinenler azdan çoğa, bilinmeyenler sonda. Ağır ceza dosyaları şimdilik atlanır
(avukat talimatı 2026-10-11). Uygulamada zaten olan dosya ve vatandaş portalı dosyası alınmaz.
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

GUNLUK_DOSYA = 8  # avukat talimatı 2026-10-12: "günde 8 dosya olsun"; yeni indirme ve güncelleme ortak sayılır
ESKI_AGAC = Path("0ESKİ") / "YargiPRO-eski-agac-2026-10-12"
ANAYASA_TAVANI = 8  # AGENTS.md "günde en çok 8 dosya"; --gunluk-tavan bunu aşamaz
ARA_BEKLEME = (1200, 1800)
CAGRI_SURESI = 2700
KAYIT_ADI = "00-uyap-esitleme-kaydi.jsonl"
CIKTI_ADI = "00-uyap-surekli-cikti.txt"
ONCELIK = {"İcra Dosyası": 0, "Hukuk Dava Dosyası": 1, "Ceza Dava Dosyası": 1, "Talimat Dosyası": 2}
# Avukat talimatı 2026-10-11: "ağır ceza dosyalarını şimdilik atla". Kaldırılınca yeniden aday olurlar.
ATLANAN_MAHKEME_TURLERI = frozenset({"agir ceza"})
# Avukat talimatı 2026-10-12: "arabuluculuk dosyalarına gerek yok", "icraları indirelim", aşağıdaki dosyalar inmesin.
ATLANAN_BIRIM_KELIMELERI = ("arabulucu",)
ATLANAN_DOSYALAR = (("Çerkezköy İcra Dairesi", "2026/19216"),  # itiraz edildi, takip durdu
                    ("Bakırköy 34. İş Mahkemesi", "2024/242"),
                    ("İstanbul Anadolu 14. İcra Dairesi", "2019/3112"),
                    ("İstanbul 13. İcra Dairesi", "2023/23334"))  # vatandaş portalından inmiş klonu diskte
# Avukat talimatı 2026-10-11 yalnız hukuk dosyalarını almıştı; 2026-10-12'de icra da açıldı. None: bütün türler.
ALINAN_DOSYA_TURLERI: frozenset | None = None
# Avukat talimatı 2026-10-13: "vatandaş uyaba gerek yok onu çıkar sıradan" — yalnız avukat portalı güncellenir.
ALINAN_PORTALLAR = ("avukat",)
KAPALI_DURUMLAR = ("Karara Çıkmış", "Kapalı")  # güncelleme yalnız hareket varsa; yeni indirmede sona
TAZE_GUN = 30  # hareketsiz açık dosya bu kadar gün içinde eşitlendiyse yeniden eşitlenmez
UYGULAMA_LISTESI = Path("YargiPRO") / "dosyalarim.json"


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


def atlanir_mi(birim, no) -> bool:
    """Avukatın indirilmesin dediği dosyalar: ağır ceza, arabuluculuk ve tek tek sayılanlar."""
    if uo.mahkeme_anahtar(birim)[1] in ATLANAN_MAHKEME_TURLERI:
        return True
    if any(k in uo.tr(birim) for k in ATLANAN_BIRIM_KELIMELERI):
        return True
    return any(uo.ayni_dosya(birim, no, m, n) for m, n in ATLANAN_DOSYALAR)


def adaylar(onbellek: dict, eski_klonlar: list[dict], gecmis: list[dict], diskte: list[dict] | None = None,
            uygulama_listesi: list[dict] | None = None) -> list[dict]:
    """Uygulamada olmayan dosyalar, öncelik sırasıyla; daha önce kabul edilenler ve tekrarlar çıkarılır.
    `diskte`: uygulama ağacında klasörü bulunan klonlar (uyap_duzen toparla ile geri kopyalananlar dahil); önbellek
    eski kalsa bile bunlar yeniden indirilmez (2026-10-11). `uygulama_listesi`: uygulamanın `dosyalarim.json` kaydı;
    yerel yolu olanlar indirilmiş sayılır, olmayan avukat portalı dosyaları ilk sıradaki adaylardır (2026-10-12)."""
    liste = uygulama_listesi or []
    yerel = {anahtar(d.get("birimAdi"), d.get("dosyaNo")) for d in (onbellek.get("dosyalarim") or {}).get("davalar", [])
             if d.get("yerelde", True)}
    yerel |= {anahtar(d.get("mahkeme"), d.get("no")) for d in (diskte or [])}
    yerel |= {anahtar(d.get("birimAdi"), d.get("dosyaNo")) for d in liste if d.get("yerel")}
    alinmis = {anahtar(k.get("birim"), k.get("dosyaNo")) for k in gecmis if k.get("kabul")}
    sonuc, gorulen = [], set()
    listeden = [{"birim": d.get("birimAdi"), "dosyaNo": uo.dosya_no(d.get("dosyaNo")), "tur": d.get("dosyaTur", ""),
                 "kaynak": "uygulama-listesi", "son": str(d.get("dosyaDurum") or "").startswith(KAPALI_DURUMLAR)}
                for d in liste if not d.get("yerel") and d.get("portal") == "avukat"]
    hareketli = []
    for x in (onbellek.get("hareketler") or {}).get("hareketler", []):
        if not x.get("yerelde"):
            hareketli.append({"birim": x.get("birimAdi"), "dosyaNo": uo.dosya_no(x.get("dosyaNo")),
                              "tur": x.get("dosyaTuru", ""), "kaynak": "hareket"})
    hareketli.sort(key=lambda a: ONCELIK.get(a["tur"], 3))
    eski = [{"birim": e.get("mahkeme"), "dosyaNo": uo.dosya_no(e.get("esasNo")), "tur": e.get("tur", ""),
             "kaynak": "eski-klon", "evrak": e.get("evrak")} for e in eski_klonlar if e.get("portal") != "vatandas"]
    for a in listeden + hareketli + eski:
        if a["kaynak"] != "uygulama-listesi" and ALINAN_DOSYA_TURLERI is not None and a["tur"] not in ALINAN_DOSYA_TURLERI:
            continue
        k = anahtar(a["birim"], a["dosyaNo"])
        if not a["birim"] or k in yerel or k in alinmis or k in gorulen or atlanir_mi(a["birim"], a["dosyaNo"]):
            continue
        gorulen.add(k)
        sonuc.append(a)
    sonuc.sort(key=lambda a: (a.get("son", False), a.get("evrak") is None, a.get("evrak") or 0))
    return sonuc


def guncelleme_adaylari(yerel_liste: list[dict], kayit_listesi: list[dict], onbellek: dict, gecmis: list[dict],
                        simdi: datetime) -> list[dict]:
    """Uygulamadaki dosyalardan eşitlenmesi gerekenler (avukat onayı 2026-10-12: önce hiç inmeyenler, sonra güncelleme).
    `yerel_liste`: `dosyalarim` komut çıktısı (inmeyen evrak sayısıyla); `kayit_listesi`: `dosyalarim.json` (dosya
    durumu). Sıra: son eşitlemeden sonra hareket görenler (en yeni hareket önce), eksik evraklılar, sonra
    TAZE_GUN'den eski eşitlenen açık dosyalar en eskiden başlayarak. Karara çıkmış ve kapalı dosya yalnız hareketle
    alınır. Yalnız kalıcı işaretli eksik (UYAP'ta da açılmayan evrak) eksik sayılmaz."""
    durum = {anahtar(d.get("birimAdi"), d.get("dosyaNo")): str(d.get("dosyaDurum") or "") for d in kayit_listesi}
    son_hareket: dict = {}
    for kume in ("hareketler", "gelen"):
        for x in (onbellek.get(kume) or {}).get("hareketler", []):
            k, t = anahtar(x.get("birimAdi"), x.get("dosyaNo")), uo.tarih_saat(x.get("tarih"))
            if t and (k not in son_hareket or t > son_hareket[k]):
                son_hareket[k] = t
    bu_betik = {}
    for g in gecmis:
        if g.get("islem") == "esitle" and g.get("kabul"):
            bu_betik[anahtar(g.get("birim"), g.get("dosyaNo"))] = uo.tarih_saat(g.get("zaman"))
    out = []
    for d in yerel_liste:
        birim, no = d.get("birimAdi"), uo.dosya_no(d.get("dosyaNo"))
        if not d.get("yerelde") or not birim or d.get("portal") not in ALINAN_PORTALLAR or atlanir_mi(birim, no):
            continue
        k = anahtar(birim, no)
        tarihler = [t for t in (uo.tarih_saat(d.get("sonEsitlemeAt") or d.get("klonlanmaAt")), bu_betik.get(k)) if t]
        son = max(tarihler) if tarihler else None
        hareketli = k in son_hareket and (son is None or son_hareket[k] > son)
        inmeyen = d.get("inmeyen") or {}
        eksik = (d.get("inmeyenSayisi") or 0) - (inmeyen.get("kalici") or 0)
        if durum.get(k, "").startswith(KAPALI_DURUMLAR) and not hareketli:
            continue
        if not hareketli and eksik <= 0 and son and (simdi - son).days < TAZE_GUN:
            continue
        if not hareketli and bu_betik.get(k) and (simdi - bu_betik[k]).days < TAZE_GUN:
            continue  # UYAP'ın vermediği evrak yüzünden aynı dosya her gün kotayı yemesin
        sira = 0 if hareketli else 1 if eksik > 0 else 2
        out.append({"islem": "esitle", "birim": birim, "dosyaNo": no, "portal": d.get("portal"),
                    "caseRef": d.get("caseRef"), "kaynak": ("hareket", "eksik", "eski-esitleme")[sira], "sira": sira,
                    "sonEsitleme": son.isoformat(timespec="seconds") if son else "", "eksik": max(eksik, 0),
                    "hareket": son_hareket[k].isoformat(timespec="seconds") if hareketli else ""})
    out.sort(key=lambda a: (a["sira"], "" if a["sira"] else _ters(a["hareket"]), a["sonEsitleme"]))
    return out


def _ters(metin: str) -> str:
    """Metni ters sıralanacak hale getirir (en yeni hareket önce)."""
    return "".join(chr(0x10FFFF - ord(c)) for c in metin)


def uygulama_diski() -> list[dict]:
    """Aktif Davalar'ın her yerindeki klonlar (uygulama ağacı + ağaç dışına düşmüş olanlar). Ağaç dışındakiler
    `uyap_duzen.py toparla` ile kopyalanır; UYAP'tan yeniden indirilmez (2026-10-11)."""
    import uyap_duzen
    return [uyap_duzen.bilgi(y) for y in uyap_duzen.klonlar(aktif_davalar())]


def eski_klonlar() -> list[dict]:
    """Ağustos dava-cli ağacı; 2026-10-12'de arşive taşındı (klonların hepsi uygulama ağacında da var)."""
    kok = aktif_davalar() / ESKI_AGAC
    out = []
    for p in kok.glob("*/**/uyap-project.json"):
        try:
            j = json.loads(p.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            continue
        parca = p.relative_to(kok).parts
        out.append({"mahkeme": j.get("mahkeme"), "esasNo": j.get("esasNo"), "portal": j.get("portal"),
                    "evrak": len(j.get("evraklar") or []),
                    "tur": "Ceza Dava Dosyası" if len(parca) > 2 and parca[2] == "Ceza" else "Hukuk Dava Dosyası"})
    return out


def _uygulama_bos() -> bool:
    d, _ = uo.oku("durum")
    if d.get("avukat") != "active":  # oturum açılmadan iş verilmez (APP_GONE dersi, 2026-10-10)
        return False
    k, a = d.get("kuyruk") or {}, d.get("arayuzIsleri") or {}
    return (k.get("aktif", 0) + k.get("bekleyen", 0) + a.get("aktif", 0) + a.get("bekleyen", 0)) == 0


def _is_kimlikleri() -> set:
    isler, _ = uo.oku("isler")
    return {x.get("isId") for x in isler.get("isler", [])}


def _is_bul(birim, no, tip="klonla", haric: set | frozenset = frozenset()):
    """Bu dosya için açılmış en son iş; `haric` komuttan önce var olan işlerdir (eski iş sonuç sayılmaz)."""
    isler, _ = uo.oku("isler")
    for x in reversed(isler.get("isler", [])):
        ref = uo.caseref_coz(x.get("caseRef"))
        if x.get("tip") == tip and ref.get("birimAdi") == birim and uo.dosya_no(ref.get("dosyaNo")) == uo.dosya_no(no)                 and x.get("isId") not in haric:
            return x
    return None


def klonla(a: dict) -> tuple[dict, int]:
    """Komutu boş girdiyle başlatır; iş uygulamada bitip kuyruk boşalınca komutu kapatır. Güncelleme adayında
    (`islem` = esitle) uygulamanın `esitle <caseRef>` komutu aynı biçimde çalışır."""
    esitle = a.get("islem") == "esitle"
    tip = "esitle" if esitle else "klonla"
    kimlik = ("esit-" if esitle else "klon-") + hashlib.sha1(
        f"{a['birim']}|{a['dosyaNo']}|{date.today() if esitle else ''}".encode("utf-8")).hexdigest()[:16]
    yol = str(yargipro_cli())
    hedef = [a["caseRef"]] if esitle else ["--dosya-no", a["dosyaNo"], "--birim", a["birim"]]
    onceki = _is_kimlikleri()
    surec = subprocess.Popen(["cmd", "/c", yol, tip, *hedef, "--idempotency-key", kimlik], stdin=subprocess.DEVNULL,
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
            is_ = _is_bul(a["birim"], a["dosyaNo"], tip, onceki)
            if is_ and is_.get("durum") in ("hazir", "hata", "iptal") and _uygulama_bos():
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


def son_deneme(gecmis: list[dict]) -> datetime | None:
    """UYAP'a giden son denemenin zamanı (kabul ya da ret); 20-30 dk ara çalıştırmalar arasında da korunur."""
    zamanlar = [uo.tarih_saat(k.get("zaman")) for k in gecmis if "yanit" in k]
    zamanlar = [z for z in zamanlar if z]
    return max(zamanlar) if zamanlar else None


def denenmis_gecersizleri_cikar(liste: list[dict], gecmis: list[dict]) -> list[dict]:
    """Uygulamanın girdi hatası (INVALID_INPUT) verdiği dosya her gün yeniden denenmez; avukata raporlanır."""
    gecersiz = {anahtar(k.get("birim"), k.get("dosyaNo")) for k in gecmis
                if uo.hata_kodu(k.get("yanit") or {}) in uo.YEREL_HATA_KODLARI}
    return [a for a in liste if anahtar(a["birim"], a["dosyaNo"]) not in gecersiz]


def _ara_bekle(son: datetime | None) -> None:
    if son is None:
        return
    hedef = random.randint(*ARA_BEKLEME)
    kalan = hedef - (datetime.now() - son).total_seconds()
    if kalan > 0:
        print(f"{datetime.now():%d.%m %H:%M} sonraki dosya için {round(kalan / 60)} dk bekleniyor", flush=True)
        time.sleep(kalan)


def uygulama_listesi() -> list[dict]:
    """Uygulamanın kendi dosya kaydı (`Aktif Davalar/YargiPRO/dosyalarim.json`): durum ve yerel yol buradadır."""
    try:
        return json.loads((aktif_davalar() / UYGULAMA_LISTESI).read_text(encoding="utf-8")).get("davalar", [])
    except (OSError, ValueError):
        return []


def tum_adaylar(gecmis: list[dict]) -> tuple[list[dict], list[dict]]:
    """(yeni indirilecekler, güncellenecekler). Sıra avukat onayıyla (2026-10-12): önce hiç inmeyenler."""
    onbellek, kayit = uo.onbellek_oku(), uygulama_listesi()
    yeni = adaylar(onbellek, eski_klonlar(), gecmis, uygulama_diski(), kayit)
    yerel, _ = uo.oku("dosyalarim")
    return yeni, guncelleme_adaylari(yerel.get("davalar", []), kayit, onbellek, gecmis, datetime.now())


def _portal_acik(portal) -> bool:
    d, _ = uo.oku("durum")
    return d.get(portal or "avukat") == "active"


def calistir(en_cok: int | None = None, gunluk_tavan: int = GUNLUK_DOSYA) -> str:
    """Bugünkü kotayı işler. Dönüş: kilit | durdu | hazir-degil | kota | bitti (aday kalmadı)."""
    bugun = date.today().isoformat()
    gecmis = kayitlar()
    kilit = kilitli_mi(gecmis)
    if kilit:
        print(f"Eşitleme KİLİTLİ ({kilit}). Yargı PRO uygulamasındaki doğrulamayı avukat tamamlar ve açıkça onaylarsa: "
              "python scripts/uyap_esitle.py devam --not \"<avukat onayı>\"", flush=True)
        return "kilit"
    if bugun_sinir_alindi_mi(gecmis, bugun):
        print("Bugün UYAP sınır uyarısı veya hata alınmış; yeniden denenmez.", flush=True)
        return "durdu"
    kalan = bugun_kalan(gecmis, bugun, min(gunluk_tavan, ANAYASA_TAVANI))
    if en_cok is not None:
        kalan = min(kalan, en_cok)
    yeni, guncel = tum_adaylar(gecmis)
    liste = denenmis_gecersizleri_cikar(yeni + guncel, gecmis)
    son = son_deneme(gecmis)
    print(f"{datetime.now():%d.%m %H:%M} Bugün kalan kota {kalan}; yeni indirme {len(yeni)}, güncelleme {len(guncel)}",
          flush=True)
    if not liste:
        return "bitti"
    yapilan, atlanan_portal, kota_doldu = 0, 0, False
    for a in liste:
        if yapilan >= kalan:
            kota_doldu = True
            break
        bekleme = 0
        while not _uygulama_bos():
            bekleme += 1
            if bekleme > 30:
                print("Uygulama 30 dakikadır hazır değil (oturum yok veya kuyruk dolu); bu çalıştırma bitti.", flush=True)
                return "hazir-degil"
            time.sleep(60)
        if a.get("islem") == "esitle" and a.get("portal") != "avukat" and not _portal_acik(a.get("portal")):
            atlanan_portal += 1  # vatandaş oturumu kapalı: o dosya oturum açılınca alınır
            continue
        _ara_bekle(son)
        try:
            yanit, kod = klonla(a)
        except (OSError, ValueError, TypeError, subprocess.SubprocessError) as hata:  # iş uygulamada açılmış olabilir
            yanit, kod = {"_istisna": f"{type(hata).__name__}: {hata}"[:300]}, -3
        son = datetime.now()
        neden = uo.durma_nedeni(yanit, kod) if "_istisna" not in yanit else "betik istisnası"
        kabul = kod == 0 and not neden
        satir = {**a, "zaman": datetime.now().isoformat(timespec="seconds"), "kod": kod, "kabul": kabul,
                 "sinir": bool(neden), "yanit": yanit}
        if uo.kilit_gerekir_mi(neden):
            satir["kilit"] = neden
        _kaydet(satir)
        etiket = "GÜNCEL" if a.get("islem") == "esitle" else "YENİ  "
        print(f"{datetime.now():%d.%m %H:%M:%S} {'KABUL' if kabul else 'RED  '} {etiket} {a['dosyaNo']:>12} "
              f"{a['birim'][:44]}", flush=True)
        if neden:
            print(f"Eşitleme durdu ({neden}); bugün yeniden deneme yok"
                  + ("; avukat onayı olmadan yeniden başlamaz." if satir.get("kilit") else "."), flush=True)
            return "kilit" if satir.get("kilit") else "durdu"
        yapilan += 1 if kabul else 0
    if atlanan_portal:
        print(f"Vatandaş oturumu kapalı olduğu için atlanan dosya: {atlanan_portal}", flush=True)
    print(f"Bitti: bu çalıştırmada kabul edilen {yapilan}", flush=True)
    return "kota" if kota_doldu or yapilan else "bitti"


def dava_klasorlerine_aktar() -> None:
    """Gün sonunda yeni ve güncellenen evrak dava klasörlerinin UYAP/ kopyasına alınır (yerel, UYAP'a gitmez)."""
    betik = Path(__file__).resolve().parent / "uyap_duzen.py"
    for komut in ("bagla", "kopyala"):
        r = subprocess.run([sys.executable, str(betik), komut, "--uygula"], capture_output=True, text=True,
                           encoding="utf-8", errors="replace")
        satirlar = (r.stdout or r.stderr or "").strip().splitlines() or ["(çıktı yok)"]
        print(f"uyap_duzen {komut}: {satirlar[-1]}", flush=True)


def sonraki_baslangic(simdi: datetime, saat: int, dakika: int) -> datetime:
    """İlk gelen başlangıç saati: gece yarısından sonra biten çalışma aynı günün sabahında sürer, bir gün atlanmaz."""
    aday = simdi.replace(hour=saat, minute=dakika, second=0, microsecond=0)
    return aday if aday > simdi else datetime.combine(date.fromordinal(simdi.toordinal() + 1), aday.time())


def surekli(gunluk_tavan: int = GUNLUK_DOSYA, baslangic_saati: int = 9) -> int:
    """Avukat talimatı 2026-10-12: "sorunsuz sürelere kısıtlara uyarak devam ediyorsa ... bitirelim beklemeden".
    Her gün kotayı işler, gün sonunda dava klasörlerine aktarır, ertesi gün devam eder; durma veya kilitte biter."""
    while True:
        durum = calistir(gunluk_tavan=gunluk_tavan)
        dava_klasorlerine_aktar()
        if durum in ("kilit", "durdu", "hazir-degil"):
            print(f"Sürekli eşitleme durdu ({durum}). Sorun giderilince yeniden başlatılır.", flush=True)
            return 1
        if durum == "bitti":
            print("Aday kalmadı: dosyalar indirildi ve güncel (vatandaş oturumu gerektirenler ve girdi hatası "
                  "alanlar hariç; bunlar plan çıktısında görünür).", flush=True)
            return 0
        yarin = sonraki_baslangic(datetime.now(), baslangic_saati, random.randint(0, 40))
        print(f"Günlük kota doldu; sonraki çalıştırma {yarin:%d.%m.%Y %H:%M}", flush=True)
        time.sleep(max(60, (yarin - datetime.now()).total_seconds()))


def plan() -> int:
    bugun = date.today().isoformat()
    gecmis = kayitlar()
    yeni, guncel = tum_adaylar(gecmis)
    kalan = bugun_kalan(gecmis, bugun)
    print(f"Bugün kalan kota: {kalan} · bugün durdurma: {'VAR' if bugun_sinir_alindi_mi(gecmis, bugun) else 'yok'}"
          f" · kilit: {kilitli_mi(gecmis) or 'yok'}")
    print(f"Yeni indirilecek: {len(yeni)}")
    for a in yeni:
        print(f"  {a['dosyaNo']:>12} {a['birim']}" + (" (karara çıkmış)" if a.get("son") else ""))
    sayim = {k: sum(1 for a in guncel if a["kaynak"] == k) for k in ("hareket", "eksik", "eski-esitleme")}
    print(f"Güncellenecek: {len(guncel)} (son eşitlemeden sonra hareketli {sayim['hareket']}, eksik evraklı "
          f"{sayim['eksik']}, {TAZE_GUN} günden eski eşitlenen {sayim['eski-esitleme']}; vatandaş portalı "
          f"{sum(1 for a in guncel if a.get('portal') != 'avukat')})")
    for a in guncel[:15]:
        print(f"  {a['kaynak']:<13} {a['dosyaNo']:>12} {a['birim'][:50]}" + (f" eksik {a['eksik']}" if a["eksik"] else ""))
    toplam = len(yeni) + len(guncel)
    gun = (1 if kalan else 0) + -(-max(0, toplam - kalan) // GUNLUK_DOSYA)
    print(f"Tahmini süre: günde {GUNLUK_DOSYA} dosyayla yaklaşık {gun} gün")
    return 0


class _Ikiz:
    """Çıktıyı hem konsola hem UTF-8 dosyaya yazar; konsol/boru kopsa bile dosya yazımı sürer (2026-10-13 dersi:
    PowerShell Tee borusu koptuğunda betik print'te sessizce düştü)."""

    def __init__(self, konsol, dosya):
        self.konsol, self.dosya = konsol, dosya

    def write(self, metin):
        self.dosya.write(metin)
        self.dosya.flush()
        try:
            self.konsol.write(metin)
            self.konsol.flush()
        except (OSError, ValueError):
            pass
        return len(metin)

    def flush(self):
        self.dosya.flush()
        try:
            self.konsol.flush()
        except (OSError, ValueError):
            pass


def _surekli_guvenli(gunluk_tavan: int) -> int:
    """surekli'yi kendi UTF-8 çıktı dosyasıyla çalıştırır; beklenmeyen istisnanın tam metni dosyaya yazılır."""
    import traceback
    dosya = (aktif_davalar() / CIKTI_ADI).open("a", encoding="utf-8")
    sys.stdout, sys.stderr = _Ikiz(sys.stdout, dosya), _Ikiz(sys.stderr, dosya)
    print(f"--- {datetime.now():%d.%m.%Y %H:%M} sürekli eşitleme başladı", flush=True)
    try:
        return surekli(gunluk_tavan)
    except BaseException:
        print(f"BETİK DURDU {datetime.now():%d.%m %H:%M}:\n{traceback.format_exc()}", flush=True)
        raise


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
    c.add_argument("--gunluk-tavan", type=int, default=GUNLUK_DOSYA,
                   help=f"yalnız avukatın o günkü açık talimatıyla; en çok {ANAYASA_TAVANI}")
    su = alt.add_parser("surekli", help="her gün kotayı işler; aday bitene ya da bir durma olana kadar sürer")
    su.add_argument("--gunluk-tavan", type=int, default=GUNLUK_DOSYA)
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
        if args.komut == "plan":
            return plan()
        if args.komut == "surekli":
            return _surekli_guvenli(args.gunluk_tavan)
        calistir(args.en_cok, args.gunluk_tavan)
        return 0
    except (OSError, ValueError, subprocess.SubprocessError) as hata:
        print(f"HATA: {hata}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
