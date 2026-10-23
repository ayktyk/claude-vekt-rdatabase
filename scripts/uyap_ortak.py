#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""uyap_ortak.py — Yargı PRO masaüstü aracı ile UYAP takibinin ortak yardımcıları.

İçerik: masaüstü araç çağrısı (yalnız okuma listesi ayrı tutulur), günlük önbellek, mahkeme ve dosya numarası
eşleştirme, CMK görevlendirmesi tespiti, UYAP hareketi için "Dikkat" etiketi, eşleşme tablosu okuyucu.
Kural kaynağı: AGENTS.md -> "Beceri Haritası ve Büro İş Hatları" -> "Yargı PRO masaüstü komut satırı".
Canlı UYAP okuması günde bir kez yapılır; UYAP_ISLEM_SINIRLI alınan gün yeniden denenmez.
"""
from __future__ import annotations

import base64
import json
import re
import subprocess
import sys
import unicodedata
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from paths import aktif_davalar, yargipro_cli  # noqa: E402

OKUMA_KOMUTLARI = {"durum", "dosyalarim", "hareketler", "gelen-evraklar", "durusmalar", "icra", "isler", "is",
                   "evraklar", "safahat", "detay", "yol", "sorunlar", "iller", "daireler", "semasi", "yardim"}
SINIR_KODLARI = ("UYAP_ISLEM_SINIRLI", "UYAP_CAPTCHA", "CLONE_BUSY", "SAFAHAT_BUSY", "KUYRUK_DOLU", "BUTCE_ASILDI")
KILIT_KODLARI = ("UYAP_CAPTCHA",)  # insan doğrulaması: avukat açık onay vermeden toplu iş yeniden başlamaz
YEREL_HATA_KODLARI = ("INVALID_INPUT",)  # uygulamanın girdi denetimi; UYAP'a gitmez, yalnız o dosya atlanır
UYGULAMA_HAZIR_DEGIL_KODLARI = ("APP_GONE",)  # uygulama kapalı/yeniden bağlanıyor; UYAP'a gitmez, durma sayılmaz (2026-10-10)
ONBELLEK_ADI = "00-uyap-onbellek.json"
CMK_LISTESI_ADI = "00-CMK-DOSYALARI.md"
ESLESME_ADI = "00-UYAP-ESLESME-TABLOSU.md"
CMK_KLASORU = "02CMK"  # avukat talimatı 2026-10-13: CMK dosyaları 02CMK/CMK-<no> … klasöründe
CMK_KODU = re.compile(r"(?<![\w-])CMK-\d+(?!\d)")
CMK_RE = re.compile(r"\bCMK\b|zorunlu müdafi|baro atama|görevlendir", re.IGNORECASE)
TURLER = ("agir ceza", "asliye ceza", "sulh ceza", "cocuk", "asliye hukuk", "sulh hukuk", "asliye ticaret", "tuketici",
          "icra hukuk", "icra ceza", "icra", "is", "aile", "kadastro", "idare", "vergi", "hukuk dairesi",
          "ceza dairesi", "arabulucu", "talimat")
KISALTMA = {"gop": "gaziosmanpasa", "ist": "istanbul"}
GURULTU = ("mahkemesi", "mahkeme", "mah", "dairesi", "mudurlugu", "cumhuriyet", "bassavciligi", "istanbul", "kapatilan")
DIKKAT_KURALLARI = (
    (r"Gerekçeli Karar", "Karar: tebliğ ve kanun yolu süresi izlenecek"),
    (r"Duruşma Günü", "Yeni duruşma günü"),
    (r"İstinaf|Temyiz|BAM Dosya", "Kanun yolu aşaması"),
    (r"Bilirkişi", "Bilirkişi: beyan veya itiraz süresi"),
    (r"Tensip", "Tensip: süreler başlayabilir"),
    (r"Tebli|UETS|Mazbata", "Tebligat: tebliğ tarihi ve süre denetlenecek"),
    (r"Vekil Çekildi", "Vekil değişikliği"),
    (r"Cevap Dilekçesi|Savunma Dilekçesi|Beyan Dilekçesi|Cevaba Cevap", "Dilekçe kaydı"),
)


# --- eşleştirme -----------------------------------------------------------------------------------------------

def tr(metin) -> str:
    """Türkçe harfleri ASCII küçük harfe indirger (eşleştirme anahtarı için). Önce NFC: macOS/Drive klasör adları
    ayrışık (NFD: u + U+0308) gelebilir; Windows'ta etkisizdir."""
    s = unicodedata.normalize("NFC", str(metin or "")).replace("İ", "i").replace("I", "ı").lower().replace("̇", "")
    for a, b in (("ı", "i"), ("ş", "s"), ("ğ", "g"), ("ü", "u"), ("ö", "o"), ("ç", "c"), ("â", "a"), ("î", "i")):
        s = s.replace(a, b)
    return s


