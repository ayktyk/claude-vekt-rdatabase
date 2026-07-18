# HIZCODEX.md - Terminal Hukuk Ajan Sistemi Review

> **⚠ TARIHSEL — 2026-05-13'TE GUNCELLENDI ⚠**
>
> Bu döküman 2026-05-04'te Gemini bridge mimarisi temelinde yazıldı.
> 2026-05-13 itibariyla sistem **Antigravity hibrit mimarisine** geçti:
> `scripts/gemini-bridge.sh` DEPRECATED (exit 100). Bridge çağrı listesi
> ve bridge ile ilgili tüm öneriler artık geçersiz.
>
> **Güncel mimari için:** `ANTIGRAVITY.md`, `CLAUDE.md` → "Antigravity
> Hibrit Mimarisi (2026-05-13)" bölümü.
>
> Tarihsel referans olarak korunuyor.

Tarih: 2026-05-04  
Guncel kapsam: Web uygulamasi kapsam disi. Bu rapor yalniz terminal/Claude Code hattini, `CLAUDE.md`, `FIVEAGENTS.md`, ajan SKILL dosyalari, `.claude/commands`, MCP araclari, Gemini bridge, profiling ve Faz 2 arastirma akislarini inceler.

## 1. Task Listesi

- [x] Onceki raporu kendim audit ettim.
- [x] Web uygulamasi bulgularini guncel hedef icin kapsam disina aldim.
- [x] `FIVEAGENTS.md` ve `CLAUDE.md` Faz 2 doktrinini tekrar okudum.
- [x] `ajanlar/arastirmaci/SKILL.md` Yargi/Mevzuat/NotebookLM protokollerini cikardim.
- [x] `.claude/commands/arastir*.md` komutlarini doktrinle karsilastirdim.
- [x] `logs/mcp-timings.jsonl`, `logs/model-events.jsonl`, `benchmark-timer*.log` ve timing raporlarini yeniden yorumladim.
- [x] Yargi/Mevzuat MCP icin verimsizlik, rate-limit ve seffaflik sorunlarini ayirdim.
- [x] Hedef cozum mimarisini yazdim: kalite korunacak, Faz 2 gorunur ve daha hizli olacak.

## 2. Kendimi Audit

Onceki raporda dogru bulgular vardi ama agirlik merkezi yanlisti:

1. Web uygulamasiyla ilgili onceki bulgulari P0 agirliginda yazdim. Senin su anki kullanim hedefin terminal hatti oldugu icin bu raporda kapsam disina alindi.
2. NotebookLM'i ana darbogaz gibi yazdim. Loglarda NotebookLM gercekten pahali gorunuyor; fakat senin isaret ettigin asil problem daha onemli: Yargi/Mevzuat MCP sorgularinin verimsiz, rate-limit'e acik ve kullaniciya kapali calismasi. Bu raporda odak buna cekildi.
3. `docs/timing-analysis-2026-05-04.md` raporunu tek kosum gibi yorumlama riski vardi. Aslinda `mcp-timings.jsonl` 2026-05-01, 2026-05-02 ve 2026-05-04 olaylarini ayni `dava_id/asama` altinda toplamis. Bu, state dosyalarinin resetlenmemesi veya ayni dava-id ile tekrarli denemeler yuzunden olabilir. Yeni raporda bu "olcum sistemi eksigi" olarak ele aliniyor.
4. Ilk raporda "model routing calismiyor" dogruydu, ama "nasil zorunlu hale getirilecek" yeterince terminal-pratik yazilmadi. Burada bridge zorlamasi, live progress log ve query ledger ile netlestirildi.
5. En onemli eksik: `FIVEAGENTS.md` ve `CLAUDE.md` muntazam akis anlatirken `.claude/commands` dosyalarinin bu akisi tam uygulamaya zorlamadigini yeterince vurgulamamistim. Bu yeni raporun merkezinde bu var.

## 3. Kisa Sonuc

Terminal sisteminin hedef mimarisi dogru:

