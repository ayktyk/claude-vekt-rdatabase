#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""akis.py — dava klasöründe akış kaydı (00-AKIS.md + .akis.json).

Avukatın "hangi aşama yapıldı, denetim ne dedi, evrak nereden geldi" sorusunun tek
cevabıdır. Director her ASAMA geçişinde ve her DENETCI sonucunda bu betiği çağırır;
/devam, /atla, /dur komutları buradan okur.
Kural kaynağı: AGENTS.md -> "Çalışma Modları ve Tetikleyiciler" + "DENETCI Kapısı ve
Denetim Politikası".

Kayıt İŞ bazlıdır: aynı davada yeni bir iş (ör. dava dilekçesinden sonra cevaba cevap)
başlatılınca önceki işin aşama ve denetim kayıtları "Geçmiş işler"e taşınır, aşamalar
sıfırlanır; evrak kaynakları dava düzeyinde kalır.

Kullanım:
  python scripts/akis.py baslat  <dava-klasoru> --mod tam|hizli --is "<iş tanımı>" [--kol hmk|iik|cmk|iyuk|aym|aihm]
  python scripts/akis.py kol     <dava-klasoru> <kol> [--not "<gerekçe>"]
  python scripts/akis.py olay    <dava-klasoru> --hat <hat-id> "<ne yapıldı>" [--cikti <yol>]
  python scripts/akis.py asama   <dava-klasoru> <0-7> --durum basladi|bitti|atlandi|mevcut
                                 [--cikti <yol>] [--not "<not>"]
  python scripts/akis.py denetim <dava-klasoru> --nokta K1|KS|K2|EK|ISTEK --dosya <yol>
                                 --karar KIRMIZI|SARI|YESIL|UYGULANMAZ [--tur <n>] [--bulgu <n>]
                                 [--not "<not>"] [--avukat-talimati]
  python scripts/akis.py evrak   <dava-klasoru> --kaynak <dava-cli klon yolu>
  python scripts/akis.py mod     <dava-klasoru> tam|hizli [--not "<gerekçe>"]
  python scripts/akis.py sonraki <dava-klasoru>     # engel varsa "ENGEL: …" ve exit 1
  python scripts/akis.py goster  <dava-klasoru>
exit 0 = tamam, 1 = hata veya geçiş engeli.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

DURUM_DOSYASI = ".akis.json"
MD_DOSYASI = "00-AKIS.md"
SURUM = 2

ASAMA_ADLARI = {
    0: "MemPalace Wake-up + profil",
    1: "Hazırlık + Olay Çözümü + Briefing",
    2: "Derin Araştırma (K1 denetimi)",
    3: "Usul Raporu",
    4: "Stratejik Analiz 4A-4E (KS denetimi)",
    5: "Dilekçe v1",
    6: "Savunma Simülasyonu",
    7: "Dilekçe v2 NİHAİ (K2 denetimi)",
}
MOD_PLANI = {"tam": [0, 1, 2, 3, 4, 5, 6, 7], "hizli": [0, 1, 2, 5, 7], "secilmedi": []}
MOD_ETIKETI = {
    "tam": "TAM — 7 ASAMA",
    "hizli": "HIZLI",
    "secilmedi": "seçilmedi — `/dilekce` veya `tam akış` ile başlatılır",
}
DENETIM_PLANI = {
    "tam": "K1 (ASAMA 2 araştırma raporu) + KS (ASAMA 4 strateji) + K2 (ASAMA 7 nihai belge)",
    "hizli": "K2 (nihai belge; atıf içermiyorsa UYGULANMAZ kaydı)",
    "secilmedi": "—",
}
ASAMA_DURUMLARI = ("bekliyor", "basladi", "bitti", "atlandi", "mevcut")
TAMAM_DURUMLARI = ("bitti", "atlandi", "mevcut")
KARARLAR = {"KIRMIZI": "KIRMIZI", "SARI": "SARI", "YESIL": "YESIL", "YEŞİL": "YESIL",
            "UYGULANMAZ": "UYGULANMAZ"}
