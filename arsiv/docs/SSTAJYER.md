# SSTAJYER — Süper Stajyer Entegre Sistem Kullanım Kılavuzu

> **Bu dosyayı her yeni davada referans olarak aç.** PC'yi açmaktan
> UYAP'a dilekçe yüklemeye kadar tüm akış burada.
> Son güncelleme: 2026-05-15

---

## Örnek Dava (Senaryo)

Bu kılavuzu daha somut anlatmak için **hayali bir dava** kullanıyorum:

> **Müvekkil:** Ahmet Yılmaz (çalışan)
> **Karşı taraf:** ABC Mağazacılık A.Ş. (işveren)
> **Olay:** Müvekkil 4 yıl mağazada satış elemanı olarak çalıştı. Son
> 14 ay haftada 60 saat çalıştırıldı (fazla mesai), ödenmedi. Sonunda
> istifa etti — şimdi haklı fesih iddia ediyor.
> **Avukatın hedefi:** Kıdem + ihbar + fazla mesai talepli iş davası.

**Bu örneği takip ederek sistem nasıl çalışır göreceksin.** Senin gerçek davanın detayları farklı olacak ama akış aynı.

---

## SAFHA 1 — Sabah PC'yi açtın (30 saniye)

### Adım 1.1 — PC açılışı
Normal şekilde PC'yi aç, Windows masaüstüne gel.

### Adım 1.2 — Süper Stajyer Chrome'unu aç
Masaüstünde **"Super Stajyer (CDP)"** yazan kısayola **çift tıkla**.

**Ne göreceksin:**
- 2-3 saniye PowerShell siyah ekranı geçer (bir şey yapmana gerek yok)
- Chrome açılır — bu **özel profile** (sadece Süper Stajyer için)
- Süper Stajyer'e otomatik login (oturum kayıtlı)
- Adres çubuğu altında küçük uyarı çıkabilir: *"Bu tarayıcı uzaktan kontrol ediliyor"* → **bu doğru, kapatma**

### Adım 1.3 — Claude Code terminalini aç
Normal şekilde Claude Code'u başlat (her zamanki yöntemin).

**Hazırsın.** İki pencere açık olmalı:
- 🌐 Chrome (Süper Stajyer CDP) — sağda/arka planda kalsın
- 💻 Claude Code terminal — burada çalışıyorsun

---

## SAFHA 2 — Yeni dava açma (5 dakika)

### Adım 2.1 — Müvekkili maskele (KVKK)

Daha bana hiç bir şey yazmadan, terminalden tek bir komutla müvekkilin gerçek bilgilerini maske altına al:

```powershell
python scripts/maske.py add ahmet-yilmaz-2026-007 "Ahmet Yılmaz" MUVEKKIL_1
python scripts/maske.py add ahmet-yilmaz-2026-007 "ABC Mağazacılık A.Ş." KARSI_TARAF_1
```

Bu komutlar `config/masks/ahmet-yilmaz-2026-007.json` dosyasını oluşturur.
Bundan sonra gerçek isimler **yerel diskte kalır**, hiçbir AI'ya gitmez.

**Bana bilmediğim ne varsa söylemeyi unutma** — TC, adres, telefon vs. dava boyunca eklemeye devam edersin (her komutta `maske.py add`).

### Adım 2.2 — Davayı başlat

Bana terminalden şunu yaz (gerçek isim YOK — sadece token):

```
yeni dava: [MUVEKKIL_1], iscilik alacagi
ozet: 4 yil [KARSI_TARAF_1] magazasinda satis elemani. Son 14 ay haftada
60 saat calistirildi, fazla mesai odenmedi. Istifa etti, simdi hakli fesih
iddia ediyor.
kritik nokta: Odenmemis fazla mesai nedeniyle iscinin istifasinin hakli fesih
sayilarak kidem tazminatina hak kazanip kazanmadigi.
dava-id: ahmet-yilmaz-2026-007
```

### Adım 2.3 — Ne göreceksin (ASAMA 0 + ASAMA 1)