def mahkeme_anahtar(ad) -> tuple[str, str, frozenset]:
    """(numara, tür, yer) — 'İstanbul Anadolu 12. İş Mahkemesi' ile 'Anadolu 12. İş Mah.' aynı anahtarı verir."""
    t = " " + re.sub(r"[^0-9a-z]+", " ", tr(ad)) + " "
    for a, b in KISALTMA.items():
        t = t.replace(f" {a} ", f" {b} ")
    for k in GURULTU:
        t = t.replace(f" {k} ", " ")
    numara = (re.search(r" (\d+) ", t) or [None, "0"])[1]
    tur = next((k for k in TURLER if f" {k} " in t), "")
    tur_kelimeleri = set(" ".join(TURLER).split())
    yer = frozenset(w for w in t.replace(f" {tur} ", " ").split() if not w.isdigit() and w not in tur_kelimeleri)
    return numara, tur, yer


def dosya_no(metin) -> str:
    """'2026/5', '2026-5', 'E.2026/0005' -> '2026/5'."""
    m = re.search(r"(\d{4})\s*[/-]\s*0*(\d+)", str(metin or ""))
    return f"{m.group(1)}/{m.group(2)}" if m else str(metin or "").strip()


def ayni_dosya(mahkeme1, no1, mahkeme2, no2) -> bool:
    if dosya_no(no1) != dosya_no(no2):
        return False
    a, b = mahkeme_anahtar(mahkeme1), mahkeme_anahtar(mahkeme2)
    if a[0] != b[0] or a[1] != b[1]:
        return False
    return not a[2] or not b[2] or bool(a[2] & b[2])


def cmk_mi(rol) -> bool:
    return bool(CMK_RE.search(str(rol or "")))


def dikkat(aciklama) -> str:
    a = str(aciklama or "")
    return next((etiket for desen, etiket in DIKKAT_KURALLARI if re.search(desen, a)), "")