KARAR_ETIKETI = {"KIRMIZI": "KIRMIZI", "SARI": "SARI", "YESIL": "YEŞİL", "UYGULANMAZ": "uygulanmaz"}
GECER_KARARLAR = ("YESIL", "UYGULANMAZ")
NOKTALAR = ("K1", "KS", "K2", "EK", "ISTEK")  # ISTEK: avukatın `denetle:` talebi (geçişi durdurmaz)
AZAMI_TUR = 3
# Yargı kolu: 1. aşamadaki uyuşmazlık tespiti belirler (avukat kararı 2026-10-09, otomatik seçim)
KOLLAR = ("hmk", "iik", "cmk", "iyuk", "aym", "aihm")
KOL_ETIKETI = {"hmk": "HMK", "iik": "İİK", "cmk": "CMK", "iyuk": "İYUK", "aym": "AYM", "aihm": "AİHM"}
DAVA_ID_RE = re.compile(r"^(\d{4}-\d{3})")


def _simdi() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")


def _mod_dogrula(mod: str) -> str:
    mod = (mod or "").strip().lower().replace("ı", "i")
    if mod not in ("tam", "hizli"):
        raise ValueError(f"geçersiz mod: {mod!r} (tam | hizli)")
    return mod


def _olay(durum: dict, metin: str) -> None:
    durum["olaylar"].append({"zaman": _simdi(), "olay": metin})


def _bos_asamalar() -> dict:
    return {str(n): {"durum": "bekliyor", "cikti": "", "not": "", "zaman": ""} for n in ASAMA_ADLARI}


def _klasor_var(klasor) -> Path:
    hedef = Path(klasor)
    if not hedef.is_dir():
        raise FileNotFoundError(f"dava klasörü yok: {hedef} — önce klasörü oluşturun "
                                "(`python scripts/paths.py dava <dava-id>` ile doğrulayın)")
    return hedef


def yukle(klasor) -> dict:
    yol = Path(klasor) / DURUM_DOSYASI
    if not yol.exists():
        raise FileNotFoundError(f"akış kaydı yok: {yol} — önce 'akis.py baslat' çalıştırın")
    durum = json.loads(yol.read_text(encoding="utf-8"))
    if int(durum.get("surum", 1)) > SURUM:
        raise ValueError(f"kayıt daha yeni bir akis.py sürümüyle yazılmış (surum {durum['surum']})")
    durum.setdefault("gecmis_isler", [])
    durum.setdefault("kol", "")
    durum["surum"] = SURUM
    return durum


def _kol_dogrula(kol: str) -> str:
    deger = (kol or "").strip().lower().replace("\u0307", "").replace("ı", "i")
    if deger and deger not in KOLLAR:
        raise ValueError(f"geçersiz kol: {kol!r} ({' | '.join(KOLLAR)})")
    return deger


