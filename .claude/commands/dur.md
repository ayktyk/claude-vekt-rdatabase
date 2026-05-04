# /dur — Workflow'u Durdur, State'i Kaydet

Avukat aktif 7 ASAMA workflow'unu durdurmak istiyor. Director Agent
state'i diske yazar, sonra `/devam-et` ile aynı yerden başlanır.

## Director Agent Davranışı

1. **Mevcut çalışan task varsa nazikçe bekle:**
   - Aktif MCP çağrısı varsa, çağrı tamamlanana kadar bekle (max 30 sn)
   - Aktif Bash komutu varsa, "process bitsin mi yoksa kill mi edeyim?" sor
2. **State dump:** `tmp/workflow-state-{dava-id}.json`
   ```json
   {
     "dava_id": "ahmet-2026-007",
     "current_asama": 3,
     "asama_durumu": "paused",
     "kaldigi_yer": "ASAMA 3 Usul Uzmani çalışıyordu, harç hesabı tamamlandı, zamanaşımı analizi başlamamıştı",
     "tamamlanan_asamalar": [0, 1, 2],
     "yarim_kalan_dosyalar": [
       "01-Usul/usul-raporu.md (yarım, harç bölümü dolu)"
     ],
     "son_komut": "dur",
     "ts": "<UTC ISO>",
     "resume_hint": "/devam-et komutu ile ASAMA 3 zamanaşımı analizinden devam eder"
   }
   ```
3. **Avukata özet ver:**
   ```
   "Workflow duruldu. Şu anda:
   - Tamamlanan ASAMA'lar: 0, 1, 2
   - Yarım kalan: ASAMA 3 (Usul Uzmanı, harç tamam, zamanaşımı eksik)
   - Yazılan dosya: 01-Usul/usul-raporu.md (yarım)

   Devam etmek için: /devam-et
   Yeniden başlatmak için: /yeni-dava ..."
   ```
4. **MemPalace'e checkpoint:**
   `wing_buro_aykut/hall_aktif_workflow` drawer'ına state özet yaz
   (cross-session devam için).

## Kullanım

```
/dur
```
