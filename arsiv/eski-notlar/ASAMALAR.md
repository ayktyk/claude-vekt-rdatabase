> ARŞİV — güncel kaynak: `AGENTS.md` (2026-09-02). Bu dosya tarihçe olarak korunur.

# Dava Akışı — Tüm Aşamalar (Güncel Durum)

> Son güncelleme: 2026-08-08. Kaynak: CLAUDE.md (7 ASAMA workflow) + argüman
> çerçevesi entegrasyonu (2026-08-07, `prompts/gemini/cerceveler/`).
> Tetikleyici: `yeni dava: [isim], [tür] / özet: [...] / kritik nokta: [...]`
> Her aşama başında motor bildirimi verilir; avukat **devam / atla / motor
> değiştir / dur** der. Aşama komutları tekil de çalıştırılabilir
> (`usul:`, `arastir:`, `stratejik analiz:`, `dilekce v1:`, `savunma simule et:`, `revize et:`).

---

## ASAMA 0 — MemPalace Wake-up
- **Motor:** Claude (terminal). Her komutta zorunlu ilk adım.
- `mempalace_status` + `mempalace_search` (wing_buro_aykut + dava türü wing'i; tam davada ajan diary'leri ve biliniyorsa hakim/avukat wing'leri).
- Çıktı: context enjeksiyonu + varsa "MEMORY MATCH" notu. Yazma yapılmaz.

## ASAMA 1 — Hazırlık + Briefing
- **Motor:** Claude (terminal).
- Drive dava klasörü kurulur: `Aktif Davalar/{dava-id}/` (01-Usul / 02-Arastirma / 03-Sentez-ve-Dilekce / 04-Muvekkil-Belgeleri / 05-Durusma-Notlari).
- **Kaynak sorgulama (zorunlu):** UYAP dosyası (`dava-cli clone`) / NotebookLM / Drive / yerel dosya / Claude Projects / kaynak yok — avukat cevabı beklenir.
- Opsiyonel Advanced Briefing (dava teorisi, kritik risk, ton, olmazsa olmaz talepler; MemPalace ön-doldurma).
- İlgili **playbook** (`playbook/{dava-turu}.md`) ve **dersler** dosyaları okunur.
- Çıktı: `00-Briefing.md`

## ASAMA 2 — Derin Araştırma
- **Motor:** Claude Fable 5 (iteratif derin protokol; fallback Opus 4.8).
- **2B Yargı MCP (birincil):** min 15 sorgu — yıl-yıl temporal evolution (son 5 yıl), min 2 HGK, min 2 çelişki/bozma taraması, min 5 tam metin okuma; sorgu başına min 3 sn bekleme (429 koruması).
- **2C Mevzuat MCP (2B'den sonra sıralı):** min 8 sorgu — atıf maddeleri çekimi, **mülga/güncel denetimi** (mülga maddeye dayanan karar elenir), gerekçe, değişiklik tarihçesi, **normlar hiyerarşisi** etiketleme (Lex Superior/Specialis/Posterior, CBK münhasır alan denetimi).
- **2D NotebookLM/Drive (paralel kol, zinciri bloklamaz):** min 10 sorgu, "SADECE KAYNAKLARA GÖRE" ibaresi zorunlu.
- Her 5 sorguda checkpoint (`02-Arastirma/checkpoint-*.md`).
- Çıktı: `02-Arastirma/arastirma-raporu.md` (+ `atif-maddeleri.json`, `mulga-eleme.json`)
- **KALİTE KAPISI 1:** `cikti_dogrula.py` + `quality_gate.py asama2` + Kaynak Doğrulama Tablosu.

## ASAMA 3 — Usul Raporu  *(BATCH 1 — Antigravity devir bloğu)*
- **Motor:** Antigravity (Gemini 3.1 Pro, sağ panel); fallback Claude.
- Görevli/yetkili mahkeme + **Adliye Eşleme Protokolü** (ilçe→adliye web doğrulaması, kaynak URL zorunlu), vekaletname, zorunlu ön adımlar (arabuluculuk/ihtarname), kritik süreler, harç tahmini, risk analizi.
- Antigravity self-review (KIRMIZI/SARI/YEŞİL) → Drive'a yazım → avukat "ASAMA 3 bitti".
- Çıktı: `01-Usul/usul-raporu.md`
- **KALİTE KAPISI 2:** usul kontrol listesi + `cikti_dogrula.py`.

## ASAMA 4 — 5-Ajan Stratejik Analiz  *(BATCH 2 — Antigravity devir bloğu)*
- **Motor:** Antigravity; fallback Claude.
- 4A Davacı + 4B Davalı + 4C Bilirkişi + 4D Hakim paralel → **4E Sentez**: KIRMIZI / YEŞİL / ŞARTLI karar + **Dilekçe Yazım Rehberi**.
- Rehber artık şunu da içerir *(2026-08-07)*:
  - **Çerçeve önerisi** — `prompts/gemini/cerceveler/_secim-rehberi.md` tablosundan (örn. cevap→TREAC, itiraz→Toulmin, istinaf→CREXAC); avukat override eder.
  - **Argüman bazlı çerçeve** (gerekirse; örn. itiraz bloğu → Toulmin).
- Hipotez seçimi **avukat onayı** gerektirir — onaysız dilekçe ailesine geçilmez.
- Çıktı: `02-Arastirma/stratejik-analiz.md`
- **KALİTE KAPISI 3:** 4/4 tam, 3/4 uyarılı, 2/4 sınırlı (DÜŞÜK GÜVEN), 1-0/4 başarısız.

## ASAMA 5 — Dilekçe v1  *(BATCH 3 başlangıcı — tek sohbette 5+6+7)*
- **Motor:** Antigravity; fallback Claude (`ajanlar/dilekce-yazari/SKILL.md`).
- Girdiler: briefing + araştırma + usul + stratejik analiz + **seçilen çerçeve dosyası** (`cerceveler/<cerceve>.md`).
- Çerçeve yalnızca AÇIKLAMALAR / II. HUKUKİ DEĞERLENDİRME'nin **iç iskeletini** kurar; dış yapı (Makam→Taraflar→KONU→AÇIKLAMALAR→DELİLLER→HUKUKİ NEDENLER→SONUÇ VE TALEP) sabittir; çerçeve adım adları (Claim, Warrant, Tez) metne başlık olarak yazılmaz.
- Çatışma önceliği: `uslup-aykut.md` > `dilekce-yazim-kurallari.md` > `_ortak-kurallar.md` > çerçeve dosyası.
- Min 2 doğrulanmış Yargıtay atfı; GÜVEN NOTU bloğu; TASLAK ibaresi.
- Çıktı: `03-Sentez-ve-Dilekce/dilekce-v1.md` (+ DOCX; **UDF üretilmez**).

## ASAMA 6 — Savunma Simülasyonu  *(BATCH 3 devamı)*
- **Motor:** Antigravity; fallback Claude (`ajanlar/savunma-simulatoru/SKILL.md`).
- **Toulmin Köprü (Warrant) Analizi (zorunlu, 2026-08-07):** v1'deki her ana argüman için Claim–Grounds–Warrant çıkarılır; karşı tarafın 3 en güçlü savunma hattı öncelikle **zayıf/örtük warrant'lara** yöneltilir; her savunmada "**Hedeflenen köprü (warrant)**" alanı doldurulur.
- karsi-arguman-onsorgu tehdit listesi (KRİTİK/YÜKSEK öncelik kuralı); yalnız DOĞRULANMIŞ kararlar kullanılır.
- Çıktı: `02-Arastirma/savunma-simulasyonu.md` (3 savunma + karşılama stratejisi + güçlendirme listesi).

## ASAMA 7 — Dilekçe v2 NİHAİ  *(BATCH 3 sonu — "Hepsi bitti")*
- **Motor:** Antigravity; fallback Claude (`ajanlar/revizyon-ajani/SKILL.md`).
- **7 boyut denetim:** 1) İspat yeterliliği 2) Mevzuat uygunluğu 3) İçtihat desteği 4) Karşı taraf hazırlığı (simülasyondaki 3 savunma karşılandı mı) 5) Ton/üslup 6) Hesap tutarlılığı 7) **Çerçeve bütünlüğü** *(2026-08-07)* — çerçeve doğrulama listesi + warrant açıklığı + "Hedeflenen köprü" saldırılarının karşılanması.
- Çıktı: `03-Sentez-ve-Dilekce/dilekce-v2.md` + DOCX + **UDF** (`md_to_udf.py` — UYAP'a hazır).
- **KALİTE KAPISI 4:** bloklayıcı sorun taraması (doğrulanmamış 2+ atıf, hesap tutarsızlığı, yanlış madde, eksik arabuluculuk atfı) + bağımsız Claude reviewer (her documentId Pro MCP ile yeniden çekilir).

---

## Kapanış (her akış sonunda)
1. MemPalace **diary write** (ajan öğrenmeleri; argüman drawer'ları — KVKK maskeli).
2. `qmd update` + `md_to_docx.py` / `md_to_udf.py` çağrıları.
3. Takvim: zamanaşımı (3 ay + 1 ay önce), hak düşürücü süreler, arabuluculuk, duruşma hatırlatmaları.
4. **Dersler ritüeli:** "Bu işte ben neyi kaçırdım / sen neyi düzelttin?" → `dersler/*.md` (2+ tekrar → kalıcı dosyaya terfi).
5. Playbook güncellemesi: avukata 2-3 hedefli muhakeme sorusu.

## Kanun Yolu (7 ASAMA dışı, gerektiğinde)
- `istinaf yaz:` / `temyiz yaz:` — varsayılan çerçeve **CREXAC** (emsal odaklı); kural ihlali ağırlıklıysa **IRAAC**. Çıktı: MD + DOCX + UDF üçlüsü.
