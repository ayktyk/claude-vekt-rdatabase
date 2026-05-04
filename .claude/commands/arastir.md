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
3. `check_government_servers_health` ile MCP sağlık kontrolü
4. ADIM 0B kaynak sorgulamasından çıkan dahili kaynak (NotebookLM notebook adı vb.) yüklenir

## Workflow (Paralel Kollar + Sıralı Zincir)

```
Director Agent
  |
  +-- 2D NotebookLM (async paralel kol — bloklamaz)
  |
  +-- 2E Akademik Doktrin (paralel kol — bloklamaz)
  |
  +-- 2B Yargı MCP --> 2C Mevzuat MCP (sıralı zincir — atıf maddeleri 2B'den)
                       --> Mulga Eleme Protokolü (kalite kapısı)
  |
  v
TÜM KOLLAR + ZİNCİR TAMAMLANINCA → Konsolide Sentez (Gemini Bridge)
```

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

### 2E Akademik — `/arastir-akademik` protokolü (paralel kol)
- DergiPark min 5 sorgu + YÖK Tez min 3 sorgu
- En alakalı 3 makale + 2 tez tam metin
- Atıf zinciri + doktrin çelişki tespiti

## Progress Görünürlüğü (Faz B'de devreye girer)
Her 30-60 sn'de terminal canlı durum:
```
FAZ 2 DURUM — run 20260504-182000-ahmet
2B Yargı: 7/15 sorgu, 2/5 tam metin, 0 rate-limit, son 4.1s
2C Mevzuat: bekliyor (2B atıf maddeleri lazım)
2D NotebookLM: 4/10 soru, Q4 polling 82s
2E Akademik: 3/8 arama, 1 makale tam metin
Geçen süre: 06:42
Sonraki adım: Yargı temporal_2025
```

60 sn sessizlikte: `STILL_WORKING: <ne yapıyorum>` satırı.

## Konsolide Sentez — ZORUNLU Bridge Çağrısı
Tüm kollar tamamlandığında:
```bash
ASAMA=2 DAVA_ID="<dava-id>" \
  bash scripts/gemini-bridge.sh arastirma_sentezi \
    tmp/.gemini-input-{dava-id}-asama2.md \
    tmp/.gemini-output-{dava-id}-asama2.md
```

## Kalite Kapısı 1 (ASAMA 2 Bitişi)
- [ ] 2B 15 sorgu + 5 tam metin var mı?
- [ ] `atif-maddeleri.json` doldu mu?
- [ ] 2C 8 sorgu + Normlar Hiyerarşisi etiketli mi?
- [ ] `mulga-eleme.json` doldu mu? Geçerli karar ≥ 5 mi?
- [ ] 2D 10 sorgu (veya doygunluk notu) var mı?
- [ ] 2E DergiPark + YÖK Tez bulgusu var mı?
- [ ] Sentez Gemini ile yapıldı mı (`engine: gemini` frontmatter)?
- [ ] Atıf doğrulama [DOĞRULANMIS] etiketli mi?
- [ ] Çelişkili kararlar bölümü var mı?
- [ ] Güven notu (yüksek/orta/düşük) atandı mı?

Eksik varsa: SADECE eksik mini-kolu yeniden çalıştır. Tüm Faz 2'yi başlatma.

## Çıktı
`02-Arastirma/arastirma-raporu.md` — konsolide rapor (tüm bulgular + sentez)

