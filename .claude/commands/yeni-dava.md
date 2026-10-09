---
description: "Yeni dava: TAM mod 7 ASAMA akışı (denetim K1 + KS + K2)"
---
# /yeni-dava — Director ile Yeni Dava (TAM mod, 7 ASAMA)

Tek motor, aynı oturum: elle devir bloğu, kopyala-yapıştır ve harici panel **yoktur**.
Kural kaynağı: `AGENTS.md` → "7 ASAMA Workflow", "Çalışma Modları ve Tetikleyiciler",
"Karma Mimari — Yargı PRO Entegrasyon Sözleşmesi", "DENETCI Kapısı ve Denetim Politikası".

`$ARGUMENTS` bilgisini al. Beklenen format (gerçek veriyle — KVKK maskeleme ERTELENDİ):

```text
yeni dava: [Müvekkil], [Dava Türü]
özet: [2-3 cümle dava özeti]
kritik nokta: [Spesifik araştırılacak hukuki mesele]
dava-id: 2026-NNN
```

Kritik nokta verilmemişse ASAMA 1'deki olay çözüm protokolü Adım 8'de üretilir; yine de
avukata tek soru olarak teyit ettirilir.

## Başlangıç

1. Mod bildirimi: `[MOD: TAM — 7 ASAMA] {dava-id} · {iş} · kol: {kol} · denetim: K1 + KS + K2`
2. Dava klasörü: `python scripts/paths.py dava "<dava-id> <Müvekkil> - <Tür>"` → klasör yoksa
   0x- yapısıyla oluştur (`00-Briefing.md`, `01-Usul/`, `02-Arastirma/`, `03-Sentez-ve-Dilekce/`,
   `04-Muvekkil-Belgeleri/`, `05-Durusma-Notlari/`).
3. Akış kaydı: `python scripts/akis.py baslat "<dava-klasoru>" --mod tam --is "yeni dava: <tür>" --kol <kol>`
   (kol 1. aşamada 10-7 ile kesinleşir; değişirse `python scripts/akis.py kol "<dava-klasoru>" <kol>`).
4. Dosya kabul hattı (`/dosya-kabul`): 15-4, 17-2, 15-3, 15-2 → `00-Kabul.md`. Avukat kabul etmeden 1. aşama başlamaz.
5. UYAP'ta dosya varsa evrak girişi hattı: `/davayi-cek` → `python scripts/akis.py evrak … --kaynak "<klon>"`

## ASAMA'lar (her biri `akis.py asama <N> --durum basladi|bitti` ile işlenir)

| ASAMA | İş | Yargı PRO yöntemi (`hukuk_skill`) | Denetim |
|---|---|---|---|
| 0 | MemPalace wake-up + `kullanici_profili_getir` | 18-1 (okuma) | — |
| 1 | Kaynak sorgulama + `playbook/` + `dersler/` + olay çözüm protokolü (24 adım) + briefing + Süre Kalkanı kaydı (`sure_kalkani.py`) | 10-7 (kol), 10-1, 10-2, 12-2, 12-1 (`npx -y yargi-skill sure_hesapla`), 12-3, 19-1, 13-1 | yapısal |
| 2 | 2B Yargı → 2C Mevzuat (sıralı) + 2D NotebookLM (paralel) + sentez | 11-2, 11-3, 11-10, 11-4, 11-5, 11-8, 11-7, 11-6, kolun emsal ailesi | **K1** |
| 3 | Usul raporu | kolun analiz ailesi (2-1 …), 15-5, 15-3, 12-1, 14-2, 14-1, 19-3 | yapısal + havuz_kontrol |
| 4 | 4A-4D paralel (`.claude/agents/`) + 4E sentez — 4E KIRMIZI veya KS YEŞİL değilse ASAMA 5'e geçilmez | 4B: 10-5 · 4C: 16-5 · 4E: 13-2 | 4A-4D: yapısal + havuz · 4E: **KS** |
| 5 | Dilekçe v1 | 13-3, 13-4, 13-5, kolun dilekçe ailesi, 19-3, 10-6 | yapısal + havuz_kontrol |
| 6 | Savunma simülasyonu | 10-5 (karşı taraf gözü), 10-10 | yapısal + havuz_kontrol |
| 7 | Dilekçe v2 NİHAİ (`dilekce-v2.md` + `dilekce-v2-kaynak-dogrulama.md`) → DENETCI YEŞİL → DOCX + UDF | 15-6, 19-2 (`yargi-skill tdk_denetim`) | **K2** (belge + eşlik) |

Her aşamanın Yargı PRO beceri listesi kola göre betikten alınır:
`python scripts/beceri_haritasi.py asama <n> --kol <kol> --mod tam` (yalnız yöntem bölümü uygulanır).

Her ASAMA başında AGENTS.md'deki bildirim bloğu yazılır; avukat `devam` demeden geçilmez.
`devam 5-7` ile ASAMA 5-6-7 tek onayla ardışık yürür.

## Kurallar

- Kaynak sorgulaması cevabı gelmeden ASAMA 2 başlamaz.
- K1 YEŞİL olmadan ASAMA 3'e, KS YEŞİL olmadan ASAMA 5'e geçilmez; K2 YEŞİL olmadan UDF üretilmez ve
  belge dışarı gitmez (`python scripts/akis.py sonraki` ENGEL verir; SARI da geçmez).
- Ara çıktılar (1, 3, 4A-4D, 5, 6) DENETCI'ye gitmez: `cikti_dogrula.py` + `havuz_kontrol.py`. Havuza
  sonradan künye eklenirse `kunye-havuzu-ek.md` kullanılmadan önce EK denetiminden geçer.
- Hesaplama, süre ve UDF LLM'e yaptırılmaz (iscilik-hesaplama modülü, `sure_hesapla`, `md_to_udf.py`).
  Süre: `npx -y yargi-skill sure_hesapla --kol <kol> --islem <kod> --teblig <YYYY-AA-GG> --tebligat-turu <tür> --adli-tatile-tabi <evet|hayir> --json`; `takvime_aktarilabilir: false`, `baslangic_durumu: TEYIT-BEKLIYOR` veya `guven` ≠ `yuksek` ise sonuç kesin son gün sayılmaz.
- Motor bildirilmemişse çıktı `engine: bildirilmedi` ile damgalanır (`motor: <ad>`).
- Kapanış: MemPalace diary; usul süreleri Süre Kalkanı'na; kesin satırlar ile duruşma, zamanaşımı ve arabuluculuk
  tarihleri avukat onayıyla takvime (AGENTS.md "Takvim Yonetimi"); dava özeti ve portföy; dersler ritüeli.
