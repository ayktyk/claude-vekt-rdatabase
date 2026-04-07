# MemPalace Taksonomi Referansi

Bu dosya, MemPalace buro hafizasinin Wing/Hall/Room/Drawer yapisini ozetler.
Tum ajanlar drawer yazimi oncesi bu dosyaya bakar; dogru yere yazmak icin
sabit referanstir.

Son guncelleme: 2026-04-07
Versiyon: 1.0
Palace: `C:/Users/user/mempalace_palace`
MCP Server: `buro-hafizasi`

---

## 1. Wing'ler (14 Adet, 4 Kategori)

### 1.1 Dava Turu Wing'leri (5 statik wing)

| Wing | Aciklama |
|---|---|
| `wing_iscilik` | Iscilik alacaklari (kidem, ihbar, fazla mesai, UBGT, izin) |
| `wing_kira` | Kira uyusmazliklari (tahliye, kira tespiti, hasarl, uyarlama) |
| `wing_tuketici` | Tuketici davalari (ayipli mal/hizmet, paket tatil, garanti) |
| `wing_aile` | Aile hukuku (bosanma, nafaka, velayet, mal rejimi) |
| `wing_trafik` | Trafik / kasko / arac mahrumiyet bedeli |

### 1.2 Aktor Wing'leri (Dinamik, ihtiyac halinde olusur)

| Wing Pattern | Aciklama |
|---|---|
| `wing_hakim_{soyad}` | Taninan hakimler. Ornek: `wing_hakim_aydin` |
| `wing_avukat_{soyad}` | Karsi taraf avukatlari. Ornek: `wing_avukat_yilmaz` |
| `wing_bilirkisi_{soyad}` | Tanidik bilirkisiler. Ornek: `wing_bilirkisi_kaya` |

KVKK NOTU: Hakim, karsi taraf avukati ve bilirkisi adlari kamuya aciktir.
Tam soyad yazilir, MASKELENMEZ.

### 1.3 Buro Hafizasi Wing'i (1 statik wing)

| Wing | Aciklama |
|---|---|
| `wing_buro_aykut` | Avukat Aykut'un yasayan tercih hafizasi (ton, is akisi, kaynak oncelik) |

### 1.4 Ajan Diary Wing'leri (5 statik wing - 5 ajanli stratejik analiz)

| Wing | Ajan |
|---|---|
| `wing_ajan_davaci` | Davaci Avukat ajani diary'si |
| `wing_ajan_davali` | Davali Avukat ajani diary'si |
| `wing_ajan_bilirkisi` | Bilirkisi ajani diary'si |
| `wing_ajan_hakim` | Hakim Simulasyon ajani diary'si |
| `wing_ajan_sentez` | Sentez ajani diary'si |

NOT: Yardimci ajanlar (arastirmaci, usul-uzmani, dilekce-yazari, savunma-simulatoru,
revizyon-ajani, pazarlama) icin ayri wing kullanmaz; `mempalace_diary_write`
ile direkt agent_name parametresi verilir ve ajan_diary alanina dusurulur.

---

## 2. Hall'lar (Wing icindeki kategoriler)

### 2.1 Dava Turu Wing'lerinde Bulunan Hall'lar

| Hall | Aciklama | Olgunluk |
|---|---|---|
| `hall_argumanlar` | Tutmus, olgun arguman kaliplari | YUKSEK |
| `hall_kararlar` | Bilinen Yargitay/HGK/IBK kararlari (temporal validity ile) | YUKSEK |
| `hall_arastirma_bulgulari` | Arastirma akisindan gelen ham bulgular | DUSUK-ORTA |
| `hall_usul_tuzaklari` | Usul hatasi, zamanasimi, gorev/yetki tuzaklari | YUKSEK |
| `hall_savunma_kaliplari` | Karsi taraftan beklenen itiraz kaliplari | YUKSEK |

### 2.2 Aktor Wing'lerinde Bulunan Hall'lar

| Hall | Aciklama |
|---|---|
| `hall_kararlar` | O hakimin verdigi / o avukatin savundugu kararlar |
| `hall_savunma_kaliplari` | O aktorun karakteristik itiraz/savunma kalibi |

NOT: Aktor wing'lerine **sadece tam dava akisindan** yazilir. Arastirma
akisinda (Bekleyen Davalar) bu wing'lere yazim YOKTUR.

### 2.3 wing_buro_aykut'taki Hall'lar

| Hall | Aciklama |
|---|---|
| `hall_avukat_tercihleri` | Ton, ret, beğeni, dilekce uslubu |
| `hall_is_akisi_tercihleri` | Hangi arastirma turu nasil yapilir, hangi kaynak oncelik |

### 2.4 wing_ajan_*'da Bulunan Hall

| Hall | Aciklama |
|---|---|
| `hall_diary` | Ajanin oz ogrenmeleri, kalip kullanim oranlari |

---

## 3. Room Ornekleri (Drawer'i drawer yapan slug)

