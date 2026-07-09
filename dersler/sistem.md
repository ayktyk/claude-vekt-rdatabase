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
