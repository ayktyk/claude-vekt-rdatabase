---
description: "Tekil usul raporu (ASAMA 3): görev ve yetki, süreler, arabuluculuk, harç, risk analizi"
---
# /usul — Usul Raporu (ASAMA 3, tekil)

`$ARGUMENTS` = dava-id (ve gerekiyorsa dava türü).

Kural kaynağı: `ajanlar/usul-uzmani/SKILL.md` + `prompts/muhakeme/usul_raporu.md` +
`AGENTS.md` "ASAMA 3" ve "Karma Mimari" (yöntem: 2-1-hukuk-dosya-analizi, 15-5, 15-3, 12-1, 14-2).

Sıra:
1. `legal.local.md`, ilgili `playbook/` ve `dersler/usul.md` okunur.
2. Girdi: `00-Briefing.md` + `02-Arastirma/arastirma-raporu.md` (varsa — atıflar yalnız künye havuzundan).
3. Süre ve zamanaşımı: `npx -y yargi-skill sure_hesapla --kol <kol> --islem <kod> --teblig <YYYY-AA-GG> --tebligat-turu <tür> --adli-tatile-tabi <evet|hayir> --json`
   (`takvime_aktarilabilir: false`, `baslangic_durumu: TEYIT-BEKLIYOR` veya `guven` ≠ `yuksek` ise sonuç kesin son gün sayılmaz); harç ve oranlar güncel kaynaktan
   teyit edilir (tarife yılı yazılır, "UYAP'tan doğrulayın" notu).
4. Rapor `ajanlar/usul-uzmani/SKILL.md` formatıyla: görevli/yetkili mahkeme (adliye eşleme protokolü
   dahil), vekaletname, zorunlu ön adımlar (arabuluculuk, ihtarname), müvekkilden alınacak bilgiler,
   toplanacak belgeler, hukuki kontrol listesi, kritik süreler, harç tahmini, risk analizi.
5. Kayıt: `01-Usul/usul-raporu.md`; ara çıktı kapısı (`cikti_dogrula.py` + `havuz_kontrol.py`);
   dava akışındaysa `python scripts/akis.py asama "<dava-klasoru>" 3 --durum bitti --cikti 01-Usul/usul-raporu.md`.