def caseref_yap(birim, no, portal: str = "avukat") -> str:
    """caseref_coz'un tersi: masaüstü araç 2026-10'dan beri klonla/esitle için caseRef zorunlu tutuyor
    (`--dosya-no/--birim` INVALID_INPUT: girdi/1 alan caseRef zorunlu)."""
    govde = json.dumps({"portal": portal or "avukat", "birimAdi": str(birim or "").strip(), "dosyaNo": dosya_no(no)},
                       ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return "c1." + base64.urlsafe_b64encode(govde).decode("ascii").rstrip("=")


def caseref_coz(ref) -> dict:
    """Masaüstü aracın dosya kimliği: 'c1.' + base64url(JSON {portal, birimAdi, dosyaNo})."""
    try:
        govde = str(ref).split(".", 1)[1]
        return json.loads(base64.urlsafe_b64decode(govde + "=" * (-len(govde) % 4)))
    except (IndexError, ValueError):
        return {}


def klasor_kodu(ad) -> str:
    """Büro klasör adından kod: `2026-028 …` -> `2026-028`; `02CMK/... CMK-15 …` -> `CMK-15`; yoksa boş."""
    ad = str(ad or "")
    m = re.match(r"^\d{4}-\d{3}", ad) or CMK_KODU.search(ad)
    return m.group(0) if m else ""


def eslesme_satirlari(yol: Path | None = None) -> list[dict]:
    """00-UYAP-ESLESME-TABLOSU.md: A (kesin) ve B (orta güven) bölümlerinde büro klasörü vardır; C'de yoktur."""
    yol = yol or aktif_davalar() / ESLESME_ADI
    if not yol.exists():
        return []
    satirlar, bolum = [], ""
    for s in yol.read_text(encoding="utf-8").splitlines():
        if s.startswith("#"):
            bolum = s.lstrip("#").strip()[:1]
            continue
        if not s.startswith("|") or s.startswith("|---") or "UYAP Klasörü" in s:
            continue
        h = [x.strip() for x in s.strip().strip("|").split("|")]
        if bolum in ("A", "B"):
            klasor, uyap, muvekkil, karsi = (h + ["", "", "", ""])[:4]
        else:
            klasor, (uyap, muvekkil, karsi) = "", (h + ["", "", ""])[:3]
        m = re.match(r"^(.*?)\s+(\d{4})-(\d+)", uyap)
        if not m:
            continue
        satirlar.append({"bolum": bolum, "klasor": klasor_kodu(klasor),
                         "mahkeme": m.group(1), "no": f"{m.group(2)}/{m.group(3)}", "muvekkil": muvekkil,
                         "karsi": karsi, "cmk": cmk_mi(muvekkil)})
    return satirlar


def eslesme_bul(satirlar: list[dict], mahkeme, no) -> dict | None:
    return next((e for e in satirlar if ayni_dosya(mahkeme, no, e["mahkeme"], e["no"])), None)


# --- masaüstü araç ----------------------------------------------------------------------------------------------

def cli(*arglar, zaman: int = 300) -> tuple[dict, int]:
    """Masaüstü aracı çağırır (boş girdiyle). JSON döndürmezse {'_ham': metin}."""
    yol = str(yargipro_cli())
    r = subprocess.run(["cmd", "/c", yol, *arglar] if yol.lower().endswith(".cmd") else [yol, *arglar],
                       capture_output=True, timeout=zaman, stdin=subprocess.DEVNULL)
    metin = (r.stdout or b"").decode("utf-8", "replace").strip() or (r.stderr or b"").decode("utf-8", "replace").strip()
    try:
        return json.loads(metin), r.returncode
    except json.JSONDecodeError:
        return {"_ham": metin[:400]}, r.returncode


def oku(*arglar, zaman: int = 300) -> tuple[dict, int]:
    if arglar[0] not in OKUMA_KOMUTLARI:
        raise ValueError(f"yalnız okuma komutu çağrılabilir: {arglar[0]}")
    return cli(*arglar, zaman=zaman)


def hata_kodu(yanit) -> str:
    alan = yanit.get("hata") if isinstance(yanit, dict) else None
    if isinstance(alan, dict):
        return str(alan.get("code") or "")
    return str(alan or "")


def sinir_mi(yanit) -> bool:
    kod = hata_kodu(yanit)
    return bool(kod) and any(k in kod for k in SINIR_KODLARI)


def durma_nedeni(yanit, cikis_kodu) -> str:
    """Toplu işin o gün DURMASI gerekiyorsa nedeni; devam edilebilirse boş metin.
    Kural (2026-10-09 dersi): bilinen kod listesine değil, başarı dışındaki HER sonuca göre durulur;
    yalnız uygulamanın yerel girdi hatası (INVALID_INPUT) o dosyayı atlayıp devam ettirir."""
    if not isinstance(yanit, dict):
        return "tanınmayan yanıt"
    kod = hata_kodu(yanit)
    if kod and any(k in kod for k in YEREL_HATA_KODLARI + UYGULAMA_HAZIR_DEGIL_KODLARI):
        return ""
    if kod:
        return kod
    if "_zaman_asimi" in yanit:
        return "zaman aşımı"
    if "_ham" in yanit:
        return "tanınmayan yanıt"
    if yanit.get("durum") not in (None, "hazir") or cikis_kodu not in (0,):
        return f"iş durumu {yanit.get('durum')!r}, çıkış {cikis_kodu}"
    return ""


def kilit_gerekir_mi(neden: str) -> bool:
    return any(k in str(neden) for k in KILIT_KODLARI)


def cmk_listesi(yol: Path | None = None) -> list[dict]:
    """Avukatın CMK olarak bildirdiği dosyalar: Aktif Davalar/00-CMK-DOSYALARI.md tablosu (Mahkeme | Dosya No | Not)."""
    yol = yol or aktif_davalar() / CMK_LISTESI_ADI
    if not yol.exists():
        return []
    out = []
    for s in yol.read_text(encoding="utf-8").splitlines():
        if not s.startswith("|") or s.startswith("|---"):
            continue
        h = [x.strip() for x in s.strip().strip("|").split("|")]
        if len(h) >= 2 and re.search(r"\d{4}\s*[/-]\s*\d+", h[1]):
            out.append({"mahkeme": h[0], "no": dosya_no(h[1])})
    return out


def cmk_listede_mi(liste: list[dict], mahkeme, no) -> bool:
    return any(ayni_dosya(mahkeme, no, c["mahkeme"], c["no"]) for c in liste)


# --- önbellek ---------------------------------------------------------------------------------------------------

def onbellek_yolu() -> Path:
    return aktif_davalar() / ONBELLEK_ADI


def onbellek_oku(yol: Path | None = None) -> dict:
    yol = yol or onbellek_yolu()
    if not yol.exists():
        return {}
    try:
        return json.loads(yol.read_text(encoding="utf-8"))
    except (ValueError, OSError):
        return {}


def bugun_str() -> str:
    return date.today().isoformat()


def iso_tarih(metin) -> datetime | None:
    try:
        return datetime.strptime(str(metin or "")[:10], "%Y-%m-%d")
    except ValueError:
        return None


def tarih_saat(metin) -> datetime | None:
    """ISO tarih-saat; saat dilimi varsa (ör. 'Z') yerel saate çevrilir, dilimsiz yerel sayılır."""
    s = str(metin or "").strip()
    if not s:
        return None
    try:
        t = datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        return iso_tarih(s)
    return t.astimezone().replace(tzinfo=None) if t.tzinfo else t
