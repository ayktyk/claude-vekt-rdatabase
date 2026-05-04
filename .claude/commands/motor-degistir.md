# /motor-degistir — Mevcut ASAMA'yı Alternatif Motorla Yeniden Çalıştır

Avukat mevcut ASAMA'nın çıktısından memnun değilse `/motor-degistir` ile
alternatif motorla (ör: Gemini → Claude veya tersi) yeniden çalıştırır.

## Director Agent Davranışı

1. **Aktif workflow state'i oku:** `tmp/workflow-state-{dava-id}.json`
2. **Mevcut motoru tespit et:**
   - `son_motor` alanından oku
   - `config/model-routing.json`'dan ASAMA'nın default engine'ini al
3. **Avukata seçenek sun:**
   ```
   "ASAMA {N} ({ad}) şu an {son_motor} ile yazıldı.
   Alternatif motorla yeniden yazayım mı?

   - [a] Gemini ile yeniden (config default ne olursa olsun)
   - [b] Claude ile yeniden (config default ne olursa olsun)
   - [c] Aynı motorla ama 'derin düşünme modunda' yeniden (max effort thinking)
   - [d] Vazgeçtim, mevcut çıktıyla devam"
   ```
4. **Seçim sonrası:**
   - Mevcut çıktıyı `{dosya}.{motor}-v1.md` olarak yedekle
   - State güncelle:
     ```json
     {
       "asama_durumu": "in_progress",
       "son_komut": "motor-degistir",
       "son_motor": "<yeni motor>",
       "motor_degisim_gecmisi": [
         {"asama": <N>, "eski": "<eski>", "yeni": "<yeni>", "sebep": "<avukat>", "ts": "..."}
       ]
     }
     ```
   - ASAMA'yı yeni motorla yeniden çalıştır
   - Çıktı `{dosya}.{yeni_motor}-v2.md` olarak yazılır
5. **Avukata karşılaştırma ver:**
   ```
   "ASAMA {N} iki motorla yazıldı:
   - {eski_motor}: dilekce-v1.gemini.md (X kelime, Y atıf)
   - {yeni_motor}: dilekce-v1.claude.md (X' kelime, Y' atıf)

   Hangisi ile devam edeyim? (numara seçin: 1 veya 2)"
   ```
6. **Logla:** MemPalace `wing_buro_aykut/hall_motor_tercihleri` drawer'ına motor değişim sebebini yaz. Gelecekte Director benzer durumda "geçen sefer Claude tercih ettiniz, yine?" diye sorabilsin.

## Kullanım

```
/motor-degistir
```
