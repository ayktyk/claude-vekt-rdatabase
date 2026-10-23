# Dava Aşama Modeli — "hangi aşamadayız, sıradaki işlem ne?" (büro standardı)

Son güncelleme: 2026-10-20 · Sahibi: Director (ORKESTRATOR) · Kaynak: `playbook/surec/*.md`

<!-- DOKTRIN-PREAMBLE v1 -->
> **0-HALÜSİNASYON + ANTI-SYCOPHANCY (zorunlu — tam metin: `prompts/_doktrin-preamble.md`):**
> - UYDURMA YARGITAY/HGK/İBK kararı atfı YASAK — her künye Bedesten documentId ile doğrulanır; doğrulanmayan "DOĞRULANMAMIŞ" damgalanır.
> - Karar metni ALINTISI UYDURULAMAZ — tırnak içi alıntı birebir kaynaktan.
> - BAĞLAM KORUNMALI — bir fıkranın cevabı başka fıkraya genellenemez.
> - Avukatı memnun etmek için LEHE YORUM YASAK; ALEYHE İÇTİHAT açıkça gösterilir, gizlenmez.
> - "KAYNAK YOK" demek dürüstlüktür — sayı doldurmak için uydurma atıf HARD FAIL.
> - Kritik kuralda ÇİFT KAYNAK şart.
> - ÇIKARIM GEÇERLİLİĞİ: Kaynak gerçek olsa dahi ondan çıkarılan sonuç geçersizse HARD FAIL — bağlam kayması, meşru olmayan genelleme, caiz olmayan kıyas, bilinçli susmayı boşluk sayma reddedilir.
> - Çıktının sonunda KAYNAK DOĞRULAMA tablosu (| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |) + "Aleyhe içtihat: VAR/YOK/ARANMADI" beyanı ZORUNLU.

TASLAK — avukat son kontrolü yapar. KARAR NOKTASI YOK — rutin uygulama (dava türüne özgü karar noktaları kendi süreç dosyasındadır).

## Amaç

Her dosya tek bir **aşama kodu** taşır; kod, o dosyanın hangi örüntüde (dava türü süreç dosyası) ve örüntünün neresinde olduğunu söyler. "Sıradaki işlem" örüntü dosyasındaki ilgili satırdan okunur. Böylece panoda, portföyde, `00-Dava-Ozeti.md`'de ve isbu-ofis önerilerinde aynı dil konuşulur.

Kod biçimi: `<ÖRÜNTÜ>:<AŞAMA>` — örn. `ISC:A6` (işçilik alacakları, rapora beyan + artırım), `ICRA:T3` (ilamsız takip, itirazın iptali derdest), `CMK:K2` (kovuşturma, delil aşaması).

## Örüntüler ve kaynak dosyaları

