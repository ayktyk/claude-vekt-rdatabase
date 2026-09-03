# /yeni-dava - Director Agent ile Yeni Dava Başlatma

**2026-05-13 itibariyla Antigravity hibrit mimarisiyle çalışır.**
Terminal Claude ASAMA 0-1-2'yi (MemPalace + Briefing + Araştırma)
yapar, sonra Antigravity için devir bloğu basar. Antigravity sağ
panelde ASAMA 3-7'yi (Usul + 5 Ajan + Dilekçe + Simülasyon + Revizyon)
üretir.

`$ARGUMENTS` bilgisini al. Format beklentisi (KVKK maskeli):

```text
yeni dava: [MUVEKKIL_1], [Dava Türü]
özet: [2-3 cümle dava özeti]
kritik nokta: [Spesifik araştırılacak hukuki mesele]
dava-id: ornek-2026-001
```

Director Agent akışı:

## ASAMA 0 — MemPalace Wake-up (ORKESTRATOR)

1. `mempalace_status` + `mempalace_search wing_buro_aykut` (avukat tercihleri)
2. `mempalace_search wing_{dava_turu}` (büro hafızası, gecmiş davalar)
3. Bulgular Director context'ine enjekte edilir (MEMORY MATCH varsa raporla)

## ASAMA 1 — Hazırlık + Olay Çözümü + Briefing (ORKESTRATOR)

1. Dava parametrelerini parse et. Kritik nokta yoksa avukata sor.
2. Drive klasörü aç: `G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\`
   - `00-Briefing.md`
   - `01-Usul/`
   - `02-Arastirma/`
   - `03-Sentez-ve-Dilekce/`
   - `04-Muvekkil-Belgeleri/`
   - `05-Durusma-Notlari/`
3. (KVKK maskeleme ERTELENDİ — 2026-07-09 avukat kararı; komut gerçek
   veriyle gelir, maske dict kontrolü YAPILMAZ. Yerel LLM'e geçişte geri gelir.)
4. Kaynak sorgulamasını zorunlu yap (UYAP / NotebookLM / Drive / yerel dosya).
5. `playbook/{dava-turu}.md` + `dersler/` oku.
6. **Olay çözüm protokolünü uygula** — `ajanlar/director/olay-cozum-protokolu.md`
   (24 adım; sıra bağlayıcı). Kritik nokta burada ÜRETİLİR (Adım 8) veya avukat
   vermişse DOĞRULANIR. Cevabı bilinmeyen adım `EKSİK — müvekkilden sorulacak`
   olarak Karar Noktaları'na taşınır.
7. Advanced briefing (avukat tercihleri) — protokolün **Adım 24**'ü, en sonda.
8. `00-Briefing.md` Drive'a kaydet.

## ASAMA 2 — Derin Araştırma (ARASTIRMACI — sıralı zincir + async paralel kol)

> **REVİZYON 2026-07-09:** 2A Süper Stajyer + Faz D Argüman.ai ARŞİVLENDİ
> (`arsiv/README.md`). Çekirdek = 2B→2C sıralı zincir + 2D async paralel.

İç sıra:

1. **2D NotebookLM (async paralel kol)** — zinciri bloklamaz; ADIM 0B'de
   dahili kaynak seçilmemişse atlanır (rapora not düşülür).
   (2E Akademik kolu 2026-05-19 itibariyla kaldırıldı.)

2. **2B Yargı-MCP-Pro → 2C Mevzuat (sıralı zincir — OMURGA)** —
   2B derin protokol (min 15 sorgu / 6 faz / min 5 tam metin), her kararın
   atıf maddeleri çıkarılır → `atif-maddeleri.json`. 2C bunu bekler
   (min 8 sorgu / 9 faz) + mülga eleme + normlar hiyerarşisi.

3. **Sentez:** ARASTIRMACI konsolide raporu aynı oturumda yazar; **DENETCI** denetler.
   - Çıktı: `02-Arastirma/arastirma-raporu.md` + `atif-maddeleri.json` +
     `mulga-eleme.json`

## ASAMA 3–7 — Tek Motor, DENETCI Kapılı

Elle devir bloğu, kopyala-yapıştır ve harici panel **yoktur**. ASAMA 2 bittiğinde
Director aynı oturumda devam eder; her ASAMA başında motor bildirimi verir, avukat
`devam` demeden geçmez:

```
ASAMA 3  Usul raporu (MUHAKEME)          → DENETCI → avukat "devam"
ASAMA 4  5-ajan stratejik analiz          → DENETCI → hipotez seçimi AVUKAT ONAYI
         ⚠ 4E sentez KIRMIZI çıkarsa ASAMA 5'e geçilmez
ASAMA 5  Dilekçe v1                       → DENETCI ┐
ASAMA 6  Savunma simülasyonu              → DENETCI ├ aynı oturumda ardışık
ASAMA 7  Dilekçe v2 NİHAİ                 → DENETCI ┘ (yaz → eleştir → revize)
         ↓ ORKESTRATOR: DOCX + UDF (yalnız v2) + 3 diary + MemPalace promotion
```

Her DENETCI çağrısı yalnızca `{çıktı yolu, dava-id}` alır (`AGENTS.md` → "DENETİM
ÇAĞRI BLOĞU"); KIRMIZI'da çıktı Drive'a yazılmaz, en çok 3 tur.
Her ASAMA sonunda ORKESTRATOR: `qmd update` + diary + `md_to_docx.py`.

Detay: `AGENTS.md` > "Motor Mimarisi" ve "7 ASAMA Workflow"; ajan protokolleri
`ajanlar/*/SKILL.md` > "Üretim Akışı (tek motor)".

## Kural

- Kaynak cevabı gelmeden ASAMA 2 araştırmasını başlatma
- NotebookLM seçildiyse notebook adını dava hafızasına kaydet
- ASAMA 2 sentezi DENETCI'den YEŞİL almadan ASAMA 3'e geçme
- KVKK Seviye 2 maskeleme her ASAMA'da korunur — dilekçe v2 unmask
  + UYAP yüklemesi avukatın elinde, sistemin değil
- Motor bildirilmemişse çıktı `engine: bildirilmedi` ile damgalanır (`motor: <ad>`)
- Hesaplama ve UDF üretimi LLM'e yaptırılmaz — Python scriptleri (ORKESTRATOR)
