şu# VEKTORDB PIPELINE -- SIFIRDAN YENIDEN KURULUM TALIMATI

Bu dosya Codex (Antigravity) icin yazilmistir.
Bu talimatlari sirayla uygula. Hicbir adimi atlama.
Yorum satiri ekleme, emoji kullanma, fazla aciklama yapma.
Sadece kodu yaz, dosyalari olustur, testleri calistir.

---

## ON KOSUL: Mevcut Vektor DB'yi Sil

Mevcut ChromaDB verileri bozuk (encoding hatali OCR ciktilari, mojibake Turkce karakterler).
Kullanilabilir veri yok. Sifirdan basliyoruz.

```bash
# Eski vektor DB'yi yedekle ve sil
mv D:\hukuk-vektordb\vektor-db D:\hukuk-vektordb\vektor-db-YEDEK-$(date +%Y%m%d)
mkdir -p D:\hukuk-vektordb\vektor-db

# Eski islenmis verileri de temizle
mv D:\hukuk-vektordb\islenmis D:\hukuk-vektordb\islenmis-YEDEK-$(date +%Y%m%d)
mkdir -p D:\hukuk-vektordb\islenmis
```

---

## KLASOR YAPISI (Guncellenmis)

Mevcut `D:\hukuk-vektordb\` klasorunu su yapiya getir:

```
D:\hukuk-vektordb\
├── pdf-kaynak/                  ← Ham PDF'ler (degismiyor)
│   ├── doktrin/                 ← Kitaplar
│   ├── buro-arsivi/             ← Eski dilekceler, ihtarnameler
│   ├── mevzuat/                 ← (Bos kalabilir -- MCP'den cekilecek)
│   └── kararlar/                ← (Bos kalabilir -- MCP'den cekilecek)
├── markdown-temiz/              ← YENi: OCR/cikarma sonrasi temiz MD dosyalari
│   ├── doktrin/
│   ├── buro-arsivi/
│   ├── mevzuat/
│   └── kararlar/
├── islenmis/                    ← Chunked JSON (embedding oncesi)
├── vektor-db/                   ← ChromaDB dosyalari
├── mcp-sunucu/                  ← MCP sunucu kodu
├── pipeline/                    ← YENI: Tum pipeline scriptleri
│   ├── 01-ocr-gemini.py
│   ├── 02-pdf-dijital.py
│   ├── 03-mcp-cek.py
│   ├── 04-parcala.py
│   ├── 05-yukle.py
│   └── utils.py
├── loglar/
├── dosya-izleyici.py
└── izleyici-baslat.bat
```

Eksik klasorleri olustur:

```bash
mkdir -p D:\hukuk-vektordb\{markdown-temiz/{doktrin,buro-arsivi,mevzuat,kararlar},pipeline}
```

---

## ADIM 1: Gerekli Paketleri Kur

```bash
pip install pymupdf chromadb sentence-transformers fastmcp tqdm google-generativeai python-docx Pillow --break-system-packages
```

Not: `google-generativeai` Gemini API icin. Kullanici API key'ini `GEMINI_API_KEY` environment variable olarak ayarlayacak.

---

## ADIM 2: Yardimci Fonksiyonlar -- `pipeline/utils.py`

Bu dosyayi olustur: `D:\hukuk-vektordb\pipeline\utils.py`

```python
"""
Tum pipeline scriptlerinin kullandigi ortak fonksiyonlar.
"""

import re
import hashlib
from pathlib import Path
from datetime import datetime


def temizle(metin: str) -> str:
    """
    OCR veya PDF ciktisindan gelen ham metni temizler.
    - Fazla bosluk ve satir sonlarini normalize eder
    - Sayfa ustbilgi/altbilgi kaliplarini siler
    - Mojibake karakterleri duzeltir
    """
    if not metin:
        return ""

    # Mojibake duzeltme (Latin-1 olarak yanlis yorumlanmis UTF-8)
    mojibake_map = {
        "Ã¶": "ö", "Ã–": "Ö", "Ã¼": "ü", "Ãœ": "Ü",
        "Ã§": "ç", "Ã‡": "Ç", "ÄŸ": "ğ", "Äž": "Ğ",
        "Ä±": "ı", "Ä°": "İ", "ÅŸ": "ş", "Åž": "Ş",
    }
    for bozuk, dogru in mojibake_map.items():
        metin = metin.replace(bozuk, dogru)

    # Sayfa numarasi kaliplari
    metin = re.sub(r'\n\s*-?\s*\d{1,4}\s*-?\s*\n', '\n', metin)
    metin = re.sub(r'\n\s*Sayfa\s+\d+\s*/?\s*\d*\s*\n', '\n', metin, flags=re.IGNORECASE)

    # Ustbilgi/altbilgi tekrarlari (ayni satir 3+ kez geciyorsa muhtemelen header/footer)
    satirlar = metin.split('\n')
    sayac = {}
    for s in satirlar:
        s_temiz = s.strip()
        if len(s_temiz) > 5:
            sayac[s_temiz] = sayac.get(s_temiz, 0) + 1
    tekrar_satirlar = {s for s, c in sayac.items() if c >= 3}
    satirlar = [s for s in satirlar if s.strip() not in tekrar_satirlar]
    metin = '\n'.join(satirlar)

    # Fazla bos satir
    metin = re.sub(r'\n{3,}', '\n\n', metin)
    # Satir basindaki/sonundaki bosluk
    metin = '\n'.join(s.rstrip() for s in metin.split('\n'))

    return metin.strip()


def dosya_hash(yol: str) -> str:
    """Dosyanin MD5 hash'ini dondurur (tekrar isleme kontrolu icin)."""
    h = hashlib.md5()
    with open(yol, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()


def kaynak_tipi_belirle(dosya_adi: str, ust_klasor: str) -> str:
    """
    Dosya yoluna gore kaynak tipini belirler.
    Donuş: 'doktrin' | 'buro_arsivi' | 'mevzuat' | 'karar'
    """
    ust = ust_klasor.lower()
    if 'doktrin' in ust or 'kitap' in ust:
        return 'doktrin'
    elif 'buro' in ust or 'arsiv' in ust or 'dilekce' in ust:
        return 'buro_arsivi'
    elif 'mevzuat' in ust or 'kanun' in ust or 'yonetmelik' in ust:
        return 'mevzuat'
    elif 'karar' in ust or 'yargi' in ust or 'ictihat' in ust:
        return 'karar'
    else:
        return 'doktrin'  # varsayilan


def tarih_damgasi() -> str:
    return datetime.now().strftime("%Y-%m-%d_%H-%M")


def guvenli_dosya_adi(ad: str) -> str:
    """Turkce ve ozel karakterleri dosya adi icin guvenli hale getirir."""
    donusum = {
        'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U',
    }
    for tr, en in donusum.items():
        ad = ad.replace(tr, en)
    ad = re.sub(r'[^\w\s-]', '', ad)
    ad = re.sub(r'[\s]+', '-', ad)
    return ad.lower().strip('-')
```

---

## ADIM 3: Gemini OCR Script -- `pipeline/01-ocr-gemini.py`

Bu dosyayi olustur: `D:\hukuk-vektordb\pipeline\01-ocr-gemini.py`

Bu script taranmis PDF'leri (kitap taramasi, ekran goruntusu) sayfa sayfa
Gemini API'ye gonderir, temiz Turkce metin alir ve MD olarak kaydeder.

```python
"""
Taranmis PDF -> Gemini Vision OCR -> Temiz Markdown
Kullanim: python 01-ocr-gemini.py --kaynak ../pdf-kaynak/doktrin --cikti ../markdown-temiz/doktrin
"""

import fitz  # pymupdf
import google.generativeai as genai
import os
import sys
import time
import argparse
from pathlib import Path
from tqdm import tqdm
from PIL import Image
import io

sys.path.append(str(Path(__file__).parent))
from utils import temizle, dosya_hash, guvenli_dosya_adi, tarih_damgasi


# --- Ayarlar ---
GEMINI_MODEL = "gemini-2.0-flash"  # hizli ve ucuz, OCR icin yeterli
MAX_SAYFA_BATCH = 5  # ayni anda kac sayfa gonderilecek (maliyet kontrolu)
BEKLEME_SURESI = 1.0  # API rate limit icin saniye


def pdf_sayfa_goruntu(pdf_yolu: str, sayfa_no: int, dpi: int = 200) -> bytes:
    """PDF sayfasini PNG goruntu olarak dondurur."""
    doc = fitz.open(pdf_yolu)
    sayfa = doc[sayfa_no]
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = sayfa.get_pixmap(matrix=mat)
    return pix.tobytes("png")


def gemini_ocr(goruntu_bytes: bytes, sayfa_no: int, kitap_adi: str) -> str:
    """Tek sayfa goruntusunu Gemini'ye gonderir, temiz metin alir."""
    model = genai.GenerativeModel(GEMINI_MODEL)

    prompt = f"""Bu goruntu bir Turkce hukuk kitabinin {sayfa_no + 1}. sayfasidir.
Kitap adi: {kitap_adi}

GOREV:
1. Sayfadaki TUM metni oku ve yazdir.
2. Baslik, alt baslik, madde numarasi gibi yapilari koru.
3. Dipnotlari [Dipnot X] seklinde isaretle.
4. Tablo varsa Markdown tablo formatinda yaz.
5. Sayfa numarasini, ustbilgiyi ve altbilgiyi YAZMA.
6. Okunamayan kisimlar icin [okunamadi] yaz.
7. Yorum ekleme, ozetle deme -- sadece sayfadaki metni dondur.
8. Turkce karakterleri dogru kullan (ç, ğ, ı, ö, ş, ü, İ).

SADECE sayfadaki metni dondur, baska bir sey yazma."""

    img = Image.open(io.BytesIO(goruntu_bytes))
    response = model.generate_content([prompt, img])
    return response.text


def pdf_isle(pdf_yolu: str, cikti_klasor: str):
    """Tek bir PDF'i uctan uca isler."""
    pdf_path = Path(pdf_yolu)
    kitap_adi = pdf_path.stem

    # Cikti dosyasi
    cikti_ad = guvenli_dosya_adi(kitap_adi)
    cikti_yol = Path(cikti_klasor) / f"{cikti_ad}.md"

    # Onceden islenmis mi?
    hash_dosya = Path(cikti_klasor) / f".{cikti_ad}.hash"
    mevcut_hash = dosya_hash(pdf_yolu)
    if hash_dosya.exists() and hash_dosya.read_text().strip() == mevcut_hash:
        print(f"  [ATLA] {kitap_adi} -- zaten islenmis, degismemis")
        return

    doc = fitz.open(pdf_yolu)
    toplam_sayfa = len(doc)
    print(f"  [ISLE] {kitap_adi} -- {toplam_sayfa} sayfa")

    tum_metin = []
    tum_metin.append(f"# {kitap_adi}\n")
    tum_metin.append(f"_Kaynak: {pdf_path.name} | Isleme: {tarih_damgasi()} | Sayfa: {toplam_sayfa}_\n")
    tum_metin.append("---\n")

    for sayfa_no in tqdm(range(toplam_sayfa), desc=f"  {kitap_adi[:30]}"):
        try:
            goruntu = pdf_sayfa_goruntu(pdf_yolu, sayfa_no)
            metin = gemini_ocr(goruntu, sayfa_no, kitap_adi)
            metin = temizle(metin)

            if len(metin) > 50:  # bos sayfalari atla
                tum_metin.append(f"\n<!-- sayfa:{sayfa_no + 1} -->\n")
                tum_metin.append(metin)
                tum_metin.append("\n")

            time.sleep(BEKLEME_SURESI)

        except Exception as e:
            print(f"  [HATA] Sayfa {sayfa_no + 1}: {e}")
            tum_metin.append(f"\n<!-- sayfa:{sayfa_no + 1} -- HATA: {e} -->\n")
            time.sleep(BEKLEME_SURESI * 2)

    # Kaydet
    cikti_yol.parent.mkdir(parents=True, exist_ok=True)
    cikti_yol.write_text('\n'.join(tum_metin), encoding='utf-8')
    hash_dosya.write_text(mevcut_hash, encoding='utf-8')
    print(f"  [TAMAM] {cikti_yol}")


def main():
    parser = argparse.ArgumentParser(description="Taranmis PDF -> Gemini OCR -> Markdown")
    parser.add_argument("--kaynak", required=True, help="PDF klasoru")
    parser.add_argument("--cikti", required=True, help="MD cikti klasoru")
    args = parser.parse_args()

    # Gemini API key kontrolu
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("HATA: GEMINI_API_KEY environment variable ayarlanmamis.")
        print("Ayarla: set GEMINI_API_KEY=senin_api_keyin")
        sys.exit(1)
    genai.configure(api_key=api_key)

    kaynak = Path(args.kaynak)
    if not kaynak.exists():
        print(f"HATA: Klasor bulunamadi: {kaynak}")
        sys.exit(1)

    pdf_dosyalar = list(kaynak.glob("**/*.pdf"))
    print(f"\n{len(pdf_dosyalar)} PDF bulundu: {kaynak}\n")

    for pdf in sorted(pdf_dosyalar):
        pdf_isle(str(pdf), args.cikti)

    print(f"\nBitti. Ciktilar: {args.cikti}")


if __name__ == "__main__":
    main()
```

---

## ADIM 4: Dijital PDF Cikarma -- `pipeline/02-pdf-dijital.py`

Bu script zaten secilebilir metni olan PDF'ler icindir (OCR gereksiz).

Bu dosyayi olustur: `D:\hukuk-vektordb\pipeline\02-pdf-dijital.py`

```python
"""
Dijital PDF (secilebilir metin) -> Markdown
Kullanim: python 02-pdf-dijital.py --kaynak ../pdf-kaynak/buro-arsivi --cikti ../markdown-temiz/buro-arsivi
"""

import fitz
import sys
import argparse
from pathlib import Path
from tqdm import tqdm

sys.path.append(str(Path(__file__).parent))
from utils import temizle, dosya_hash, guvenli_dosya_adi, tarih_damgasi


def dijital_mi(pdf_yolu: str, orneklem: int = 5) -> bool:
    """
    PDF'in dijital (secilebilir metin) mi yoksa taranmis mi oldugunu kontrol eder.
    Ilk N sayfadan metin cikarir, yeterli metin varsa dijitaldir.
    """
    doc = fitz.open(pdf_yolu)
    toplam_karakter = 0
    kontrol = min(orneklem, len(doc))
    for i in range(kontrol):
        metin = doc[i].get_text("text")
        toplam_karakter += len(metin.strip())
    doc.close()
    # Sayfa basina ortalama 100+ karakter varsa dijital
    return (toplam_karakter / max(kontrol, 1)) > 100


def pdf_isle(pdf_yolu: str, cikti_klasor: str):
    pdf_path = Path(pdf_yolu)
    dosya_adi = guvenli_dosya_adi(pdf_path.stem)
    cikti_yol = Path(cikti_klasor) / f"{dosya_adi}.md"

    hash_dosya = Path(cikti_klasor) / f".{dosya_adi}.hash"
    mevcut_hash = dosya_hash(pdf_yolu)
    if hash_dosya.exists() and hash_dosya.read_text().strip() == mevcut_hash:
        print(f"  [ATLA] {pdf_path.stem}")
        return

    if not dijital_mi(pdf_yolu):
        print(f"  [ATLA] {pdf_path.stem} -- taranmis PDF, 01-ocr-gemini.py kullan")
        return

    doc = fitz.open(pdf_yolu)
    tum_metin = []
    tum_metin.append(f"# {pdf_path.stem}\n")
    tum_metin.append(f"_Kaynak: {pdf_path.name} | Isleme: {tarih_damgasi()} | Sayfa: {len(doc)}_\n")
    tum_metin.append("---\n")

    for sayfa_no in range(len(doc)):
        metin = doc[sayfa_no].get_text("text")
        metin = temizle(metin)
        if len(metin) > 50:
            tum_metin.append(f"\n<!-- sayfa:{sayfa_no + 1} -->\n")
            tum_metin.append(metin)
            tum_metin.append("\n")

    cikti_yol.parent.mkdir(parents=True, exist_ok=True)
    cikti_yol.write_text('\n'.join(tum_metin), encoding='utf-8')
    hash_dosya.write_text(mevcut_hash, encoding='utf-8')
    print(f"  [TAMAM] {cikti_yol}")


def main():
    parser = argparse.ArgumentParser(description="Dijital PDF -> Markdown")
    parser.add_argument("--kaynak", required=True)
    parser.add_argument("--cikti", required=True)
    args = parser.parse_args()

    kaynak = Path(args.kaynak)
    pdf_dosyalar = list(kaynak.glob("**/*.pdf"))
    print(f"\n{len(pdf_dosyalar)} PDF bulundu\n")

    for pdf in sorted(pdf_dosyalar):
        pdf_isle(str(pdf), args.cikti)


if __name__ == "__main__":
    main()
```

---

## ADIM 5: Akilli Parcalama -- `pipeline/04-parcala.py`

Bu dosyayi olustur: `D:\hukuk-vektordb\pipeline\04-parcala.py`

KRITIK: Belge tipine gore farkli parcalama stratejisi uygula.

```python
"""
Temiz Markdown -> Belge tipine gore akilli parcalama -> JSON
Kullanim: python 04-parcala.py --kaynak ../markdown-temiz --cikti ../islenmis
"""

import json
import re
import sys
import argparse
from pathlib import Path

sys.path.append(str(Path(__file__).parent))
from utils import kaynak_tipi_belirle, dosya_hash


# --- Parcalama Stratejileri ---

def parcala_mevzuat(metin: str, metadata: dict) -> list[dict]:
    """
    Mevzuat metinleri: Madde bazli parcalama.
    Her 'Madde X -' bir chunk.
    """
    chunks = []
    # Turkce mevzuat madde kaliplari
    madde_pattern = re.compile(
        r'(?=(?:^|\n)\s*(?:Madde|MADDE)\s+(\d+)\s*[-–—])',
        re.MULTILINE
    )

    parcalar = madde_pattern.split(metin)

    if len(parcalar) <= 1:
        # Madde yapisi bulunamadi, genel parcalama yap
        return parcala_genel(metin, metadata)

    # Ilk parca giris/baslik kismi
    if parcalar[0].strip():
        chunks.append({
            "metin": parcalar[0].strip(),
            "metadata": {**metadata, "bolum": "giris", "madde": "0"}
        })

    # Madde parcalari (pattern split: [oncesi, madde_no, metin, madde_no, metin, ...])
    i = 1
    while i < len(parcalar) - 1:
        madde_no = parcalar[i].strip()
        madde_metin = parcalar[i + 1].strip() if i + 1 < len(parcalar) else ""
        if madde_metin:
            chunks.append({
                "metin": f"Madde {madde_no} - {madde_metin}",
                "metadata": {**metadata, "bolum": f"madde_{madde_no}", "madde": madde_no}
            })
        i += 2

    return chunks


def parcala_karar(metin: str, metadata: dict) -> list[dict]:
    """
    Yargi kararlari: Bolum bazli parcalama.
    Tipik bolumler: taraflar, ozet, ilk derece, gerekce, sonuc.
    """
    chunks = []

    bolum_kaliplari = [
        (r'(?:ÖZET|Özet|KARAR ÖZETİ)', 'ozet'),
        (r'(?:İLK DERECE|İlk Derece|YEREL MAHKEME)', 'ilk_derece'),
        (r'(?:İSTİNAF|İstinaf|BÖLGE ADLİYE)', 'istinaf'),
        (r'(?:TEMYİZ|Temyiz|BOZMA|Bozma)', 'temyiz'),
        (r'(?:GEREKÇE|Gerekçe)', 'gerekce'),
        (r'(?:SONUÇ|Sonuç|HÜKÜM|Hüküm)', 'sonuc'),
    ]

    # Bolum sinirlarini bul
    bolumler = []
    for pattern, ad in bolum_kaliplari:
        for m in re.finditer(pattern, metin):
            bolumler.append((m.start(), ad))

    if not bolumler:
        return parcala_genel(metin, metadata)

    bolumler.sort(key=lambda x: x[0])

    # Karar basligi (ilk bolumden onceki kisim)
    if bolumler[0][0] > 100:
        chunks.append({
            "metin": metin[:bolumler[0][0]].strip(),
            "metadata": {**metadata, "bolum": "baslik"}
        })

    # Bolumleri parcala
    for idx, (baslangic, ad) in enumerate(bolumler):
        bitis = bolumler[idx + 1][0] if idx + 1 < len(bolumler) else len(metin)
        bolum_metin = metin[baslangic:bitis].strip()
        if len(bolum_metin) > 50:
            # Cok uzun bolumleri alt parcalara bol (max 1500 karakter)
            if len(bolum_metin) > 1500:
                alt_parcalar = _overlap_parcala(bolum_metin, 1200, 200)
                for i, parca in enumerate(alt_parcalar):
                    chunks.append({
                        "metin": parca,
                        "metadata": {**metadata, "bolum": f"{ad}_{i}"}
                    })
            else:
                chunks.append({
                    "metin": bolum_metin,
                    "metadata": {**metadata, "bolum": ad}
                })

    return chunks


def parcala_doktrin(metin: str, metadata: dict) -> list[dict]:
    """
    Doktrin/kitap: Baslik/alt baslik bazli parcalama.
    Markdown heading'leri (#, ##, ###) sinir olarak kullanilir.
    Heading yoksa overlap ile sabit boyut.
    """
    chunks = []

    # Markdown baslik kaliplari
    baslik_pattern = re.compile(r'^(#{1,4})\s+(.+)$', re.MULTILINE)
    basliklar = list(baslik_pattern.finditer(metin))

    if not basliklar:
        return parcala_genel(metin, metadata)

    # Basliktan basliga parcala
    for idx, match in enumerate(basliklar):
        baslangic = match.start()
        bitis = basliklar[idx + 1].start() if idx + 1 < len(basliklar) else len(metin)
        bolum_metin = metin[baslangic:bitis].strip()
        baslik_metni = match.group(2).strip()
        seviye = len(match.group(1))

        if len(bolum_metin) > 50:
            if len(bolum_metin) > 1500:
                alt_parcalar = _overlap_parcala(bolum_metin, 1200, 200)
                for i, parca in enumerate(alt_parcalar):
                    chunks.append({
                        "metin": parca,
                        "metadata": {
                            **metadata,
                            "bolum": baslik_metni,
                            "baslik_seviyesi": seviye,
                            "parca": i
                        }
                    })
            else:
                chunks.append({
                    "metin": bolum_metin,
                    "metadata": {
                        **metadata,
                        "bolum": baslik_metni,
                        "baslik_seviyesi": seviye
                    }
                })

    return chunks


def parcala_buro_arsivi(metin: str, metadata: dict) -> list[dict]:
    """
    Buro arsivi (dilekceler, ihtarnameler): Bolum bazli.
    Tipik bolumler: OLAYLAR, HUKUKİ DEĞERLENDİRME, DELİLLER, SONUC VE TALEP
    """
    chunks = []

    bolum_kaliplari = [
        (r'(?:I+\.?\s*OLAYLAR?|AÇIKLAMALAR)', 'olaylar'),
        (r'(?:I+\.?\s*HUKUKİ|HUKUKİ DEĞERLENDİRME|HUKUKİ NEDENLER)', 'hukuki_degerlendirme'),
        (r'(?:I+\.?\s*DELİLLER|DELİL LİSTESİ)', 'deliller'),
        (r'(?:SONUÇ VE TALEP|NETİCE|TALEP)', 'sonuc_talep'),
    ]

    bolumler = []
    for pattern, ad in bolum_kaliplari:
        for m in re.finditer(pattern, metin, re.IGNORECASE):
            bolumler.append((m.start(), ad))

    if not bolumler:
        # Dilekce yapisi bulunamadi, komple tek chunk
        return [{"metin": metin.strip(), "metadata": {**metadata, "bolum": "tam_metin"}}]

    bolumler.sort(key=lambda x: x[0])

    # Baslik (ilk bolumden onceki kisim)
    if bolumler[0][0] > 50:
        chunks.append({
            "metin": metin[:bolumler[0][0]].strip(),
            "metadata": {**metadata, "bolum": "baslik"}
        })

    for idx, (baslangic, ad) in enumerate(bolumler):
        bitis = bolumler[idx + 1][0] if idx + 1 < len(bolumler) else len(metin)
        bolum_metin = metin[baslangic:bitis].strip()
        if bolum_metin:
            chunks.append({
                "metin": bolum_metin,
                "metadata": {**metadata, "bolum": ad}
            })

    return chunks


def parcala_genel(metin: str, metadata: dict) -> list[dict]:
    """Yedek: overlap ile sabit boyutlu parcalama."""
    return [
        {"metin": p, "metadata": {**metadata, "bolum": f"parca_{i}"}}
        for i, p in enumerate(_overlap_parcala(metin, 1000, 150))
        if len(p.strip()) > 50
    ]


def _overlap_parcala(metin: str, boyut: int = 1000, overlap: int = 150) -> list[str]:
    """Karakter bazli overlap parcalama. Cumle sinirinda bolmeye calisir."""
    parcalar = []
    baslangic = 0
    while baslangic < len(metin):
        bitis = baslangic + boyut
        if bitis < len(metin):
            # Cumle sonunda bol
            son_nokta = metin.rfind('.', baslangic + boyut - 200, bitis + 100)
            if son_nokta > baslangic:
                bitis = son_nokta + 1
        parca = metin[baslangic:bitis].strip()
        if parca:
            parcalar.append(parca)
        baslangic = bitis - overlap
    return parcalar


# --- Ana Fonksiyon ---

STRATEJILER = {
    'mevzuat': parcala_mevzuat,
    'karar': parcala_karar,
    'doktrin': parcala_doktrin,
    'buro_arsivi': parcala_buro_arsivi,
}


def dosya_isle(md_yolu: str, cikti_klasor: str):
    md_path = Path(md_yolu)
    metin = md_path.read_text(encoding='utf-8')

    # Ust klasorden kaynak tipini belirle
    ust_klasor = md_path.parent.name
    tip = kaynak_tipi_belirle(md_path.name, ust_klasor)

    metadata = {
        "kaynak_dosya": md_path.name,
        "kaynak_tipi": tip,
        "kategori": ust_klasor,
        "orijinal_yol": str(md_path),
        "hash": dosya_hash(str(md_path)),
        "isleme_yontemi": "gemini_ocr" if "ocr" in md_path.name.lower() else "dijital",
    }

    strateji = STRATEJILER.get(tip, parcala_genel)
    chunks = strateji(metin, metadata)

    # JSON olarak kaydet
    cikti_ad = md_path.stem + ".json"
    cikti_yol = Path(cikti_klasor) / cikti_ad
    cikti_yol.parent.mkdir(parents=True, exist_ok=True)

    with open(cikti_yol, 'w', encoding='utf-8') as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"  [{tip}] {md_path.name} -> {len(chunks)} chunk")


def main():
    parser = argparse.ArgumentParser(description="Markdown -> Akilli parcalama -> JSON")
    parser.add_argument("--kaynak", required=True, help="markdown-temiz klasoru")
    parser.add_argument("--cikti", required=True, help="islenmis klasoru")
    args = parser.parse_args()

    kaynak = Path(args.kaynak)
    md_dosyalar = list(kaynak.glob("**/*.md"))
    # .hash dosyalarini filtrele
    md_dosyalar = [f for f in md_dosyalar if not f.name.startswith('.')]

    print(f"\n{len(md_dosyalar)} MD dosyasi bulundu\n")
    for md in sorted(md_dosyalar):
        dosya_isle(str(md), args.cikti)


if __name__ == "__main__":
    main()
```

---

## ADIM 6: ChromaDB Yukleme -- `pipeline/05-yukle.py`

Bu dosyayi olustur: `D:\hukuk-vektordb\pipeline\05-yukle.py`

```python
"""
Parcalanmis JSON -> Embedding -> ChromaDB
Kullanim: python 05-yukle.py --kaynak ../islenmis --db ../vektor-db
"""

import json
import sys
import argparse
from pathlib import Path
from tqdm import tqdm
import chromadb
from chromadb.utils import embedding_functions

sys.path.append(str(Path(__file__).parent))
from utils import dosya_hash


# --- Ayarlar ---
EMBEDDING_MODEL = "intfloat/multilingual-e5-large"
COLLECTION_ADI = "hukuk_kutuphanesi"
BATCH_BOYUT = 50  # ChromaDB'ye tek seferde gonderilecek chunk sayisi


def main():
    parser = argparse.ArgumentParser(description="JSON chunks -> ChromaDB")
    parser.add_argument("--kaynak", required=True, help="islenmis klasoru (JSON)")
    parser.add_argument("--db", required=True, help="ChromaDB klasoru")
    parser.add_argument("--sifirla", action="store_true", help="Mevcut collection'i sil ve yeniden olustur")
    args = parser.parse_args()

    # ChromaDB baglantisi
    client = chromadb.PersistentClient(path=args.db)

    # Embedding fonksiyonu
    # KRITIK: e5 modeli query icin "query: " prefix'i bekler
    # Bu MCP sunucusunda handle edilecek. Yukleme sirasinda "passage: " ekliyoruz.
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=EMBEDDING_MODEL
    )

    if args.sifirla:
        try:
            client.delete_collection(COLLECTION_ADI)
            print(f"[SILINDI] {COLLECTION_ADI}")
        except Exception:
            pass

    collection = client.get_or_create_collection(
        name=COLLECTION_ADI,
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"}
    )

    mevcut_sayisi = collection.count()
    print(f"Mevcut chunk sayisi: {mevcut_sayisi}")

    # JSON dosyalarini oku
    kaynak = Path(args.kaynak)
    json_dosyalar = list(kaynak.glob("**/*.json"))
    print(f"{len(json_dosyalar)} JSON dosyasi bulundu\n")

    toplam_eklenen = 0

    for json_yol in tqdm(sorted(json_dosyalar), desc="Yukleniyor"):
        with open(json_yol, 'r', encoding='utf-8') as f:
            chunks = json.load(f)

        if not chunks:
            continue

        # Batch halinde yukle
        ids = []
        documents = []
        metadatas = []

        for i, chunk in enumerate(chunks):
            metin = chunk.get("metin", "").strip()
            if len(metin) < 30:
                continue

            # e5 modeli icin "passage: " prefix'i ekle
            doc_text = f"passage: {metin}"

            chunk_id = f"{json_yol.stem}_{i}"
            meta = chunk.get("metadata", {})
            # ChromaDB metadata sadece str, int, float, bool kabul eder
            meta_temiz = {k: str(v) for k, v in meta.items()}

            ids.append(chunk_id)
            documents.append(doc_text)
            metadatas.append(meta_temiz)

        # Batch halinde ekle
        for batch_start in range(0, len(ids), BATCH_BOYUT):
            batch_end = batch_start + BATCH_BOYUT
            try:
                collection.upsert(
                    ids=ids[batch_start:batch_end],
                    documents=documents[batch_start:batch_end],
                    metadatas=metadatas[batch_start:batch_end],
                )
                toplam_eklenen += len(ids[batch_start:batch_end])
            except Exception as e:
                print(f"  [HATA] {json_yol.name} batch {batch_start}: {e}")

    print(f"\nToplam eklenen chunk: {toplam_eklenen}")
    print(f"Collection toplam: {collection.count()}")


if __name__ == "__main__":
    main()
```

---

## ADIM 7: MCP Sunucusu (Guncellenmis) -- `mcp-sunucu/sunucu.py`

Mevcut MCP sunucusunu sil ve yeniden olustur: `D:\hukuk-vektordb\mcp-sunucu\sunucu.py`

```python
"""
Hukuk Kutuphanesi MCP Sunucusu
Claude Code'un vektor DB'ye eristigi arayuz.
Hybrid search: metadata filtresi + semantik benzerlik.
"""

import os
import json
from fastmcp import FastMCP
import chromadb
from chromadb.utils import embedding_functions

DB_YOLU = os.environ.get("HUKUK_DB_YOLU", "D:\\hukuk-vektordb\\vektor-db")
EMBEDDING_MODEL = "intfloat/multilingual-e5-large"
COLLECTION_ADI = "hukuk_kutuphanesi"

mcp = FastMCP("hukuk-kutuphanesi")

# Global baglanti
_client = None
_collection = None
_ef = None


def _baglan():
    global _client, _collection, _ef
    if _client is None:
        _client = chromadb.PersistentClient(path=DB_YOLU)
        _ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=EMBEDDING_MODEL
        )
        _collection = _client.get_or_create_collection(
            name=COLLECTION_ADI,
            embedding_function=_ef,
            metadata={"hnsw:space": "cosine"}
        )