| Örüntü | Kod | Hangi dosyalar | Süreç dosyası | Doğrulama durumu |
|---|---|---|---|---|
| İşçilik alacakları (işçi vekili) | `ISC` | 2025-002, 2025-003, 2025-004, 2025-005, 2025-009, 2026-006, 2026-008, 2026-009, 2026-011, 2026-021, 2026-029, 2026-030, 2026-037, 2026-040, 2026-050, 2026-051, 2026-055 | `iscilik-alacaklari-dava-sureci.md` (A0–A13) | **Mevzuat + içtihat DOĞRULANDI (2026-10-20)** |
| İşe iade | `IADE` | 2025-010 | `../ise-iade.md` §6 Dava akışı | Playbook doğrulamalı (2026-07); süreç HMK genel aşamalarını izler, temyiz kapalı (7036 m.8/1-a — bu turda doğrulandı) |
| Genel HMK alacak/tazminat (trafik maddi hasar, değer kaybı, tüketici, kira tespit, tahliye, itirazın iptali davası, haksız fiil tazminatı) | `HMK` | 2026-001, 2026-003, 2026-007, 2026-010, 2026-012, 2026-016, 2026-019, 2026-024, 2026-027, 2026-032, 2026-038, 2026-042, 2026-044, 2026-045, 2026-048, 2026-054, 2026-059, 2025-001 | Bu dosya §3 + ilgili playbook "Dava akışı" | HMK genel aşamaları bu turda doğrulandı (137–147, 186, 240, 281, 294, 341–362); yazılı usulde dilekçeler aşaması 4 dilekçe (HMK 141/1 doğrulandı); tüketici ve kira sulh hukuk basit usul (HMK 316) — madde bu turda çekilmedi [DOĞRULANMAMIŞ] |
| Aile (boşanma, mal rejimi, soybağı) | `AILE` | 002, 2026-056, 2026-058, 2026-033 | `../aile-bosanma.md` §6 | Playbook doğrulamalı; kesinleşmeden icra yok (HMK 350/2 — doğrulandı) |
| Gayrimenkul (izale-i şuyu, tapu, 2/B, tespit) | `GAYR` | 2026-013, 2026-057, 2025-001, 2026-015 (miras ret) | `../gayrimenkul.md` §6, `../miras-ret.md` | Playbook doğrulamalı; kesinleşme şartı 350/2 |
| İcra takibi ve itiraz hattı | `ICRA` | 2026-005, 2026-014, 2026-023, 2026-052, 2026-053, 2026-054 (icra kolu), 2026-059, `icralar/` | `../icra-itiraz-hatti.md` §0 + bu dosya §4 | Playbook İİK doğrulamalı (2026-07); İİK 32/36 bu turda doğrulandı |
| Sigorta Tahkim | `TAHK` | 2026-041 | `../trafik-bedensel-olum.md` (tahkim bölümü) | Playbook düzeyi |
| İdari yargı | `IYUK` | 2026-018, 2026-031 | — (playbook yok) | [YOK — `hukuk_skill` 4-1 yöntemiyle kurulur] |
| Ceza (CMK, müdafi/katılan) | `CMK` | 02CMK/*, 2025-006, 2025-007, 2026-017, 2026-028, 2026-035, 2026-039, 2026-043, 2026-046, 2026-049 | `../cmk-uyusturucu.md`, `../cmk-siddet.md` + bu dosya §5 | Playbook doğrulamalı; CMK süreleri `~/.claude/skills/yargilama-sureleri` (7499 sonrası tebliğden 2 hafta) |
| Arabuluculuk (dava öncesi / anlaşma) | `ARB` | 01ARABULUCULUK/*, 2026-004 | `../iscilik-isveren-feshi.md` §3.2, `arabuluculuk` skill | 7036 m.3 playbook doğrulamalı |

## §1 Ortak kural: aşama kodu nasıl belirlenir

1. Kaynak sırası: UYAP klonu evrak listesi (son evrak türü ve tarihi) → `00-Dava-Ozeti.md` → zabıt → avukat beyanı. Çelişkide UYAP evrakı kazanır.
2. Aşamayı **son gerçekleşen olay** değil, **beklenen bir sonraki olay** belirler (ör. tanıklar dinlendi, beyan süresi işliyor → `A4`, `A3` değil).
3. Süre taşıyan her aşama Süre Kalkanı'na satır düşer (`sure_kalkani.py`); kodun yanında `KALKAN#<satir-id>` yazılır.
4. Kod değişikliği `00-AKIS.md`'ye olay olarak işlenir: `python scripts/akis.py olay "<dava>" --hat takip "asama: ISC:A5 -> ISC:A6 (rapor tebliğ 18.10.2026)"`.
5. Kodu olmayan dosya panoda "AŞAMA BİLİNMİYOR" görünür; "sorun yok" sayılmaz.

## §2 ISC — İşçilik alacakları (özet; tam metin süreç dosyasında)

A0 tensip bekleniyor → A1 dilekçeler/delil → A2 ön inceleme → A3 tanık → A4 tanığa karşı beyan + bilirkişi sevk → A5 rapor bekleniyor → A6 rapora beyan + ıslah/109-4 → A7 karar celsesi → A8 gerekçeli karar → A9 tebliğ + istinaf süresi → A10 ilamlı icra → A11 istinaf + tehir-i icra → A12 temyiz → A13 kesinleşme/tahsilat.

## §3 HMK — Genel hukuk davası (yazılı veya basit usul)

| Kod | Aşama | Dayanak (doğrulanan) | Sıradaki işlem |
|---|---|---|---|
| H0 | Dava açıldı / cevap bekleniyor | HMK 127 cevap 2 hafta (`yargilama-sureleri`) | Tensip takibi; davalıysak cevap süresi Kalkan'a |
| H1 | Dilekçeler aşaması (yazılı usulde cevaba cevap + ikinci cevap; HMK 141/1 doğrulandı: «Dilekçelerin karşılıklı verilmesinden sonra iddia veya savunma genişletilemez yahut değiştirilemez») | HMK 141 | Replik/düplik; delil ve tanık listesi (240) |
| H2 | Ön inceleme | HMK 137, 139, 140 | Belge sunma 2 hafta kesin (139/1-ç); uyuşmazlık tespiti |
| H3 | Tahkikat — tanık/keşif/bilirkişi | HMK 147/3 (3 ay), 240, 281 | Celse kartı; rapora itiraz 2 hafta |
| H4 | Islah / 109-4 artırımı (alacak davasında) | HMK 176–181, 109/4 | `iscilik-alacaklari-dava-sureci.md` §6 karar ağacı aynen uygulanır (örüntüden bağımsız HMK kuralı) |
| H5 | Sözlü yargılama + hüküm | HMK 186, 294 | Son beyan; gerekçeli karar 1 ay |
| H6 | Tebliğ + istinaf (2 hafta) | HMK 345, 341 | Kesinlik sınırı kontrolü |
| H7 | İcra / kesinleşme şartı | HMK 350; İİK 32, 36 | Aile/kişiler/ayni hak → kesinleşme beklenir (350/2); diğerleri ilamlı takip |
| H8 | Temyiz (362 sınırı, 2 hafta) | HMK 361–362 | — |
| H9 | Kesinleşme / tahsilat / kapanış | — | 18-4 dersler |

Tüketici mahkemesi ve sulh hukuk (kira) davaları basit usule tabidir; dilekçeler aşaması iki dilekçeyle biter ve deliller dilekçeyle sunulur (HMK 318 doğrulandı; 316–317 [DOĞRULANMAMIŞ]). Tüketici hakem heyeti ve zorunlu arabuluculuk öncesi adımları ilgili playbook'ta.

## §4 ICRA — Takip hattı

| Kod | Aşama | Kaynak |
|---|---|---|
| T0 | Takip talebi / ödeme emri tebliğ bekleniyor | `icra-itiraz-hatti.md` §0 |
| T1 | İtiraz süresi işliyor (ilamsız 7 gün / kambiyo 5 gün) | İİK 62, 168 (playbook) |
| T2 | İtiraz geldi → itirazın iptali (m.67) veya kaldırılması (m.68) seçimi | playbook §0–§7; işçilik alacağında arabuluculuk şartı (7036 m.3/1 ek c.) |
| T3 | İtirazın iptali davası derdest → `HMK` örüntüsüne geçer (H0–H9) | — |
| T4 | Takip kesinleşti → haciz / 89-1 / satış | playbook; `icra_ozet.py` kuralları (AGENTS.md "Takip araçları") |
| T5 | İlamlı takip (icra emri 7 gün) + tehir-i icra izleme | İİK 32, 36 (doğrulandı) |
| T6 | Tahsilat / kapanış | — |

## §5 CMK — Ceza

| Kod | Aşama | Not |
|---|---|---|
| K0 | Soruşturma (ifade, tedbir, KYOK itirazı) | `hukuk_skill` 1-3, 1-5 yöntem |
| K1 | İddianame kabul → tensip, iddianameye karşı beyan | 1-4 |
| K2 | Delil / tanık celseleri, tutuklu işte tutukluluk incelemesi | 1-4, 1-5; 02CMK kayıt kuralı |
| K3 | Mütalaa → esas hakkında savunma | 1-4 |
| K4 | Hüküm → istinaf (tebliğden 2 hafta, 7499 sonrası) | `yargilama-sureleri`; 1-6 |
| K5 | İstinaf/temyiz sonucu, infaz | 1-7 |

## §6 Portföy görünümü

`Aktif Davalar/00-PORTFOY-ASAMA.md` her dosya için: dava-id · örüntü:aşama · son olay (tarih) · sıradaki işlem · süre (KALKAN ref) · açık kalem. Güncelleme: her `/pano bugun` ve her `zabit geldi:` / `karar geldi:` hattında ilgili satır değişir; tablo türev görünümdür, süre tarihi yalnız Kalkan'da tutulur.

## Kaynak Doğrulama Tablosu

Bu dosyadaki madde atıflarının tamamı `iscilik-alacaklari-dava-sureci.md` Kaynak Doğrulama Tablosu'ndaki doğrulanmış girdilere dayanır (HMK 109, 137, 139, 140, 141, 147, 176, 177, 181, 186, 240, 281, 294, 318, 320, 321, 341, 345, 350, 361, 362, 448; 7036 m.7, 8; İİK 32, 36; 7589 geçici m.1). Burada ayrıca künye verilmez; [DOĞRULANMAMIŞ] etiketli maddeler (HMK 127, 316, 317, 347; İİK 62, 168) ilgili playbook'tan veya `yargilama-sureleri` skill'inden alınmıştır ve dilekçeye taşınmadan önce `mevzuat_getir` ile teyit edilir.

| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |
|---|---|---|---|---|
| Örüntü/aşama modeli büro standardı | Bu dosya | — | — | Künye içermez; yapısal |

Aleyhe içtihat: ARANMADI (bu dosya içtihat taşımaz; içtihat süreç dosyalarındadır).
