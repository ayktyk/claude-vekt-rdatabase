# /atla — Mevcut ASAMA'yı Atla (Sebep Sorgulanır)

Avukat mevcut ASAMA'nın atlanması gerektiğini düşünüyorsa `/atla` der.
Director Agent atlamadan ÖNCE sebebi sorar ve loglar (sonradan
"neden bu ASAMA atlanmıştı?" sorusu için).

## Director Agent Davranışı

1. **Aktif workflow state'i oku:** `tmp/workflow-state-{dava-id}.json`
2. **Avukata sor:**
   ```
   "ASAMA {N} ({ad}) atlanacak.
   Sebep nedir?
   - [a] Bu ASAMA bu dava için gereksiz (ör: arabuluculuk gerektirmeyen dava)
   - [b] Çıktıyı zaten elimde var (manuel hazırladım)
   - [c] Şimdilik atla, sonra dön (state'e 'deferred' olarak kayıtla)
   - [d] Diğer (yazın)"
   ```
3. **State güncelle:**
   ```json
   {
     "current_asama": <N+1>,
     "asama_durumu": "in_progress",
     "atlanan_asamalar": [
       {"asama": <N>, "sebep": "<a/b/c/d>", "aciklama": "<avukat girdisi>", "ts": "..."}
     ],
     "son_komut": "atla"
   }
   ```
4. **Atlama sebebi araştırma raporu / dilekçe sürecini etkiliyorsa uyarı:**
   - ASAMA 2 (Araştırma) atlanırsa: "Dilekçe v1 araştırma bulguları olmadan yazılacak. Onaylıyor musunuz?"
   - ASAMA 6 (Savunma Simülasyonu) atlanırsa: "Dilekçe v2 NIHAI savunma testinden geçmemiş olur. Onaylıyor musunuz?"
   - Sadece ASAMA 4 (Stratejik Analiz) ve ASAMA 6 (Savunma Sim) atlanması "kaliteden ödün" sayılmaz; diğerleri uyarı gerektirir.
5. **Logla:** MemPalace `wing_buro_aykut/hall_workflow_atlamalari` drawer'ına yaz (gelecek davalarda Director "bu durumda da atlamak ister misiniz?" diye sorabilsin).

## Kullanım

```
/atla
```
