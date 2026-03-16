# CLAUDE.md — Hukuk Bürosu Otomasyon Sistemi

Bu dosya, Claude Code'un bu projedeki nasıl davranacağını tanımlar.
Karpathy'nin autoresearch yaklaşımını hukuka uyarlamasıdır:
insan stratejiyi tanımlar, ajanlar işi otonom olarak bitirir.

---

## Projenin Amacı

Bir avukatın rutin iş yükünü dört otonom ajana devretmek:
araştırma, usul analizi, dilekçe yazımı ve pazarlama.
Avukat yalnızca son çıktıyı denetler ve stratejik kararları alır.

---

## Klasör Yapısı

```
~/hukuk-otomasyon/
├── CLAUDE.md                  ← bu dosya
├── ajanlar/
│   ├── arastirmaci/
│   │   └── system-prompt.md
│   ├── usul-uzmani/
│   │   └── system-prompt.md
│   ├── dilekce-yazari/
│   │   └── system-prompt.md
│   └── pazarlama/
│       └── system-prompt.md
├── bilgi-tabani/              ← NotebookLM çıktıları, referans MD dosyaları
├── sablonlar/                 ← Onaylanmış dilekçe örnekleri
├── aktif-davalar/             ← Canlı dava klasörleri
└── config/
    └── .env                   ← API anahtarları (Git'e eklenme)
```

---

## Araçlar ve Rolleri

| Araç | Rol |
|---|---|
| Yargı MCP | Yargıtay, HGK, İBK kararı araması |
| Mevzuat MCP | Güncel kanun ve yönetmelik metinleri |
| Google Drive MCP | Dosya oluşturma, kaydetme, senkronizasyon |
| NotebookLM | Özel PDF bilgi tabanı (Dilekçenin Anatomisi, eski dilekçeler) |
| Claude API | Her ajanın beyni |

---

## Dört Ajan — Görev Tanımları

### Ajan 1: Araştırmacı

**Tetikleyici:** Yeni dava parametreleri girildiğinde otomatik başlar.

**Görev:**
1. Mevzuat MCP ile ilgili kanun maddelerini tam metinleriyle çek.
2. Yargı MCP ile son 2 yılın Yargıtay kararlarını ara (minimum 5 karar).
3. İlgili HGK veya İBK kararı var mı kontrol et.
4. Kararlar arasındaki çelişkileri ve yerleşik uygulamadan sapmaları tespit et.
5. Raporu `aktif-davalar/{dava-id}/01-arastirma/rapor.md` dosyasına kaydet.

**Çıktı formatı:**
```
## KONU
## İLGİLİ MEVZUAT
## GÜNCEL YARGITAY KARARLARI (son 2 yıl)
## HGK / İBK KARARLARI
## ÇELİŞKİLİ NOKTALARA DİKKAT
## SONUÇ VE TAVSİYELER
```

**Kalite kriteri:** Raporda en az 1 HGK veya İBK kararı, en az 3 güncel
Yargıtay kararı bulunmalı. Bulunamazsa ek arama terimleriyle tekrar dene.

---

### Ajan 2: Usul Uzmanı

**Tetikleyici:** Ajan 1'in raporu tamamlandığında başlar.

**Görev:**
1. Ajan 1'in raporunu ve dava parametrelerini oku.
2. Aşağıdaki checklist'i doldur.
3. İşçilik alacağı davası ise `iscilik_hesapla()` fonksiyonunu çalıştır.
4. Çıktıyı `aktif-davalar/{dava-id}/02-usul/checklist.md` dosyasına kaydet.

**Çıktı formatı:**
```
## MÜVEKKİLDEN ALINACAK BELGELER
## GÖREVLİ VE YETKİLİ MAHKEME (gerekçesiyle)
## HARÇ VE MASRAF TABLOSU
## KRİTİK SÜRELER (zamanaşımı + hak düşürücü)
## ARABULUCULUK ZORUNLULUĞU
## RİSK ANALİZİ — GOL YENİLEBİLECEK ALANLAR
## TAHMİNİ SÜRE
```

**İşçilik alacağı hesaplama — zorunlu girdiler:**
- işe_giris_tarihi
- isten_cikis_tarihi
- son_brut_ucret
- fesih_nedeni (işveren_haksiz / işçi_hakli / ikale)
- ek_odemeler (yemek, yol, AGI)

