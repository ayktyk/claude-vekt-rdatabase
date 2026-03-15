# Hukuk Bürosu Vektör Veri Tabanı — Kurulum Rehberi
# Claude Code bu dosyayı okuyarak sistemi adım adım kurar.
# Kullanıcı: sadece PDF klasörünü göster ve başlat.

---

## Genel Mimari

```
PDF'ler → Metin çıkarma → Akıllı parçalama → Embedding → ChromaDB
                                                               ↓
                                                    MCP Sunucusu
                                                               ↓
                                              Claude (Ajan 2 araştırma)
```

Kullanılan araçlar:
- `pymupdf` — PDF metin çıkarma (hızlı, Türkçe karakter sorunu yok)
- `sentence-transformers` — embedding modeli (multilingual-e5-large)
- `chromadb` — vektör veri tabanı (lokal, kurulum gerektirmez)
- `fastmcp` — MCP sunucusu (Claude'un vektör DB'ye bağlanması için)

---

## ADIM 1: Klasör Yapısını Kur

```bash
mkdir -p ~/hukuk-vektordb/{pdf-kaynak,islenmis,vektor-db,mcp-sunucu,loglar}
```

Yapı:
```
hukuk-vektordb/
├── pdf-kaynak/          ← Tüm PDF'leri buraya koy
│   ├── is-hukuku/
│   ├── medeni-hukuk/
│   ├── ceza-hukuku/
│   ├── usul-hukuku/
│   └── diger/
├── islenmis/            ← Çıkarılan metinler (JSON)
├── vektor-db/           ← ChromaDB dosyaları
├── mcp-sunucu/          ← MCP sunucu kodu
└── loglar/              ← İşlem logları
```

Kullanıcıya sor: "PDF'lerin hangi klasörde? Tam yolu yazar mısın?"
Verilen klasörü `pdf-kaynak/` altına sembolik link olarak bağla veya kopyala.

---

## ADIM 2: Gerekli Paketleri Kur

```bash
pip install pymupdf sentence-transformers chromadb fastmcp tqdm --break-system-packages
```

sentence-transformers büyük model indirecek (~1.1 GB). Kullanıcıyı bilgilendir:
"multilingual-e5-large modeli indiriliyor, ~1.1 GB, bir kez indirilir."

---

## ADIM 3: PDF İşleme Scripti

`~/hukuk-vektordb/pdf-isle.py` dosyasını oluştur:

