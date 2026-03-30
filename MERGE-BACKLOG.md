# MERGE-BACKLOG.md

## Amac

Bu belge, [MERGE.md](/C:/Users/user/Desktop/projelerim/Vektör%20Database%20li%20Otomasyon%20Claude%20Code/MERGE.md)
icindeki hedef akisi mevcut `hukuk-takip` uygulamasina hangi sirayla indirecegimizi tanimlar.

Bu bir fikir listesi degil.
Bu belge, uygulama backlog'udur.

## Mevcut Durum

Bugun sistemde zaten var:

- muvekkil olusturma
- dava olusturma
- AI workspace hazirlama
- briefing / usul / arastirma / savunma / revizyon / dilekce dosya yollarini davaya yazma
- belge yukleme, indirme, silme
- evrak checklist senkronu
- dava detay ekraninda belge, not, masraf, tahsilat, durusma sekmeleri

Bugun sistemde eksik olan kritik katmanlar:

- `ai_jobs` tabanli surec orkestrasyonu
- `kritik nokta sentezi` veri modeli ve ekranlari
- `briefing onay` akisi
- `kaynak secimi` akisi
- `usul pre-check` ve `usul qc`
- `arastirma qc`
- `artifact review` sistemi
- `belge -> olgu -> arguman` izlenebilirligi

## Ana Tasarim Karari

Bu backlog su prensiple ilerleyecek:

1. once veri modeli ve job omurgasi
2. sonra `kritik nokta -> briefing -> kaynak secimi`
3. sonra `usul`
4. sonra `paralel arastirma`
5. sonra `dilekce hatti`
6. en son `UYAP`

Yani once gosterisli agent cagrilari degil,
once guvenilir surec iskeleti kurulacak.

## Faz 1: AI Job Omurgasi

Bu faz olmadan sonraki adimlar daginik kalir.
Ilk teknik is bu olmali.

### Veritabani

Eklenecek tablolar:

- `ai_jobs`
- `ai_job_steps`
- `ai_job_artifacts`
- `ai_job_reviews`
- `ai_job_sources`

`ai_jobs` alan onerisi:

- `id`
- `case_id`
- `job_type`
- `status`
- `current_step_key`
- `started_at`
- `finished_at`
- `created_by`
- `created_at`
- `updated_at`

`ai_job_steps` alan onerisi:

- `id`
- `job_id`
- `step_key`
- `step_label`
- `status`
- `input_snapshot`
- `output_snapshot`
- `started_at`
- `finished_at`
- `error_message`

`ai_job_artifacts` alan onerisi:

- `id`
- `job_id`
- `case_id`
- `artifact_type`
- `title`
- `storage_path`
- `content_preview`
- `version_no`
- `source_step_key`
- `created_at`

`ai_job_reviews` alan onerisi:

- `id`
- `job_id`
- `artifact_id`
- `review_type`
- `status`
- `review_notes`
- `reviewed_by`
- `reviewed_at`

`ai_job_sources` alan onerisi:

- `id`
- `job_id`
- `source_type`
- `source_name`
- `source_locator`
- `is_enabled`
- `priority`
- `filter_config`
- `created_at`

### API

Eklenecek route ailesi:

- `GET /api/cases/:id/ai-jobs`
- `POST /api/cases/:id/ai-jobs`
- `GET /api/ai-jobs/:id`
- `POST /api/ai-jobs/:id/run-step`
- `POST /api/ai-jobs/:id/review`

### UI

`CaseDetailPage` icine yeni sekme:

- `Arastirma`

Bu sekmede ilk asamada sadece su gorunsun:

- aktif job var mi
- hangi adimdayiz
- hangi artifactler uretildi
- hangi review bekliyor

### Kabul Kriteri

- bir dava icin AI job kaydi acilabilmeli
- job adimlari kaydedilebilmeli
- artifactler job ile iliskilenebilmeli
- dava detayinda bu durum gorulebilmeli

## Faz 2: Kritik Nokta Sentezi

Bu faz briefing'den once gelir.
Bu siralama degismemeli.

### Veritabani

Iki secenek var:

1. `cases` tablosuna ozet alanlari eklemek
2. ayri `case_intake_profiles` tablosu acmak

Benim onerim ayri tablo:

- `case_intake_profiles`

Alan onerisi:

- `case_id`
- `lawyer_direction`
- `client_interview_notes`
- `critical_point_summary`
- `main_legal_axis`
- `secondary_risks`
- `proof_risks`
- `missing_information`
- `missing_documents`
- `opponent_initial_arguments`
- `approved_by_lawyer`
- `approved_at`

### API

- `GET /api/cases/:id/intake-profile`
- `PUT /api/cases/:id/intake-profile`
- `POST /api/cases/:id/intake-profile/generate-critical-point`
- `POST /api/cases/:id/intake-profile/approve`