Ben şunları otomatik yapacağım:

1. **ASAMA 0 — MemPalace hafıza taraması:**
   > "MemPalace'ta benzer davalar aranıyor... 2 sonuç bulundu..."

2. **ASAMA 1 — Drive klasörü açılıyor:**
   ```
   G:\Drive'im\Hukuk Bürosu\Aktif Davalar\ahmet-yilmaz-2026-007\
     ├── 00-Briefing.md
     ├── 01-Usul/
     ├── 02-Arastirma/
     ├── 03-Sentez-ve-Dilekce/
     ├── 04-Muvekkil-Belgeleri/
     └── 05-Durusma-Notlari/
   ```

3. **Kaynak sorgusu** — sana şunu sorarım:
   > "İşçilik alacağı için NotebookLM notebook'un var mı? Drive'da kaynak klasörü? Yerel dosya?"
   >
   > Cevap seçenekleri:
   > - "NotebookLM is_hukuku" (varsa)
   > - "yok, MCP'lerle devam et"
   > - "şu klasör: G:\..."

4. **Briefing soruları** — sana 8 opsiyonel soru:
   - Dava teorisi nedir?
   - Karşı tarafın en güçlü savunması?
   - Müvekkilin risk toleransı (agresif/dengeli/muhafazakar)?
   - Ton (sert/ölçülü/uzlaşma)?
   - Olmazsa olmaz talepler?
   - Tahmini ücret bilgisi (hesaplama için)?
   - vs.

   **İstersen tek tek cevapla, istersen "atla" de.** Atladığında akış devam eder, sonra ekleyebilirsin.

5. `00-Briefing.md` Drive'a kaydedilir.

---

## SAFHA 3 — Araştırma (ASAMA 2) — 15-25 dakika

### Adım 3.1 — 2A Süper Stajyer otomasyonu başlar

Briefing biter bitmez ben şunu derim:
> *"ASAMA 2A başlıyor — Süper Stajyer'e yörünge belirletiyorum. Chrome sekmeni gözle, prompt yazılıyor."*

Sonra **otomatik olarak şunlar olur**:

1. Ben briefing'i okur, KVKK maskelerim, 7 başlıklı prompt'u doldururum
2. `tmp/2A-stajyer-prompt.md` backup yazarım
3. CDP üzerinden Chrome'a bağlanırım
4. **Sen gözünle göreceksin:**
   - Chrome sekmesinde Süper Stajyer açık
   - Sorgu kutusuna metin **otomatik yazılır** (insan gibi, harf harf)
   - Enter tuşu otomatik basılır
   - Süper Stajyer "Stajyer Alakalı Kararları İnceliyor..." der
   - 1-3 dakika sonra cevap gelir (içtihat matrisi + 7 başlıklı analiz + ARASTIRMA TAMAMLANDI)

### Adım 3.2 — Cevap geldi, ne olur?

Cevap "ARASTIRMA TAMAMLANDI" ibaresiyle bitince ben otomatik:

1. Tam metni `02-Arastirma\2A-superstajyer-cevap.md`'ye yazarım
2. **Kalite Kapısı 0 kontrolü** yapar, sana şunu raporlarım:
   ```
   ## 2A Süper Stajyer — Yörünge Belirlendi

   Esas mesele: Ödenmemiş fazla mesai nedeniyle istifanın haklı fesih sayılması

   Bulunan kararlar (8 adet, 7 doğrulanmış teyit linkli):
     - Yargıtay 9. HD 21.11.2024 E.2024/12345 K.2024/56789 — emsal değeri: yüksek
     - Yargıtay 22. HD 14.06.2024 E.2024/4567 K.2024/8901 — emsal değeri: yüksek
     - HGK 03.02.2023 E.2022/9-456 K.2023/123 — emsal değeri: çok yüksek
     - ... (5 karar daha)

   Atıf maddeleri: 4857 s. K. m.24/II/e, m.32, m.41, m.57

   Karşı taraf savunması: "İstifa yazılı, fazla mesai bordrolarda var"
   → bizim cevap: "Bordro imzaları ihtirazi kayıtsız değil, tanık dinletilecek"

   Sapma uyarıları: Son 6 ayda 9. HD'nin tutumunda yumuşama var (2025/Q3)

   Kalite Kapısı 0: PASS

   2B Yargı MCP'ye geçeyim mi? (Burada bulunan kararları teyit modunda
   sorgulayıp + yan meseleler için ek arama yapacağım.)
   ```

