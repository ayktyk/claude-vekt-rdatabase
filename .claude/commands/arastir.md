<!-- DOKTRIN-PREAMBLE v1 -->
> **0-HALÜSİNASYON + ANTI-SYCOPHANCY (zorunlu — tam metin: `prompts/_doktrin-preamble.md`):**
> - UYDURMA YARGITAY/HGK/İBK kararı atfı YASAK — her künye Bedesten documentId ile doğrulanır; doğrulanmayan "DOĞRULANMAMIŞ" damgalanır.
> - Karar metni ALINTISI UYDURULAMAZ — tırnak içi alıntı birebir kaynaktan.
> - BAĞLAM KORUNMALI — bir fıkranın cevabı başka fıkraya genellenemez.
> - Avukatı memnun etmek için LEHE YORUM YASAK; ALEYHE İÇTİHAT açıkça gösterilir, gizlenmez.
> - "KAYNAK YOK" demek dürüstlüktür — sayı doldurmak için uydurma atıf HARD FAIL.
> - Kritik kuralda ÇİFT KAYNAK şart.
> - Çıktının sonunda KAYNAK DOĞRULAMA tablosu (| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |) + "Aleyhe içtihat: VAR/YOK/ARANMADI" beyanı ZORUNLU.

# /arastir — Director Agent ile Kritik Nokta Araştırması (FIVEAGENTS ASAMA 2)

`$ARGUMENTS` kritik noktasını **FIVEAGENTS.md ASAMA 2** protokolüne (3 paralel kol +
1 sıralı zincir) tam uygulayarak araştır. Mevcut kısa prompt YASAK.

## Zorunlu Referans Dokümanlar
- `FIVEAGENTS.md` → ASAMA 2 (satır ~600 civarı)
- `ajanlar/arastirmaci/SKILL.md` → Bölümler 1, 2, 2.5, 2.7, 3
- `CLAUDE.md` → ASAMA 2 hibrit motor haritası
- `config/model-routing.json` → motor routing

