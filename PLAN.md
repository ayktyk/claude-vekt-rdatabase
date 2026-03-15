# Hukuk Bürosu AI Sistemi — Kurulum Planı
# Claude Code bu dosyayı okuyarak sistemi sıfırdan kurar.
# Başlamadan önce kullanıcıya tek soru sor: "PDF klasörünün tam yolu nedir?"
# Sonra bu planı tepeden tırnağa, sırayla uygula. Adım atlamak yasak.

---

## Ön Kontrol (Başlamadan Önce)

Kullanıcıya şunu sor:

```
Kuruluma başlamadan önce iki şeyi teyit edelim:

1. PDF klasörünün tam yolu nedir?
   (Örnek: /Users/aykut/Desktop/Hukuk-Kitaplar)

2. Hangi işletim sistemini kullanıyorsun?
   [ ] Mac
   [ ] Windows
```

Cevabı al ve kaydet. Tüm yollarda kullanacaksın.
Kullanıcı "bilmiyorum" derse: `pwd` komutunu çalıştırmasını iste,
masaüstü için `ls ~/Desktop` ile klasör adını buldur.

---

## AŞAMA 1: Temel Klasör Yapısını Kur

```bash
mkdir -p ~/hukuk-otomasyon
mkdir -p ~/hukuk-vektordb/{pdf-kaynak,islenmis,vektor-db,mcp-sunucu,loglar}
mkdir -p ~/hukuk-vektordb/pdf-kaynak/{is-hukuku,medeni-hukuk,ceza-hukuku,usul-hukuku,diger}
```

Kullanıcının PDF klasörünü sisteme bağla:

```bash
# Mac:
ln -s [KULLANICI_PDF_KLASORU] ~/hukuk-vektordb/pdf-kaynak/diger
# Windows: klasörü kopyala veya yolu not et
```

Tamamlandığında kullanıcıya bildir:
"Klasör yapısı kuruldu. PDF'lerin şuraya bağlandı: ~/hukuk-vektordb/pdf-kaynak/"

---

## AŞAMA 2: Python Paketlerini Kur

```bash
pip install pymupdf sentence-transformers chromadb fastmcp tqdm --break-system-packages
```

sentence-transformers ilk kurulumda ~1.1 GB model indirecek.
Kullanıcıyı önceden bilgilendir: "Model indirme işlemi ~1.1 GB, bir kez yapılır."

Kurulum sonrası doğrula:
```bash
python -c "import fitz, sentence_transformers, chromadb, fastmcp; print('Tüm paketler hazır.')"
```

Hata varsa eksik paketi tekrar kur, geçme.

---

## AŞAMA 3: Vektör Veri Tabanını Kur

Bu aşama `vektordb-kurulum.md` dosyasındaki scriptleri kullanır.

### 3A — PDF İşleme Scriptini Oluştur

`vektordb-kurulum.md` dosyasını oku.
"ADIM 3: PDF İşleme Scripti" bölümündeki kodu al:
`~/hukuk-vektordb/pdf-isle.py` olarak kaydet.

### 3B — Embedding ve Yükleme Scriptini Oluştur

"ADIM 4: Embedding ve ChromaDB'ye Yükleme Scripti" bölümündeki kodu al:
`~/hukuk-vektordb/vektor-yukle.py` olarak kaydet.

### 3C — Arama Scriptini Oluştur

"ADIM 5: Arama Scripti" bölümündeki kodu al:
`~/hukuk-vektordb/ara.py` olarak kaydet.

### 3D — MCP Sunucusunu Oluştur

"ADIM 6: MCP Sunucusu" bölümündeki kodu al:
`~/hukuk-vektordb/mcp-sunucu/sunucu.py` olarak kaydet.

### 3E — PDF'leri İşle

```bash
cd ~/hukuk-vektordb
python pdf-isle.py --kaynak ./pdf-kaynak --cikti ./islenmis
```

Kaç PDF bulunduğunu, kaç parçaya bölündüğünü kullanıcıya göster.
Hata varsa hangi dosyada hata olduğunu raporla, devam et.

### 3F — Vektör DB'ye Yükle

```bash
python vektor-yukle.py --islenmis ./islenmis --db ./vektor-db
```

Bu adım uzun sürebilir. Kullanıcıyı bilgilendir:
"Embedding işlemi başladı. PDF sayısına göre 15 dakika ile birkaç saat sürebilir.
Bitince haber vereceğim."

### 3G — Vektör DB'yi Test Et