@mcp.tool()
def hukuk_ara(
    sorgu: str,
    kategori: str = "",
    kaynak_tipi: str = "",
    sonuc_sayisi: int = 10,
    min_skor: float = 0.3
) -> str:
    """
    Hukuk kutuphanesinde semantik arama yapar.

    Parametreler:
    - sorgu: Aranacak hukuki konu veya terim
    - kategori: Filtreleme (is-hukuku, medeni-hukuk, ceza-hukuku, usul-hukuku, diger)
    - kaynak_tipi: Filtreleme (doktrin, buro_arsivi, mevzuat, karar)
    - sonuc_sayisi: Dondurulecek sonuc sayisi (varsayilan 10)
    - min_skor: Minimum benzerlik skoru 0-1 arasi (varsayilan 0.3)
    """
    _baglan()

    # e5 modeli query prefix'i
    query_text = f"query: {sorgu}"

    # Metadata filtresi olustur
    where_filtre = None
    filtreler = []
    if kategori:
        filtreler.append({"kategori": kategori})
    if kaynak_tipi:
        filtreler.append({"kaynak_tipi": kaynak_tipi})

    if len(filtreler) == 1:
        where_filtre = filtreler[0]
    elif len(filtreler) > 1:
        where_filtre = {"$and": filtreler}

    try:
        sonuclar = _collection.query(
            query_texts=[query_text],
            n_results=sonuc_sayisi,
            where=where_filtre,
            include=["documents", "metadatas", "distances"]
        )
    except Exception as e:
        return json.dumps({"hata": str(e)}, ensure_ascii=False)

    # Sonuclari formatla
    cikti = []
    if sonuclar and sonuclar['documents']:
        for i, doc in enumerate(sonuclar['documents'][0]):
            mesafe = sonuclar['distances'][0][i] if sonuclar['distances'] else 1.0
            skor = 1 - mesafe  # cosine distance -> similarity

            if skor < min_skor:
                continue

            meta = sonuclar['metadatas'][0][i] if sonuclar['metadatas'] else {}

            # "passage: " prefix'ini kaldir
            metin = doc
            if metin.startswith("passage: "):
                metin = metin[9:]

            cikti.append({
                "skor": round(skor, 3),
                "metin": metin[:500],  # ilk 500 karakter
                "tam_metin": metin,
                "kaynak": meta.get("kaynak_dosya", "bilinmiyor"),
                "tip": meta.get("kaynak_tipi", ""),
                "bolum": meta.get("bolum", ""),
                "kategori": meta.get("kategori", ""),
            })

    return json.dumps(cikti, ensure_ascii=False, indent=2)