```python
"""
PDF'lerden metin çıkarır, akıllı parçalar, JSON olarak kaydeder.
Kullanım: python pdf-isle.py --kaynak ./pdf-kaynak --cikti ./islenmis
"""

import fitz  # pymupdf
import json
import os
import re
import hashlib
from pathlib import Path
from datetime import datetime
import argparse

def pdf_metin_cikart(pdf_yolu: str) -> list[dict]:
    """PDF'den sayfa sayfa metin çıkarır."""
    doc = fitz.open(pdf_yolu)
    sayfalar = []
    for sayfa_no in range(len(doc)):
        sayfa = doc[sayfa_no]
        metin = sayfa.get_text("text")
        metin = temizle(metin)
        if len(metin) > 100:  # boş sayfaları atla
            sayfalar.append({
                "sayfa": sayfa_no + 1,
                "metin": metin
            })
    doc.close()
    return sayfalar

def temizle(metin: str) -> str:
    """Metindeki OCR gürültüsünü temizler."""
    metin = re.sub(r'\n{3,}', '\n\n', metin)
    metin = re.sub(r' {3,}', ' ', metin)
    metin = re.sub(r'[^\w\s\.,;:\-\(\)\[\]\'\"\/\n]', ' ', metin)
    return metin.strip()

def akilli_parcala(sayfalar: list[dict], 
                   parca_boyutu: int = 800,
                   cakisma: int = 150) -> list[dict]:
    """
    Metni anlamlı parçalara böler.
    - Bölüm başlıklarında doğal kesim noktası arar
    - Cümle ortasında kesmez
    - Her parçada önceki parçayla cakisma kadar örtüşme bırakır
    """
    parcalar = []
    tam_metin = ""
    sayfa_haritasi = {}  # karakter_pozisyonu → sayfa_no
    
    for sayfa in sayfalar:
        baslangic = len(tam_metin)
        tam_metin += sayfa["metin"] + "\n\n"
        for i in range(baslangic, len(tam_metin)):
            sayfa_haritasi[i] = sayfa["sayfa"]
    
    # Bölüm başlığı pattern'leri (Türkçe hukuk kitapları için)
    bolum_pattern = re.compile(
        r'\n(#{1,3}\s|[IVX]+\.|[A-Z]\.|Madde\s\d+|BÖLÜM|KISIM|§\s*\d+)',
        re.MULTILINE
    )
    
    pozisyon = 0
    parca_id = 0
    
    while pozisyon < len(tam_metin):
        bitis = min(pozisyon + parca_boyutu, len(tam_metin))
        
        # Bölüm başlığında kes (varsa)
        if bitis < len(tam_metin):
            bolum_es = list(bolum_pattern.finditer(tam_metin, pozisyon, bitis))
            if bolum_es:
                bitis = bolum_es[-1].start()
            else:
                # Paragraf sonunda kes
                son_paragraf = tam_metin.rfind('\n\n', pozisyon, bitis)
                if son_paragraf > pozisyon + 200:
                    bitis = son_paragraf
                else:
                    # Cümle sonunda kes
                    son_nokta = max(
                        tam_metin.rfind('. ', pozisyon, bitis),
                        tam_metin.rfind('.\n', pozisyon, bitis)
                    )
                    if son_nokta > pozisyon + 200:
                        bitis = son_nokta + 1
        
        parca_metin = tam_metin[pozisyon:bitis].strip()
        
        if len(parca_metin) > 100:
            sayfa_no = sayfa_haritasi.get(pozisyon, 0)
            parcalar.append({
                "id": parca_id,
                "metin": parca_metin,
                "kelime_sayisi": len(parca_metin.split()),
                "sayfa_baslangic": sayfa_no,
            })
            parca_id += 1
        
        pozisyon = max(pozisyon + 1, bitis - cakisma)
    
    return parcalar

def kaynak_bilgisi_cikart(pdf_yolu: str) -> dict:
    """Dosya adından kaynak kategorisi çıkarır."""
    dosya_adi = Path(pdf_yolu).stem.lower()
    ust_klasor = Path(pdf_yolu).parent.name.lower()
    
    kategori_map = {
        "is-hukuku": "iş hukuku",
        "medeni-hukuk": "medeni hukuk",
        "ceza-hukuku": "ceza hukuku",
        "usul-hukuku": "usul hukuku",
        "diger": "genel",
    }
    
    kategori = kategori_map.get(ust_klasor, "genel")
    
    return {
        "dosya_adi": Path(pdf_yolu).name,
        "kategori": kategori,
        "klasor": ust_klasor,
    }

def pdf_islenmis_mi(pdf_yolu: str, cikti_klasor: str) -> bool:
    """Bu PDF daha önce işlendi mi kontrol et."""
    dosya_hash = hashlib.md5(Path(pdf_yolu).read_bytes()).hexdigest()[:8]
    cikti_dosya = Path(cikti_klasor) / f"{Path(pdf_yolu).stem}_{dosya_hash}.json"
    return cikti_dosya.exists()

def islenmis_yolu(pdf_yolu: str, cikti_klasor: str) -> str:
    dosya_hash = hashlib.md5(Path(pdf_yolu).read_bytes()).hexdigest()[:8]
    return str(Path(cikti_klasor) / f"{Path(pdf_yolu).stem}_{dosya_hash}.json")

def ana(kaynak_klasor: str, cikti_klasor: str, yeniden_isle: bool = False):
    Path(cikti_klasor).mkdir(parents=True, exist_ok=True)
    
    pdf_listesi = list(Path(kaynak_klasor).rglob("*.pdf"))
    print(f"{len(pdf_listesi)} PDF bulundu.")
    
    toplam_parca = 0
    hatalar = []
    
    for i, pdf_yolu in enumerate(pdf_listesi):
        print(f"[{i+1}/{len(pdf_listesi)}] {pdf_yolu.name}", end=" ... ")
        
        if not yeniden_isle and pdf_islenmis_mi(str(pdf_yolu), cikti_klasor):
            print("zaten işlendi, atlandı.")
            continue
        
        try:
            sayfalar = pdf_metin_cikart(str(pdf_yolu))
            parcalar = akilli_parcala(sayfalar)
            kaynak = kaynak_bilgisi_cikart(str(pdf_yolu))
            
            cikti = {
                "meta": {
                    **kaynak,
                    "islenme_tarihi": datetime.now().isoformat(),
                    "sayfa_sayisi": len(sayfalar),
                    "parca_sayisi": len(parcalar),
                },
                "parcalar": parcalar
            }
            
            cikti_dosya = islenmis_yolu(str(pdf_yolu), cikti_klasor)
            with open(cikti_dosya, 'w', encoding='utf-8') as f:
                json.dump(cikti, f, ensure_ascii=False, indent=2)
            
            toplam_parca += len(parcalar)
            print(f"{len(sayfalar)} sayfa, {len(parcalar)} parça.")
            
        except Exception as e:
            print(f"HATA: {e}")
            hatalar.append({"dosya": str(pdf_yolu), "hata": str(e)})
    
    print(f"\nTamamlandı. Toplam {toplam_parca} parça üretildi.")
    if hatalar:
        print(f"{len(hatalar)} dosyada hata oluştu:")
        for h in hatalar:
            print(f"  - {h['dosya']}: {h['hata']}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--kaynak", default="./pdf-kaynak")
    parser.add_argument("--cikti", default="./islenmis")
    parser.add_argument("--yeniden", action="store_true")
    args = parser.parse_args()
    ana(args.kaynak, args.cikti, args.yeniden)
```

