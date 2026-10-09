---
description: "İstifa, azil veya dosya devrinde bildirim, açık süreler, ücret ve teslim planı; büro iş hattı"
---
# /vekalet-sonlandir — Vekâletin Sonlanması

`$ARGUMENTS` = dava-id ve sonlanma türü (istifa, azil, devir).

Kural kaynağı: `AGENTS.md` → "Beceri Haritası ve Büro İş Hatları" (`vekalet-sonu` hattı).
Beceri listesi: `python scripts/beceri_haritasi.py hat vekalet-sonu`.

1. 17-4-vekalet-sonlandirma: sonlanma türü ve yargı kolu ayrılır; bildirim, görevlendirme, açık süreler, ücret ve
   dosya teslimi planlanır. Uygulanacak bildirim süreleri güncel madde metninden doğrulanır; süre uydurulmaz.
2. Açık süreler Süre Kalkanı'ndan okunur: `python scripts/sure_kalkani.py liste --dava "<dava-klasoru>" --gun 365`.
   Kaydı olmayan süre `sure_hesapla` ile hesaplanıp kayda geçirilir. Süre kaçırma riski planın ilk satırına yazılır.
3. Portföy (`Aktif Davalar/00-PORTFOY.md`) 18-5 ile güncellenir.
4. Çıktı: `04-Muvekkil-Belgeleri/vekalet-sonlandirma-plani.md`. Kapı: `python scripts/cikti_dogrula.py <dosya>`.
5. Mahkemeye, karşı tarafa veya müvekkile gidecek bildirim ayrı bir belgedir: belge ve eşlik çifti, K2.
6. Kayıt: `python scripts/akis.py olay "<dava-klasoru>" --hat vekalet-sonu "sonlanma planı hazırlandı" --cikti <yol>`.

Bildirimi gönderme kararı ve gönderimi avukattadır.
