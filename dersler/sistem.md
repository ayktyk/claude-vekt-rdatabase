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