### Adım 3.3 — Sen onaylarsın

```
devam
```

### Adım 3.4 — 2B/2C/2D/2E paralel + sıralı çalışır (15-20 dk)

Ben sana periyodik güncelleme veririm:
> *"2B Yargı MCP: 7/15 sorgu, 2 tam metin... 2D NotebookLM Q4 polling... 2E DergiPark 3 makale..."*

**Burada hiçbir şey yapmana gerek yok.** Bekleyebilirsin, başka iş yapabilirsin. Bittiğinde haber veririm.

Çıktı:
- `02-Arastirma\arastirma-raporu.md` — konsolide rapor (tüm bulgular)
- `02-Arastirma\atif-maddeleri.json` — mülga eleme yapıldı
- `02-Arastirma\mulga-eleme.json` — geçerli karar listesi

---

## SAFHA 4 — Usul Raporu (ASAMA 3) — 5-8 dakika

Ben sana **Antigravity devir bloğu** basacağım (kopyala-yapıştır):

```
========== ANTIGRAVITY DEVIR BLOGU (BATCH 1) ==========
ASAMA: ASAMA 3 (Usul Raporu)
Dava-ID: ahmet-yilmaz-2026-007

Sag panele yapistirilacak:
--------------------------------------------
Asagidaki dosyalari oku:
  - G:\Drive'im\...\00-Briefing.md
  - G:\Drive'im\...\02-Arastirma\arastirma-raporu.md
  - G:\Drive'im\...\02-Arastirma\atif-maddeleri.json

Protokol: prompts/gemini/usul_raporu.md

Cikti: G:\Drive'im\...\01-Usul\usul-raporu.md
...
=============================================
```

### Adım 4.1 — Devir bloğunu kopyala
- Terminalde bloğu seç (mouse veya tıkla)
- Ctrl+C

### Adım 4.2 — Antigravity sağ paneline yapıştır
- Antigravity uygulamasını aç (sağ panel)
- Ctrl+V → Enter

### Adım 4.3 — Bekle
- Antigravity (Gemini 3.1 Pro) usul raporunu yazar (3-5 dk)
- Drive'a kendisi yazar
- Sonunda self-review yapar (KIRMIZI/SARI/YEŞİL)

### Adım 4.4 — Bitince terminale dön, yaz:
```
ASAMA 3 bitti
```

Ben sonraki batch'i (ASAMA 4) hazırlarım.

---

## SAFHA 5 — Stratejik Analiz (ASAMA 4) — 5-8 dakika

**BATCH 2 devir bloğu** basacağım. Aynı kopyala-yapıştır akışı.

Bu batch'te 5 ajan (Davacı + Davalı + Bilirkişi + Hakim + Sentez) hipotezleri tartışır.

**Önemli karar noktası:** Sentez kırmızı çıkarsa (örnek: "Bu dava kazanılması zor, uzlaşma öneririz") **dilekçeye GEÇMEDEN seni uyarırım**. Sen "yine de yaz" dersen geçerim, yoksa stratejiyi değiştiririz.

Bittikten sonra:
```
ASAMA 4 bitti
```

---

## SAFHA 6 — Dilekçe Ailesi (ASAMA 5+6+7) — 30-45 dakika

**BATCH 3** — Tek devir bloğu, **3 çıktı**:

1. Antigravity v1 dilekçeyi yazar (15 dk)
2. Aynı sohbette savunma simülasyonu yapar — kendi yazdığı dilekçeyi eleştirir (5 dk)
3. Aynı sohbette v2 NİHAİ dilekçeyi yazar (15 dk)