## Ön-koşullar (otomatik)
1. `tmp/current-run-id.txt` oluştur (yoksa): `{YYYYMMDD}-{HHMMSS}-{dava-id}`
2. `02-Arastirma/.faz2-progress.jsonl` aç (append mode)
3. Pro MCP sağlık kontrolü: `claude mcp list` ile `yargi-mcp-pro` ve `arguman` bağlı doğrulanır (eski `check_government_servers_health` Pro MCP'de yok — FAZ 2 2026-05-19)
4. ADIM 0B kaynak sorgulamasından çıkan dahili kaynak (NotebookLM notebook adı vb.) yüklenir

## Workflow (Yorunge + Paralel Kollar + Sıralı Zincir)

```
Director Agent
  |
  +-- 2A Suer Stajyer (YORUNGE BELIRLEYICI — TAVSIYE EDILEN ILK ADIM)
  |    Otomatik komut: `arastir stajyer: {dava-id}`
  |    Cikti: 02-Arastirma/2A-superstajyer-cevap.md
  |          02-Arastirma/2A-yorunge-talimatlari.md (alt-moduller icin)
  |    Atlanabilir: avukat "2A atla" derse veya CDP+manuel ikisi de fail ise
  |    Atlandiginda raporda `YORUNGE EKSIK` flag'i konur
  |
  | 2A bittikten sonra (veya atlandiktan sonra):
  |
  +-- Faz D Arguman.ai (YENI — FAZ 3 2026-05-19, semantik genisletme)
  |    Otomatik komut: `arastir arguman: {kritik nokta}`
  |    Cikti: 02-Arastirma/2A-arguman-bulgulari.md
  |    11M+ karar havuzu (8 koleksiyon), server-side skill'ler
  |    (caselaw-search/citation-network/karsi-arguman) otomatik tetiklenir
  |    Her bulgu Yargi-MCP-Pro documentId koprusunden gecirilir
  |    Atlanabilir: avukat "arguman atla" derse (kredi tasarrufu)
  |
  +-- 2D NotebookLM (async paralel kol — bloklamaz, Faz D ile eszamanli)
  |    Zorunlu Girdi: 2A yorunge talimati (varsa) — 2A'nin yan meseleleri
  |
  +-- 2B Yargı-MCP-Pro --> 2C Yargi-MCP-Pro Mevzuat (sıralı zincir)
                           --> Mulga Eleme Protokolü (kalite kapısı)
       Zorunlu Girdi (2B): 2A kararlari (TEYIT modunda) + yan meseleler
                           + Faz D bulgulari (Arguman -> documentId dogrulama)
       Zorunlu Girdi (2C): 2B atif maddeleri + 2A esas mesele
  |
  v
TÜM KOLLAR + ZİNCİR TAMAMLANINCA → Konsolide Sentez (Terminal Claude)
```

Yorunge prensibi: 2A varsa 2B-2D onun bulgularini DOGRULAMA + DERINLESTIRME
modunda calisir (bagimsiz arama degil). 2A atlanmissa eski bagimsiz akis modu.

Not (2026-05-19): 2E Akademik Doktrin kolu (DergiPark + YOK Tez) ASAMA 2'den
kaldirildi. Semantik karar arama bos­luğunu Arguman.ai (Faz 3 entegrasyonu) ve
Yargı-MCP-Pro doldurur. Akademik doktrin gerekirse `arastir-notebook` veya
Yargi-MCP-Pro tam metin atifindan dolayli olarak gelir.

## Zorunlu Çağrılar (Detayları Alt Komutlarda)

### 2B Yargı — `/arastir-yargi` protokolü
- Min 15 sorgu / 6 faz / temporal evolution / min 5 tam metin
- Israrcı backoff (15→30→60→120→300 sn, skip YOK)
- Atıf maddeleri `02-Arastirma/atif-maddeleri.json`'a yazılır

### 2C Mevzuat — `/arastir-mevzuat` protokolü
- 2B'nin atıf maddelerini bekler
- Min 8 sorgu / 9 faz + Mulga Denetim
- `page_size: 20` her search'te explicit
- Mulga eleme `02-Arastirma/mulga-eleme.json`'a yazılır
- Normlar Hiyerarşisi etiketleri zorunlu

### 2D NotebookLM — `/arastir-notebook` protokolü (async paralel kol)
- 10 iteratif sorgu (6 hukuki + 4 perspektif)
- 47 sorguya çıkma uyarısı (hard cap 12)
- Async — diğer kolları bloklamaz
- Tek sorgu 3 dk soft timeout, toplam 15 dk soft cap

## Progress Görünürlüğü (Faz B'de devreye girer)
Her 30-60 sn'de terminal canlı durum:
```
FAZ 2 DURUM — run 20260504-182000-ahmet
2B Yargı: 7/15 sorgu, 2/5 tam metin, 0 rate-limit, son 4.1s
2C Mevzuat: bekliyor (2B atıf maddeleri lazım)
2D NotebookLM: 4/10 soru, Q4 polling 82s
Geçen süre: 06:42
Sonraki adım: Yargı temporal_2025
```

60 sn sessizlikte: `STILL_WORKING: <ne yapıyorum>` satırı.

## Konsolide Sentez — Terminal Claude (2026-05-13 Antigravity Hibrit)

**DEPRECATED:** Eski `gemini-bridge.sh arastirma_sentezi` çağrısı artık
yapılmıyor (exit 100). Sentez **terminal Claude** tarafından yazılır;
MCP çıktıları zaten Claude oturumunda hazır.

Tüm kollar tamamlandığında Claude konsolide raporu doğrudan yazar:
- Frontmatter: `engine: claude`, `model: claude-opus-4-7`, `status: TASLAK`
- Format: FIVEAGENTS.md "Cikti Format Kurallari" + Kalite Kapı 1 gereklilikleri
- Çıktı: `02-Arastirma/arastirma-raporu.md`
- Yan dosyalar: `atif-maddeleri.json`, `mulga-eleme.json`

## Kalite Kapısı 1 (ASAMA 2 Bitişi)
- [ ] 2A Suer Stajyer çalıştı mı veya `YORUNGE EKSIK` flag'i konuldu mu?
- [ ] Faz D Arguman.ai çalıştı mı (`arastir arguman:` veya tam akış)?
- [ ] Faz D DOĞRULANMIŞ / DOĞRULANMAMIŞ / HARD FAIL tabloları rapora girdi mi?
- [ ] 2B 15 sorgu + 5 tam metin var mı?
- [ ] `atif-maddeleri.json` doldu mu?
- [ ] 2C 8 sorgu + Normlar Hiyerarşisi etiketli mi?
- [ ] `mulga-eleme.json` doldu mu? Geçerli karar ≥ 5 mi?
- [ ] 2D 10 sorgu (veya doygunluk notu) var mı?
- [ ] Sentez Claude tarafından yapıldı mı (`engine: claude` frontmatter)?
- [ ] Atıf doğrulama [DOĞRULANMIŞ] (Pro MCP documentId ile) etiketli mi?
- [ ] Çelişkili kararlar bölümü var mı?
- [ ] Güven notu (yüksek/orta/düşük) atandı mı?
- [ ] mcp_fallback_used flag'i (varsa) belirtildi mi?
- [ ] (2E DergiPark + YÖK Tez kontrolü 2026-05-19'da KALDIRILDI)

Eksik varsa: SADECE eksik mini-kolu yeniden çalıştır. Tüm Faz 2'yi başlatma.

## Çıktı
`02-Arastirma/arastirma-raporu.md` — konsolide rapor (tüm bulgular + sentez)