**Hesaplanacak kalemler:**
- Kıdem tazminatı
- İhbar tazminatı
- Yıllık izin ücreti
- Fazla mesai (varsa)
- Toplam brüt / net

**Harç formülü (güncel tarife esas):**
```
Nispi harç  = dava_degeri × 0.06831
Peşin harç  = nispi_harc / 4
Başvurma    = yıllık maktu tarife
```

---

### Ajan 3: Dilekçe Yazarı

**Tetikleyici:** Ajan 2'nin checklist'i tamamlandığında başlar.

**Görev:**
1. Ajan 1'in araştırma raporunu oku.
2. Ajan 2'nin checklist ve hesaplama çıktısını oku.
3. `bilgi-tabani/dilekce-anatomisi.md` dosyasını oku.
4. `sablonlar/` klasöründeki onaylanmış dilekçelerden üslup referansı al.
5. Dilekçeyi yaz.
6. `aktif-davalar/{dava-id}/03-dilekce/taslak-v1.docx` olarak kaydet.

**Yazım kuralları — bunlar pazarlık konusu değil:**

- Üslup: Kısa, net, aktif cümle. "Şöyle ki", "zira", "nitekim" doğal
  hukuk jargonu olarak kullanılabilir. Klişe kalıplar yasak.
- Yapay zeka olduğu belli olmamalı. "Sonuç olarak", "özetle" gibi
  yapay zeka markalı geçişler kullanma.
- Yargıtay kararı referans formatı:
  `Yargıtay X. Hukuk Dairesi'nin GG.AA.YYYY tarih ve YYYY/XXXXX E.,
   YYYY/XXXXX K. sayılı kararında...`
- Mevzuat referans formatı:
  `4857 sayılı İş Kanunu'nun XX. maddesi uyarınca...`
- Netice-i talep: Her alacak kalemi için ayrı satır, net tutar.
- Belirsiz alacak davası ise geçici değer açıkça belirtilmeli.

**Dilekçe yapısı:**
```
BAŞLIK (mahkeme, davacı, davalı, konu, değer)
AÇIKLAMALAR
  1. Olaylar (kronolojik, olgusal, duygusuz)
  2. Hukuki Değerlendirme (mevzuat + içtihat)
DELİLLER (numaralı liste)
HUKUKİ NEDENLER
SONUÇ VE TALEP (net rakamlarla)
```

**Kalite kontrol — dilekçeyi kaydetmeden önce şunu sor:**
- En az 2 Yargıtay kararına atıf yapıldı mı?
- Netice-i talep rakamları Ajan 2'nin hesaplamalarıyla tutarlı mı?
- Zamanaşımı savunmasına karşı pozisyon alındı mı?
- Arabuluculuk son tutanağına atıf var mı?

Eksik varsa tamamla, sonra kaydet.

---

### Ajan 4: Pazarlama Uzmanı

**Tetikleyici:** Bağımsız. Her hafta Pazartesi 09:00'da veya manuel çağrıyla.

**Görev:**
1. Yargı MCP ile son 7 günün dikkat çekici kararlarını tara.
2. Kamuoyunu ilgilendiren 1 karar seç.
3. Blog yazısı yaz (800-1200 kelime).
4. Sosyal medya formatlarını hazırla.
5. Tüm çıktıları `blog-icerikleri/{tarih}/` klasörüne kaydet.

**Blog yapısı:**
```
BAŞLIK (dikkat çekici, halk dili, SEO uyumlu)
GİRİŞ (2-3 cümle, günlük hayattaki karşılığı)
OLAY ÖZETİ (teknik olmayan dil)
MAHKEME NE DEDİ (sade analiz)
SİZİ NASIL ETKİLER (pratik sonuçlar)
FOOTER: "Bu yazı bilgilendirme amaçlıdır, hukuki danışmanlık
         niteliği taşımaz."
```

**Sosyal medya formatları:**
- LinkedIn: 200-300 kelime, profesyonel ton, 3-5 hashtag
- Twitter/X: 5-7 tweet zinciri, her tweet bağımsız okunabilir
- Instagram: 10 slayt başlık metni

**Yasak:** Hukuki tavsiye, müvekkil bilgisi, "Kesin kazanırsınız" tarzı vaatler.

---

## Ana İş Akışı — Yeni Dava Geldiğinde

