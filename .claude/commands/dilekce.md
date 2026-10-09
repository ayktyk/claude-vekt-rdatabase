---
description: "Mevcut davaya belge yazımı: Çalışma Modu seçimi (TAM 7 ASAMA veya HIZLI), denetim K1 + KS + K2"
---
# /dilekce — Mevcut Davaya Belge (Çalışma Modu Seçimli)

> Ad notu: Yargı PRO'nun global `dilekce-yaz` skill'i ile çakışmasın diye bu proje komutu `/dilekce`
> adını taşır. "Dilekçe yaz" talebinde bu komut uygulanır; global skill 7 ASAMA'nın yerine geçmez.

`$ARGUMENTS` = dava-id ve istenen belge (ör. `2026-016 cevap dilekçesi`,
`2026-059 ödeme emrine itiraz`, `2026-058 duruşma günü talebi`).

Kural kaynağı: `AGENTS.md` → "Çalışma Modları ve Tetikleyiciler". Bu komut eski
"yalnız v1" davranışını değiştirir: esas belgede varsayılan **TAM** akıştır.

## 1. Mod seçimi (ajan çalıştırmadan önce)

1. **Belge türü:** esas belge (dava, cevap, replik/düplik, istinaf/temyiz başvurusu veya cevabı,
   esaslı beyan, bilirkişi raporuna esaslı itiraz, ıslah / HMK 109/4) mı, usul/ara belge mi?
2. **Süre:** son güne kaç gün? Süre Kalkanı (`python scripts/sure_kalkani.py liste --dava "<dava-klasoru>"`) veya
   `npx -y yargi-skill sure_hesapla --kol <kol> --islem <kod> --teblig <YYYY-AA-GG> --tebligat-turu <tür> --adli-tatile-tabi <evet|hayir> --json`
   (işlem kodları `--katalog`). Tebliğ tarihi belgeyle sabitlenmemişse tarih uydurulmaz. Çıktıda
   `takvime_aktarilabilir: false`, `baslangic_durumu: TEYIT-BEKLIYOR` veya `guven` ≠ `yuksek` ise sonuç kesin son gün sayılmaz; `uyarilar` avukata aynen bildirilir.
3. **Karar:**
   - esas belge + son güne > 7 gün → **TAM** (0 → 7)
   - usul/ara belge, veya son güne ≤ 7 gün → **HIZLI** (0 → 1 → 2 → 5 → 7), bildirimde `süre kritik`
   - avukat açıkça söylediyse onun dediği (`mod: tam` / `mod: hızlı` / "sadece v1")
4. **Bildirim + kayıt (önce bu):**
   `[MOD: TAM — 7 ASAMA] {dava-id} · {belge} · kol: {kol} · denetim: K1 + KS + K2` veya
   `[MOD: HIZLI] {dava-id} · {belge} · kol: {kol} · denetim: K2 (atıf yoksa UYGULANMAZ kaydı)`;
   `python scripts/akis.py baslat "<dava-klasoru>" --mod tam|hizli --is "<belge>" --kol <kol>` (yeni iş önceki işin
   kaydını arşivler).
5. **Mevcut çıktılar:** `00-Briefing.md`, `02-Arastirma/arastirma-raporu.md`, `01-Usul/usul-raporu.md`,
   `02-Arastirma/stratejik-analiz.md` varsa ve dosyaya sonradan yeni evrak girmediyse ilgili ASAMA
   `python scripts/akis.py asama … <N> --durum mevcut --cikti <göreli yol>` ile işaretlenir, yeniden üretilmez.
   Mevcut ASAMA 2 / 4 çıktısı daha önce K1 / KS'den geçmemişse `akis.py sonraki` ENGEL verir; çıktı bu iş
   için denetlenir.

## 2. Yürütme

- Yargı kolu akış kaydında yoksa 10-7 ile belirlenir. Her aşamanın beceri listesi:
  `python scripts/beceri_haritasi.py asama <n> --kol <kol> --mod <tam|hizli>`. HIZLI usul belgesinde kolun usul
  ailesi (2-7, 3-9, 1-8, 4-6, 5-4, 6-4), esas belgede kolun dilekçe ailesi yöntem kaynağıdır.

- TAM: `/yeni-dava` ASAMA tablosu (mevcut çıktılar atlanır). 4A-4E perspektifleri bu modda
  her zaman çalışır; savunma simülasyonu ve v2 atlanmaz (avukat `atla` demedikçe).
- HIZLI: ASAMA 1 kısa (uyuşmazlık + süre + evrak), ASAMA 2 yalnız gerekiyorsa (hafif 6 sorgu /
  3 tam metin), ASAMA 5'te belge, ASAMA 7'de biçim adımları (format referansı + `tdk_denetim`).
- TAM'da denetim noktaları: K1 (araştırma raporu) → KS (stratejik analiz) → K2 (nihai belge + eşlik).
  KIRMIZI veya SARI kararda sonraki ASAMA'ya geçilmez (`python scripts/akis.py sonraki` ENGEL verir).
- HIZLI'da ASAMA 3, 4 ve 6 yoktur; ara çıktı `havuz_kontrol.py` ile (varsa) hafif araştırma raporuna bağlanır.
- Nihai belge iki dosyadır: temiz belge + `<belge-adı>-kaynak-dogrulama.md` eşlik dosyası. Yapısal kapı:
  `python scripts/cikti_dogrula.py <belge.md> --eslik <eşlik.md>`. Belge atıf içeriyorsa **K2 DENETCI**;
  içermiyorsa (kapı "atıf yok" der) `akis.py denetim … --nokta K2 --karar UYGULANMAZ --not "atıf yok"`
  kaydı düşülür. UDF yalnız K2 YEŞİL veya UYGULANMAZ kaydından sonra üretilir.

## 3. Çıktı

`03-Sentez-ve-Dilekce/` altında MD + DOCX (+ nihai metinde UDF). Biçim:
`sablonlar/FORMAT-REFERANS-cevap-dilekcesi-avukat-revize-2026-10-09.html` (başlık bloğu, TC yazılır,
uzun tire yok, taslak satırı yok); kaynak doğrulama tablosu, SENTINEL, aleyhe beyanı, karar noktaları ve
DENETİM SONUCU ayrı `…-kaynak-dogrulama.md` eşlik dosyasında.