Drive'da 3 dosya birden oluşur:
- `03-Sentez-ve-Dilekce\dilekce-v1.md`
- `02-Arastirma\savunma-simulasyonu.md`
- `03-Sentez-ve-Dilekce\dilekce-v2.md`

Bittiğinde:
```
Hepsi bitti
```

Ben otomatik olarak:
- DOCX dosyalarını üretirim (`md_to_docx.py`)
- **v2'nin UDF dosyasını üretirim** (`md_to_udf.py`) — UYAP yüklemesi için
- MemPalace'a diary yazarım (öğrenmeleri kaydet)
- Pilot raporu çıkarırım

---

## SAFHA 7 — UYAP'a yükle (3-5 dakika)

### Adım 7.1 — Maskeyi çöz (terminalden)

```powershell
python scripts/maske.py unmask "G:\Drive'im\Hukuk Bürosu\Aktif Davalar\ahmet-yilmaz-2026-007\03-Sentez-ve-Dilekce\dilekce-v2.md" "G:\Drive'im\Hukuk Bürosu\Aktif Davalar\ahmet-yilmaz-2026-007\03-Sentez-ve-Dilekce\dilekce-v2.final.md" --dict ahmet-yilmaz-2026-007
```

(Sadece v2 NİHAİ için — taslakları unmask etme.)

UDF için de:
```powershell
python scripts/maske.py unmask "G:\...\dilekce-v2.udf" "G:\...\dilekce-v2.final.udf" --dict ahmet-yilmaz-2026-007
```

### Adım 7.2 — Drive'dan UDF dosyasını indir
File Explorer ile bul, masaüstüne kopyala.

### Adım 7.3 — UYAP'a giriş yap, dava aç, dilekçeyi yükle
Normal UYAP rutinin. Sistem buraya karışmaz.

---

## ÖZET — Tam Akış Tek Bakışta

```
SAFHA 1: PC açılışı (30 sn)
  └── Masaüstü "Super Stajyer (CDP)" çift tıkla
  └── Claude Code terminal aç

SAFHA 2: Yeni dava (5 dk)
  └── maske.py add (KVKK)
  └── "yeni dava: ..." → ASAMA 0 (MemPalace) → ASAMA 1 (Briefing)

SAFHA 3: Araştırma (15-25 dk)                       ← KRİTİK FAZ
  └── 2A Süper Stajyer (otomatik) — yörünge belirleme
  └── 2B/2C/2D/2E paralel + sıralı — teyit + derinleştirme
  └── Çıktı: arastirma-raporu.md

SAFHA 4: Usul (5-8 dk)
  └── Antigravity BATCH 1 devir bloğu
  └── Çıktı: usul-raporu.md

SAFHA 5: Stratejik analiz (5-8 dk)
  └── Antigravity BATCH 2 devir bloğu (5 ajan)
  └── Çıktı: stratejik-analiz.md

SAFHA 6: Dilekçe ailesi (30-45 dk)
  └── Antigravity BATCH 3 devir bloğu (v1 + savunma sim + v2)
  └── Çıktı: dilekce-v2.md/.docx/.udf

SAFHA 7: UYAP yükleme (3-5 dk)
  └── maske.py unmask
  └── UDF dosyasını UYAP'a yükle

TOPLAM: ~1-1.5 saat (eski manuel akışta 3-4 saat)
```

---

## HATA SENARYOLARI VE ÇÖZÜMLER