def _kaydet(klasor, durum: dict) -> None:
    durum["guncelleme"] = _simdi()
    hedef = Path(klasor)
    (hedef / DURUM_DOSYASI).write_text(
        json.dumps(durum, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (hedef / MD_DOSYASI).write_text(render(durum), encoding="utf-8")


def _yeni_durum(klasor: Path, mod: str, is_tanimi: str) -> dict:
    eslesme = DAVA_ID_RE.match(klasor.name)
    return {
        "surum": SURUM,
        "dava_klasoru": klasor.name,
        "dava_id": eslesme.group(1) if eslesme else "",
        "is": is_tanimi,
        "mod": mod,
        "kol": "",
        "olusturma": _simdi(),
        "guncelleme": _simdi(),
        "asamalar": _bos_asamalar(),
        "denetimler": [],
        "evrak_kaynaklari": [],
        "gecmis_isler": [],
        "olaylar": [],
    }


def _isi_arsivle(durum: dict) -> None:
    durum["gecmis_isler"].append({
        "is": durum["is"], "mod": durum["mod"], "kapanis": _simdi(),
        "asamalar": durum["asamalar"], "denetimler": durum["denetimler"],
    })
    durum["asamalar"] = _bos_asamalar()
    durum["denetimler"] = []


def baslat(klasor, mod: str, is_tanimi: str, kol: str = "") -> dict:
    """Kayıt yoksa oluşturur. Aynı iş için mod değişikliğini işler; yeni iş için önceki işi
    arşivler ve aşamaları sıfırlar. Klasör yoksa oluşturmaz (hayalet klasör açılmaz)."""
    mod = _mod_dogrula(mod)
    kol = _kol_dogrula(kol)
    hedef = _klasor_var(klasor)
    if not (hedef / DURUM_DOSYASI).exists():
        durum = _yeni_durum(hedef, mod, is_tanimi)
        _olay(durum, f"akış başlatıldı ({MOD_ETIKETI[mod]}): {is_tanimi}")
    else:
        durum = yukle(hedef)
        if durum["mod"] == "secilmedi" or not durum["is"]:
            _olay(durum, f"akış başlatıldı ({MOD_ETIKETI[mod]}): {is_tanimi}")
            durum["is"], durum["mod"] = is_tanimi, mod
        elif durum["is"] != is_tanimi:
            onceki = durum["is"]
            _isi_arsivle(durum)
            _olay(durum, f"yeni iş: {is_tanimi} (önceki iş arşivlendi: {onceki})")
            durum["is"], durum["mod"] = is_tanimi, mod
        elif durum["mod"] != mod:
            _olay(durum, f"mod değişti: {durum['mod']} -> {mod}")
            durum["mod"] = mod
    if kol and durum.get("kol") != kol:
        _olay(durum, f"yargı kolu: {KOL_ETIKETI[kol]}")
        durum["kol"] = kol
    _kaydet(hedef, durum)
    return durum


def kol_degistir(klasor, kol: str, not_: str = "") -> dict:
    """Yargı kolunu kaydeder ya da düzeltir (avukat düzeltmesi olay olarak işlenir)."""
    kol = _kol_dogrula(kol)
    if not kol:
        raise ValueError(f"kol boş olamaz ({' | '.join(KOLLAR)})")
    kayit = yukle(klasor)
    if kayit.get("kol") != kol:
        onceki = KOL_ETIKETI.get(kayit.get("kol", ""), "belirlenmedi")
        ek = f" ({not_})" if not_ else ""
        _olay(kayit, f"yargı kolu: {onceki} -> {KOL_ETIKETI[kol]}{ek}")
        kayit["kol"] = kol
        _kaydet(klasor, kayit)
    return kayit


def _goreli_yol(klasor, yol: str) -> str:
    """Dava klasörüne göreli, '/' ayraçlı yol: aynı dosya mutlak/göreli yazıldığında kayıt eşleşsin."""
    yol = (yol or "").strip().strip('"')
    if not yol:
        return ""
    p = Path(yol)
    if p.is_absolute():
        try:
            p = p.resolve().relative_to(Path(klasor).resolve())
        except (ValueError, OSError):
            return str(p).replace("\\", "/")
    return p.as_posix().replace("\\", "/")


def _ayni_dosya(a: str, b: str) -> bool:
    """Eski kayıtlarda mutlak yol veya ters bölü kalmış olabilir; sonek eşleşmesi de aynı dosyadır."""
    a, b = (a or "").replace("\\", "/"), (b or "").replace("\\", "/")
    if a == b:
        return True
    if not a or not b:
        return False
    return a.endswith("/" + b) or b.endswith("/" + a)


def asama(klasor, no: int, durum: str, cikti: str = "", not_: str = "") -> dict:
    if no not in ASAMA_ADLARI:
        raise ValueError(f"geçersiz ASAMA: {no} (0-7)")
    if durum not in ASAMA_DURUMLARI:
        raise ValueError(f"geçersiz durum: {durum!r} ({' | '.join(ASAMA_DURUMLARI)})")
    kayit = yukle(klasor)
    satir = kayit["asamalar"][str(no)]
    satir["durum"] = durum
    satir["zaman"] = _simdi()
    if cikti:
        satir["cikti"] = _goreli_yol(klasor, cikti)
    if not_:
        satir["not"] = not_
    _kaydet(klasor, kayit)
    return kayit


def _beklenen_tur(kayit: dict, nokta: str, dosya: str) -> int:
    """Aynı dosyanın son geçer kararından sonraki tur numarası.

    YEŞİL / UYGULANMAZ bir denetim dizisini kapatır; dosya sonra değişip yeniden denetlenirse
    (ör. her eklemede yeniden denetlenen havuz eki) sayaç 1'den başlar. 3 tur sınırı ardışık
    geçmeyen turlar içindir.
    """
    tur = 1
    for d in kayit["denetimler"]:
        if d["nokta"] == nokta and _ayni_dosya(d["dosya"], dosya):
            tur = 1 if d["karar"] in GECER_KARARLAR else tur + 1
    return tur


def denetim(klasor, nokta: str, dosya: str, karar: str, tur: int | None = None, bulgu: int = 0,
            not_: str = "", avukat_talimati: bool = False) -> dict:
    nokta = (nokta or "").strip().upper()
    karar_anahtar = (karar or "").strip().upper()
    if nokta not in NOKTALAR:
        raise ValueError(f"geçersiz denetim noktası: {nokta!r} ({' | '.join(NOKTALAR)})")
    if karar_anahtar not in KARARLAR:
        raise ValueError(f"geçersiz karar: {karar!r} (KIRMIZI | SARI | YESIL | UYGULANMAZ)")
    karar_kod = KARARLAR[karar_anahtar]
    if karar_kod == "UYGULANMAZ" and (nokta != "K2" or not not_.strip()):
        raise ValueError("UYGULANMAZ yalnız K2 için ve gerekçe notuyla kaydedilir "
                         "(ör. --not \"atıfsız usul belgesi; yalnız yapısal kapı\")")
    if bulgu < 0:
        raise ValueError("bulgu sayısı negatif olamaz")
    dosya = _goreli_yol(klasor, dosya)
    kayit = yukle(klasor)
    beklenen = _beklenen_tur(kayit, nokta, dosya)
    if tur is not None and tur != beklenen:
        raise ValueError(f"tur uyuşmuyor: kayıtlara göre bu {beklenen}. tur (verilen {tur})")
    if beklenen > AZAMI_TUR and not avukat_talimati:
        raise ValueError(f"{AZAMI_TUR} turdan sonra yeni tur yalnız avukatın açık "
                         "talimatıyla açılır (--avukat-talimati)")
    kayit["denetimler"].append({
        "zaman": _simdi(), "nokta": nokta, "dosya": dosya, "karar": karar_kod,
        "tur": beklenen, "bulgu": bulgu, "not": not_,
    })
    if avukat_talimati and beklenen > AZAMI_TUR:
        _olay(kayit, f"{nokta} için {beklenen}. tur avukatın talimatıyla açıldı ({dosya})")
    _kaydet(klasor, kayit)
    return kayit


def evrak(klasor, kaynak: str) -> dict:
    """Evrak kaynağını kaydeder; akış kaydı yoksa mod seçilmemiş bir kayıt açar."""
    hedef = _klasor_var(klasor)
    if (hedef / DURUM_DOSYASI).exists():
        kayit = yukle(hedef)
    else:
        kayit = _yeni_durum(hedef, "secilmedi", "")
        _olay(kayit, "kayıt evrak edinimiyle açıldı (mod seçilmedi)")
    if kaynak not in [e["yol"] for e in kayit["evrak_kaynaklari"]]:
        kayit["evrak_kaynaklari"].append({"yol": kaynak, "eklenme": _simdi()})
    _kaydet(hedef, kayit)
    return kayit


def olay_ekle(klasor, hat: str, metin: str, cikti: str = "") -> dict:
    """Büro iş hattı olayını kaydeder (AGENTS.md "Büro iş hatları"); kayıt yoksa mod seçilmemiş kayıt açar."""
    hat = (hat or "").strip()
    metin = " ".join((metin or "").split())
    if not hat or not metin:
        raise ValueError("olay için --hat ve açıklama zorunludur")
    hedef = _klasor_var(klasor)
    if (hedef / DURUM_DOSYASI).exists():
        kayit = yukle(hedef)
    else:
        kayit = _yeni_durum(hedef, "secilmedi", "")
    ek = f" → {_goreli_yol(hedef, cikti)}" if cikti else ""
    _olay(kayit, f"[hat: {hat}] {metin}{ek}")
    _kaydet(hedef, kayit)
    return kayit


def mod_degistir(klasor, mod: str, not_: str = "") -> dict:
    mod = _mod_dogrula(mod)
    kayit = yukle(klasor)
    if kayit["mod"] != mod:
        ek = f" ({not_})" if not_ else ""
        _olay(kayit, f"mod değişti: {kayit['mod']} -> {mod}{ek}")
        kayit["mod"] = mod
        _kaydet(klasor, kayit)
    return kayit


def plan(durum: dict) -> list[int]:
    return list(MOD_PLANI[durum["mod"]])


def sonraki(durum: dict) -> int | None:
    for no in plan(durum):
        if durum["asamalar"][str(no)]["durum"] not in TAMAM_DURUMLARI:
            return no
    return None


def _son_karar(durum: dict, nokta: str, dosya: str = "", gecmis: bool = False) -> str | None:
    kayitlar = list(durum["denetimler"])
    if gecmis:
        for is_ in durum.get("gecmis_isler", []):
            kayitlar = is_["denetimler"] + kayitlar
    secili = [d for d in kayitlar if d["nokta"] == nokta and (not dosya or _ayni_dosya(d["dosya"], dosya))]
    return secili[-1]["karar"] if secili else None


def _kapi(durum: dict, asama_no: int, nokta: str, mesaj: str) -> str | None:
    """asama_no tamamlanmışsa, sonraki adıma geçmeden nokta kararı geçer olmalı."""
    satir = durum["asamalar"][str(asama_no)]
    if asama_no not in plan(durum) or satir["durum"] not in TAMAM_DURUMLARI:
        return None
    if satir["durum"] == "atlandi":
        return None
    if satir["durum"] == "mevcut":
        karar = _son_karar(durum, nokta, satir["cikti"], gecmis=True)
        if karar in GECER_KARARLAR:
            return None
        return f"{nokta} {KARAR_ETIKETI.get(karar, 'kaydı yok')} — {mesaj}"
    # Aynı işte birden çok dosya aynı noktada denetlenebilir (ör. K2: dilekçe v2 + müvekkil
    # bilgilendirme). Her dosyanın SON kararı geçer olmalı; birinin YEŞİL'i diğerinin
    # KIRMIZI'sını örtmez.
    sonlar = _dosya_bazli_son(durum["denetimler"], nokta)
    if not sonlar:
        return f"{nokta} kaydı yok — {mesaj}"
    for kayit in sonlar:
        if kayit["karar"] not in GECER_KARARLAR:
            return f"{nokta} {KARAR_ETIKETI[kayit['karar']]} ({kayit['dosya']}) — {mesaj}"
    if satir["cikti"] and _son_karar(durum, nokta, satir["cikti"]) not in GECER_KARARLAR:
        return f"{nokta} kaydı yok ({satir['cikti']}) — {mesaj}"
    return None


def _dosya_bazli_son(kayitlar: list[dict], nokta: str) -> list[dict]:
    """Bir denetim noktasındaki her dosyanın son kaydı (dosyaların ilk görülme sırasıyla)."""
    sonlar: list[dict] = []
    for kayit in kayitlar:
        if kayit["nokta"] != nokta:
            continue
        for i, onceki in enumerate(sonlar):
            if _ayni_dosya(onceki["dosya"], kayit["dosya"]):
                sonlar[i] = kayit
                break
        else:
            sonlar.append(kayit)
    return sonlar


def _ek_engeli(durum: dict) -> str | None:
    """Havuz ekinin son denetimi geçer değilse ek kullanılamaz (EK yalnız TAM akışta açılır)."""
    for kayit in _dosya_bazli_son(durum["denetimler"], "EK"):
        if kayit["karar"] not in GECER_KARARLAR:
            return (f"EK {KARAR_ETIKETI[kayit['karar']]} — havuz eki ({kayit['dosya']}) kullanılamaz; "
                    "ek düzeltilip yeniden denetlenir")
    return None


# Ad ile tanınan denetim noktası çıktıları (ASAMA kaydına çıktı yolu yazılmadan önce de korunur)
DENETIM_NOKTASI_ADLARI = {
    "arastirma-raporu.md": "K1",
    "stratejik-analiz.md": "KS",
    "dilekce-v2.md": "K2",
}
NOKTA_ASAMA_MOD = ((2, "K1", ("tam",)), (4, "KS", ("tam",)), (7, "K2", ("tam", "hizli")))


def denetim_engeli(dosya) -> str | None:
    """Dosya bir denetim noktası çıktısıysa ve son kararı geçer değilse nedenini döndürür.

    AGENTS.md "Drive'a yazılmaz" kuralının kod karşılığı: md_to_docx.py bu dosyayı atlar,
    md_to_udf.py UDF üretmez. Akış kaydı (.akis.json) dosyanın üst klasörlerinde (en çok 4
    seviye) aranır; kayıt yoksa (danışma, blog, eski dava) engel yoktur. ISTEK kayıtları engellemez.
    """
    yol = Path(dosya).resolve()
    klasor = next((ust for ust in list(yol.parents)[:4] if (ust / DURUM_DOSYASI).exists()), None)
    if klasor is None:
        return None
    try:
        durum = yukle(klasor)
    except (OSError, ValueError) as hata:
        print(f"UYARI: akış kaydı okunamadı ({hata}); denetim engeli uygulanmadı", file=sys.stderr)
        return None
    goreli = _goreli_yol(klasor, str(yol))
    tum = [d for is_ in durum.get("gecmis_isler", []) for d in is_["denetimler"]] + durum["denetimler"]
    ilgili = [d for d in tum if d["nokta"] in ("K1", "KS", "K2", "EK") and _ayni_dosya(d["dosya"], goreli)]
    if ilgili:
        son = ilgili[-1]
        if son["karar"] in GECER_KARARLAR:
            return None
        return f"{son['nokta']} {KARAR_ETIKETI[son['karar']]} — {goreli} denetimden geçmedi"
    for asama_no, nokta, modlar in NOKTA_ASAMA_MOD:
        if durum["mod"] not in modlar:
            continue
        cikti = durum["asamalar"][str(asama_no)]["cikti"]
        if (cikti and _ayni_dosya(cikti, goreli)) or DENETIM_NOKTASI_ADLARI.get(yol.name) == nokta:
            return f"{nokta} kaydı yok — {goreli} denetimden geçmeden DOCX/UDF üretilmez"
    return None


def engel(durum: dict) -> str | None:
    """Geçişi durduran denetim engeli (yoksa None). ISTEK kayıtları geçişi durdurmaz."""
    if durum["mod"] == "tam":
        for asama_no, nokta, mesaj in ((2, "K1", "ASAMA 3'e geçilmez"),
                                       (4, "KS", "ASAMA 5'e geçilmez")):
            sorun = _kapi(durum, asama_no, nokta, mesaj)
            if sorun:
                return sorun
    sorun = _ek_engeli(durum)
    if sorun:
        return sorun
    return _kapi(durum, 7, "K2", "belge dışarı gönderilmez, UDF üretilmez")


def _hucre(deger) -> str:
    metin = str(deger if deger not in (None, "") else "—")
    return " ".join(metin.split()).replace("|", "\\|")


def _tablo_asamalar(durum: dict) -> list[str]:
    planli = set(plan(durum))
    satirlar = ["| ASAMA | Ad | Planda | Durum | Çıktı | Not | Zaman |",
                "|---|---|---|---|---|---|---|"]
    for no, ad in ASAMA_ADLARI.items():
        s = durum["asamalar"][str(no)]
        satirlar.append(
            f"| {no} | {ad} | {'evet' if no in planli else '—'} | {_hucre(s['durum'])} "
            f"| {_hucre(s['cikti'])} | {_hucre(s['not'])} | {_hucre(s['zaman'])} |")
    return satirlar


def _tablo_denetimler(denetimler: list[dict]) -> list[str]:
    if not denetimler:
        return ["_Henüz denetim yok._"]
    satirlar = ["| Zaman (UTC) | Nokta | Dosya | Karar | Tur | Bulgu | Not |",
                "|---|---|---|---|---|---|---|"]
    for d in denetimler:
        satirlar.append(
            f"| {_hucre(d['zaman'])} | {d['nokta']} | {_hucre(d['dosya'])} "
            f"| {KARAR_ETIKETI[d['karar']]} | {d['tur']} | {d['bulgu']} | {_hucre(d['not'])} |")
    return satirlar


def render(durum: dict) -> str:
    siradaki = sonraki(durum)
    if durum["mod"] == "secilmedi":
        sira_metni = "mod seçilmedi"
    elif siradaki is not None:
        sira_metni = f"ASAMA {siradaki} — {ASAMA_ADLARI[siradaki]}"
    else:
        sira_metni = "akış tamamlandı"
    sorun = engel(durum)
    gecmis = durum.get("gecmis_isler", [])
    satirlar = [
        f"# Akış Kaydı — {durum['dava_klasoru']}",
        "",
        "> Bu dosya `scripts/akis.py` ile üretilir; elle düzenlemeyin.",
        f"> Son güncelleme: {durum['guncelleme']} (UTC)",
        "",
        f"- **İş:** {durum['is'] or '—'}",
        f"- **Mod:** {MOD_ETIKETI[durum['mod']]}",
        f"- **Yargı kolu:** {KOL_ETIKETI.get(durum.get('kol', ''), 'belirlenmedi')}",
        f"- **Denetim planı:** {DENETIM_PLANI[durum['mod']]}",
        f"- **Sıradaki:** {sira_metni}",
        *([f"- **ENGEL:** {sorun}"] if sorun else []),
        "",
        "## Aşamalar",
        "",
        *_tablo_asamalar(durum),
        "",
        "## Denetim Kaydı",
        "",
        *_tablo_denetimler(durum["denetimler"]),
        "",
        "## Evrak Kaynakları",
        "",
        *([f"- {e['yol']} (eklenme {e['eklenme']})" for e in durum["evrak_kaynaklari"]]
          or ["_Kayıtlı evrak kaynağı yok._"]),
        "",
        "## Geçmiş İşler",
        "",
        *([f"- {g['kapanis']} — {g['is']} ({MOD_ETIKETI.get(g['mod'], g['mod'])}, "
           f"{len(g['denetimler'])} denetim kaydı)" for g in gecmis] or ["_Yok._"]),
        "",
        "## Olaylar",
        "",
        *[f"- {o['zaman']} — {o['olay']}" for o in durum["olaylar"]],
    ]
    return "\n".join(satirlar) + "\n"


def _parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(prog="akis.py", description="Dava akış kaydı (00-AKIS.md)")
    alt = ap.add_subparsers(dest="komut", required=True)
    b = alt.add_parser("baslat")
    b.add_argument("klasor")
    b.add_argument("--mod", required=True)
    b.add_argument("--is", dest="is_tanimi", required=True)
    b.add_argument("--kol", default="")
    o = alt.add_parser("olay")
    o.add_argument("klasor")
    o.add_argument("metin")
    o.add_argument("--hat", required=True)
    o.add_argument("--cikti", default="")
    k = alt.add_parser("kol")
    k.add_argument("klasor")
    k.add_argument("yeni_kol")
    k.add_argument("--not", dest="not_", default="")
    a = alt.add_parser("asama")
    a.add_argument("klasor")
    a.add_argument("no", type=int)
    a.add_argument("--durum", required=True)
    a.add_argument("--cikti", default="")
    a.add_argument("--not", dest="not_", default="")
    d = alt.add_parser("denetim")
    d.add_argument("klasor")
    d.add_argument("--nokta", required=True)
    d.add_argument("--dosya", required=True)
    d.add_argument("--karar", required=True)
    d.add_argument("--tur", type=int, default=None)
    d.add_argument("--bulgu", type=int, default=0)
    d.add_argument("--not", dest="not_", default="")
    d.add_argument("--avukat-talimati", action="store_true")
    e = alt.add_parser("evrak")
    e.add_argument("klasor")
    e.add_argument("--kaynak", required=True)
    m = alt.add_parser("mod")
    m.add_argument("klasor")
    m.add_argument("yeni_mod")
    m.add_argument("--not", dest="not_", default="")
    for ad in ("sonraki", "goster"):
        alt.add_parser(ad).add_argument("klasor")
    return ap


def _calistir(args) -> int:
    if args.komut == "baslat":
        baslat(args.klasor, args.mod, args.is_tanimi, args.kol)
    elif args.komut == "kol":
        kol_degistir(args.klasor, args.yeni_kol, args.not_)
    elif args.komut == "olay":
        olay_ekle(args.klasor, args.hat, args.metin, args.cikti)
    elif args.komut == "asama":
        asama(args.klasor, args.no, args.durum, args.cikti, args.not_)
    elif args.komut == "denetim":
        denetim(args.klasor, args.nokta, args.dosya, args.karar, args.tur,
                args.bulgu, args.not_, args.avukat_talimati)
    elif args.komut == "evrak":
        evrak(args.klasor, args.kaynak)
    elif args.komut == "mod":
        mod_degistir(args.klasor, args.yeni_mod, args.not_)
    if args.komut == "sonraki":
        durum = yukle(args.klasor)
        sorun = engel(durum)
        if sorun:
            print(f"ENGEL: {sorun}")
            return 1
        siradaki = sonraki(durum)
        if durum["mod"] == "secilmedi":
            print("MOD SEÇİLMEDİ — `/dilekce` veya `tam akış` ile başlatın")
        else:
            print(f"ASAMA {siradaki}: {ASAMA_ADLARI[siradaki]}" if siradaki is not None
                  else "TAMAMLANDI")
    elif args.komut == "goster":
        print(render(yukle(args.klasor)), end="")
    else:
        print(f"Kaydedildi: {Path(args.klasor) / MD_DOSYASI}")
    return 0


def main(argv: list[str]) -> int:
    for akim in (sys.stdout, sys.stderr):
        try:
            akim.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    args = _parser().parse_args(argv)
    try:
        return _calistir(args)
    except (FileNotFoundError, ValueError) as hata:
        print(f"HATA: {hata}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
