# /arastir-yargi — Yargı MCP Derin İteratif Protokolü (FIVEAGENTS ASAMA 2B)

`$ARGUMENTS` kritik noktasını **FIVEAGENTS.md ASAMA 2B** protokolüne uyarak araştır.
Mevcut kısa prompt YASAK — bu komut tam protokolü zorunlu uygular.

## Zorunlu Referans Dokümanlar
- `FIVEAGENTS.md` → ASAMA 2B (satır ~628 civarı)
- `ajanlar/arastirmaci/SKILL.md` → Bölüm 1 (Yargı MCP Derin Protokolü, 6 Faz) + Bölüm 2.5 (2B → 2C Sıralı Zincir)

## Ön-koşullar (otomatik)
1. `tmp/current-run-id.txt` oluştur (yoksa): `{YYYYMMDD}-{HHMMSS}-{dava-id}`
2. `02-Arastirma/.faz2-progress.jsonl` aç (append mode)
3. `check_government_servers_health` ile Bedesten sağlık kontrolü

## Zorunlu Adımlar (FIVEAGENTS 6 Faz + Gap Check)

### Faz 1 — Terim Üretimi (ön-düşünme)
- 5-7 alternatif arama terimi üret (kritik nokta etrafında)
- Hangi daire(ler) (9. HD, 22. HD, HGK, İBK, AYM)
- Terim listesini progress ledger'a yaz: `phase: 2B, step: term_generation`

### Faz 2 — Geniş Tarama (Query 1-4)
- `search_bedesten_unified(query="<ana terim>")` — varsayılan
- `search_bedesten_unified(query="<ana>", birim="HGK")`
- İBK arama
- Alternatif terim
- **Min delay 1.5 sn** sorgular arası

### Faz 3 — Daraltılmış Arama (Query 5-8)
- Tarih + daire filtreleri
- Spesifik kavram

### Faz 4 — Temporal Evolution (Query 9-14, ZORUNLU)
- 2021, 2022, 2023, 2024, 2025 yıl-yıl ayrı sorgu
- HGK yıl-aralığı sorguları
- Hakim görüş kırılımı + kırılma noktası tespiti

### Faz 5 — Çelişki + Bozma + Karşı Argüman (Query 15-17, min 2)

### Faz 6 — Tam Metin Okuma (min 5 karar)
- `get_bedesten_document_markdown` ile en alakalı 5 kararı tam çek
- Her karardan **atıf yaptığı mevzuat maddelerini çıkar** (2C girdisi)

### Gap Check (zorunlu son kontrol)
- HGK var mı? Son 12 ay karar var mı? Çelişki var mı? Temporal seyir tam mı?
- Eksikse → Faz'a geri dön

## Rate Limit Yönetimi (Israrcı Backoff — Skip YOK)
- **Min delay:** 1.5 sn (3 sn yerine, test sonucu)
- **on_429:** 15 → 30 → 60 → 120 → 300 sn ısrarcı backoff
- **6+ retry sonrası:** Avukata canlı bildirim, manuel karar
- **ASLA otomatik skip yok**

## Progress Ledger Yazımı (Faz B'de devreye girer)
Her sorgu sonu `.faz2-progress.jsonl`'e satır:
```json
{"ts":"...","run_id":"...","phase":"2B","step":"yargi_search","query_no":N,"query_label":"<faz>_<terim>","tool":"...","status":"ok","duration_ms":X,"result_count":Y,"selected_count":Z,"rate_limit_wait_ms":0}
```
60 sn sessizlikte: `STILL_WORKING: <ne yapıyorum>` satırı.

## Çıktı Dosyaları (Zorunlu)
- `02-Arastirma/yargi-bulgulari.md` — kararların tam listesi + temporal seyir
- `02-Arastirma/atif-maddeleri.json` — 2C girdisi (her karar için citations array)

## Sentez Aşaması — ZORUNLU Bridge Çağrısı
2B sonuçları sentezlenirken (kararları rapora çevirirken):
```bash
ASAMA=2B DAVA_ID="<dava-id>" \
  bash scripts/gemini-bridge.sh arastirma_sentezi \
    tmp/.gemini-input-yargi-{dava-id}.md \
    tmp/.gemini-output-yargi-{dava-id}.md
```

## Kalite Kapısı (cikti tamamlanmadan once)
- [ ] 15 sorgu listesi var mı?
- [ ] 5 tam metin künyesi var mı?
- [ ] Temporal evolution (2021-2025) tablosu var mı?
- [ ] HGK/İBK kararı var mı (yoksa ek arama)?
- [ ] `atif-maddeleri.json` doldu mu?
- [ ] Çelişkili kararlar bölümü var mı?
- [ ] Engine frontmatter var mı (sentez bridge çıktısında)?

Eksik varsa: ASAMA 2B yarım, sadece eksik mini-kolu tekrar çalıştır (tüm Faz 2'yi başlatma).
