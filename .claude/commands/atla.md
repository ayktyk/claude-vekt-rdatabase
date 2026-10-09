---
description: "Sıradaki ASAMA'yı sebebi sorularak atlar ve 00-AKIS.md kaydına işler"
---
# /atla — Mevcut ASAMA'yı Atla (Sebep Kaydedilir)

Director atlamadan ÖNCE sebebi sorar ve akış kaydına yazar (sonradan "bu aşama neden
atlanmıştı?" sorusunun cevabı `00-AKIS.md`'de kalır).

## Director davranışı

1. **Kaydı oku:** `python scripts/akis.py goster "<dava-klasoru>"`; atlanacak ASAMA sıradaki
   veya `basladi` durumundaki ASAMA'dır.
2. **Sebep sor:**
   ```
   ASAMA {N} ({ad}) atlanacak. Sebep?
   [a] Bu dava için gereksiz   [b] Çıktısı zaten elimde (manuel hazırladım)
   [c] Şimdilik atla, sonra dön   [d] Diğer (yazın)
   ```
   [b] seçilirse dosya yolu alınır ve `--durum mevcut --cikti <yol>` işlenir.
3. **Etki uyarısı (atlamadan önce):**
   - ASAMA 2 atlanırsa künye havuzu oluşmaz; sonraki ASAMA'lar atıf yapamaz, K2 tüm künyeleri
     sıfırdan denetler. Avukatın açık onayı gerekir.
   - ASAMA 4 atlanırsa dilekçe yazım rehberi (4E) ve KS denetimi olmaz; v1 araştırma + usul raporundan
     yazılır, stratejik çıkarımlar ancak K2'de denetlenir.
   - ASAMA 6 atlanırsa v2 savunma testinden geçmemiş olur.
   - ASAMA 7 atlanırsa nihai belge K2 denetiminden geçmez ve dışarı gönderilemez; yalnız avukatın
     açık onayıyla ve "denetlenmedi" notuyla.
4. **Kaydet:** `python scripts/akis.py asama "<dava-klasoru>" <N> --durum atlandi --not "<sebep>"`.
5. **İsteğe bağlı:** sebep tekrarlanan bir kalıpsa `dersler/sistem.md`'ye kural adayı olarak yazılır.