### UI

`Arastirma` sekmesinde ilk kart:

- `Kritik Nokta`

Form alanlari:

- avukatin yazili yonlendirmesi
- muvekkil gorusme notu
- otomatik belge bulgulari ozeti
- ana hukuki eksen
- riskler
- eksik bilgi
- eksik belge

### Ajan

Ilk calisacak moduller:

- belge ozetleyici
- fact extractor
- kritik nokta sentezleyici

### Kabul Kriteri

- avukat notu girilebilmeli
- belge yukleri bu sentezde kullanilabilmeli
- sistem taslak kritik nokta uretebilmeli
- avukat onaylamadan briefing'e gecilememeli

## Faz 3: Briefing ve Onay

### Veritabani

`ai_job_artifacts` uzerinden tutulabilir.
Ek olarak istenirse ayri `case_briefings` tablosu eklenebilir.

Minimum alanlar:

- `case_id`
- `version_no`
- `summary`
- `main_goal`
- `secondary_goal`
- `main_procedure_risk`
- `main_proof_risk`
- `tone_strategy`
- `status`

### API

- `POST /api/cases/:id/briefing/generate`
- `GET /api/cases/:id/briefing`
- `POST /api/cases/:id/briefing/approve`

### UI

`Arastirma` sekmesinde ikinci kart:

- `Briefing`

Burada:

- briefing ozet gorunumu
- markdown artifact linki
- `Onaya Gonder`
- `Duzenle`
- `Onayla`

### Kabul Kriteri

- kritik nokta onayi olmadan briefing uretilmemeli
- briefing hem DB'de ozet olarak hem workspace'te artifact olarak durmali
- son onay durumu davada gorunmeli

## Faz 4: Kaynak Secim ve Arastirma Profili

### Veritabani

Bu faz `ai_job_sources` ile tasinabilir.
Ek olarak istenirse `case_research_profiles` tablosu eklenebilir.

Alan onerisi:

- `case_id`
- `use_notebooklm`
- `notebooklm_name`
- `use_vector_db`
- `vector_collections`
- `use_yargi_mcp`
- `yargi_filters`
- `use_mevzuat_mcp`
- `mevzuat_scope`
- `use_internal_examples`
- `lawyer_source_note`

### API

- `GET /api/cases/:id/research-profile`
- `PUT /api/cases/:id/research-profile`

### UI

`Arastirma` sekmesinde ucuncu kart:

- `Kaynak Secimi`

Kontroller:

- NotebookLM ac/kapat
- notebook adi
- Vector DB ac/kapat
- koleksiyon secimi
- Yargi MCP ac/kapat
- filtre alanlari
- Mevzuat MCP ac/kapat
- mevzuat kapsami
- dahili emsal kullan
- serbest avukat notu

### Kabul Kriteri

- arastirma hangi kaynaklardan yapilacak net kayda gecmeli
- bu secim daha sonra job adimlarinda aynen kullanilabilmeli

## Faz 5: Usul Pre-Check ve Usul Raporu

Bu faz iki parcali gelmeli.

### Veritabani

Artifact tipleri:

- `procedure_precheck`
- `procedure_report`
- `procedure_qc`

Review tipleri:

- `procedure_review`

### API

- `POST /api/cases/:id/procedure/precheck`
- `POST /api/cases/:id/procedure/generate`
- `POST /api/cases/:id/procedure/review`

### UI

`Arastirma` sekmesinde dorduncu alan:

- `Usul`

Alt bolumler:

- pre-check sonucu
- tespit edilen eksikler
- usul raporu ozeti
- kalite kontrol sonucu

### Ajan

Usul ajanina gidecek paket:

- case metadata
- kritik nokta ozeti
- briefing
- belge ozetleri
- eksik belge listesi
- dar kapsamli usul mevzuati

### Kabul Kriteri

- veri yetersizse pre-check bunu bloklamali
- pre-check temiz degilse usul raporu olusmamali
- usul raporu review olmadan arastirma job'u baslamamali

## Faz 6: Paralel Arastirma Hatti

### Veritabani

`ai_job_steps` icinde ayri step key'ler:

- `research_notebooklm`
- `research_vector_db`
- `research_yargi_mcp`
- `research_mevzuat_mcp`
- `research_merge`
- `research_qc`

Artifact tipleri:

- `research_notes_notebooklm`
- `research_notes_vector_db`
- `research_notes_yargi`
- `research_notes_mevzuat`
- `research_report`
- `research_conflicts`

### API

- `POST /api/cases/:id/research/run`
- `GET /api/cases/:id/research/report`
- `POST /api/cases/:id/research/review`

### UI

Arastirma sekmesinde:

- her kaynagin durum rozeti
- tamamlanma yuzesesi
- bulunan kaynak sayisi
- conflict listesi
- arastirma raporu

