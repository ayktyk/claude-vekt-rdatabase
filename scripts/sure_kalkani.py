#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""sure_kalkani.py — dava klasöründe Süre Kalkanı deposu (00-Sure-Kalkani.json).

Yargı PRO 12-4-sure-takvimi satırlarını büroda saklar. Günlük pano, dava özeti ve portföy bu
depodan TÜREV görünüm alır (`kaynak: KALKAN#<satir-id>`); tarih başka dosyaya yeniden yazılmaz.
Betik süre HESAPLAMAZ ve satırın hukuki alanlarını değiştirmez: hesap `sure_hesapla`, satır
dönüşümü `sure_takvimi` (npx -y yargi-skill) ile yapılır.
Kural kaynağı: AGENTS.md -> "Beceri Haritası ve Büro İş Hatları" -> "Takip araçları".

Bir sürenin kayda geçmesi:
  npx -y yargi-skill sure_hesapla ... --json > hesap.json
  python scripts/sure_kalkani.py girdi <dava-klasoru> --satir-id <dava-id>:<islem>[:<olay>] --hesap hesap.json --cikti girdi.json
  npx -y yargi-skill sure_takvimi girdi.json > satir.json
  python scripts/sure_kalkani.py kaydet <dava-klasoru> satir.json

Kullanım:
  python scripts/sure_kalkani.py girdi   <dava-klasoru> --satir-id <id> --hesap <hesap.json> [--cikti <girdi.json>]
                                         [--buro-hedefi YYYY-AA-GG --gerekce "<metin>"] [--bugun YYYY-AA-GG]
                                         [--arsivden-cikar]
  python scripts/sure_kalkani.py kaydet  <dava-klasoru> <satir.json>
  python scripts/sure_kalkani.py arsivle <dava-klasoru> <satir-id> --not "<ne yapıldı>"
  python scripts/sure_kalkani.py senkron <dava-klasoru> <satir-id> --kayit "<takvim etkinlik kimliği>"
  python scripts/sure_kalkani.py liste   [--dava <dava-klasoru>] [--gun 30] [--bugun YYYY-AA-GG] [--json]
exit 0 = tamam, 1 = hata veya reddedilen kayıt, 2 = kullanım hatası.
JSON dosyaları UTF-8, BOM'lu UTF-8 veya UTF-16 (PowerShell 5.1 yönlendirmesi) olarak okunur.

12-4 sözleşmesinden gelen kurallar:
- Satır silinmez. Aynı satir_id güncellenir, önceki sürüm `gecmis`e taşınır. `girdi` güncel satırı
  `onceki` olarak ekler; `kaydet`, yeni satırın tam olarak depodaki güncel satırdan üretildiğini
  denetler (geçmiş öneki korunmuş olmalı, yeni geçmiş kaydı güncel satırla aynı olmalı). Arada arşiv,
  senkron veya başka bir güncelleme olduysa kayıt reddedilir; büroya ait alanlar geçmişte korunur.
- Kalan gün ve eşik (T-30 bilgi, T-7 uyarı, T-1 kritik, T-0 bugün, geçti) yalnız `hukuki_son_gun`
  dolu satırda hesaplanır. Koşullu hesaba eşik ve ufuk uygulanmaz; her zaman "koşullu" etiketiyle ayrı
  gösterilir (başlangıcı teyitsiz tarih gerçekte daha erken olabilir).
- Büro tedbir tarihi hukuki süre değildir, gerekçesiz yazılmaz ve son günden sonraya konulamaz.
- Dış takvime yazılmadıkça `dis_senkron` YAPILMADI kalır; `senkron` yalnız gerçek etkinlik kimliğiyle.
  Senkronlu satırın son günü değişirse durum ESKİ olur: takvimdeki etkinlik güncellenmelidir.
- Arşivli satır `--arsivden-cikar` verilmeden yeniden hesaplanmaz.
- Kayıt olmaması "süre yok" demek değildir; `liste` kaç davada kayıt bulunduğunu, okunamayan depo ve
  satırları ayrıca yazar; tek bir bozuk satır panonun geri kalanını düşürmez.
