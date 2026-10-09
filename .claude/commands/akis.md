---
description: "Dava akış durumunu 00-AKIS.md kaydından özetler (mod, ASAMA'lar, K1/KS/K2/EK denetim kararları, evrak kaynakları)"
---
# /akis — Dava Akış Durumu

`$ARGUMENTS` = dava-id.

1. Dava klasörü: `python scripts/paths.py dava <dava-id>`
2. `python scripts/akis.py goster "<dava-klasoru>"`
3. Avukata kısa özet: mod (TAM/HIZLI), tamamlanan ASAMA'lar, sıradaki ASAMA, son denetim kararı
   (K1/KS/K2/EK), kayıtlı evrak kaynakları; `python scripts/akis.py sonraki` ENGEL veriyorsa nedeni.

Kayıt yoksa: "Bu davada akış kaydı yok. `tam akış: <dava-id>`, `/dilekce` veya `/yeni-dava`
ile başlatılır." de; kayıt uydurma.