---

## ADIM 4: Embedding ve ChromaDB'ye Yükleme Scripti

`~/hukuk-vektordb/vektor-yukle.py` dosyasını oluştur:

```python
"""
İşlenmiş JSON dosyalarını embedding'e çevirip ChromaDB'ye yükler.
Kullanım: python vektor-yukle.py --islenmis ./islenmis --db ./vektor-db
"""

import json
import os
from pathlib import Path
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
import argparse
from tqdm import tqdm

# Model: multilingual-e5-large
# Türkçe dahil 100+ dil, hukuki metin için iyi performans
# İlk çalıştırmada ~1.1 GB indirir, sonra cache'den kullanır
MODEL_ADI = "intfloat/multilingual-e5-large"

def embedding_modeli_yukle():
    print(f"Embedding modeli yükleniyor: {MODEL_ADI}")
    print("(İlk çalıştırmada ~1.1 GB indirir)")
    model = SentenceTransformer(MODEL_ADI)
    print("Model hazır.")
    return model

def chroma_baglanti(db_yolu: str):
    client = chromadb.PersistentClient(
        path=db_yolu,
        settings=Settings(anonymized_telemetry=False)
    )
    return client

def koleksiyon_al_veya_olustur(client, koleksiyon_adi: str):
    try:
        koleksiyon = client.get_collection(koleksiyon_adi)
        print(f"Mevcut koleksiyon: '{koleksiyon_adi}' ({koleksiyon.count()} kayıt)")
    except:
        koleksiyon = client.create_collection(
            name=koleksiyon_adi,
            metadata={"hnsw:space": "cosine"}
        )
        print(f"Yeni koleksiyon oluşturuldu: '{koleksiyon_adi}'")
    return koleksiyon

def yuklu_id_listesi(koleksiyon) -> set:
    """Zaten yüklenmiş ID'leri getir (tekrar yüklemeyi önler)."""
    try:
        tum_idler = koleksiyon.get(include=[])["ids"]
        return set(tum_idler)
    except:
        return set()

def embed_ve_yukle(islenmis_klasor: str, db_yolu: str, 
                   toplu_boyut: int = 32):
    
    model = embedding_modeli_yukle()
    client = chroma_baglanti(db_yolu)
    
    # Tüm içerik tek koleksiyonda — kategoriye göre metadata filtresi kullanılır
    koleksiyon = koleksiyon_al_veya_olustur(client, "hukuk-kutuphanesi")
    yuklu_idler = yuklu_id_listesi(koleksiyon)
    
    json_listesi = list(Path(islenmis_klasor).glob("*.json"))
    print(f"{len(json_listesi)} işlenmiş dosya bulundu.")
    
    toplam_eklenen = 0
    toplam_atlanan = 0
    
    for json_dosya in tqdm(json_listesi, desc="Dosyalar"):
        with open(json_dosya, 'r', encoding='utf-8') as f:
            veri = json.load(f)
        
        meta = veri["meta"]
        parcalar = veri["parcalar"]
        
        # Bu dosyadan yüklenecek parçaları belirle
        yuklenecek_metinler = []
        yuklenecek_idler = []
        yuklenecek_metadatalar = []
        
        for parca in parcalar:
            # Benzersiz ID: dosya_adi + parça_id
            parca_id = f"{json_dosya.stem}__p{parca['id']}"
            
            if parca_id in yuklu_idler:
                toplam_atlanan += 1
                continue
            
            # multilingual-e5 için "query: " veya "passage: " prefix önerilir
            embed_metin = f"passage: {parca['metin']}"
            
            yuklenecek_metinler.append(embed_metin)
            yuklenecek_idler.append(parca_id)
            yuklenecek_metadatalar.append({
                "dosya": meta["dosya_adi"],
                "kategori": meta["kategori"],
                "klasor": meta["klasor"],
                "sayfa": parca.get("sayfa_baslangic", 0),
                "metin_ozet": parca["metin"][:200],  # önizleme için
            })
        
        if not yuklenecek_metinler:
            continue
        
        # Toplu embedding
        for i in range(0, len(yuklenecek_metinler), toplu_boyut):
            toplu_metinler = yuklenecek_metinler[i:i+toplu_boyut]
            toplu_idler = yuklenecek_idler[i:i+toplu_boyut]
            toplu_meta = yuklenecek_metadatalar[i:i+toplu_boyut]
            toplu_orijinal = [p["metin"] for p in parcalar 
                             if f"{json_dosya.stem}__p{p['id']}" in toplu_idler]
            
            embeddingler = model.encode(
                toplu_metinler,
                normalize_embeddings=True,
                show_progress_bar=False
            ).tolist()
            
            koleksiyon.add(
                ids=toplu_idler,
                embeddings=embeddingler,
                documents=toplu_orijinal,
                metadatas=toplu_meta
            )
            toplam_eklenen += len(toplu_idler)
    
    print(f"\nTamamlandı.")
    print(f"  Eklenen: {toplam_eklenen}")
    print(f"  Atlanan (zaten vardı): {toplam_atlanan}")
    print(f"  Toplam koleksiyonda: {koleksiyon.count()}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--islenmis", default="./islenmis")
    parser.add_argument("--db", default="./vektor-db")
    parser.add_argument("--toplu", type=int, default=32)
    args = parser.parse_args()
    embed_ve_yukle(args.islenmis, args.db, args.toplu)
```

