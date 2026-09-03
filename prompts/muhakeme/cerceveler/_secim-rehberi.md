# Argüman Çerçevesi Seçim Rehberi

> Kaynak: esaterbiltavus/yapay-zeka-turkce-dilekce-skilleri (MIT, commit 00f0b43).
> Vega Hukuk hattına uyarlandı (2026-08-07). Bu dosya ASAMA 4E (sentez-strateji)
> tarafından çerçeve önerisi verirken, Director tarafından tekil dilekçe
> komutlarında okunur. Çerçeve ZORUNLU DEĞİLDİR; önerilmezse standart yapı
> (dilekce-yazim-kurallari.md) kullanılır. Avukat her zaman override eder.

## 12 çerçeve — tek bakış

| Çerçeve | Dosya | Şema | Güçlü olduğu yer |
|---|---|---|---|
| MIRAT | `mirat.md` | Maddi Vakıa → Mesele → Kural → Uygulama → Sonuç | Vakıa-ağırlıklı, mesele-temelli klasik analiz |
| IRAAC | `iraac.md` | Mesele → Kural → Uygulama → Karşı-Uygulama → Sonuç | Karşı argümanın gövdeye işlendiği analiz |
| ILAC | `ilac.md` | Mesele → Mevzuat → Uygulama → Sonuç | Mevzuat hükmünün merkezde olduğu basit uyuşmazlık |
| IPAC | `ipac.md` | Mesele → İlke/Doktrin → Uygulama → Sonuç | Mevzuat boşluğu; ilke/doktrin ağırlıklı argüman |
| TREAC | `treac.md` | Tez → Kural → Açıklama → Uygulama → Sonuç (+karşı argüman) | Tezi başa koyan savunma/cevap |
| CRAC | `crac.md` | Sonuç → Kural → Uygulama → Sonuç | Kısa, net, güçlü dosyada hâkimi baştan yönlendirme |
| CRuPAC | `crupac.md` | Sonuç → Kural → Kuralın İspatı → Uygulama → Sonuç | Kuralın kendisinin tartışmalı olduğu dosya |
| CREXAC | `crexac.md` | Sonuç → Kural → Açıklama → Emsal → Uygulama → Sonuç | Emsal karar karşılaştırması taşıyan argüman |
| TREAT | `treat.md` | Tez → Kural → Açıklama → Uygulama → Tez | Tezin tekrarla mühürlendiği kısa brief |
| CRRACC | `crracc.md` | Sonuç → Kural → Açıklama → Uygulama → Karşı argüman → Sonuç | Karşı argüman + menfaat tartısı gereken dosya |
| Toulmin | `toulmin.md` | İddia → Dayanak → Köprü(Warrant) → Destek → Çekince → Çürütme | İtiraz; karşı tarafın zayıf köprüsünü hedefleme |
| Klasik retorik | `klasik-retorik.md` | Exordium → Narratio → Partitio → Confirmatio → Refutatio → Peroratio | Çok bölümlü, anlatı gücü yüksek kapsamlı dilekçe |

## Duruma göre varsayılan öneri

| Durum | Birincil | Alternatif |
|---|---|---|
| Dava dilekçesi — güçlü dosya, net talep | CRAC | CRuPAC (kural tartışmalıysa) |
| Dava dilekçesi — çok vakıalı / karmaşık | Klasik retorik | MIRAT |
| Cevap dilekçesi | TREAC | CRRACC |
| Replik / düplik | IRAAC | TREAT |
| Bilirkişi raporuna itiraz, her tür itiraz | Toulmin | IRAAC |
| İstinaf / temyiz | CREXAC | IRAAC |
| Emsal içtihat omurgalı argüman | CREXAC | CRuPAC |
| Mevzuat boşluğu / ilke-doktrin argümanı | IPAC | Toulmin |
| Zayıf dosya (sonucu sona saklama — piramit) | MIRAT | ILAC |

## Seçim kuralları

1. Tek dilekçede TEK ana çerçeve kullanılır; ancak farklı argüman blokları
   için farklı çerçeve önerilebilir (örn. gövde CRAC + itiraz bloğu Toulmin).
2. Çerçeve dış yapıyı DEĞİŞTİRMEZ: bölüm sırası dilekce-yazim-kurallari.md'ye
   göre sabittir; çerçeve yalnızca AÇIKLAMALAR / HUKUKİ DEĞERLENDİRME içindeki
   argüman iskeletini belirler.
3. Çatışma önceliği: uslup-aykut.md > dilekce-yazim-kurallari.md >
   _ortak-kurallar.md > çerçeve dosyası.
4. Öneri gerekçesi 1 cümleyi geçmez; avukat override ederse override geçerlidir.