- Claude Opus: Director, MCP arac kullanimi, kaynak toplama, state/progress yonetimi.
- Gemini: hukuki analiz, arama plani, arastirma sentezi, usul raporu, dilekce, revizyon ve self-review.
- Faz 2: 2D NotebookLM ve 2E akademik kol paralel; 2B Yargi MCP -> 2C Mevzuat MCP sirali zincir; sonunda Gemini sentezi.

Fiili sorun:

- Bu mimari dokumanlarda var, fakat komut ve runtime seviyesinde zorunlu degil.
- Faz 2 calisirken kullaniciya "su anda ne yapiyorum" gorunmuyor.
- Yargi/Mevzuat MCP sorgularinda merkezi query scheduler, rate-limit governor, dedupe, cache, progress ledger ve timeout yok.
- 3 sn rate-limit kurali dokumanda var ama olculmus/adaptif degil. Loglarda bazi Yargi MCP cagrilari 1-2 saniye aralikla baslamis gorunuyor; yani kural deterministik uygulanmiyor veya eski kosumlarla karismis.
- Gemini bridge var ama SKILL/command katmani onu zorunlu cagirmadigi icin analiz/sentez pratikte Claude tarafinda kalabiliyor.

## 4. Doktrin ve Gercek Arasindaki Ana Kopukluk

### 4.1 `FIVEAGENTS.md` tam protokol istiyor

`FIVEAGENTS.md` Faz 2 icin sunu tarif ediyor:

- 2B Yargi MCP: min 15 sorgu, 6 faz, temporal evolution, HGK/IBK, celiski/bozma, min 5 tam karar.
- 2C Mevzuat MCP: 2B'nin atif maddelerine bagli, min 8 sorgu, gerekce, madde agaci, degisiklik gecmisi, mulga/guncel denetimi.
- 2D NotebookLM: min 10 soru.
- 2E akademik: DergiPark + Yoktez.
- Konsolide rapor: gecerli kararlar, elenen kararlar, guven notu, norm hiyerarsisi, celiski/sapma.

Bu kalite hedefi korunmali.

### 4.2 `.claude/commands` bu protokolu zorlamiyor

Kanit:

- `.claude/commands/arastir-yargi.md` sadece "en az 3 arama terimi, son 2 yil, HGK/IBK kontrol, tam metin" diyor. Bu, `FIVEAGENTS.md`deki 15 sorgu/6 faz/temporal evolution standardinin gerisinde.
- `.claude/commands/arastir-mevzuat.md` sadece 4 adimlik genel mevzuat cikarma diyor. 2B'ye bagli atif maddesi, mulga eleme, norm hiyerarsisi zorlamasi yok.
- `.claude/commands/arastir.md` "mumkunse paralel yurut" diyor ama progress ledger, checkpoint, rate-limit scheduler, fallback raporu veya Gemini sentez cagrisini zorunlu kilmiyor.

Etki:

Terminalde `/arastir` veya `/arastir-yargi` calistirildiginda Claude kisa command dosyasini izleyebilir; tam `FIVEAGENTS.md` protokolu otomatik ve denetlenebilir sekilde uygulanmayabilir.

Cozum:

Komut dosyalari "ozet prompt" olmaktan cikmali, Director'a zorunlu calisma emri vermeli:

```markdown
Bu komut, `FIVEAGENTS.md` ASAMA 2 ve `ajanlar/arastirmaci/SKILL.md`
Bolum 1-2.5 protokolunu zorunlu uygular.

Her MCP cagrisi oncesi ve sonrasi `.faz2-progress.jsonl` satiri yaz.
Her 5 MCP cagrisi veya 3 dakika sonunda checkpoint yaz.
Yargi/Mevzuat kaynaklari bitmeden Gemini sentezine gecme.
Sentez icin dogrudan yazma; `scripts/gemini-bridge.sh arastirma_sentezi`
cagrisi zorunludur.
```

## 5. Model Routing ve Gemini Sorunu

### 5.1 Config var ama runtime yok

Kanit:

- `config/model-routing.json` su an MCP yonetimini bile Gemini'ye vermis gibi duruyor.
- `scripts/gemini-bridge.sh` model listesini hardcoded kullaniyor; config'i okumuyor.
- `logs/model-events.jsonl` son Gemini olayini 2026-04-20 gosteriyor.

Etki:

