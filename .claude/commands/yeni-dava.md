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

## ASAMA 0 — MemPalace Wake-up (Terminal Claude)

1. `mempalace_status` + `mempalace_search wing_buro_aykut` (avukat tercihleri)
2. `mempalace_search wing_{dava_turu}` (büro hafızası, gecmiş davalar)
3. Bulgular Director context'ine enjekte edilir (MEMORY MATCH varsa raporla)

## ASAMA 1 — Hazırlık + Briefing (Terminal Claude)

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
4. Kaynak sorgulamasını zorunlu yap (NotebookLM, Drive, yerel dosya).
5. Advanced briefing topla (opsiyonel ama tavsiye edilen).
6. Hukuki kritik noktaları belirle (birincil + ikincil + riskli).
7. `00-Briefing.md` Drive'a kaydet.

## ASAMA 2 — Derin Araştırma (Terminal Claude — sıralı zincir + async paralel kol)

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

3. **Sentez:** terminal Claude konsolide raporu yazar (Antigravity'ye gitmez).
   - Çıktı: `02-Arastirma/arastirma-raporu.md` + `atif-maddeleri.json` +
     `mulga-eleme.json`

## ASAMA 2 SONUNDA — Antigravity 3 Batch Devir (2026-05-14 iyileştirme)

ASAMA 2 bittiğinde Director Agent **otomatik olarak BATCH 1 için Antigravity
devir bloğu basar**. Toplam 3 batch ile dilekçe NİHAİ'ye ulaşılır:

```
BATCH 1: ASAMA 3 (Usul Raporu) — tek
   ↓ avukat: "ASAMA 3 bitti"
   ↓ Claude: qmd update + diary + DOCX + BATCH 2 bloğu

BATCH 2: ASAMA 4 (5-Ajan Stratejik Analiz) — tek
   ↓ avukat: "ASAMA 4 bitti"
   ↓ Claude: hipotez seçimi avukat onayı + diary + DOCX + BATCH 3 bloğu
   ⚠ 4E sentez KIRMIZI çıkarsa BATCH 3 BLOKLENİR

BATCH 3: ASAMA 5+6+7 (Dilekçe Ailesi) — TEK ANTIGRAVITY SOHBETİ
   Antigravity sırayla: v1 → savunma sim → v2 NİHAİ (3 dosya Drive'a)
   ↓ avukat: "Hepsi bitti"
   ↓ Claude: 3 ajan diary + DOCX + UDF + MemPalace promotion + Pilot raporu
```

**Mehmet Ali 2026-003 pilot dersi:** Önceki 5 ayrı devir blok yorucuydu.
ASAMA 5-6-7 zaten doğal "yaz-eleştir-revize" döngüsü olduğu için tek
sohbette birleştirildi. **5 yapıştırma → 3 yapıştırma** (%40 azalma).

Detay: `ANTIGRAVITY.md` > "3 BATCH DEVIR BLOGU ŞABLONLARI" bölümü.

## Kural

- Kaynak cevabı gelmeden ASAMA 2 araştırmasını başlatma
- NotebookLM seçildiyse notebook adını dava hafızasına kaydet
- ASAMA 2 sentezi tamamlanmadan ASAMA 3 devir bloğu basma
- KVKK Seviye 2 maskeleme her ASAMA'da korunur — dilekçe v2 unmask
  + UYAP yüklemesi avukatın elinde, sistemin değil
- Antigravity erişilemezse avukat "fallback claude" → terminal Claude
  o ASAMA'yı `prompts/gemini/{task_type}.md` ile üretir
- `gemini-bridge.sh` cagirma — DEPRECATED (exit 100)