@mcp.tool()
def hukuk_istatistik() -> str:
    """Vektor veritabaninin genel istatistiklerini dondurur."""
    _baglan()
    return json.dumps({
        "toplam_chunk": _collection.count(),
        "collection": COLLECTION_ADI,
        "db_yolu": DB_YOLU,
    }, ensure_ascii=False)


if __name__ == "__main__":
    mcp.run()
```

---

## ADIM 8: .mcp.json Guncelle

Proje kokundeki `.mcp.json` dosyasini su sekilde guncelle:

```json
{
  "mcpServers": {
    "hukuk-kutuphanesi": {
      "command": "python",
      "args": ["D:\\hukuk-vektordb\\mcp-sunucu\\sunucu.py"],
      "env": {
        "HUKUK_DB_YOLU": "D:\\hukuk-vektordb\\vektor-db"
      }
    },
    "notebooklm": {
      "command": "notebooklm-mcp",
      "args": []
    }
  }
}
```

Not: Yargi MCP ve Mevzuat MCP global ayarlardaysa burada tanimlamaya gerek yok.
Degilse ekle (URL'leri avukattan al).

---

## ADIM 9: Tam Pipeline Calistirma Komutu

Kullanicinin tek seferde calistiracagi komut dizisi:

```bash
cd D:\hukuk-vektordb\pipeline