"""
from __future__ import annotations

import argparse
import copy
import json
import os
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path

DOSYA = "00-Sure-Kalkani.json"
SURUM = 1
ISO_GUN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
ZORUNLU = ("satir_id", "kaynak", "durum", "hukuki_son_gun", "kosullu_hesap", "gecmis", "dis_senkron")
ARSIV = "arşiv"
IZ_ALANLARI = ("hukuki_son_gun", "buro_tedbir_tarihi", "durum")
BURO_ALANLARI = ("arsiv", "dis_kayit", "dis_senkron")
OKUMA_HATALARI = (ValueError, TypeError, AttributeError, json.JSONDecodeError, OSError, UnicodeDecodeError)


def _simdi() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def _iso_mu(deger) -> bool:
    if not isinstance(deger, str) or not ISO_GUN.match(deger):
        return False
    try:
        date.fromisoformat(deger)
    except ValueError:
        return False
    return True


def _gun(deger, ad: str) -> date:
    if not _iso_mu(deger):
        raise ValueError(f"{ad} YYYY-AA-GG biçiminde geçerli bir tarih olmalı: {deger!r}")
    return date.fromisoformat(deger)


def _json_oku(yol):
    ham = Path(yol).read_bytes()
    metin = ham.decode("utf-16") if ham.startswith((b"\xff\xfe", b"\xfe\xff")) else ham.decode("utf-8-sig")
    return json.loads(metin)


def _klasor(klasor) -> Path:
    hedef = Path(klasor)
    if not hedef.is_dir():
        raise FileNotFoundError(f"dava klasörü yok: {hedef} (`python scripts/paths.py dava <dava-id>`)")
    return hedef


def yukle(klasor) -> dict:
    yol = Path(klasor) / DOSYA
    if not yol.exists():
        return {"surum": SURUM, "dava": Path(klasor).name, "satirlar": []}
    if not yol.is_file():
        raise ValueError(f"Süre Kalkanı deposu dosya değil: {yol}")
    depo = _json_oku(yol)
    if not isinstance(depo, dict) or not isinstance(depo.get("satirlar"), list):
        raise ValueError(f"Süre Kalkanı deposu bozuk: {yol}")
    surum = depo.get("surum", 1)
    if not isinstance(surum, int) or surum > SURUM:
        raise ValueError(f"depo sürümü okunamadı veya daha yeni bir sure_kalkani.py ile yazılmış: {yol}")
    return depo


def _yaz(klasor, depo: dict) -> Path:
    depo.update(surum=SURUM, dava=Path(klasor).name, guncelleme=_simdi())
    yol = Path(klasor) / DOSYA
    gecici = yol.with_name(yol.name + ".tmp")
    try:
        gecici.write_text(json.dumps(depo, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        os.replace(gecici, yol)
    except OSError as hata:
        try:
            gecici.unlink()
        except OSError:
            pass
        raise ValueError(f"depo yazılamadı ({yol}): {hata}") from hata
    return yol


def _bul(depo: dict, satir_id: str) -> dict | None:
    return next((s for s in depo["satirlar"] if isinstance(s, dict) and s.get("satir_id") == satir_id), None)


def _kosullu_tarih(satir: dict):
    k = satir.get("kosullu_hesap")
    return k.get("tarih") if isinstance(k, dict) else None


def _iz(satir: dict) -> tuple:
    return tuple(satir.get(a) for a in IZ_ALANLARI) + (_kosullu_tarih(satir),)


def girdi(klasor, satir_id: str, hesap: dict, bugun: str = "", buro_hedefi: str = "",
          gerekce: str = "", arsivden_cikar: bool = False) -> dict:
    """sure_takvimi girdisi: depodaki güncel satır `onceki` olarak eklenir (geçmiş kaybolmasın)."""
    _klasor(klasor)
    satir_id = (satir_id or "").strip()
    if not satir_id:
        raise ValueError("satir_id boş olamaz")
    if isinstance(hesap, dict) and "hata" in hesap and "islem" not in hesap:
        raise ValueError(f"sure_hesapla hatası: {hesap['hata']}")
    if not isinstance(hesap, dict) or "islem" not in hesap:
        raise ValueError("hesap `sure_hesapla --json` çıktısı olmalı (islem alanı yok)")
    sonuc = {"hesap": hesap, "satir_id": satir_id,
             "bugun": _gun(bugun, "bugun").isoformat() if bugun else date.today().isoformat()}
    if buro_hedefi:
        hedef = _gun(buro_hedefi, "buro_hedefi")
        if not gerekce.strip():
            raise ValueError("büro tedbir hedefi gerekçesiz yazılmaz (--gerekce)")
        son = hesap.get("son_gun")
        if _iso_mu(son) and hedef > date.fromisoformat(son):
            raise ValueError(f"büro tedbir hedefi hesaplanan son günden ({son}) sonraya konulamaz")
        sonuc.update(buro_hedefi=hedef.isoformat(), hedef_gerekcesi=gerekce.strip())
    onceki = _bul(yukle(klasor), satir_id)
    if onceki is not None:
        if onceki.get("durum") == ARSIV and not arsivden_cikar:
            raise ValueError("satır arşivde; yeniden hesaplamak için --arsivden-cikar verin "
                             "(yeni bir süre için yeni satir_id kullanın)")
        sonuc["onceki"] = onceki
    return sonuc


def _satir_dogrula(satir) -> None:
    if isinstance(satir, dict) and "hata" in satir and "satir_id" not in satir:
        raise ValueError(f"sure_takvimi hatası: {satir['hata']}")
    eksik = [a for a in ZORUNLU if not isinstance(satir, dict) or a not in satir]
    if eksik:
        raise ValueError(f"sure_takvimi satırı değil; eksik alan: {', '.join(eksik)}")
    if satir["kaynak"] != f"KALKAN#{satir['satir_id']}":
        raise ValueError("kaynak alanı KALKAN#<satir_id> olmalı")
    if not isinstance(satir["gecmis"], list):
        raise ValueError("gecmis liste olmalı")
    if satir["hukuki_son_gun"] is not None and not _iso_mu(satir["hukuki_son_gun"]):
        raise ValueError(f"hukuki_son_gun geçerli tarih değil: {satir['hukuki_son_gun']!r}")
    k = satir["kosullu_hesap"]
    if k is not None and (not isinstance(k, dict) or (k.get("tarih") is not None and not _iso_mu(k.get("tarih")))):
        raise ValueError("kosullu_hesap nesne olmalı ve tarihi YYYY-AA-GG olmalı")
    hedef = satir.get("buro_tedbir_tarihi")
    if hedef is not None:
        if not _iso_mu(hedef):
            raise ValueError(f"buro_tedbir_tarihi geçerli tarih değil: {hedef!r}")
        if not str(satir.get("hedef_gerekcesi") or "").strip():
            raise ValueError("büro tedbir hedefi gerekçesiz yazılmaz")
        son = satir["hukuki_son_gun"] or _kosullu_tarih(satir)
        if son and hedef > son:
            raise ValueError(f"büro tedbir hedefi ({hedef}) son günden ({son}) sonraya konulamaz")


def kaydet(klasor, satir: dict) -> Path:
    """sure_takvimi çıktısını depoya yazar; yalnız depodaki güncel satırdan üretilmiş satırı kabul eder."""
    _klasor(klasor)
    _satir_dogrula(satir)
    satir = copy.deepcopy(satir)
    depo = yukle(klasor)
    eski = _bul(depo, satir["satir_id"])
    if eski is None:
        depo["satirlar"].append(satir)
        return _yaz(klasor, depo)
    eski_g, yeni_g = eski.get("gecmis") or [], satir["gecmis"]
    n = len(eski_g)
    if len(yeni_g) < n or [_iz(g) for g in yeni_g[:n]] != [_iz(g) for g in eski_g]:
        raise ValueError("yeni satır depodaki geçmişi korumuyor; `girdi` ile güncel satırdan yeniden üretin")
    if len(yeni_g) == n:
        if _iz(satir) != _iz(eski):
            raise ValueError("satır değişmiş ama eski sürüm geçmişe taşınmamış; `girdi` ile yeniden üretin")
    elif len(yeni_g) == n + 1:
        if _iz(yeni_g[-1]) != _iz(eski):
            raise ValueError("satır bu arada değişmiş (arşiv, senkron veya başka güncelleme); "
                             "`girdi` ile güncel satırdan yeniden üretin")
        for alan in BURO_ALANLARI:
            if alan in eski:
                yeni_g[-1][alan] = copy.deepcopy(eski[alan])
    else:
        raise ValueError("beklenmeyen geçmiş uzunluğu; `girdi` ile güncel satırdan yeniden üretin")
    yeni_g[:n] = copy.deepcopy(eski_g)
    kayit = eski.get("dis_kayit")
    if isinstance(kayit, dict) and eski.get("dis_senkron") in ("YAPILDI", "ESKİ"):
        satir["dis_kayit"] = copy.deepcopy(kayit)
        ayni = satir.get("hukuki_son_gun") is not None and satir.get("hukuki_son_gun") == kayit.get("etkinlik_tarihi")
        satir["dis_senkron"] = "YAPILDI" if ayni else "ESKİ"
    depo["satirlar"][depo["satirlar"].index(eski)] = satir
    return _yaz(klasor, depo)


def _surumle(klasor, satir_id: str, degisiklik: dict) -> Path:
    depo = yukle(_klasor(klasor))
    satir = _bul(depo, satir_id)
    if satir is None:
        raise ValueError(f"satır yok: {satir_id}")
    onceki = {k: copy.deepcopy(v) for k, v in satir.items() if k != "gecmis"}
    satir.setdefault("gecmis", []).append(onceki)
    satir.update(degisiklik)
    return _yaz(klasor, depo)


def arsivle(klasor, satir_id: str, not_: str) -> Path:
    if not (not_ or "").strip():
        raise ValueError("arşiv gerekçesi zorunlu (--not), ör. 'cevap dilekçesi UYAP'tan gönderildi'")
    return _surumle(klasor, satir_id, {"durum": ARSIV, "esik": None,
                                       "arsiv": {"tarih": _simdi(), "not": not_.strip()}})


def senkron(klasor, satir_id: str, kayit: str) -> Path:
    if not (kayit or "").strip():
        raise ValueError("dış takvim etkinlik kimliği zorunlu (--kayit); kimlik yoksa senkron YAPILMADI kalır")
    satir = _bul(yukle(_klasor(klasor)), satir_id)
    if satir is None:
        raise ValueError(f"satır yok: {satir_id}")
    if not satir.get("hukuki_son_gun"):
        raise ValueError("yalnız kesin son günü olan satır dış takvime işlenir")
    return _surumle(klasor, satir_id, {"dis_senkron": "YAPILDI",
                                       "dis_kayit": {"kimlik": kayit.strip(), "tarih": _simdi(),
                                                     "etkinlik_tarihi": satir["hukuki_son_gun"]}})


def esik(kalan: int) -> str:
    if kalan < 0:
        return "geçti"
    if kalan == 0:
        return "T-0 bugün"
    if kalan == 1:
        return "T-1 kritik"
    if kalan <= 7:
        return "T-7 uyarı"
    if kalan <= 30:
        return "T-30 bilgi"
    return "—"


def _satir_isle(sonuc: dict, klasor: Path, s, bugun: date, gun: int) -> None:
    if not isinstance(s, dict):
        raise ValueError("satır nesne değil")
    if s.get("durum") == ARSIV:
        return
    ortak = {"dava": klasor.name, "islem": s.get("islem", ""), "durum": s.get("durum", ""),
             "tedbir_hedefi": s.get("buro_tedbir_tarihi"), "kaynak": s.get("kaynak", "")}
    if s.get("kosullu_hesap") is not None and not isinstance(s.get("kosullu_hesap"), dict):
        raise ValueError("kosullu_hesap nesne değil")
    hukuki, kosullu = s.get("hukuki_son_gun"), _kosullu_tarih(s)
    tedbir_yakin = bool(ortak["tedbir_hedefi"]) and (_gun(ortak["tedbir_hedefi"], "buro_tedbir_tarihi") - bugun).days <= gun
    if hukuki:
        kalan = (_gun(hukuki, "hukuki_son_gun") - bugun).days
        if kalan <= gun or tedbir_yakin:
            sonuc["kesin"].append({**ortak, "hukuki_son_gun": hukuki, "kalan_gun": kalan, "esik": esik(kalan),
                                   "dis_senkron": s.get("dis_senkron")})
    elif kosullu:
        _gun(kosullu, "kosullu_hesap.tarih")
        sonuc["kosullu"].append({**ortak, "kosullu_tarih": kosullu,
                                 "baslangic": (s.get("kosullu_hesap") or {}).get("baslangic_durumu", "")})
    else:
        sonuc["tarihsiz"].append(ortak)


def liste(kok, bugun: date, gun: int = 30, dava: str = "") -> dict:
    """Türev görünüm: kesin, koşullu ve tarihsiz satırlar; okunamayan depo ve satırlar ayrıca yazılır."""
    if dava:
        klasorler = [_klasor(dava)]
    else:
        kok_yolu = Path(kok)
        if not kok_yolu.is_dir():
            raise FileNotFoundError(f"aktif davalar kökü yok: {kok_yolu}")
        klasorler = sorted(p for p in kok_yolu.iterdir() if p.is_dir())
    sonuc = {"bugun": bugun.isoformat(), "ufuk_gun": gun, "taranan": len(klasorler), "kayitli": 0,
             "kesin": [], "kosullu": [], "tarihsiz": [], "okunamadi": []}
    for klasor in klasorler:
        if not (klasor / DOSYA).exists():
            continue
        try:
            depo = yukle(klasor)
        except OKUMA_HATALARI as hata:
            sonuc["okunamadi"].append(f"{klasor.name}: {hata}")
            continue
        sonuc["kayitli"] += 1
        for s in depo["satirlar"]:
            try:
                _satir_isle(sonuc, klasor, s, bugun, gun)
            except (ValueError, TypeError, AttributeError) as hata:
                kimlik = s.get("satir_id") if isinstance(s, dict) else "?"
                sonuc["okunamadi"].append(f"{klasor.name} · satır {kimlik}: {hata}")
    sonuc["kesin"].sort(key=lambda r: r["kalan_gun"])
    sonuc["kosullu"].sort(key=lambda r: r["kosullu_tarih"])
    return sonuc


def _takvim(deger) -> str:
    return "ESKİ — etkinliği güncelleyin" if deger == "ESKİ" else str(deger)


def _md(sonuc: dict) -> str:
    satirlar = [f"## Süre Kalkanı · {sonuc['bugun']} · ufuk {sonuc['ufuk_gun']} gün", "",
                f"Taranan dava klasörü: {sonuc['taranan']} · Süre Kalkanı kaydı olan: {sonuc['kayitli']}. "
                "Kaydı olmayan davada süre yok sayılmaz.", ""]
    if sonuc["okunamadi"]:
        satirlar += ["**OKUNAMAYAN DEPO VEYA SATIR (bu süreler görünmüyor):**"]
        satirlar += [f"- {x}" for x in sonuc["okunamadi"]] + [""]
    satirlar += ["### Kesin son günler", "",
                 "| Dava | İşlem | Hukuki son gün | Kalan | Eşik | Tedbir hedefi | Dış takvim | Kaynak |",
                 "|---|---|---|---|---|---|---|---|"]
    satirlar += [f"| {r['dava']} | {r['islem']} | {r['hukuki_son_gun']} | {r['kalan_gun']} | {r['esik']} | "
                 f"{r['tedbir_hedefi'] or '—'} | {_takvim(r['dis_senkron'])} | {r['kaynak']} |" for r in sonuc["kesin"]]
    satirlar += ["", "### Koşullu hesaplar (kesin son gün DEĞİL; başlangıç teyidi bekliyor; ufuk uygulanmaz)", "",
                 "| Dava | İşlem | Koşullu tarih | Başlangıç | Tedbir hedefi | Kaynak |", "|---|---|---|---|---|---|"]
    satirlar += [f"| {r['dava']} | {r['islem']} | {r['kosullu_tarih']} | {r['baslangic']} | "
                 f"{r['tedbir_hedefi'] or '—'} | {r['kaynak']} |" for r in sonuc["kosullu"]]
    satirlar += ["", "### Tarihsiz satırlar (ara karar, gün sayısı veya başlangıç delili bekleniyor)", "",
                 "| Dava | İşlem | Durum | Tedbir hedefi | Kaynak |", "|---|---|---|---|---|"]
    satirlar += [f"| {r['dava']} | {r['islem']} | {r['durum']} | {r['tedbir_hedefi'] or '—'} | {r['kaynak']} |"
                 for r in sonuc["tarihsiz"]]
    return "\n".join(satirlar) + "\n"


def _parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(prog="sure_kalkani.py", description="Süre Kalkanı deposu (00-Sure-Kalkani.json)")
    alt = ap.add_subparsers(dest="komut", required=True)
    g = alt.add_parser("girdi")
    g.add_argument("klasor")
    g.add_argument("--satir-id", required=True)
    g.add_argument("--hesap", required=True)
    g.add_argument("--cikti", default="")
    g.add_argument("--buro-hedefi", default="")
    g.add_argument("--gerekce", default="")
    g.add_argument("--bugun", default="")
    g.add_argument("--arsivden-cikar", action="store_true")
    k = alt.add_parser("kaydet")
    k.add_argument("klasor")
    k.add_argument("satir")
    a = alt.add_parser("arsivle")
    a.add_argument("klasor")
    a.add_argument("satir_id")
    a.add_argument("--not", dest="not_", required=True)
    s = alt.add_parser("senkron")
    s.add_argument("klasor")
    s.add_argument("satir_id")
    s.add_argument("--kayit", required=True)
    li = alt.add_parser("liste")
    li.add_argument("--dava", default="")
    li.add_argument("--kok", default="")
    li.add_argument("--gun", type=int, default=30)
    li.add_argument("--bugun", default="")
    li.add_argument("--json", action="store_true")
    return ap


def _calistir(args) -> int:
    if args.komut == "girdi":
        veri = girdi(args.klasor, args.satir_id, _json_oku(args.hesap), args.bugun, args.buro_hedefi,
                     args.gerekce, args.arsivden_cikar)
        metin = json.dumps(veri, ensure_ascii=False, indent=2)
        if args.cikti:
            Path(args.cikti).write_text(metin + "\n", encoding="utf-8")
            print(f"Yazıldı: {args.cikti}")
        else:
            print(metin)
        return 0
    if args.komut == "liste":
        if args.kok:
            kok = args.kok
        else:
            sys.path.insert(0, str(Path(__file__).resolve().parent))
            from paths import aktif_davalar
            kok = aktif_davalar()
        bugun = _gun(args.bugun, "bugun") if args.bugun else date.today()
        sonuc = liste(kok, bugun, args.gun, args.dava)
        print(json.dumps(sonuc, ensure_ascii=False, indent=2) if args.json else _md(sonuc).rstrip("\n"))
        return 0
    if args.komut == "kaydet":
        yol = kaydet(args.klasor, _json_oku(args.satir))
    elif args.komut == "arsivle":
        yol = arsivle(args.klasor, args.satir_id, args.not_)
    else:
        yol = senkron(args.klasor, args.satir_id, args.kayit)
    print(f"Kaydedildi: {yol}")
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
    except (FileNotFoundError, ValueError, json.JSONDecodeError, OSError, UnicodeDecodeError) as hata:
        print(f"HATA: {hata}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
