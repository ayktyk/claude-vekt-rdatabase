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
3. KVKK kontrol: komut maskeli mi? `config/masks/{dava-id}.json` var mı?
4. Kaynak sorgulamasını zorunlu yap (NotebookLM, Drive, yerel dosya).
5. Advanced briefing topla (opsiyonel ama tavsiye edilen).
6. Hukuki kritik noktaları belirle (birincil + ikincil + riskli).
7. `00-Briefing.md` Drive'a kaydet.

## ASAMA 2 — Derin Araştırma (Terminal Claude — yörünge + paralel + sıralı zincir)

İç sıra:

1. **2A Suer Stajyer (YÖRÜNGE BELİRLEYİCİ — tavsiye edilen ilk adım)**
   - Otomatik komut: `arastir stajyer: {dava-id}` (CDP otomasyon, fallback manuel pano)
   - Çıktı: `02-Arastirma/2A-superstajyer-cevap.md` + `2A-yorunge-talimatlari.md`
   - Atlanabilir: avukat "2A atla" derse veya CDP+manuel ikisi de fail ise.
     Atlandığında ASAMA 2 raporuna `YORUNGE EKSIK` flag'i konur.
   - Detay: `.claude/commands/arastir-stajyer.md`

2. **Faz D — Arguman.ai Semantik Genişletme (YENİ — FAZ 3 2026-05-19)**
   - 2A sonrası, 2B öncesi çalışır
   - Otomatik komut: `arastir arguman: {kritik nokta}`
   - Arguman.ai 11M+ karar havuzunda hibrit semantik+keyword arama
     (Cohere + BM25 + RRF + opsiyonel neural rerank)
   - 8 koleksiyon: ceza / hukuk / idare / anayasa / aihm / uyusmazlik / bgh_*
   - Server-side skill'ler otomatik tetiklenir: `caselaw-search`,
     `citation-network` (HGK/CGK bağlayıcılık etiketi), `karsi-arguman`
     (5 seviyeli tehdit — ASAMA 6 için ön-sorgu olarak da kullanılır)
   - Her bulgu Yargı-MCP-Pro `documentId` köprüsünden geçirilir →
     DOĞRULANMIŞ / DOĞRULANMAMIŞ / HARD FAIL etiketleme
   - Çıktı: `02-Arastirma/2A-arguman-bulgulari.md`
   - Atlanabilir: avukat "arguman atla" derse (kredi tasarrufu için)
   - Detay: `.claude/commands/arastir-arguman.md`

3. **2D NotebookLM (paralel kol)** — 2A yörünge talimatı varsa onu uygular,
   yoksa bağımsız akış. Faz D ile eş zamanlı çalışabilir.
   (2E Akademik kolu 2026-05-19 itibariyla kaldırıldı.)

4. **2B Yargı-MCP-Pro → 2C Mevzuat-MCP-Pro (sıralı zincir)** — 2A varsa
   kararları teyit modunda sorgular + yan meseleler için ek arama.
   2A yoksa eski bağımsız akış (atıf maddeleri + mülga eleme).
   - 2B Faz D varsa Arguman bulgularını Pro MCP'ye doğrulatma da yapar
     (esas/karar/daire → documentId köprüsü)

5. **Sentez:** terminal Claude konsolide raporu yazar (Antigravity'ye gitmez).
   - Çıktı: `02-Arastirma/arastirma-raporu.md` + `atif-maddeleri.json` +
     `mulga-eleme.json`
   - Faz D bulguları rapora "Arguman.ai DOĞRULANMIŞ/DOĞRULANMAMIŞ Kararlar"
     bölümü olarak girer

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