### Ajan

Paralel rolleri net ayrilmali:

- NotebookLM: dava / ofis baglami
- Vector DB: emsal hafiza
- Yargi MCP: ictihat
- Mevzuat MCP: normatif dogruluk

### Kabul Kriteri

- kaynak bazli adimlar ayri ayri gorunmeli
- basarisiz bir kaynak tum job'u gocurtmemeli
- conflict detector celiskileri ayri artifact olarak yazmali
- arastirma QC onayi olmadan dilekce job'u baslamamali

## Faz 7: Dilekce v1, Savunma Simulasyonu, Dilekce v2

### Veritabani

Artifact tipleri:

- `pleading_v1`
- `defense_simulation`
- `pleading_v2`
- `pleading_final_review`

### API

- `POST /api/cases/:id/pleading/generate-v1`
- `POST /api/cases/:id/pleading/simulate-defense`
- `POST /api/cases/:id/pleading/generate-v2`
- `POST /api/cases/:id/pleading/review`

### UI

`Arastirma` sekmesi veya ayri `Taslaklar` sekmesi:

- v1 onizleme
- savunma simulasyonu
- zayif noktalar listesi
- v2 onizleme
- son review notlari

### Kabul Kriteri

- v1 tek basina final sayilmamali
- savunma simulasyonu v2 uretimine veri vermeli
- v2 son avukat onayina cikmali

## Faz 8: UDF Cikti Hatti

### Veritabani

Artifact tipleri:

- `udf_output`
- `udf_generation_log`

### API

- `POST /api/cases/:id/udf/generate`
- `GET /api/cases/:id/udf`

### UI

- `UDF Hazirla`
- `UDF Indir`
- son uretim zamani
- kaynak v2 artifact linki

### Kabul Kriteri

- yalnizca onayli v2 uzerinden UDF uretilmeli
- UDF artifact olarak davaya baglanmali

## Faz 9: Audit ve Izlenebilirlik

Bu faz ertelenmemeli.
En azindan iskeleti erken gelmeli.

### Hedef

Su zinciri gorulebilmeli:

`belge -> olgu -> kritik nokta -> briefing -> usul -> arastirma -> dilekce`

### UI

Artifact detayinda:

- bu sonuc hangi belgelerden beslendi
- hangi kaynaklarla dogrulandi
- hangi review'den gecti

### Kabul Kriteri

- avukat bir argumanin dayandigi belgeyi gorebilmeli
- review notu olmadan artifact final gorunmemeli

## Faz 10: UYAP

Bu backlogda bilerek son fazdir.

Bu asamaya gecis on kosulu:

- belge akisi stabil
- kritik nokta sentezi calisiyor
- briefing akisi var
- usul pre-check ve usul raporu var
- paralel arastirma var
- research QC var
- v1 -> savunma simulasyonu -> v2 var
- UDF stabil uretiliyor

UYAP bu backlogun erken fazlarina alinmayacak.

## Ilk Iki Sprintte Ne Yapacagiz

Ilk iki sprint icin net onerim:

### Sprint 1

- `ai_jobs` veri modeli
- `ai_job_artifacts` veri modeli
- `Arastirma` sekmesi iskeleti
- dava bazli AI job listeleme
- artifact panelinin ilk versiyonu

### Sprint 2

- `case_intake_profile`
- kritik nokta formu
- belge ozetlerinden kritik nokta taslagi
- kritik nokta onay akisi
- briefing generate ve briefing onay

Bu iki sprint bitmeden `Yargi MCP`, `NotebookLM`, `Mevzuat MCP` entegrasyonunu UI'ya tam baglamaya calismak erken olur.

## Bugunden Yarinin Isine Donusen Somut Gorevler

Hemen acilabilecek implementasyon kartlari:

1. `server/src/db/schema.ts` icine `ai_jobs` ve ilgili tablolari ekle
2. migration olustur
3. `server/src/routes` altina `aiJobs.ts` ekle
4. `client/src/hooks` altina `useAiJobs.ts` ekle
5. [CaseDetailPage.tsx](/C:/Users/user/Desktop/projelerim/Vektör%20Database%20li%20Otomasyon%20Claude%20Code/isbu-ofis/hukuk-takip/client/src/pages/CaseDetailPage.tsx) icine `Arastirma` sekmesini ekle
6. dava detayinda artifact listesi kartini ekle
7. `case_intake_profile` veri modelini ekle
8. kritik nokta formunu ekle
9. briefing generate endpoint'ini ekle
10. review durum rozeti ekle

## Karar

Uygulama backlog'unun ilk teknik adimi `AI job omurgasi`dir.
Benim onerim, bir sonraki implementasyon turunda dogrudan bunu kodlamaya baslamamiz.
