---
description: "Sulh teklifi veya arabuluculuk masası için müzakere planı; büro iş hattı"
---
# /muzakere — Sulh ve Müzakere Planı

`$ARGUMENTS` = dava-id (ve varsa gelen teklifin özeti).

Kural kaynağı: `AGENTS.md` → "Beceri Haritası ve Büro İş Hatları" (`muzakere` hattı).
Beceri listesi: `python scripts/beceri_haritasi.py hat muzakere`.

1. 13-1-hedef-belirleme-gorusmesi: hedef belirsizse seçenekler sonuç ve riskleriyle avukata sunulur; açık bir
   talimat varsa yeniden onaya bağlanmaz.
2. 15-5-arabuluculuk-sarti-denetimi: arabuluculuk zorunlu mu, süreç nerede, son tutanak var mı.
3. 17-3-muzakere-plani: konu bazında tercih, alternatif, sınır ve karşılık. Sayılar eksikse nitel taslak kurulur;
   hesap gerekiyorsa büro hesap modülü ve 14-1 kullanılır, rakam uydurulmaz.
4. Çıktı: `03-Sentez-ve-Dilekce/muzakere-plani.md` (büro içi). Kapı: `python scripts/cikti_dogrula.py <dosya>`.
5. Karşı tarafa veya arabulucuya gidecek teklif metni ayrı bir belgedir: belge ve eşlik çifti, K2.
6. Kayıt: `python scripts/akis.py olay "<dava-klasoru>" --hat muzakere "müzakere planı hazırlandı" --cikti <yol>`.

Anlaşma yetkisi avukattadır; sistem teklif göndermez, kabul veya ret beyan etmez.
