# KVKK Seviye 2 Maskeleme Kılavuzu

Bu belge müvekkil verisi sisteme girerken LLM'e (Anthropic/Google) gitmeden önce nasıl maskeleneceğini anlatır.

**Temel prensip:** Müvekkil verisi → maske.py → Maskelenmiş veri → Claude / NotebookLM → İşleme → Dilekçe taslağı (maskeli) → unmask → Nihai dilekçe (gerçek veri, sadece UYAP'a yüklenmek üzere)

**Dict dosyaları:** `config/masks/{dava-id}.json` — yerel diskte tutulur, hiçbir şekilde dışarıya çıkmaz.

---

## 1. Yeni Dava Başlarken Maskeleme Kurulumu

### 1.1 Dava-ID belirle

Her dava için unique bir ID. Örnek:
- `selin-uyar-2026-003`
- `hanife-2026-002`
- `ahmet-yilmaz-iscilik-2026-005`

Bu ID `config/masks/{dava-id}.json` dict dosyasının adını belirler.

### 1.2 Müvekkil ve karşı taraf isimlerini tanımla

```bash
cd "Vektör Database li Otomasyon Claude Code/scripts"

python maske.py --dict selin-uyar-2026-003 add \
  --muvekkil "Selin Uyar" "Recep Uyar" \
  --karsi-taraf "Hacire Karakurt" \
  --adres "Barış Mah. Palmiye Sk. No:4/7 Beylikdüzü/İstanbul" \
          "Sümer Mah. 8/1 Sk. No:7 D:4 Zeytinburnu/İstanbul"
```

Sonuç:
```
Müvekkil: Selin Uyar -> [MUVEKKIL_1]
Müvekkil: Recep Uyar -> [MUVEKKIL_2]
Karşı taraf: Hacire Karakurt -> [KARSI_TARAF_1]
Adres: Barış Mah. Palmiye Sk. No:4/7 Beylikdüzü/İstanbul -> [ADRES_1]
Adres: Sümer Mah. 8/1 Sk. No:7 D:4 Zeytinburnu/İstanbul -> [ADRES_2]
```

### 1.3 Müvekkil belgelerini maskele

Müvekkil Drive'a ham belgeler yüklediyse (JPEG, PDF, metin):

**Metin dosyaları (.txt, .md):**
```bash
python maske.py --dict selin-uyar-2026-003 mask input.txt output.masked.txt
```

**JPEG / PDF dosyaları:**
- Bu dosyalar direkt maskelenemez
- Claude OCR ile okur, okunan metni `.md` olarak kaydeder
- Bu `.md` dosyası maskelenir
- Claude maskelenmiş `.md` dosyasıyla çalışır

**Workflow:**
```
1. Claude fotoğrafı okur: kira-sozlesmesi-ocr.md
2. python maske.py --dict ... mask kira-sozlesmesi-ocr.md kira-sozlesmesi-ocr.masked.md
3. Claude .masked.md dosyasıyla dilekçe üretir (ham verilerle konuşmaz)
4. Dilekçe bittiğinde: python maske.py unmask dilekce.md dilekce.final.md
```

---

## 2. Otomatik Maskelenen Veriler (Regex Tabanlı)

`maske.py` metinde bulursa **otomatik** maskeler:

| Veri | Regex | Token |
|------|-------|-------|
| TC Kimlik | 11 hanelik rakam (algoritma kontrolü) | `[TC_N]` |
| IBAN | TR + 24 hane | `[IBAN_N]` |
| Telefon | +90 5XX... / 05XX... / 5XX... | `[TEL_N]` |
| E-posta | standart e-posta regex | `[EPOSTA_N]` |

**Not:** TC için Türk Kimlik Numarası doğrulama algoritması (1-8 haneli toplam kuralı) uygulanır. Yanlış TC'ler maskelenmez (ör. dava numarası "12345678901" format olarak TC benzerse bile algoritma tutmazsa maskelenmez).

## 3. Manuel Maskelemede Eklenen Veriler

Bunlar otomatik tespit edilemez, dict'e manuel eklenmelidir:

- **İsimler** (müvekkil, karşı taraf, tanık, hakim)
- **Adresler** (tam adres — sokak adı, mahalle, il)
- **Şirket isimleri** (gerekirse)
- **Noter yevmiye numaraları** (opsiyonel, genelde hassas değil)

Ekleme komutu:
```bash
python maske.py --dict selin-uyar-2026-003 add \
  --muvekkil "İsim Soyisim" \
  --karsi-taraf "Karşı Taraf Adı" \
  --adres "Tam adres metni"
```

---

## 4. Unmask — Dilekçeyi UYAP'a Yüklemeye Hazırlama

Dilekçe tamamlandığında (ve tüm revizyonlar bittiğinde):

```bash
python maske.py --dict selin-uyar-2026-003 unmask dilekce-v2.md dilekce-v2.final.md
```

Maskeli tokens gerçek verilere dönüşür:
- `[MUVEKKIL_1]` → `Selin Uyar`
- `[TC_1]` → `17129455420`
- `[ADRES_1]` → `Barış Mah. Palmiye Sk. No:4/7 Beylikdüzü/İstanbul`

`dilekce-v2.final.md` UYAP'a yüklenebilir veya DOCX'e çevrilebilir (md_to_docx.py).

---

## 5. Dict Dosyası İnceleme

Gerçek veriyle dolu dict dosyasını görmek:

```bash
python maske.py --dict selin-uyar-2026-003 show-dict
```

**UYARI:** Bu çıktı gerçek verileri içerir. Asla paylaşma, log'a yazdırma. Sadece debugging için.

---

## 6. Güvenlik Notları

### 6.1 Dict dosyaları NEREDE?
- `config/masks/*.json` (yerel disk)
- Git'e commit edilmemeli (zaten `.gitignore` önerilir)
- Drive'a backup edilmemeli (KVKK ihlali)

### 6.2 Claude Code ile İş Akışı

**❌ YANLIŞ:**
```
[Kullanıcı] "Selin Uyar'ın kira tespit davası... TC: 17129455420"
→ Veri Claude'a gidiyor ham olarak → KVKK ihlali
```

**✓ DOĞRU:**
```
[Kullanıcı] "[MUVEKKIL_1]'in kira tespit davası... TC: [TC_1]"
→ Veri Claude'a maskeli gidiyor
→ Claude maskeli veriyle çalışıyor
→ Dilekçe maskeli üretiliyor
→ Kullanıcı unmask yapıp UYAP'a yüklüyor
```

### 6.3 Drive'daki Ham Belgeler

Şu an Drive'da ham belgeler (JPEG, UDF) duruyor. Kısa vadeli planda:
- Drive ham halde kalacak (müvekkil rızası ile)
- Sadece Claude'a verilecek metin/OCR sonucu maskelenecek
- Uzun vadede: Drive → lokal depolama geçişi (BRAINSTORMING.md)

### 6.4 Anthropic Zero Data Retention

Anthropic API kullanımında ZDR (Zero Data Retention) flag'i Enterprise planda mevcut. Aktif edilmesi önerilir. Console'dan kontrol edilecek.

---

## 7. Pratik Komut Referansı

```bash
# Yeni dava dict oluştur, isim/adres ekle
python maske.py --dict DAVA-ID add --muvekkil "Ad Soyad" --karsi-taraf "Ad Soyad" --adres "Adres"

# Dosya maskele
python maske.py --dict DAVA-ID mask input.md output.md

# Dilekçe unmask
python maske.py --dict DAVA-ID unmask dilekce.md dilekce.final.md

# Dict içeriğini gör (dikkat: gerçek veri!)
python maske.py --dict DAVA-ID show-dict

# Stdin maskele (tek seferlik)
echo "TC: 17129455420" | python maske.py --dict DAVA-ID mask-stdin
```

---

## 8. Claude Code ile Entegrasyon (Workflow)

Claude Code ile çalışırken şu adımlar:

**ADIM 1 — Dava başlatma:**
Avukat komutu Claude'a vermeden önce isimler/adresler manuel olarak `maske.py add` ile dict'e eklenir. Dava-ID ve maskeli isimler Claude'a bildirilir.

**Örnek avukat mesajı (Claude'a):**
```
Yeni dava: [MUVEKKIL_1] (kiraya veren) + [MUVEKKIL_2] (tapu maliki) - Kira tespit
Karşı taraf: [KARSI_TARAF_1]
Taşınmaz: [ADRES_2]
Mevcut kira 13.000 TL, hedef 35.000 TL
Dava-ID: selin-uyar-2026-003
```

Claude tüm süreci maskeli verilerle yürütür.

**ADIM 2 — Müvekkil belgesi ekleme:**
JPEG/PDF direkt Claude'a gösterilmez. Önce OCR yapılır (yerel veya Claude OCR), çıkan metin maskelenir, maskeli metin Claude'a verilir.

**ADIM 3 — Dilekçe üretimi:**
Claude maskeli verilerle dilekçe üretir. Dilekçedeki tüm taraflar `[MUVEKKIL_N]` / `[TC_N]` gibi token'lar halinde kalır.

**ADIM 4 — Nihai aşama:**
Dilekçe tam onaylandığında avukat `maske.py unmask` ile gerçek verilere çevirir. Üretilen `dilekce.final.md` UYAP'a yüklenir.

---

## 9. Sınırlamalar ve Dikkat

- **Müvekkil ham belgeleri Drive'da şu an açık duruyor** — Google bu verilere erişebilir. KVKK Seviye 4'te çözülecek.
- **Otomatik isim tespiti YOK** — her isim manuel dict'e eklenmelidir (yanlış pozitif riski için).
- **Claude OCR'dan önce maskeleme yapılamaz** — JPEG'i Claude okurken ham veri Anthropic'e gider. Çözüm: Yerel OCR (Tesseract + Türkçe). BRAINSTORMING.md'de planlı.
- **NotebookLM sorguları hâlâ ham veri içerebilir** — Claude maskeli sorgu yazmalı, ancak mevcut oturumda NotebookLM sorgu metinleri maskelenmemiş olabilir. Kontrol edilmeli.

---

## 10. Geliştirme Yol Haritası

- **Şimdi:** Seviye 2 maskeleme çalışıyor (manuel dict + regex otomatik)
- **Kısa vade:** Claude Code hook ile her LLM çağrısı öncesi otomatik maskeleme
- **Orta vade:** Yerel OCR (Tesseract) ile JPEG maskeleme
- **Uzun vade:** Yerel LLM (Ollama) ile Anthropic'e hiç veri gitmez — Seviye 3
- **Çok uzun vade:** Tam egemenlik (Türkiye bulut + UYAP entegrasyonu) — Seviye 4

Detay BRAINSTORMING.md'de.
