# Hibrit Motor Pilot Testi

Amac: Ayni davayi (A) full-Claude ve (B) hibrit (Gemini+Claude) modda
kosturup ciktilarini yan yana karsilastirmak. Benchmark'in gercek iste
de gecerli olup olmadigini dogrulamak.

---

## On Hazirlik (Tek Seferlik)

1. Gemini CLI auth:
   ```powershell
   gemini /auth
   ```
   Tarayici acilir, Google Pro hesabi ile giris yap.

2. Smoke test:
   ```bash
   echo "Test" > /tmp/ctx.md
   scripts/gemini-bridge.sh kritik_nokta_tespiti /tmp/ctx.md /tmp/out.md
   cat /tmp/out.md
   ```
   Cikti geldiyse: basarili. Exit 4 geldiyse: auth tekrar.

3. `config/model-routing.json` kontrol:
   ```bash
   cat config/model-routing.json
   ```
   `default_mode: ask` oldugundan emin ol (pilotta her karar avukata sorulur).

---

## Pilot Davasi Secimi

Kriterler:
- Muvekkil KVKK izni vermis (veya tamamen kurgu dava)
- Orta zorluk (cok basit degil, cok komplike degil)
- Iscilik alacagi veya benzer ortak tip (karsilastirma kolaylasir)
- Avukatin onceden sonucunu tahmin edebilecegi dava

Onerilen: Kurgu "Ahmet Yilmaz - fazla mesai / istifa haklı fesih" davasi
(CLAUDE.md ornegindeki).

---

## A Turu: Full-Claude

1. `config/model-routing.json` -> tum default'lari `claude-opus-4.6` yap
   (veya komut satirinda `--model claude` ile override et)
2. Komut:
   ```
   yeni dava: Ahmet Yilmaz, iscilik alacagi
   ozet: Muvekkil 4 yil calistiktan sonra istifa etmis gorunuyor ancak
   odenmemis 14 aylik fazla mesai alacagi mevcut.
   kritik nokta: Odenmemis fazla mesai nedeniyle iscinin istifasinin hakli
   fesih sayilarak kidem tazminatina hak kazanip kazanmadigi.
   ```
3. Sureyi olc (toplam, ajan basina).
4. Ciktilari `G:\Drive'im\Hukuk Burosu\Aktif Davalar\PILOT-A-Claude\` altina al.

## B Turu: Hibrit

1. `config/model-routing.json` -> default'lar `gemini-3.1-pro-preview`
2. Ayni komutu calistir, ayni veri.
3. Her ajan cagrisi oncesi Director motor sorar -> hepsine Gemini de.
4. Ciktilari `G:\Drive'im\Hukuk Burosu\Aktif Davalar\PILOT-B-Hibrit\` altina al.

---

## Degerlendirme Matrisi

| Kriter | Full-Claude | Hibrit | Galip |
|---|---|---|---|
| Usul raporu eksiksizligi | | | |
| Arastirma derinligi (kac karar) | | | |
| HGK/IBK yakalama | | | |
| Dilekce tonu (AI gibi mi?) | | | |
| Dilekce hukuki gucu | | | |
| Savunma simulasyonu gercekciligi | | | |
| Revizyon kalitesi | | | |
| Toplam sure | | | |
| Fallback sayisi | - | | |
| Self-review yakaladigi hata | - | | |

Avukat her satirda sezgisiyle galip isaretler. 6+/10 olan mod
production default olur. `config/model-routing.json` ona gore guncellenir.

---

## Cikti Metadata Kontrolu

Her ciktinin basinda YAML frontmatter olmali:
- `engine: gemini` veya `engine: claude`
- `run_id` unique
- `fallback_used` false olmali (hibrit modda bile ideali)

`logs/model-events.jsonl` dosyasinda her Gemini cagrisi icin satir olmali.

---

## Beklenen Sinyaller

Gemini iyi calisirsa (benchmark dogru cikarsa):
- Dilekce tonu daha dogal
- Arastirma raporu daha derli toplu
- Self-review gercek hatalar yakaliyor

Gemini kotu calisirsa:
- 2+ fallback olur
- Avukat dilekceyi "robot yazmis" diye uyarir
- Karar atiflari bos veya hatali

Pilot sonucuna gore `config/model-routing.json` guncellenir veya
belirli tasklar Claude'a geri alinir.