```
Avukat → Dava parametrelerini girer
            │
            ▼
        Ajan 1 başlar (Araştırmacı)
        Mevzuat MCP + Yargı MCP
            │
            ▼
        Ajan 2 başlar (Usul Uzmanı)
        Checklist + Hesaplama
            │
            ▼
        Ajan 3 başlar (Dilekçe Yazarı)
        Taslak dilekçe üretilir
            │
            ▼
        Avukat son okumayı yapar
        Onay verir veya revizyon ister
```

Her ajan kendi çıktısını Google Drive'a kaydeder.
Avukat yalnızca son aşamada devreye girer.

---

## Autoresearch Döngüsü

Tweet'teki Karpathy yaklaşımının hukuk karşılığı:

1. Haftalık içtihat taraması: Ajan 1 her hafta Yargı MCP üzerinden
   son kararları tara, değişen içtihadı raporla.
2. Rapor `bilgi-tabani/haftalik-ictihat-{tarih}.md` dosyasına kaydedilir.
3. Kritik değişiklik varsa (HGK, İBK, bozma kararı) avukata bildirim gönder.
4. Bu rapor Ajan 4'ün blog içeriği kaynağı olarak kullanılır.

Bu döngü geceyi çalışır. Sabah masaya oturduğunda güncel içtihat sende hazır.

---

## Güvenlik ve KVKK

- API anahtarları yalnızca `config/.env` dosyasında saklanır.
- Müvekkil verileri Claude API'ye gönderilmeden önce maskele:
  Gerçek isim → [MÜVEKKİL], TC → [TC_NO], IBAN → [IBAN]
- Google Drive paylaşım ayarları: yalnızca sen erişebilirsin.
- Her AI çıktısı son kullanımdan önce avukat tarafından denetlenir.
  Bu sistem taslak üretir, final belge üretmez.

---

## Dava Parametresi Şablonu

Yeni dava açarken bu formatı kullan:

```yaml
dava_id: 2026-XXX
muvekkil: [MÜVEKKİL]
dava_turu: iscilik_alacagi  # iscilik_alacagi | kira | tuketici | diger
ise_giris: GG.AA.YYYY
isten_cikis: GG.AA.YYYY
son_brut_ucret: 00000
fesih_nedeni: isveren_haksiz  # isveren_haksiz | isci_hakli | ikale
ek_odemeler:
  yemek: 0
  yol: 0
  agi: 0
isveren: [İŞVEREN ADI ve ADRESİ]
ozet: "Kısa olay özeti buraya"
```

---

## Sık Yapılan Hatalar ve Çözümleri

**Harç hesaplaması eski tarifeden yapılmış:**
Her yılın Ocak ayında Mevzuat MCP'den güncel Harçlar Kanunu Genel
Tebliğini çek ve `bilgi-tabani/harc-tarifesi-{yil}.md` dosyasını güncelle.

**Dilekçe yapay zeka gibi görünüyor:**
`sablonlar/` klasörüne daha fazla onaylanmış dilekçe ekle.
Ajan 3'ün system-prompt dosyasına few-shot örnekler ekle.

**Yargı MCP yeterli karar bulamıyor:**
Tek arama terimi yerine 3 farklı terimle ara.
Daire bazlı filtrele (işçilik → 9. HD veya 22. HD).

**MCP bağlantı hatası:**
`~/.claude/settings.json` dosyasındaki MCP URL'lerini kontrol et.
Yargı MCP: bağlantı bilgilerini MCP sağlayıcısından doğrula.

---

## Bu Sistemden Ne Beklenmemeli

- Final belge üretmez, taslak üretir.
- Avukatın hukuki yargısının yerini alamaz.
- Güncel olmayan bilgi tabanıyla çalışıyorsa hata üretir
  (bilgi tabanını düzenli güncelle).
- UYAP'a otomatik yükleme bu sürümde yok.

---

## Başlangıç Komutu

Claude Code'u ilk kez çalıştırırken:

```
claude "CLAUDE.md dosyasını oku. Klasör yapısını oluştur.
Sonra bana dava parametrelerini soracak basit bir prompt hazırla."
```

Sistem hazır olduğunda ilk test:

```
claude "CLAUDE.md'yi oku. Şu dava için tüm ajan zincirini çalıştır:
dava_turu: iscilik_alacagi
ise_giris: 01.03.2020
isten_cikis: 15.01.2026
son_brut_ucret: 35000
fesih_nedeni: isveren_haksiz"
```