# 1. Taranmis PDF'ler icin Gemini OCR (doktrin kitaplari)
python 01-ocr-gemini.py --kaynak ../pdf-kaynak/doktrin --cikti ../markdown-temiz/doktrin

# 2. Dijital PDF'ler icin metin cikarma (buro arsivi, varsa diger)
python 02-pdf-dijital.py --kaynak ../pdf-kaynak/buro-arsivi --cikti ../markdown-temiz/buro-arsivi

# 3. Tum MD dosyalarini parcala
python 04-parcala.py --kaynak ../markdown-temiz --cikti ../islenmis

# 4. ChromaDB'ye yukle (sifirdan)
python 05-yukle.py --kaynak ../islenmis --db ../vektor-db --sifirla

# 5. Test -- basit arama
python -c "
import chromadb
from chromadb.utils import embedding_functions
c = chromadb.PersistentClient('D:\\hukuk-vektordb\\vektor-db')
ef = embedding_functions.SentenceTransformerEmbeddingFunction('intfloat/multilingual-e5-large')
col = c.get_collection('hukuk_kutuphanesi', embedding_function=ef)
print(f'Toplam chunk: {col.count()}')
r = col.query(query_texts=['query: fazla mesai ispat yuku'], n_results=3)
for i, doc in enumerate(r['documents'][0]):
    d = r['distances'][0][i]
    print(f'  [{round(1-d, 3)}] {doc[:100]}...')