Room ismi kisa, anlamli slug. Snake_case.

```text
wing_iscilik       / hall_argumanlar          / room_fazla_mesai_ispat_yuku
wing_iscilik       / hall_argumanlar          / room_istifa_perdesi_hakli_fesih
wing_iscilik       / hall_arastirma_bulgulari / room_kidem_tavani_2026_guncel
wing_iscilik       / hall_kararlar            / room_kidem_tavani_asimi_temporal
wing_iscilik       / hall_usul_tuzaklari      / room_arabuluculuk_son_tutanak_eksik
wing_kira          / hall_argumanlar          / room_kira_tespiti_endeks_ustu
wing_aile          / hall_argumanlar          / room_velayet_psikolog_raporu
wing_hakim_aydin   / hall_savunma_kaliplari   / room_sert_ispat_standardi
wing_avukat_yilmaz / hall_savunma_kaliplari   / room_arabuluculuk_dava_sarti_itirazi
wing_buro_aykut    / hall_avukat_tercihleri   / room_olculu_ton_tercihi
wing_buro_aykut    / hall_is_akisi_tercihleri / room_arastirma_talebi_oncelik
wing_ajan_davaci   / hall_diary               / room_fazla_mesai_kalip_kullanim_orani
```

Aynı room ismi farkli wing'lerde olusursa MemPalace otomatik **tunnel** acar
(cross-reference). Bu yuzden room slug'lari anlamli, tutarli secilmeli.

---

## 4. Iki Akis - Ne Nereye Yazar?

### 4.1 Tam Dava Akisi (Aktif Davalar)

Yazim izinli wing'ler:

