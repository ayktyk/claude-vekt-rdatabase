# /motor-degistir — Mevcut ASAMA'yı Alternatif Motorla Yeniden Çalıştır

Avukat mevcut ASAMA'nın çıktısından memnun değilse `/motor-degistir` ile
alternatif motorla (Antigravity ↔ Claude) yeniden üretir.

2026-05-13 itibariyla sistem Antigravity hibrit mimarisinde çalışıyor.
`gemini-bridge.sh` DEPRECATED. Bu komut artık iki yönlü çalışır:

- **Antigravity → Claude:** Bir ASAMA Antigravity'de yapıldı, beğenilmedi
  → terminal Claude fallback olarak yeniden üretir
- **Claude (fallback) → Antigravity:** Bir ASAMA fallback ile Claude'da
  yapıldı, daha iyi olsun → yeni Antigravity devir bloğu basılır

## Director Agent Davranışı

1. **Aktif workflow state'i oku:** `tmp/workflow-state-{dava-id}.json`
2. **Mevcut motoru tespit et:**
   - `son_motor` alanından oku (`antigravity_manual` veya `claude`)
   - `config/motor-haritasi.json`'dan ASAMA'nın default engine'ini al
3. **Avukata seçenek sun:**

   ASAMA Antigravity'de üretildiyse:
   ```
   "ASAMA {N} ({ad}) şu an Antigravity (sağ panel — Gemini 3.1 Pro) ile
   üretildi. Alternatif:

   - [a] Terminal Claude ile yeniden üret (fallback mod)
         → Bu komutu sonrası ben ASAMA'yı buraya yazarım,
            Antigravity'ye dönmen gerekmez
   - [b] Aynı Antigravity sohbetinde yeniden üret (yeni devir bloğu)
         → 'Lütfen bu ASAMA'yı baştan üret, X noktası eksik' diye söyle
   - [c] Antigravity'de DAHA UZUN düşünmesini iste (deep mode)
         → Yeni devir bloğunda 'derin düşünme' notu ekle
   - [d] Vazgeçtim, mevcut çıktıyla devam"
   ```

   ASAMA Claude fallback ile üretildiyse:
   ```
   "ASAMA {N} ({ad}) şu an terminal Claude (fallback) ile üretildi.
   Antigravity erişilebilirse alternatif üretim mümkün:

   - [a] Antigravity'ye taşı (yeni devir bloğu basacağım)
         → Sağ panele yapıştır, çıktı Drive'a yazılır, sonra 'ASAMA N bitti' yaz
   - [b] Terminal Claude ile yeniden üret (mevcut motor)
         → Ben aynı prompt'la baştan üreteyim
   - [c] Vazgeçtim, mevcut çıktıyla devam"
   ```

4. **Seçim sonrası:**
   - Mevcut çıktıyı `{dosya}.{motor}-v1.md` olarak yedekle (örn.
     `usul-raporu.antigravity-v1.md` veya `dilekce-v1.claude-v1.md`)
   - State güncelle:
     ```json
     {
       "asama_durumu": "in_progress",
       "son_komut": "motor-degistir",
       "son_motor": "<yeni motor>",
       "motor_degisim_gecmisi": [
         {"asama": <N>, "eski": "<eski>", "yeni": "<yeni>",
          "sebep": "<avukat>", "ts": "..."}
       ]
     }
     ```
   - ASAMA'yı yeni motorla yeniden çalıştır:
     - **Antigravity → Claude:** Terminal Claude `prompts/muhakeme/{task_type}.md`
       protokolüne göre üretir, `fallback_used: true` işaretler.
     - **Claude → Antigravity:** Yeni devir bloğu bas, avukat sağ panele
       yapıştırır.
   - Çıktı `{dosya}.{yeni_motor}-v2.md` olarak yazılır.

5. **Avukata karşılaştırma ver:**
   ```
   "ASAMA {N} iki motorla üretildi:
   - {eski_motor}: dilekce-v1.antigravity-v1.md (X kelime, Y atıf, Z risk flag)
   - {yeni_motor}: dilekce-v1.claude-v2.md (X' kelime, Y' atıf, Z' risk flag)

   Hangisi ile devam edeyim? (numara seçin: 1 veya 2)"
   ```
   Seçilen versiyon ana çıktı adıyla (`dilekce-v1.md`) Drive'a yazılır,
   diğeri arşiv olarak `*.{motor}-v{n}.md` kalır.

6. **MemPalace tercih kaydı:**
   `wing_buro_aykut/hall_model_tercihleri` drawer'ına motor değişim sebebini
   yaz. Gelecekte Director benzer durumda "geçen sefer X tercih ettiniz,
   yine?" diye sorabilsin.

## DEPRECATED

Eski `/motor-degistir` (Gemini ↔ Claude bridge tabanlı) 2026-05-13'te
güncellendi. Artık:
- Gemini bridge yok (exit 100)
- "Antigravity" = sağ panel manuel devir
- "Claude" = terminal fallback üretim
- "Aynı motor + deep mode" seçeneği eklendi

## Kullanım

```
/motor-degistir
```

Hiçbir argüman gerekmez. Aktif ASAMA otomatik tespit edilir.