"
```

---

## ADIM 10: Dosya Izleyici Guncelle

Mevcut `dosya-izleyici.py`'yi sil ve yeniden yaz.
Yeni izleyici IKI klasoru ayni anda izler:

1. `pdf-kaynak/` -- Yeni PDF atildiginda otomatik isler:
   - Dijital PDF ise pymupdf ile MD'ye cevirir
   - Taranmis PDF ise Gemini OCR'a gonderir, MD alir
   - MD dosyasini `markdown-temiz/` icine uygun alt klasore kaydeder

2. `markdown-temiz/` -- Yeni MD dusunce otomatik parcalar ve ChromaDB'ye yukler

Kullanim senaryolari:
- Istanbul Barosu Dergisi PDF'i `pdf-kaynak/kararlar/` icine at -> otomatik islenir
- Yeni doktrin kitabi `pdf-kaynak/doktrin/` icine at -> Gemini OCR -> MD -> ChromaDB
- Elle temizlenmis bir MD dosyasini `markdown-temiz/` icine at -> parcala -> yukle

Ekstra talimat gerekmez. Izleyici arka planda calisir, her sey otonom olur.

Bu dosyayi olustur: `D:\hukuk-vektordb\dosya-izleyici.py`

```python
"""
Tam otonom dosya izleyici.
Iki klasoru paralel izler:
  1. pdf-kaynak/  -> PDF gelince: tip belirle -> OCR veya metin cikart -> MD olustur
  2. markdown-temiz/ -> MD gelince: parcala -> ChromaDB'ye yukle

Baslatma: python dosya-izleyici.py
Veya: izleyici-baslat.bat cift tikla

Gerekli env: GEMINI_API_KEY (taranmis PDF'ler icin)
"""