---

## ADIM 5: Arama Scripti (Test İçin)

`~/hukuk-vektordb/ara.py` dosyasını oluştur:

```python
"""
Vektör DB'de arama yapar. Test ve doğrulama için.
Kullanım: python ara.py "fazla mesai ispat bordro imzalı" --n 5
"""

import argparse
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

MODEL_ADI = "intfloat/multilingual-e5-large"

def ara(sorgu: str, db_yolu: str = "./vektor-db", 
        n_sonuc: int = 5, kategori: str = None):
    
    model = SentenceTransformer(MODEL_ADI)
    client = chromadb.PersistentClient(
        path=db_yolu,
        settings=Settings(anonymized_telemetry=False)
    )
    koleksiyon = client.get_collection("hukuk-kutuphanesi")
    
    # multilingual-e5 için sorgu prefix'i
    embed_sorgu = f"query: {sorgu}"
    sorgu_vektoru = model.encode(
        embed_sorgu,
        normalize_embeddings=True
    ).tolist()
    
    # Filtre opsiyonel
    filtre = {"kategori": kategori} if kategori else None
    
    sonuclar = koleksiyon.query(
        query_embeddings=[sorgu_vektoru],
        n_results=n_sonuc,
        where=filtre,
        include=["documents", "metadatas", "distances"]
    )
    
    print(f"\nSorgu: '{sorgu}'")
    if kategori:
        print(f"Kategori filtresi: {kategori}")
    print(f"{'─'*60}")
    
    for i, (metin, meta, mesafe) in enumerate(zip(
        sonuclar["documents"][0],
        sonuclar["metadatas"][0],
        sonuclar["distances"][0]
    )):
        benzerlik = 1 - mesafe  # cosine distance → benzerlik
        print(f"\n[{i+1}] Benzerlik: {benzerlik:.3f}")
        print(f"    Kaynak: {meta['dosya']} | Sayfa: {meta['sayfa']}")
        print(f"    Kategori: {meta['kategori']}")
        print(f"    {'─'*50}")
        print(f"    {metin[:400]}...")
    
    return sonuclar

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("sorgu", type=str)
    parser.add_argument("--db", default="./vektor-db")
    parser.add_argument("--n", type=int, default=5)
    parser.add_argument("--kategori", type=str, default=None)
    args = parser.parse_args()
    ara(args.sorgu, args.db, args.n, args.kategori)
```

