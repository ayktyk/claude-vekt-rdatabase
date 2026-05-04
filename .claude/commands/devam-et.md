# /devam-et — Duraklatılmış Workflow'u Devam Ettir

`/dur` ile duraklatılmış workflow'a kaldığı yerden devam eder.
`/devam`'dan farkı: `/devam` "sıradaki ASAMA'ya geç" derken
`/devam-et` "yarım kalan ASAMA'yı bitir" demek.

## Director Agent Davranışı

1. **State dosyasını oku:** `tmp/workflow-state-{dava-id}.json`
   - Yoksa MemPalace `wing_buro_aykut/hall_aktif_workflow` drawer'ından restore dene
   - İkisi de yoksa: "Duraklatılmış workflow bulunamadı. /yeni-dava ile başlayın." mesajı
2. **State özetini avukata göster:**
   ```
   "Workflow restore edildi:
   - Dava: ahmet-2026-007
   - Tamamlanan ASAMA'lar: 0, 1, 2
   - Yarım kalan: ASAMA 3 (Usul Uzmanı)
   - Kaldığı yer: 'harç hesabı tamamlandı, zamanaşımı analizi başlamamıştı'
   - Son komut: dur (2026-05-04T18:30:00Z, 23 dakika önce)

   Devam ediyorum..."
   ```
3. **State güncelle:**
   ```json
   {
     "asama_durumu": "in_progress",
     "son_komut": "devam-et",
     "ts": "<UTC ISO>"
   }
   ```
4. **Yarım kalan ASAMA'yı tamamla:**
   - `kaldigi_yer` alanını ilgili ajana iletir (örnek: Usul Uzmanı'na "harç tamam, sen zamanaşımından devam et")
   - Yarım kalan dosyaları okuyup nereden devam edileceğini bulur
5. **Tamamlandıktan sonra:** Avukata `/devam` ile bir sonraki ASAMA'ya geçişi önerir.

## Kullanım

```
/devam-et
```

Eğer birden fazla duraklatılmış workflow varsa:

```
/devam-et ahmet-2026-007
```

(dava-id ile spesifik workflow seç)