- Hukuki analiz ve dilekce Gemini'de yapilacak hedefi fiilen uygulanmiyor.

Cozum:

Tek routing modeli:

```json
{
  "mode": "auto",
  "tasks": {
    "director": { "engine": "claude", "model": "claude-opus-4-7" },
    "mcp_arac_yonetimi": { "engine": "claude", "model": "claude-opus-4-7" },
    "yargi_mcp": { "engine": "claude", "model": "claude-opus-4-7" },
    "mevzuat_mcp": { "engine": "claude", "model": "claude-opus-4-7" },
    "notebooklm_mcp": { "engine": "claude", "model": "claude-opus-4-7" },
    "arama_plani": { "engine": "gemini", "model": "gemini-3.1-pro-preview" },
    "arastirma_sentezi": { "engine": "gemini", "model": "gemini-3.1-pro-preview" },
    "usul_raporu": { "engine": "gemini", "model": "gemini-3.1-pro-preview" },
    "dilekce_yazimi": { "engine": "gemini", "model": "gemini-3.1-pro-preview" },
    "savunma_simulasyonu": { "engine": "gemini", "model": "gemini-3.1-pro-preview" },
    "revizyon": { "engine": "gemini", "model": "gemini-3.1-pro-preview" },
    "self_review": { "engine": "gemini", "model": "gemini-3.1-pro-preview" }
  },
  "fallback": {
    "gemini_chain": ["gemini-3.1-pro-preview", "gemini-3-flash-preview"],
    "final_fallback": "claude-opus-4-7"
  }
}
```

### 5.2 Gemini bridge zorunlu mekanizma olmali

Uretim task'lari icin kural:

- Arama plani: `gemini-bridge.sh arama_plani`
- Arastirma sentezi: `gemini-bridge.sh arastirma_sentezi`
- Usul raporu: `gemini-bridge.sh usul_raporu`
- Dilekce: `gemini-bridge.sh dilekce_yazimi`
- Revizyon: `gemini-bridge.sh revizyon`
- Self review: `gemini-bridge.sh self_review`

Director bu gorevlerde dogrudan uzun hukuki metin yazmamali. Claude sadece:

1. Kaynaklari toplar.
2. Context dosyasini hazirlar.
3. Bridge'i cagirir.
4. Ciktiyi okur.
5. Kalite kapisini uygular.

Bridge fail olursa ciktida su metadata zorunlu:

```yaml
engine: claude
fallback_used: true
fallback_reason: gemini_bridge_failed
```

## 6. Faz 2 Darbogazi: Asil Problem Seffaflik + Query Yonetimi

### 6.1 Mevcut olcumlerin siniri

`mcp-timings.jsonl` sadece MCP tool duration kaydediyor. Su gorunmuyor:

- Hangi sorgu terimi gitti?
- Kac sonuc geldi?
- Neden bu karar secildi?
- 429 oldu mu?
- 429 olduysa kac saniye beklendi?
- Ayni sorgu tekrarlandi mi?
- 2B'den 2C'ye hangi atif maddeleri gecti?
- Claude tool cagrilari arasinda dusunurken ne yapiyor?

Bu yuzden sistem takildiginda avukat terminalde yalniz bekliyor.

### 6.2 Loglardan gorunenler

Mevcut `mcp-timings.jsonl` icinde:

- Yargi MCP toplam: 13 paired call, toplam yaklasik 90.5 sn.
- Mevzuat MCP toplam: 10 paired call, toplam yaklasik 49.3 sn.
- NotebookLM toplam: 47 paired call, toplam yaklasik 1307 sn.
- 2026-05-02 gununde Yargi MCP 10 call, Mevzuat MCP 9 call gorunuyor.
- `FIVEAGENTS.md` standardina gore Yargi minimum 15 sorgu + min 5 tam metin, Mevzuat minimum 8 sorgu + atif/mulga denetimi. Log sayilari bu standardin tam ve denetlenebilir uygulandigini kanitlamiyor.
- Timing state ayni dava/asama altinda gunler arasi birikmis; bu da run bazli takip olmadigini gosteriyor.

Sonuc:

