<!-- DOKTRIN-PREAMBLE v1 -->
> **0-HALÜSİNASYON + ANTI-SYCOPHANCY (zorunlu — tam metin: `prompts/_doktrin-preamble.md`):**
> - UYDURMA YARGITAY/HGK/İBK kararı atfı YASAK — her künye Bedesten documentId ile doğrulanır; doğrulanmayan "DOĞRULANMAMIŞ" damgalanır.
> - Karar metni ALINTISI UYDURULAMAZ — tırnak içi alıntı birebir kaynaktan.
> - BAĞLAM KORUNMALI — bir fıkranın cevabı başka fıkraya genellenemez.
> - Avukatı memnun etmek için LEHE YORUM YASAK; ALEYHE İÇTİHAT açıkça gösterilir, gizlenmez.
> - "KAYNAK YOK" demek dürüstlüktür — sayı doldurmak için uydurma atıf HARD FAIL.
> - Kritik kuralda ÇİFT KAYNAK şart.
> - Çıktının sonunda KAYNAK DOĞRULAMA tablosu (| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |) + "Aleyhe içtihat: VAR/YOK/ARANMADI" beyanı ZORUNLU.

# /arastir — Director Agent ile Kritik Nokta Araştırması (ASAMA 2 Çekirdeği)

`$ARGUMENTS` kritik noktasını **araştırma çekirdeği** ile araştır:
**2B→2C sıralı zincir (omurga) + 2D async paralel kol**. Kısa/yüzeysel
tek-shot araştırma YASAK.

> **REVİZYON 2026-07-09 (avukat kararı):** 2A Süper Stajyer ve Faz D
> Argüman.ai AKIŞTAN ÇIKARILDI (arşiv: `arsiv/README.md`). Ana omurga
> Yargı-MCP-Pro'dur. KVKK maskeleme ERTELENDİ (yerel LLM'e geçişe kadar).

## Zorunlu Referans Dokümanlar
- `ajanlar/arastirmaci/SKILL.md` → Bölüm 1 (Yargı), 2 (Mevzuat), 2.5 (zincir + mülga eleme), 2.7 (NotebookLM)
- `ajanlar/perspektif/PROTOKOL.md` → ASAMA 2 kesiti
- `CLAUDE.md` → Araç Katmanı + ASAMA 2
- `config/model-routing.json` → motor routing

## Ön-koşullar (otomatik)
1. `tmp/current-run-id.txt` oluştur (yoksa): `{YYYYMMDD}-{HHMMSS}-{dava-id}`
2. `02-Arastirma/.faz2-progress.jsonl` aç (append mode)
3. Pro MCP sağlık kontrolü: `yargi-mcp-pro` bağlı mı doğrula (bağlı değilse
   avukata OAuth yetkilendirmesi gerektiğini bildir)
4. ADIM 0B kaynak sorgulamasından çıkan dahili kaynak (NotebookLM notebook adı vb.) yüklenir

## Workflow (Sıralı Zincir + Async Paralel Kol)

```
Director Agent
  |
  +-- 2D NotebookLM (ASYNC PARALEL KOL — zinciri bloklamaz)
  |    10 iteratif sorgu (6 hukuki + 4 perspektif)
  |    Dahili kaynak seçilmemişse bu kol atlanır (rapora not düşülür)
  |
  +-- 2B Claude Fable 5 (Yargı-MCP-Pro) ──> 2C Yargı-MCP-Pro Mevzuat (SIRALI ZİNCİR)
  |         |                        |
  |         |                        +──> Mülga Eleme Protokolü (kalite kapısı)
  |         |
  |         Çıktı: atif-maddeleri.json (2C'nin zorunlu girdisi)
  |
  v
ZİNCİR + KOL TAMAMLANINCA → Konsolide Sentez (Terminal Claude)
```

## Zorunlu Çağrılar (Detayları Alt Komutlarda)

### 2B Yargı — `/arastir-yargi` protokolü
- 2B **bu oturumda Claude Fable 5 tek elden** yürütülür
  (`config/model-routing.json -> tasks.yargi_mcp`, mod: derin); ayrı
  pipeline scripti YOKTUR