```bash
python ara.py "kıdem tazminatı ihbar tazminatı hesaplama" --n 3
python ara.py "boşanma davası kusur ispatı" --n 3
```

Sonuçları kullanıcıya göster. Benzerlik skoru 0.5 üstündeyse başarılı.
Sonuçlar alakasızsa kullanıcıya bildir ve devam et — DB sonradan iyileştirilebilir.

### 3H — MCP Bağlantısını Kur

`~/.claude/settings.json` dosyasını oku (yoksa oluştur).
`vektordb-kurulum.md` → "ADIM 7: Claude Desktop'a MCP Bağlantısı" bölümündeki
JSON bloğunu settings.json'a ekle. Kullanıcı adını otomatik tespit et:

```bash
# Mac:
echo $USER
# Windows:
echo %USERNAME%
```

settings.json güncellendikten sonra kullanıcıya söyle:
"Claude Desktop'ı kapatıp yeniden açman gerekiyor. Açınca buraya geri dön."

---

## AŞAMA 4: Otomasyon Sistemi Dosyalarını Yerleştir

### 4A — Ana Sistem Dosyası

`CLAUDE.md` dosyasını `~/.claude/CLAUDE.md` olarak kopyala.

```bash
cp CLAUDE.md ~/.claude/CLAUDE.md
```

### 4B — Çalışma Dosyalarını Kopyala

```bash
cp legal.local.md ~/hukuk-otomasyon/legal.local.md
cp dilekce-yazim-kurallari.md ~/hukuk-otomasyon/dilekce-yazim-kurallari.md
cp avukat-dava-rehberi-copilot.md ~/hukuk-otomasyon/avukat-dava-rehberi-copilot.md
```

### 4C — İşçilik Hesaplama Modülü

`~/hukuk-otomasyon/hesaplama/iscilik-hesapla.py` dosyasını oluştur.
CLAUDE.md'deki "İşçilik Alacakları Hesaplama Modülü" bölümündeki
tüm formül mantığını Python fonksiyonlarına dönüştür.

Fonksiyon imzası:
```python
def hesapla(
    giris_tarihi: str,      # "DD.MM.YYYY"
    cikis_tarihi: str,      # "DD.MM.YYYY"
    net_ucret: float,
    yemek: float = 0,
    servis: float = 0,
    ikramiye: float = 0,
    fesih_turu: str = "haksiz",   # "haksiz" | "hakli" | "istifa"
    fazla_mesai_saat: float = 0,
    izin_hakki: int = 0,
    izin_kullanilan: int = 0,
) -> dict:
    """
    Tüm işçilik alacaklarını hesaplar.
    Döndürür: kıdem, ihbar, fazla_mesai, ubgt, hafta_tatili, yillik_izin, toplam
    """
```

Hesaplama doğrulama testi:
```python
# Test: 3 yıl çalışmış, net 20.000 TL, yemek 1.500 TL, haksız fesih
sonuc = hesapla("01.01.2022", "01.01.2025", 20000, yemek=1500, fesih_turu="haksiz")
print(sonuc)
```

Sonuçları kullanıcıya göster, onay iste.

### 4D — Yeni Dava Başlatma Scripti

`~/hukuk-otomasyon/yeni-dava.sh` dosyasını oluştur:

```bash
#!/bin/bash
# Kullanım: ./yeni-dava.sh
# Yeni dava geldiğinde bu scripti çalıştır.
# Google Drive klasörünü oluşturur ve Claude'u başlatır.

echo "=== HUKUK BÜROSU — YENİ DAVA ==="
echo ""
read -p "Müvekkil adı soyadı: " MUVEKKIL
read -p "Dava türü: " DAVA_TURU
read -p "Kısa özet (1-2 cümle): " OZET
read -p "Kritik nokta (araştırılacak hukuki mesele): " KRITIK

# Dosya numarası: YYYY-NNN formatı
YIL=$(date +%Y)
SIRANO=$(ls ~/hukuk-otomasyon/davalar/ 2>/dev/null | wc -l | tr -d ' ')
SIRANO=$(printf "%03d" $((SIRANO + 1)))
DOSYA_NO="${YIL}-${SIRANO}"

# Klasör oluştur
KLASOR=~/hukuk-otomasyon/davalar/${DOSYA_NO}_${MUVEKKIL// /_}
mkdir -p "$KLASOR"/{01-Usul,02-Arastirma,03-Sentez-ve-Dilekce,04-Muvekkil-Belgeleri,05-Durusma-Notlari}

# Dava bilgilerini kaydet
cat > "$KLASOR/dava-bilgileri.md" << EOF
# Dava Bilgileri
Dosya No: $DOSYA_NO
Müvekkil: $MUVEKKIL
Dava Türü: $DAVA_TURU
Açılış: $(date +%d.%m.%Y)

## Özet
$OZET

## Kritik Nokta
$KRITIK
EOF

echo ""
echo "Klasör oluşturuldu: $KLASOR"
echo ""
echo "Claude'a kopyalayacağın komut:"
echo "---"
echo "yeni dava: $MUVEKKIL, $DAVA_TURU"
echo "özet: $OZET"
echo "kritik nokta: $KRITIK"
echo "dosya klasörü: $KLASOR"
echo "---"
```