Yargi/Mevzuat "yavas tool" olmaktan cok "yonetilmeyen ve gorunmeyen pipeline" sorunu. Tool cagrilari tek tek 3-7 sn bandinda olabilir, ama arada:

- gereksiz beklemeler,
- tekrarli veya verimsiz sorgular,
- Claude'un uzun sessiz yorumlamasi,
- 429 sonrasi belirsiz bekleme,
- checkpoint/progress eksigi

toplam sureyi saatlere tasiyor olabilir.

## 7. Faz 2 Icin Zorunlu Progress Ledger

Her arastirma icin dosya:

```text
cases/{dava-id}/02-Arastirma/.faz2-progress.jsonl
```

Drive klasoru kullaniliyorsa:

```text
G:\Drive'im\Hukuk Burosu\...\02-Arastirma\.faz2-progress.jsonl
```

Her satir KVKK guvenli JSON olmali:

```json
{
  "ts": "2026-05-04T18:20:11Z",
  "run_id": "20260504-182000-engin-kaya",
  "phase": "2B",
  "step": "yargi_search",
  "query_no": 4,
  "query_label": "temporal_2024",
  "query_masked": "arac mahrumiyet bedeli rayic deger 2024",
  "tool": "mcp__claude_ai_Yarg_MCP__search_bedesten_unified",
  "attempt": 1,
  "status": "ok",
  "duration_ms": 4384,
  "result_count": 18,
  "selected_count": 2,
  "rate_limit_wait_ms": 0,
  "fallback_used": false,
  "note": "2 karar tam metin adayi"
}
```

Yazilmamasi gerekenler:

- tam karar metni,
- muvekkil ham adlari,
- TC/IBAN/adres,
- tool raw response.

Yazilmasi gerekenler:

- maskeli sorgu,
- hangi faz,
- hangi tool,
- sure,
- sonuc sayisi,
- secilen sonuc sayisi,
- retry/fallback,
- rate-limit beklemesi,
- bir sonraki adim.

Terminalde canli gorunum:

```text
[18:20:11] 2B/Yargi Q04 temporal_2024 START: "arac mahrumiyet bedeli rayic deger 2024"
[18:20:16] 2B/Yargi Q04 OK 4.4s result=18 selected=2 next=doc_fetch
[18:20:19] 2B/Yargi wait 1.5s rate-limit guard
[18:20:21] 2B/Yargi Q05 HGK START: "arac mahrumiyet bedeli HGK"
```

Bu olursa sistem 2 saat calissa bile avukat ne yaptigini gorur.

## 8. Yargi MCP Verimlilik ve Rate-Limit Cozumu

### 8.1 Sabit 3 saniye kurali yeterli degil

`ajanlar/arastirmaci/SKILL.md` 3 sn bekleme ve paralel batch yasagi koyuyor. Bu fazla kaba:

- 3 sn gercek limitten fazla olabilir.
- Bazi kosumlarda sorgularin 1-2 sn arayla basladigi gorunuyor; yani kural zaten garanti degil.
- 429 oldugunda 60 sn bekleme her zaman gerekli olmayabilir.
- Sabit kural avukata "neden bekliyorum" bilgisini vermez.

### 8.2 Cozum: Yargi MCP Queue + Adaptive Backoff

Yargi MCP icin tek merkezi scheduler olmali:

```text
YargiQueue:
  concurrency_per_server = 1
  min_delay_ms = 1500
  max_attempt = 2
  on_429:
    first = wait 15000
    second = wait 30000
    third = skip_query + RATE_LIMIT flag
  on_5xx_or_timeout:
    retry once after 5000
    then CLI fallback
```

Kurallar:

- Ayni anda birden fazla Bedesten/Yargi sorgusu yok.
- NotebookLM ve akademik kollar Yargi beklerken paralel calisabilir.
- Her bekleme progress ledger'a yazilir.
- 429 sebebiyle 60 sn ustu bekleme sadece avukata gorunur sekilde yapilir.
- 2 kez 429 alan sorgu tum Faz 2'yi durdurmaz; `RATE_LIMIT_SKIPPED` olur, sonra alternatif sorguya gecilir.

### 8.3 Sorgu kalitesi icin dedupe ve relevance gate