import time
import subprocess
import sys
import os
import fitz  # pymupdf
from pathlib import Path
from datetime import datetime

# watchdog lazy import (kurulum kontrolu icin)
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("watchdog kurulu degil. Kuruluyor...")
    subprocess.run([sys.executable, "-m", "pip", "install", "watchdog",
                   "--break-system-packages"], check=True)
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler


# --- Yollar ---
PDF_KLASOR = "D:\\hukuk-vektordb\\pdf-kaynak"
MARKDOWN_KLASOR = "D:\\hukuk-vektordb\\markdown-temiz"
ISLENMIS_KLASOR = "D:\\hukuk-vektordb\\islenmis"
DB_KLASOR = "D:\\hukuk-vektordb\\vektor-db"
PIPELINE_KLASOR = "D:\\hukuk-vektordb\\pipeline"
LOG_KLASOR = "D:\\hukuk-vektordb\\loglar"


def log(mesaj: str):
    """Konsol + log dosyasina yaz."""
    zaman = datetime.now().strftime("%H:%M:%S")
    satir = f"[{zaman}] {mesaj}"
    print(satir)
    log_dosya = Path(LOG_KLASOR) / f"izleyici-{datetime.now().strftime('%Y-%m-%d')}.log"
    log_dosya.parent.mkdir(parents=True, exist_ok=True)
    with open(log_dosya, 'a', encoding='utf-8') as f:
        f.write(satir + "\n")


