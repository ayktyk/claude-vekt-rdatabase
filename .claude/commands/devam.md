---
description: "Sıradaki ASAMA'ya geçer; akis.py sonraki ENGEL veriyorsa (KIRMIZI veya SARI denetim) geçmez"
---
# /devam — Sıradaki ASAMA'ya Geç

Durum kaynağı: dava klasöründeki `00-AKIS.md` (+ `.akis.json`), `scripts/akis.py`.
Kural kaynağı: `AGENTS.md` → "7 ASAMA Workflow" ve "Çalışma Modları ve Tetikleyiciler".

## Director davranışı

1. **Dava klasörü:** `$ARGUMENTS` dava-id içeriyorsa `python scripts/paths.py dava <dava-id>`;
   içermiyorsa bu oturumda çalışılan dava klasörü.
2. **Kaydı oku:** `python scripts/akis.py goster "<dava-klasoru>"`.
   Kayıt yoksa: "Bu davada akış kaydı yok. `tam akış: <dava-id>` veya `/yeni-dava` ile başlayın."
3. **Kontrol:** son ASAMA `basladi` durumundaysa bitmeden geçilmez. `python scripts/akis.py sonraki
   "<dava-klasoru>"` "ENGEL: …" yazıp 1 ile çıkıyorsa geçilmez: K1 / KS / K2 son kararı KIRMIZI veya SARI
   ya da kaydı yok demektir. Engel giderilir ve DENETCI yeniden çalışır; 3 tur dolduysa avukata escalate.
4. **Sıradaki:** `python scripts/akis.py sonraki "<dava-klasoru>"` (TAM: 0-7, HIZLI: 0, 1, 2, 5, 7).
5. **Başlat:** `python scripts/akis.py asama "<dava-klasoru>" <N> --durum basladi`; AGENTS.md
   bildirim bloğunu yaz (Mod, Rol, Yargı PRO yöntemi, Beklenen çıktı, Denetim).
6. **Bitince:** `akis.py asama … <N> --durum bitti --cikti <yol>`; denetim noktasıysa
   `akis.py denetim … --nokta K1|KS|K2|EK …`.
7. **`devam 5-7`:** ASAMA 5, 6 ve 7 tek onayla ardışık yürür; her biri ayrı dosyaya yazılır.
8. **Akış bittiyse:** "Akış tamamlandı" + Kapanış (diary, takvim, dersler ritüeli).

## Kullanım

```
/devam
/devam 2026-016
/devam 5-7
```