15 sorgu kalite icin iyi bir hedef, ama 15 kotu sorgu kalite degildir.

Zorunlu adim:

1. Gemini `arama_plani` once JSON plan uretir.
2. Director plan icinde duplicate query temizler.
3. Her sorgudan sonra `result_count` ve `selected_count` yazilir.
4. Iki ardisik sorgu `selected_count=0` ise plan revize edilir:
   - daha spesifik terim,
   - daire filtresi,
   - yil araligi,
   - HGK/IBK ayrimi.

Yargi arama planinda minimum kalite matrisi:

```text
temel_genis: 3
temporal_yil: 5
HGK/IBK: 2
daire_ozel: 2
celiski/bozma: 2
tam_metin_fetch: min 5, max 10
```

Bu sayilar korunur; fakat tekrar eden veya bos sorgular korlemesine devam etmez.

### 8.4 Tam metin fetch secimi

Tam metin okuma pahali olmasa bile context pahali. Kural:

- Ilk search sonucu sadece aday listesi.
- Aday skorlanir:
  - tarih guncel mi,
  - ilgili daire mi,
  - olay benzer mi,
  - HGK/IBK mi,
  - karsi arguman mi.
- Sadece top 5-10 karar tam metin cekilir.
- Tam metin cekilen her karardan 2C icin atif madde listesi cikarilir.

## 9. Mevzuat MCP Verimlilik Cozumu

### 9.1 Mevcut risk

Mevzuat protokolu kaliteli ama seri ve tekrarli calismaya acik:

- `search_mevzuat` tekrar tekrar ayni kanunu bulabilir.
- `get_mevzuat_madde_tree` ayni kanun icin tekrar cekilebilir.
- `get_mevzuat_content` her madde icin tek tek ve plansiz calisabilir.
- `page_size` explicit verilmezse API hatasi riski var.

### 9.2 Cozum: Kanun cache + madde batch

2C basinda atif maddeleri normalize edilir:

```text
TBK m.344
6098 sayili Turk Borclar Kanunu m.344
Turk Borclar Kanunu 344
=> 6098:344
```

Sonra cache:

```json
{
  "law_cache": {
    "6098": {
      "mevzuat_id": "...",
      "tree_fetched": true,
      "tree_duration_ms": 5195,
      "articles": {
        "344": { "status": "fetched" },
        "345": { "status": "fetched" }
      }
    }
  }
}
```

Kurallar:

- `search_kanun` veya kanun no ile dar arama tercih edilir.
- `search_mevzuat` broad arama sadece kanun bilinmiyorsa kullanilir.
- `page_size: 20` her search'te explicit verilir.
- `get_mevzuat_madde_tree` kanun basina bir kez.
- `get_mevzuat_gerekce` madde/kanun icin gerekiyorsa bir kez.
- Ayni madde ikinci kez istenirse cache'ten okunur.

### 9.3 Mulga eleme seffaf olmali

2B -> 2C aktarimi dosyaya yazilmali:

```text
02-Arastirma/atif-maddeleri.json
```

Format:

```json
[
  {
    "decision_id": "bedesten:...",
    "decision_label": "9.HD 2024/...",
    "citations": ["6098:344", "6100:200"]
  }
]
```

2C sonunda:

```text
02-Arastirma/mulga-eleme.json
```

Format:

```json
{
  "valid": 8,
  "date_mismatch": 1,
  "repealed": 0,
  "unknown": 2,
  "decisions": [
    {
      "decision_id": "...",
      "result": "GECERLI",
      "reason": "Atif maddeleri yururlukte; olay tarihi versiyonu uyumlu"
    }
  ]
}
```

Bu iki dosya olmadan arastirma raporu tamamlanmis sayilmamali.

## 10. NotebookLM Hakkinda Duzeltilmis Degerlendirme

NotebookLM icin 10 soru kalite geregi kabul edilebilir. Burada asil sorun "10 soru sorulmasi" degil:

- cevaplar yavas olabilir,
- NotebookLM uzun cevap uretebilir,
- ama bu kol diger kollari bloklamamali,
- cevap beklenirken Yargi/Mevzuat ilerlemeli,
- her NotebookLM sorgusu progress ledger'da gorunmeli.