- Min 15 sorgu / 6 faz / temporal evolution / min 5 tam metin
- **Temporal evolution DİNAMİK:** içinde bulunulan yıl dahil son 5 takvim
  yılı, yıl-yıl ayrı sorgu (sabit yıl listesi YAZILMAZ)
- **Backoff (TEK DOĞRU):** 429'da 5→15→30→60 sn, max 4 retry; hâlâ fail
  → o sorgu `[RATE LIMIT]` notuyla atlanır, faz devam eder
- Atıf maddeleri `02-Arastirma/atif-maddeleri.json`'a yazılır
- `atif-maddeleri.json` üretilmeden ve 2B kalite listesi tamamlanmadan 2C başlamaz

### 2C Mevzuat — `/arastir-mevzuat` protokolü
- 2B'nin atıf maddelerini bekler (**2B `atif-maddeleri.json` üretmeden
  BAŞLAYAMAZ**; 2B tamamen fail olduysa avukata bildir, zinciri durdur)
- Min 8 sorgu / 9 faz + Mülga Denetim
- `page_size: 20` her search'te explicit
- Mülga eleme `02-Arastirma/mulga-eleme.json`'a yazılır
- Normlar Hiyerarşisi etiketleri zorunlu

### 2D NotebookLM — `/arastir-notebook` protokolü (async paralel kol)
- 10 iteratif sorgu (6 hukuki + 4 perspektif), hard cap 12
- Async — zinciri bloklamaz
- Tek sorgu 3 dk soft timeout, toplam 15 dk soft cap

## Progress Görünürlüğü
Her 30-60 sn'de terminal canlı durum:
```
FAZ 2 DURUM — run 20260709-182000-ahmet
2B Yargı: Faz 4 temporal evolution çalışıyor (sorgu 11/15)
2C Mevzuat: bekliyor (2B atıf maddeleri lazım)
2D NotebookLM: 4/10 soru, Q4 polling 82s
Geçen süre: 06:42
Sonraki adım: Yargı temporal (dinamik yıl listesi)
```

60 sn sessizlikte: `STILL_WORKING: <ne yapıyorum>` satırı.

## Konsolide Sentez — Terminal Claude

Sentez **terminal Claude** tarafından yazılır; MCP çıktıları zaten Claude
oturumunda hazır. (Eski gemini-bridge sentezi DEPRECATED — exit 100.)

Zincir + kol tamamlandığında Claude konsolide raporu doğrudan yazar:
- Frontmatter: `engine: claude`, `model: {config/model-routing.json ->
  tasks.arastirma_sentezi.model}`, `status: TASLAK`
- Format: ajanlar/perspektif/PROTOKOL.md "Cikti Format Kurallari" + Kalite Kapı 1 gereklilikleri
- Çıktı: `02-Arastirma/arastirma-raporu.md`
- Yan dosyalar: `atif-maddeleri.json`, `mulga-eleme.json`

## Kalite Kapısı 1 (ASAMA 2 Bitişi)
- [ ] 2B 15 sorgu + 5 tam metin var mı?
- [ ] 2B 6 Faz + Gap Check tamamlandı mı (Claude Fable 5 tek elden)?
- [ ] Temporal evolution dinamik yıl listesiyle (son 5 takvim yılı) tamamlandı mı?
- [ ] `atif-maddeleri.json` doldu mu?
- [ ] 2C 8 sorgu + Normlar Hiyerarşisi etiketli mi?
- [ ] `mulga-eleme.json` doldu mu? Geçerli karar ≥ 5 mi?
- [ ] 2D 10 sorgu (veya doygunluk notu / dahili-kaynak-yok notu) var mı?
- [ ] Sentez Claude tarafından yapıldı mı (`engine: claude` frontmatter)?
- [ ] Her künye Pro MCP documentId ile [DOĞRULANMIŞ] etiketli mi?
- [ ] Çelişkili kararlar bölümü var mı?
- [ ] Aleyhe içtihat beyanı (VAR/YOK/ARANMADI) yazıldı mı?
- [ ] Güven notu (yüksek/orta/düşük) atandı mı?
- [ ] mcp_fallback_used flag'i (varsa) belirtildi mi?

Eksik varsa: SADECE eksik mini-kolu yeniden çalıştır. Tüm Faz 2'yi başlatma.

## Çıktı
`02-Arastirma/arastirma-raporu.md` — konsolide rapor (tüm bulgular + sentez)