---

## ADIM 6: MCP Sunucusu

`~/hukuk-vektordb/mcp-sunucu/sunucu.py` dosyasını oluştur:

```python
"""
Claude'un vektör DB'ye bağlanması için MCP sunucusu.
Başlatma: python sunucu.py
"""

from fastmcp import FastMCP
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
import os

DB_YOLU = os.environ.get("HUKUK_DB_YOLU", 
                          os.path.expanduser("~/hukuk-vektordb/vektor-db"))
MODEL_ADI = "intfloat/multilingual-e5-large"

# Başlangıçta yükle (her sorguda yüklememek için)
print("Model yükleniyor...")
_model = SentenceTransformer(MODEL_ADI)
_client = chromadb.PersistentClient(
    path=DB_YOLU,
    settings=Settings(anonymized_telemetry=False)
)
_koleksiyon = _client.get_collection("hukuk-kutuphanesi")
print(f"Hazır. {_koleksiyon.count()} kayıt yüklü.")

mcp = FastMCP("Hukuk Kütüphanesi")

@mcp.tool()
def hukuk_ara(
    sorgu: str,
    n_sonuc: int = 5,
    kategori: str = None
) -> str:
    """
    Hukuk kütüphanesinde anlamsal arama yapar.
    
    Args:
        sorgu: Aranacak hukuki konu, argüman veya kavram.
               Örnek: "fazla mesai ispat yükü imzalı bordro"
        n_sonuc: Kaç sonuç döndürüleceği (varsayılan 5, maks 10)
        kategori: Opsiyonel filtre — "iş hukuku", "medeni hukuk",
                  "ceza hukuku", "usul hukuku", "genel"
    
    Returns:
        İlgili pasajlar, kaynak bilgisi ve benzerlik skorları.
    """
    n_sonuc = min(n_sonuc, 10)
    
    embed_sorgu = f"query: {sorgu}"
    sorgu_vektoru = _model.encode(
        embed_sorgu,
        normalize_embeddings=True
    ).tolist()
    
    filtre = {"kategori": kategori} if kategori else None
    
    sonuclar = _koleksiyon.query(
        query_embeddings=[sorgu_vektoru],
        n_results=n_sonuc,
        where=filtre,
        include=["documents", "metadatas", "distances"]
    )
    
    if not sonuclar["documents"][0]:
        return "Sorguyla ilgili kaynak bulunamadı."
    
    cikti_parcalari = [f"Sorgu: '{sorgu}'\n{'='*50}"]
    
    for i, (metin, meta, mesafe) in enumerate(zip(
        sonuclar["documents"][0],
        sonuclar["metadatas"][0],
        sonuclar["distances"][0]
    )):
        benzerlik = round(1 - mesafe, 3)
        parca = (
            f"\n[Kaynak {i+1}] Benzerlik: {benzerlik}\n"
            f"Kitap: {meta['dosya']}\n"
            f"Kategori: {meta['kategori']}\n"
            f"Sayfa: {meta['sayfa']}\n"
            f"{'─'*40}\n"
            f"{metin}\n"
        )
        cikti_parcalari.append(parca)
    
    return "\n".join(cikti_parcalari)


@mcp.tool()
def kutuphane_istatistik() -> str:
    """
    Kütüphanedeki toplam kayıt sayısını ve kategori dağılımını gösterir.
    Sistemin ne kadar PDF içerdiğini görmek için kullan.
    """
    toplam = _koleksiyon.count()
    
    # Kategori dağılımı
    kategoriler = ["iş hukuku", "medeni hukuk", "ceza hukuku", 
                   "usul hukuku", "genel"]
    dagılım = {}
    for kat in kategoriler:
        try:
            sonuc = _koleksiyon.get(
                where={"kategori": kat},
                include=[]
            )
            dagılım[kat] = len(sonuc["ids"])
        except:
            dagılım[kat] = 0
    
    satırlar = [f"Toplam kayıt: {toplam}\n\nKategori dağılımı:"]
    for kat, sayi in dagılım.items():
        if sayi > 0:
            satırlar.append(f"  {kat}: {sayi} parça")
    
    return "\n".join(satırlar)


if __name__ == "__main__":
    mcp.run(transport="stdio")
```