NotebookLM icin onerilen kural:

- 10 soru korunur.
- Her soru `query_start` ile baslar, `query_status` polling progress olarak gorunur.
- Tek soru 3 dakikayi gecerse `SLOW_NOTEBOOKLM` flag yazilir ama diger kollara devam edilir.
- NotebookLM sonucu gec gelirse konsolide rapora "NotebookLM ek bulgulari sonradan eklendi" checkpoint'i ile islenir.

Yani NotebookLM'i kisarak kaliteyi dusurmek zorunlu degil. Asil kazanc, onu pipeline'i kilitlemeyen paralel ve gorunur bir kol yapmak.

## 11. Faz 2 Orkestrasyon Tasarimi

Hedef runtime:

```text
ASAMA 2 BASLA
  0. run_id olustur
  1. progress ledger ac
  2. Gemini arama_plani uret
  3. 3 kolu baslat:
       2D NotebookLM async
       2E Akademik async
       2B YargiQueue sync
  4. 2B bitince atif-maddeleri.json yaz
  5. 2C MevzuatQueue basla
  6. mulga-eleme.json yaz
  7. Tum mevcut kaynaklarla Gemini arastirma_sentezi cagir
  8. self_review cagir
  9. kalite kapi 1 uygula
  10. eksik varsa sadece eksik mini-kolu tekrar calistir
ASAMA 2 BITTI
```

Kalite kapisi:

```text
[ ] Yargi MCP primary kullanildi mi?
[ ] Yargi sorgu matrisi tamam mi?
[ ] Min 5 tam karar var mi?
[ ] Atif maddeleri dosyasi var mi?
[ ] Mevzuat page_size explicit mi?
[ ] Kanun/madde cache kullanildi mi?
[ ] Mulga eleme dosyasi var mi?
[ ] NotebookLM 10 soru tamam/partial flag var mi?
[ ] Her fallback progress log'da gorunuyor mu?
[ ] Gemini sentez frontmatter engine: gemini mi?
```

## 12. Faz 2 Canli Seffaflik Formati

Terminalde her 30-60 saniyede bir ozet:

```text
FAZ 2 DURUM - run 20260504-182000
2B Yargi: 7/15 sorgu, 2/5 tam metin, 0 rate-limit, son sorgu 4.1s
2C Mevzuat: bekliyor (2B atif maddeleri lazim)
2D NotebookLM: 4/10 soru, Q4 polling 82s
2E Akademik: 3/8 arama, 1 makale tam metin
Gecen sure: 06:42
Sonraki adim: Yargi temporal_2025
```

Bu format olmadan uzun arastirma kullanici icin "takildi" gibi hissedilir.

## 13. Profiling Katmani Eksikleri

### 13.1 Run id yok

Mevcut MCP timing loglari `asama` ve `dava_id` tasiyor ama `run_id` yok. Ayni dava icin farkli gunlerdeki denemeler tek raporda karisiyor.

Cozum:

- `tmp/current-run-id.txt`
- hook loglarina `run_id`
- timing report'ta `--run-id`

### 13.2 Tool input/output loglanmiyor, bu KVKK icin dogru; ama ozet metadata lazim

Raw input/output loglanmamali. Ama Director guvenli progress satiri yazmali:

- maskeli query,
- result_count,
- selected_count,
- attempt,
- fallback,
- wait reason.

### 13.3 Gaps gorunmuyor

MCP duration disinda Claude'un tool arasi dusunme sureleri gorunmuyor.

Cozum:

- Her faz adimi icin `step_start` / `step_end`.
- Tool cagrisi olmayan 60 sn ustu sessizlikte:

```text
[18:31:00] STILL_WORKING: Yargi sonuclarini skorlayip tam metin adaylarini seciyorum.
```

Bu sadece kullanici bilgilendirme degil, debug icin de zorunlu.

## 14. Guvenlik ve Secret Notu

Onceki rapordaki secret uyarisi hala gecerli. `.claude/settings.local.json` icinde literal Gemini API key gecen izin satirlari var. Degeri burada yazmiyorum.

Cozum:

1. Key rotate edilmeli.
2. Literal key iceren izin satirlari silinmeli.
3. Gemini auth `.env` veya kullanici credential store ile yapilmali.

