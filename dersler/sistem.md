# Dersler — Sistem / Altyapı

## 2026-07-09 — smoke test (arac-mahrumiyet-bedeli-icra)
- KAÇIRILAN: Bedesten canlı indeksi sorgu anında erişilemezdi; sistem yedek
  arşive (~Nisan 2025) otomatik düştü — son 2-3 ayın kararları taranamadı.
- DÜZELTME: Rapora kaynak-tazeliği flag'i kondu; sorun değil, davranış doğruydu.
- KURAL ADAYI: `ictihat_ara` yanıtında "yedek arşiv" uyarısı görülürse rapor
  frontmatter'ına `kaynak_notu` + Risk Flag'lere tazelik notu ZORUNLU.

## 2026-07-09 — smoke test (arac-mahrumiyet-bedeli-icra)
- KAÇIRILAN: DOCX üretimi Mac'te patladı — `python-docx` kurulu değil.
- DÜZELTME: MD raporu Drive'a yazıldı, DOCX atlandı, avukata bildirildi.
- KURAL ADAYI: Yeni makine kurulumunda `pip3 install -r requirements.txt`
  onboarding adımı; DOCX üretimi öncesi import hızlı-kontrolü.

## 2026-07-18 — Benchmark revizyonu: Luna ve Claude çıkarıldı
- KAÇIRILAN: Hukuk benchmark'ında (son benchmark.jfif) pipeline'ın nihai 2B
  raporunu yazan Luna en zayıf modeldi (87/100); en güçlü kombinasyon
  Gemini 3.1 Pro + YargıPro (96) ve Sol + YargıPro (91) iken sentez zayıf
  halkadaydı. Ayrıca araç desteğinin (+YargıPro) her modele +2…+7 puan
  kattığı görüldü.
- DÜZELTME: Avukat kararıyla pipeline Sol→Terra→Sol(sentez)→Terra(kalite)
  yapıldı; Claude (Fable) orkestrasyon dahil ŞİMDİLİK tamamen çıkarıldı —
  orkestratör Codex/Sol (AGENTS.md), üretim Antigravity/Gemini 3.1 Pro.
  MemPalace/Gmail/Takvim devre dışı; hafıza dersler/+playbook/ dosya döngüsü.
  Spec: docs/superpowers/specs/2026-07-18-claudesiz-motor-revizyonu-design.md
- KURAL ADAYI: Araç erişimi olmayan motor künye YAZAMAZ; araçsız üretimde
  "ARAÇSIZ — künye içermez" damgası zorunlu (AGENTS.md doktrin md.7).

## 2026-07-19 — Codex denemesi geri alındı: Claude+Gemini dönüşü
- KAÇIRILAN: Benchmark puanı tek başına orkestratör seçimi için yeterli
  kriter değildi — Codex/Sol orkestrasyonu avukatın çalışma akışında
  (kontrol kapıları, MCP entegrasyonları, MemPalace/Gmail/Takvim
  otomasyonu) beklentiyi karşılamadı.
- DÜZELTME: Avukat kararıyla (2026-07-19) Codex TÜM projeden kaldırıldı
  (arsiv/codex-motor/). Orkestra şefi + tüm tool kullanımı Claude Fable 5;
  limit dolarsa Claude Opus 4.8 (bildirimli). Hukuki muhakeme
  Antigravity/Gemini 3.1 Pro'da kaldı. 2B tek elden Claude iteratif derin
  protokol. Spec: docs/superpowers/specs/2026-07-19-claude-gemini-donus-design.md
- KURAL ADAYI: Motor/orkestratör değişikliği kararında benchmark puanına ek
  olarak entegrasyon maliyeti (MCP, hook, hafıza katmanları) ve avukatın
  fiili kullanım deneyimi ZORUNLU kriterdir; tek metrikle motor değiştirilmez.

## 2026-07-24 — 15 dava türü playbook seti yazıldı (MCP doğrulamalı)
- KAÇIRILAN: `mevzuat_getir(id_type=madde, madde_no=X)` çağrısı, kanunların
  EK ve GEÇİCİ maddelerini BULAMIYOR (madde_no_not_found döner) — bunlar MCP
  ağacında sayısal numarayla gelmiyor. İş K. Ek m.3 (zamanaşımı) bu yüzden
  doğrudan çekilemedi.
- DÜZELTME: Ek/Geçici madde metni, o maddeyi metninde birebir aktaran güncel
  bir Yargıtay kararından (`ictihat_getir`) doğrulandı (İş K. Ek m.3 + Geçici
  m.8 → documentId 1093760300). Alıntı karar metninden alındı, uydurulmadı.
- KURAL ADAYI: Bir kanunun EK/GEÇİCİ maddesi gerektiğinde: (a) `id_type=outline`
  ile ağacı çekip madde_id bul, VEYA (b) o maddeyi aktaran güncel içtihattan
  doğrula. UYDURMA YASAK — çekilemeyen madde `[METİN DOĞRULANMADI]` damgalanır.
- İKİNCİ DERS: Playbook doğrulama disiplini — künye yazılan her karar
  `ictihat_getir` ile TAM METİN açıldı, alıntılar birebir; her mevzuat maddesi
  `mevzuat_getir` ile çekildi; tutar/oran/tarife YAZILMADI (yıllık değişir,
  "UYAP'tan teyit" formülü). Doğrulanmış künye çekirdeği playbook/README.md'de.
- ÜÇÜNCÜ DERS: Bedesten sık sık ~Nisan 2025 yedek arşivine düşüyor; snippet'ler
  tam metin okunmadan kullanıldıysa tabloda işaretlendi, son ~3 ay eksik notu
  kondu.