def dijital_mi(pdf_yolu: str, orneklem: int = 5) -> bool:
    """
    PDF'in dijital (secilebilir metin) mi yoksa taranmis mi oldugunu kontrol eder.
    Ilk N sayfadan metin cikarir, sayfa basina ortalama 100+ karakter varsa dijitaldir.
    """
    try:
        doc = fitz.open(pdf_yolu)
        toplam_karakter = 0
        kontrol = min(orneklem, len(doc))
        for i in range(kontrol):
            metin = doc[i].get_text("text")
            toplam_karakter += len(metin.strip())
        doc.close()
        return (toplam_karakter / max(kontrol, 1)) > 100
    except Exception:
        return False


def pdf_alt_klasor_belirle(pdf_yolu: str) -> str:
    """
    PDF'in bulundugu alt klasore gore markdown-temiz icindeki
    hedef alt klasoru belirler.
    pdf-kaynak/doktrin/kitap.pdf -> markdown-temiz/doktrin/
    pdf-kaynak/kararlar/dergi.pdf -> markdown-temiz/kararlar/
    """
    pdf_path = Path(pdf_yolu)
    # pdf-kaynak altindaki ilk alt klasor
    try:
        pdf_kaynak = Path(PDF_KLASOR)
        goreceli = pdf_path.relative_to(pdf_kaynak)
        if len(goreceli.parts) > 1:
            return goreceli.parts[0]  # ilk alt klasor adi
    except ValueError:
        pass
    return "diger"


def pdf_isle(pdf_yolu: str):
    """
    Tek bir PDF'i tip belirleyerek isler.
    Dijital -> pymupdf ile MD
    Taranmis -> Gemini OCR ile MD
    """
    pdf_path = Path(pdf_yolu)
    alt_klasor = pdf_alt_klasor_belirle(pdf_yolu)
    cikti_klasor = str(Path(MARKDOWN_KLASOR) / alt_klasor)

    if dijital_mi(pdf_yolu):
        log(f"  [DIJITAL] {pdf_path.name} -> pymupdf ile metin cikarma")
        try:
            subprocess.run([
                sys.executable,
                str(Path(PIPELINE_KLASOR) / "02-pdf-dijital.py"),
                "--kaynak", str(pdf_path.parent),
                "--cikti", cikti_klasor
            ], check=True)
            log(f"  [TAMAM] {pdf_path.name} -> {cikti_klasor}")
        except subprocess.CalledProcessError as e:
            log(f"  [HATA] pymupdf basarisiz: {e}")
    else:
        # Taranmis PDF -- Gemini OCR gerekli
        gemini_key = os.environ.get("GEMINI_API_KEY")
        if not gemini_key:
            log(f"  [BEKLE] {pdf_path.name} taranmis PDF ama GEMINI_API_KEY yok.")
            log(f"          Cozum: set GEMINI_API_KEY=... ayarla ve izleyiciyi yeniden baslat")
            log(f"          Veya manuel calistir: python pipeline/01-ocr-gemini.py --kaynak {pdf_path.parent} --cikti {cikti_klasor}")
            return

        log(f"  [TARANMIS] {pdf_path.name} -> Gemini OCR baslatiliyor")
        try:
            subprocess.run([
                sys.executable,
                str(Path(PIPELINE_KLASOR) / "01-ocr-gemini.py"),
                "--kaynak", str(pdf_path.parent),
                "--cikti", cikti_klasor
            ], check=True, env={**os.environ, "GEMINI_API_KEY": gemini_key})
            log(f"  [TAMAM] {pdf_path.name} -> Gemini OCR tamamlandi")
        except subprocess.CalledProcessError as e:
            log(f"  [HATA] Gemini OCR basarisiz: {e}")