Bu terminal hattini dogrudan etkiler; cunku Gemini bridge devreye alinirsa credential hijyeni daha kritik hale gelir.

## 15. Uygulama Plani

### Faz A - Doktrini runtime'a bagla

1. `.claude/commands/arastir.md`, `arastir-yargi.md`, `arastir-mevzuat.md` tam `FIVEAGENTS.md` protokolunu zorunlu referans alacak sekilde revize edilir.
2. `config/model-routing.json` hibrit schema'ya cekilir.
3. `scripts/gemini-bridge.sh` config okur hale getirilir.
4. Arastirma sentezi ve dilekce yazimi icin bridge cagrisi zorunlu yapilir.

Kabul:

- Yeni arastirmada `logs/model-events.jsonl` icinde yeni `arastirma_sentezi` Gemini event'i olur.
- Cikti frontmatter `engine: gemini` tasir.

### Faz B - Faz 2 progress ledger

1. Director her run icin `run_id` olusturur.
2. `.faz2-progress.jsonl` yazimi zorunlu olur.
3. Her MCP cagrisi oncesi/sonrasi terminal satiri basilir.
4. Her 5 tool cagrisi veya 3 dakikada checkpoint yazilir.

Kabul:

- Arastirma sirasinda `tail -f .faz2-progress.jsonl` ile sistemin ne yaptigi gorulur.
- 60 sn ustu sessizlikte `STILL_WORKING` satiri vardir.

### Faz C - Yargi/Mevzuat scheduler

1. YargiQueue adaptive backoff ile yazilir.
2. MevzuatQueue kanun/madde cache ile yazilir.
3. Query dedupe ve relevance gate eklenir.
4. Rate-limit olaylari rapora ve progress log'a yazilir.

Kabul:

- 429 olursa sistem 2-3 saat kilitlenmez; sorgu flaglenir ve devam eder.
- Yargi/Mevzuat toplam bekleme sureleri raporda ayrica gorunur.

### Faz D - Kalite kapi ve self-review

1. `atif-maddeleri.json` olmadan 2C baslamaz.
2. `mulga-eleme.json` olmadan arastirma tamamlanmis sayilmaz.
3. Gemini `self_review` kalite kapisini calistirir.
4. Eksik sadece eksik mini-kol tekrar calistirilir; tum Faz 2 bastan baslamaz.

Kabul:

- Raporda gecerli/elenen karar tablolari vardir.
- Eksik kaynaklar `BULUNAMADI`, `RATE_LIMIT_SKIPPED`, `MCP_FALLBACK_USED` gibi gorunur flag'lerle yazilir.

## 16. Net Oncelik Sirasi

1. `.claude/commands/arastir*.md` dosyalarini tam protokole bagla.
2. Faz 2 progress ledger ve terminal durum satirlarini ekle.
3. `run_id` tabanli profiling duzelt.
4. YargiQueue adaptive rate-limit governor ekle.
5. Mevzuat cache/batch ekle.
6. Gemini bridge'i sentez ve yazim icin zorunlu hale getir.
7. Secret rotate ve settings temizligi yap.

## 17. Son Degerlendirme

Bu sistemin hayal edilen hali gercekci: hizli, kaynakli, stratejik ve dilekceye dogrudan tasinan bir hukuk arastirma hatti kurulabilir. Mevcut sorun kalite vizyonunda degil; uygulama katmaninda:

- command dosyalari doktrini zorlamiyor,
- MCP cagrilari merkezi scheduler'dan gecmiyor,
- rate-limit davranisi olculu/adaptif degil,
- avukat progress gormuyor,
- Gemini hukuki uretim zorunlu degil,
- profiling run bazli degil.

NotebookLM 10 soru sormaya devam edebilir. Asil degisiklik su olmali: Yargi/Mevzuat MCP sorgulari planli, cache'li, rate-limit kontrollu ve terminalde gorunur hale getirilmeli. O zaman Faz 2 "takildi mi calisiyor mu" belirsizliginden cikar; avukat 2-3 saat beklemek yerine her dakika sistemin hangi hukuki izi takip ettigini gorur.