- `wing_{dava_turu}` (5 hall'in hepsine)
- `wing_buro_aykut` (her iki hall'a)
- `wing_ajan_*` (sadece kendi ajan wing'ine)
- `wing_hakim_*`, `wing_avukat_*`, `wing_bilirkisi_*` (taninan aktor varsa)

### 4.2 Arastirma Akisi (Bekleyen Davalar)

Yazim izinli wing'ler:

- `wing_{dava_turu}/hall_arastirma_bulgulari` (yalnizca bu hall)
- `wing_{dava_turu}/hall_usul_tuzaklari` (usul-uzmani cagrildiysa)
- `wing_buro_aykut` (avukat tercihi degisiklikleri)
- `wing_ajan_arastirmaci` ve `wing_ajan_usul` diary'leri

Yazim YASAK wing'ler:

- Aktor wing'leri (`wing_hakim_*`, `wing_avukat_*`, `wing_bilirkisi_*`)
- 5 ajanli stratejik analiz wing'leri (`wing_ajan_davaci/davali/bilirkisi/hakim/sentez`)

Sebep: Arastirma akisinda hakim, karsi taraf veya 5 ajanli stratejik analiz
zaten calismaz; bu wing'lere yazim anlam tasimaz ve hafizayi kirletir.

---

## 5. Promotion Kurali (Olgunluk Yukseltme)

Bir drawer `hall_arastirma_bulgulari`'nda baslar (DUSUK-ORTA olgunluk).
Su sartlardan biri saglandiginda `hall_argumanlar`'a (YUKSEK olgunluk)
**promote** edilir:

1. **2+ farkli arastirma talebinde** ayni kritik nokta icin tekrar kullanildi
2. **Tam davada** Belge Yazari tarafindan dilekceye girdi ve revizyondan gecti
3. **Dosya sonucu pozitif** (mahkeme kabul etti veya sulh oldu)

Promotion karari **Revizyon Ajani** veya **Director Agent** tarafindan verilir.
Arastirmaci kendi bulgusunu dogrudan promote ETMEZ.

Promotion teknik adimi:

```text
1. Mevcut hall_arastirma_bulgulari drawer'ini bul (mempalace_search)
2. Yeni drawer yarat: hall_argumanlar/room_{slug}
3. Yeni drawer'in content alanina su satirlari ekle:
   - Olgunluk: PROMOTED (2026-04-07)
   - Kaynak bulgu: {orijinal drawer adi}
4. Eski hall_arastirma_bulgulari drawer'ini SILME (audit izi)
```

---

## 6. KVKK Maskeleme Kurallari

Drawer yazimi oncesi su alanlar **MUTLAKA MASKELENIR**:

| Alan | Maskeleme |
|---|---|
| TC Kimlik | `[TC_NO]` |
| Muvekkil tam adi | `[Muvekkil]` veya `A.Y.` |
| IBAN | `[IBAN]` |
| Telefon | `[TEL]` |
| Dava-id | YAZMA (`2026-XXX` bile yazma) |
| Ev/is adresi | `[ADRES]` |
| Karsi taraf gercek kisi adi | `[Karsi Taraf]` |

**Maskelenmeyenler** (kamuya aciktir):

- Hakim adlari (Yargitay/yerel mahkeme)
- Karsi taraf avukatinin adi (kamuya acik kayit)
- Bilirkisi adi (kamuya acik kayit)
- Yargitay/HGK/IBK karar metnindeki kisi adlari
- Sirket / kurumsal davali adi
- Kanun maddesi, mahkeme adi, esas/karar numarasi

---

## 7. Drawer Icerik Sablonlari

### 7.1 hall_argumanlar Drawer'i

```text
Arguman: {2-3 cumle olgun hali}
Mevzuat: {kanun-madde}
Karar: {daire-tarih-esas/karar}
Karsi savunma: {beklenen itiraz ve karsilama yontemi}
Kullanim: {hangi olgu kalibinda calisir}
Olgunluk: {ARASTIRMA / PROMOTED}
```

### 7.2 hall_arastirma_bulgulari Drawer'i

```text
Kritik nokta: {nokta}
Mevzuat: {kanun-madde}
Yargitay: {daire-tarih-esas/karar} - 1 cumle ozet
HGK/IBK: {varsa kunye}
Arguman: {dilekceye tasinacak ana arguman, 2-3 cumle}
Kaynak guven: {DOGRULANMIS / DOGRULANMASI GEREKIR}
```

### 7.3 hall_kararlar Drawer'i

```text
Karar: {daire-tarih-esas/karar}
Konu: {kisa konu}
Ozet: {2-3 cumle}
Emsal degeri: {YUKSEK/ORTA/DUSUK}
Temporal validity: {GUNCEL / DEGISIKLIK VAR / BOZULMUS}
Son kontrol: {tarih}
```

### 7.4 hall_usul_tuzaklari Drawer'i

```text
Tuzak: {kisa aciklama}
Dayanak: {kanun-madde}
Kontrol: {raporda kullanilan kontrol cumlesi}
Risk seviyesi: {dusuk/orta/yuksek}
```

### 7.5 hall_savunma_kaliplari Drawer'i

```text
Beklenen savunma: {kalip}
Karsi cevap: {bizim onerimiz}
Dayanak: {kanun veya karar}
Tehlike seviyesi: {dusuk/orta/yuksek}
```

### 7.6 wing_buro_aykut/hall_avukat_tercihleri Drawer'i

```text
Tercih: {ton/uslup/ret tercihi}
Kapsam: {hangi dava turu / hangi belge}
Sebep: {neden bu tercih}
Tarih: {son guncelleme}
```

### 7.7 wing_ajan_*/hall_diary Drawer'i

```text
Tarih: {YYYY-MM-DD}
En onemli 3 ogrenme:
1. {ogrenme 1}
2. {ogrenme 2}
3. {ogrenme 3}
Tekrar eden hata kalibi: {varsa}
Basarili kalip: {varsa}
```

---

## 8. MCP Tool Referansi

Su tool'lar buro-hafizasi MCP server'inda mevcuttur:

| Tool | Kullanim |
|---|---|
| `mempalace_status` | L0+L1 context, ~170 token |
| `mempalace_search` | wing/hall/room filtreli arama |
| `mempalace_add_drawer` | Yeni drawer ekleme |
| `mempalace_diary_write` | Ajan diary yazimi |
| `mempalace_diary_read` | Ajan diary okuma |
| `mempalace_traverse` | Wing/hall yapısinda gezinme |
| `mempalace_find_tunnels` | Otomatik cross-reference bulma |
| `mempalace_kg_*` | Knowledge graph (temporal validity icin) |

---

## 9. Hafiza Kontrolu Cagri Sirasi (Tum Ajanlar)

Her ajan ise baslarken bu siraya uyar:

```text
1. mempalace_status (L0+L1, ~170 token, hizli context)
2. mempalace_search "{kritik_nokta}" --wing wing_{dava_turu}
3. mempalace_search "{kritik_nokta}" --wing wing_ajan_{kendi_adi} (yoksa atla)
4. SADECE TAM DAVADA + AKTOR BILINIYORSA:
   mempalace_search "{kritik_nokta}" --wing wing_hakim_{soyad}
   mempalace_search "{kritik_nokta}" --wing wing_avukat_{soyad}
```

MCP erisilemiyorsa: ajan calismaya devam eder, raporun "Kullanilan Kaynaklar"
bolumune `MemPalace: ERISILEMEDI` notu duser.

---

## 10. Iliskili Dosyalar

- `CLAUDE.md` -> ADIM -1 (MemPalace Wake-up) ve Director Agent karar semasi
- `FIVEAGENTS.md` -> ASAMA 0 wake-up + ASAMA 4 diary write + ASAMA 7 promotion
- `legal.local.md` -> Statik kalici kurallar (dinamik tercihler MemPalace'ta)
- `.mcp.json` -> `buro-hafizasi` MCP server kaydi
- `C:/Users/user/.mempalace/identity.txt` -> palace kimligi
- `C:/Users/user/.mempalace/config.json` -> wing/hall topic mapping
- `C:/Users/user/mempalace_palace/seed_drawers.py` -> ilk seed scripti
