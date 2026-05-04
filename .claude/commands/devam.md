# /devam — Sıradaki ASAMA'ya Geç (7 ASAMA Workflow Kontrol)

7 ASAMA dava akışında bir ASAMA tamamlandığında avukat `/devam` diyerek
bir sonraki ASAMA'nın başlamasını onaylar.

## Director Agent Davranışı

1. **Aktif workflow state'i oku:** `tmp/workflow-state-{dava-id}.json`
   - Yoksa: "Aktif bir 7 ASAMA workflow'u bulamadım. Yeni dava komutu ile başlayın." mesajı
   - Varsa: `current_asama` ve `asama_durumu` alanlarını oku
2. **Kontrol:**
   - `asama_durumu == "completed"` → bir sonraki ASAMA'ya geç
   - `asama_durumu == "in_progress"` → uyarı: "ASAMA henüz tamamlanmadı, tamamlanmasını bekleyin"
   - `asama_durumu == "blocked"` → blocker'ı göster, kararı sor
3. **State güncelle:**
   ```json
   {
     "dava_id": "ahmet-2026-007",
     "current_asama": <next>,
     "asama_durumu": "in_progress",
     "son_komut": "devam",
     "son_motor": "<config'ten okunur>",
     "ts": "<UTC ISO>"
   }
   ```
4. **Bir sonraki ASAMA'yı başlat:**
   - 7 ASAMA tablosu (CLAUDE.md'deki) referans alınır
   - Motor + model bilgisi `config/model-routing.json`'dan okunur
   - "[ASAMA N: {ad}] Motor: {engine} Model: {model} Beklenen çıktı: {dosya}" bildirimi yazılır
5. **Eğer son ASAMA (7) tamamlandıysa:** "Workflow tamamlandı, dilekçe v2 NIHAI Drive'a yazıldı" mesajı, state silinir.

## Kullanım

```
/devam
```

(Argüman almaz, mevcut state'ten devam eder.)