| Sorun | Çözüm |
|---|---|
| **Süper Stajyer Chrome açılmıyor** | Masaüstü kısayolu doğru mu? Eski normal Chrome açıksa kapat. |
| **CDP bağlanmıyor** (`python superstajyer.py health` hata veriyor) | Süper Stajyer Chrome'unu kapat, tekrar kısayoldan aç. |
| **Süper Stajyer login expired** | Chrome'da Süper Stajyer'e gir, manuel login ol bir kez. Sonraki açılışlarda hatırlanır. |
| **2A komutu CDP fail veriyor** | Komut otomatik fallback teklif eder: "Manuel pano ile devam edelim mi?" → "evet" → ben sana prompt'u panoya koyarım, sen manuel yapıştır, cevabı kopyala → `2A cevap al: {dava-id}` |
| **Antigravity sağ panel açılmıyor** | "fallback claude" yaz → ben Antigravity yerine kendim üretirim (kalite biraz düşer ama akış sürer) |
| **Süper Stajyer cevabı çok kısa veya yetersiz** | "Yetersiz cevap, revize prompt mu, devam mı?" sorarım. "Revize" dersen 2A yeniden çalışır farklı odakla. |
| **"ARASTIRMA TAMAMLANDI" ibaresi gelmedi** | 10 dakika sonra timeout — kısmi cevap kaydedilir, sana sorulur: "kısmi cevapla devam edelim mi?" |
| **PC açıldı ama eski Chrome lock'lu** | Görev Yöneticisi (Ctrl+Shift+Esc) → chrome.exe → Görevi Sonlandır → kısayolu tekrar tıkla |

---

## DURMA / DEVAM KOMUTLARI (her zaman geçerli)

| Komut | Ne yapar |
|---|---|
| `devam` | Bir sonraki ASAMA'ya geç |
| `atla` | Bu ASAMA'yı atla (sebebini sorarım) |
| `motor degistir` | Antigravity yerine Claude'a (veya tersine) çevir |
| `dur` | Akışı duraklat, oturum sonunda kalınan yere döner |
| `devam et` | Önceki oturumda kalınan yerden devam |
| `fallback claude` | O ASAMA'yı Antigravity yerine Claude'da üret |
| `2A atla` | Süper Stajyer'i atla, 2B-2E bağımsız modda çalışsın |
| `motor degistir` | Antigravity ↔ Claude tek seferlik geçiş |

---

## TEK BAŞINA SÜPER STAJYER KULLANMAK İSTERSEN

Otomasyon dışı, "ben sadece bir hukuki konu sormak istiyorum" durumunda:

1. Süper Stajyer Chrome'una geç
2. Normal şekilde sorgu yaz, Enter
3. Cevabı oku

**Bu kullanım otomasyonu bozmaz** — sadece o anki sohbet seninle olur. Bir
sonraki `arastir stajyer:` komutunda yeni bir sohbet (`/chat/{uuid}`) açılır.

---

## SIK KULLANILAN KOMUTLAR (Hızlı Referans)

```
# Yeni dava (tam akış)
yeni dava: [MUVEKKIL_1], dava_turu
ozet: ...
kritik nokta: ...
dava-id: kisa-id

# Sadece araştırma (yörünge + 2B-2E)
arastir stajyer: dava-id     # 2A yörünge (Süper Stajyer)
arastir: dava-id             # Tüm araştırma (2A+2B+2C+2D+2E)
arastir yargi: dava-id       # Sadece Yargıtay MCP
arastir mevzuat: dava-id     # Sadece Mevzuat MCP

# Sadece belge yazımı
dilekce yaz                  # v1 taslak
revize et: dava-id           # v2 nihai
ihtarname yaz: dava-id       # ihtarname taslağı
sozlesme yaz: dava-id        # sözleşme taslağı

# Hesaplama
hesapla: giris:01.06.2020, cikis:31.12.2024, net:25000, yemek:2000, fesih:isveren_haksiz

# Maske
python scripts/maske.py add dava-id "Ahmet Yılmaz" MUVEKKIL_1
python scripts/maske.py unmask dilekce-v2.md dilekce-v2.final.md --dict dava-id
```

---

## HER ŞEYİ UNUTTUM, NEREDEN BAŞLAYAYIM?

```
devam et
```

Bana bunu yaz. Ben:
1. MemPalace'tan son oturumda nerede kaldığını bulurum
2. Açık dava varsa hangi ASAMA'da olduğunu söylerim
3. "Hangi davayla devam edelim?" diye sorarım

Kontrolü bırakmana gerek yok — her zaman geri dönebilirim.