---

## ADIM 7: Claude Desktop'a MCP Bağlantısı

`~/.claude/settings.json` dosyasına şu bloğu ekle:

```json
{
  "mcpServers": {
    "hukuk-kutuphanesi": {
      "command": "python",
      "args": ["/Users/KULLANICI_ADI/hukuk-vektordb/mcp-sunucu/sunucu.py"],
      "env": {
        "HUKUK_DB_YOLU": "/Users/KULLANICI_ADI/hukuk-vektordb/vektor-db"
      }
    }
  }
}
```

`KULLANICI_ADI` kısmını Mac'teki kullanıcı adınla değiştir.
Windows'ta yol: `C:\\Users\\KULLANICI_ADI\\hukuk-vektordb\\...`

---

## ADIM 8: CLAUDE.md Güncellemesi

CLAUDE.md'deki Ajan 2 bölümüne şunu ekle:

```
### Araştırma Kaynak Önceliği (Ajan 2)

1. ÖNCE: hukuk-kutuphanesi MCP → hukuk_ara() ile sorgula
   Sorgu: dava türü + kritik nokta + ilgili hukuki kavramlar
   
2. SONRA: Yargı MCP → güncel Yargıtay kararları
3. SONRA: Mevzuat MCP → güncel kanun metni
4. SON: NotebookLM → avukatın seçtiği kaynak

Kütüphane araması her zaman önce yapılır. Kitaplardaki teorik temel
ve doktrin görüşleri Yargıtay kararlarından önce okunur.
```

---

## Çalıştırma Sırası (İlk Kurulum)

```bash
cd ~/hukuk-vektordb

# 1. PDF'leri işle
python pdf-isle.py --kaynak ./pdf-kaynak --cikti ./islenmis

# 2. Vektör DB'ye yükle (model ilk seferde indirilir)
python vektor-yukle.py --islenmis ./islenmis --db ./vektor-db

# 3. Test
python ara.py "kıdem tazminatı ihbar öneli hesaplama" --n 3
python ara.py "fazla mesai ispat yükü imzalı bordro" --kategori "iş hukuku"

# 4. MCP sunucusunu başlat (Claude Desktop yeniden başlatıldığında otomatik olur)
python mcp-sunucu/sunucu.py
```

---

## Yeni PDF Eklenince

```bash
# Yeni PDF'yi ilgili alt klasöre koy, sonra:
python pdf-isle.py --kaynak ./pdf-kaynak --cikti ./islenmis
python vektor-yukle.py --islenmis ./islenmis --db ./vektor-db
# Zaten işlenmiş dosyaları atlar, sadece yenileri ekler.
```

---

## Beklenen Performans

| PDF Sayısı | İşleme Süresi | DB Boyutu | Arama Süresi |
|---|---|---|---|
| 20 kitap (~4.000 sayfa) | ~15 dk | ~500 MB | ~0.5 sn |
| 100 kitap (~20.000 sayfa) | ~1.5 saat | ~2.5 GB | ~1 sn |
| 500 kitap (~100.000 sayfa) | ~8 saat | ~12 GB | ~2 sn |

İşleme bir kez yapılır. Sonraki çalıştırmalarda zaten işlenmiş dosyalar atlanır.

---

## Sorun Giderme

**"Model yüklenemiyor"**
→ İnternet bağlantısını kontrol et. İlk seferinde ~1.1 GB indirir.

**"chromadb collection bulunamadı"**
→ `vektor-yukle.py` henüz çalıştırılmamış. Önce yükleme scriptini çalıştır.

**"MCP bağlantısı kurulamıyor"**
→ `settings.json`'daki dosya yolunu kontrol et. Python'un tam yolunu kullan:
`which python` komutuyla öğren, `python` yerine tam yolu yaz.

**Arama sonuçları alakasız geliyor**
→ `ara.py` ile birkaç sorgu test et. Benzerlik skoru 0.7'nin altındaysa
chunk boyutunu küçült (800 → 500) ve yeniden yükle.

**Türkçe karakterler bozuk**
→ `json.dump(..., ensure_ascii=False)` satırının scriptte olduğunu kontrol et.