```bash
chmod +x ~/hukuk-otomasyon/yeni-dava.sh
```

---

## AŞAMA 5: Sistem Testi

Kurulum tamamlandı. Sistemi baştan sona test et.

### Test 1 — Vektör DB Çalışıyor mu?

```bash
cd ~/hukuk-vektordb
python ara.py "iş sözleşmesi fesih ihbar" --n 3
```

Sonuç geliyorsa: geç.
Sonuç gelmiyorsa: `vektor-yukle.py` yeniden çalıştır.

### Test 2 — Hesaplama Modülü Çalışıyor mu?

```bash
cd ~/hukuk-otomasyon
python hesaplama/iscilik-hesapla.py
```

Rakamlar çıkıyorsa: geç.

### Test 3 — MCP Sunucusu Çalışıyor mu?

```bash
python ~/hukuk-vektordb/mcp-sunucu/sunucu.py &
sleep 3
echo "MCP sunucusu çalışıyor."
```

### Test 4 — Ajan Sistemi Çalışıyor mu?

Kullanıcıya şunu yaz demesini iste:

```
yeni dava: Test Müvekkil, işçilik alacakları
özet: İşçi 4 yıl çalıştı, işveren yazılı bildirim yapmadan işten çıkardı.
kritik nokta: Fesih bildiriminin yazılı yapılmamasının hukuki sonuçları.
```

Sistemin şunları yapıp yapmadığını kontrol et:
- Kaynak sorgusu sormak (ADIM 0B)
- Usul raporu üretmek (Ajan 1)
- Araştırma raporu üretmek (Ajan 2)
- Vektör DB'den kaynak çekmek (hukuk_ara)

---

## AŞAMA 6: Kullanıcıya Teslim

Tüm testler geçtikten sonra kullanıcıya şu özeti ver:

```
=== KURULUM TAMAMLANDI ===

Sisteminiz hazır. İşte özet:

VEKTÖR VERITABANI
  Konum: ~/hukuk-vektordb/vektor-db
  Kayıt sayısı: [X] parça ([N] PDF)
  Yeni PDF eklemek için:
    python ~/hukuk-vektordb/pdf-isle.py --kaynak ~/hukuk-vektordb/pdf-kaynak --cikti ~/hukuk-vektordb/islenmis
    python ~/hukuk-vektordb/vektor-yukle.py --islenmis ~/hukuk-vektordb/islenmis --db ~/hukuk-vektordb/vektor-db

OTOMASYON SİSTEMİ
  Ana dosya: ~/.claude/CLAUDE.md
  Çalışma klasörü: ~/hukuk-otomasyon/
  Yeni dava başlatmak için: ~/hukuk-otomasyon/yeni-dava.sh

KOMUTLAR
  yeni dava: [ad], [tür] / özet: [...] / kritik nokta: [...]
  hesapla: giriş:[tarih], çıkış:[tarih], net:[TL], yemek:[TL], fesih:[tür]
  usul: [dava türü]
  araştır: [konu]
  dilekçe yaz
  blog yaz: [konu]

GÜNCELLEME
  legal.local.md → büro kurallarınızı buraya ekleyin
  PDF ekleme → yukarıdaki iki komut
  NotebookLM → notebooklm-kurulum.md dosyasına bakın

Herhangi bir adımda sorun yaşarsanız söyleyin.
```

---

## Hata Durumunda

Herhangi bir aşamada hata alınırsa:
1. Hatayı kullanıcıya göster
2. Çözümü uygula
3. O adımı tekrar çalıştır
4. Aşamayı geçme, tamam olana kadar orada kal

Atlanamaz adımlar: 3E, 3F, 4A, 4B, 4C
Atlanabilir adımlar: 3H (MCP bağlantısı — sonradan yapılabilir)