def md_isle(md_yolu: str):
    """MD dosyasini parcalar ve ChromaDB'ye yukler."""
    try:
        # Parcala
        subprocess.run([
            sys.executable,
            str(Path(PIPELINE_KLASOR) / "04-parcala.py"),
            "--kaynak", str(Path(md_yolu).parent),
            "--cikti", ISLENMIS_KLASOR
        ], check=True)

        # Yukle
        subprocess.run([
            sys.executable,
            str(Path(PIPELINE_KLASOR) / "05-yukle.py"),
            "--kaynak", ISLENMIS_KLASOR,
            "--db", DB_KLASOR
        ], check=True)

        log(f"  [TAMAM] {Path(md_yolu).name} -> parcalandi ve yuklendi")
    except subprocess.CalledProcessError as e:
        log(f"  [HATA] MD isleme basarisiz: {e}")


# --- Watchdog Handler'lari ---

class PDFHandler(FileSystemEventHandler):
    """pdf-kaynak/ klasorunu izler. Yeni PDF gelince otomatik isler."""

    def on_created(self, event):
        if event.is_directory:
            return
        if event.src_path.lower().endswith('.pdf'):
            # PDF yazimi tamamlansin diye kisa bekle
            time.sleep(2)
            log(f"\n[YENI PDF] {event.src_path}")
            pdf_isle(event.src_path)


class MDHandler(FileSystemEventHandler):
    """markdown-temiz/ klasorunu izler. Yeni MD gelince parcalar ve yukler."""

    def on_created(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith('.md') and not Path(event.src_path).name.startswith('.'):
            # MD yazimi tamamlansin diye kisa bekle
            time.sleep(1)
            log(f"\n[YENI MD] {event.src_path}")
            md_isle(event.src_path)

    def on_modified(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith('.md') and not Path(event.src_path).name.startswith('.'):
            log(f"\n[GUNCELLENDI] {event.src_path}")
            md_isle(event.src_path)


# --- Ana ---

def main():
    # Klasorlerin var oldugundan emin ol
    for klasor in [PDF_KLASOR, MARKDOWN_KLASOR, ISLENMIS_KLASOR, DB_KLASOR, LOG_KLASOR]:
        Path(klasor).mkdir(parents=True, exist_ok=True)

    observer = Observer()

    # 1. PDF izleyici
    pdf_handler = PDFHandler()
    observer.schedule(pdf_handler, PDF_KLASOR, recursive=True)

    # 2. MD izleyici
    md_handler = MDHandler()
    observer.schedule(md_handler, MARKDOWN_KLASOR, recursive=True)

    observer.start()

    log("=" * 60)
    log("HUKUK VEKTOR DB -- DOSYA IZLEYICI AKTIF")
    log("=" * 60)
    log(f"PDF izleniyor:  {PDF_KLASOR}")
    log(f"MD izleniyor:   {MARKDOWN_KLASOR}")
    log(f"Gemini API:     {'AYARLI' if os.environ.get('GEMINI_API_KEY') else 'YOK (taranmis PDF icin gerekli)'}")
    log("")
    log("Kullanim:")
    log("  PDF at -> pdf-kaynak/doktrin/ veya pdf-kaynak/kararlar/ icine")
    log("  MD at  -> markdown-temiz/ icine (elle temizlenmis dosyalar icin)")
    log("")
    log("Durdurmak icin Ctrl+C")
    log("=" * 60)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        log("\nIzleyici durduruluyor...")
        observer.stop()
    observer.join()
    log("Izleyici durduruldu.")


if __name__ == "__main__":
    main()
```

Ayrica `izleyici-baslat.bat` dosyasini da guncelle: `D:\hukuk-vektordb\izleyici-baslat.bat`

```bat
@echo off
echo Hukuk Vektor DB Dosya Izleyici Baslatiliyor...
echo.
echo PDF ve MD klasorleri izleniyor.
echo Yeni dosya atildiginda otomatik islenir.
echo.
cd /d D:\hukuk-vektordb
python dosya-izleyici.py
pause
```

---

## KONTROL LISTESI

Codex bu dosyadaki tum adimlari tamamladiktan sonra su kontrolleri yap:

- [ ] `D:\hukuk-vektordb\pipeline\` altinda 5 Python dosyasi var
- [ ] `D:\hukuk-vektordb\mcp-sunucu\sunucu.py` guncellendi
- [ ] `D:\hukuk-vektordb\markdown-temiz\` klasor yapisi olusturuldu
- [ ] `.mcp.json` guncellendi
- [ ] `dosya-izleyici.py` yeni versiyonla degistirildi (PDF + MD dual watcher)
- [ ] `izleyici-baslat.bat` guncellendi
- [ ] Eski `vektor-db/` yedeklendi ve temiz bir ChromaDB olusturuldu
- [ ] Test arama komutu calisiyor ve sonuc donuyor
- [ ] `pip install` ile tum bagimliliklar kuruldu

---

## SIRADAKI ADIM (Bu dosyanin kapsami disinda)

Bu pipeline kurulduktan sonra ayri bir talimat dosyasinda yapilacaklar:
1. CLAUDE.md modularizasyonu (hesaplama modulleri disari cikarilacak)
2. Mevzuat MCP'den kanun metinlerini cekip markdown-temiz/mevzuat/'a kaydetme scripti
3. Yargi MCP'den kararlari cekip markdown-temiz/kararlar/'a kaydetme scripti
4. Otonom dongunun cron/scheduler implementasyonu
5. Repo temizligi (CLAUDE1.md, CLAUDETASLAK.md, YENIPLAN.md silinecek)
