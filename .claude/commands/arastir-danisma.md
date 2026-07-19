<!-- DOKTRIN-PREAMBLE v1 -->
> **0-HALÜSİNASYON + ANTI-SYCOPHANCY (zorunlu — tam metin: `prompts/_doktrin-preamble.md`):**
> - UYDURMA YARGITAY/HGK/İBK kararı atfı YASAK — her künye Bedesten documentId ile doğrulanır; doğrulanmayan "DOĞRULANMAMIŞ" damgalanır.
> - Karar metni ALINTISI UYDURULAMAZ — tırnak içi alıntı birebir kaynaktan.
> - BAĞLAM KORUNMALI — bir fıkranın cevabı başka fıkraya genellenemez.
> - Avukatı memnun etmek için LEHE YORUM YASAK; ALEYHE İÇTİHAT açıkça gösterilir, gizlenmez.
> - "KAYNAK YOK" demek dürüstlüktür — sayı doldurmak için uydurma atıf HARD FAIL.
> - Kritik kuralda ÇİFT KAYNAK şart.
> - Çıktının sonunda KAYNAK DOĞRULAMA tablosu (| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |) + "Aleyhe içtihat: VAR/YOK/ARANMADI" beyanı ZORUNLU.

# /arastir danisma — Hızlı Hukuki Araştırma Modülü (Müvekkil Adayı Sorusu)

`$ARGUMENTS` = avukatın sorduğu hukuki soru (jenerik, kişisel veri yok).

Bu komut **bağımsız hızlı araştırma modülünü** çalıştırır. Mevcut dava akışına
(CLAUDE.md ASAMA 0-7, `arastir:` komutu) **DOKUNMAZ**.

> **REVİZYON 2026-07-09:** Süper Stajyer ve Argüman.ai fazları ÇIKARILDI
> (arşiv: `arsiv/README.md`). Modül doğrudan Yargı-MCP-Pro + Mevzuat ile
> çalışır.

## Zorunlu Referans Dokümanlar

- **`ARASTIRMA.md`** (proje kökü) — modülün tam protokolü, faz tanımları, kalite kapısı
- `ajanlar/0-halusinasyon-doktrini.md` — kaynak doğrulama doktrini

## Workflow (5 Faz — Detay ARASTIRMA.md'de)

```
Faz 0    Soru kabul + slug üret + Research/{tarih}-{slug}/ klasörü + 00-Soru.md
         (klasör kökü: python3 scripts/paths.py research)
Faz 1    Yargı-MCP-Pro içtihat taraması (hafif protokol: min 6 sorgu,
         min 3 tam metin teyidi; Claude Fable 5 tek elden)
         → 01-Ictihat-taramasi.md
         (DOĞRULANMIŞ / ELENDİ / DOĞRULANMAMIŞ etiketleme — atıf ön şartı
          tam metin açılması)
Faz 2    Mülga denetimi — mcp__yargi-mcp-pro__mevzuat_ara + mevzuat_getir
         → 02-Mulga-denetim.md
Faz 2.5  (Opsiyonel) NotebookLM 2-4 hedefli sorgu (uygun notebook varsa)
Faz 3    Sentez cevap (Claude tek-elden) → arastirma-cevabi.md + DOCX
         (HARD FAIL eşiği: DOĞRULANMIŞ atıf ≥2 olmalı, aksi halde yazılmaz)
Faz 4    Memory yazımı — MemPalace wing_arastirma + proje memory
```

## Adımlar

1. **ARASTIRMA.md'yi tam oku.** Protokolünü uygula, ezberden çalışma.
2. `$ARGUMENTS`'ten slug üret. Tarih önekiyle klasör adı: `{YYYY-MM-DD}-{slug}`.
3. Research klasörünü oluştur: `{python3 scripts/paths.py research}/{klasör}/`.
4. Faz 1'i **bu oturumda Claude Fable 5 tek elden** çalıştır (hafif mod:
   min 6 sorgu / 3 tam metin — `tasks.yargi_mcp.modes.hafif`). Faz 1
   çıktıları yazılmadan Faz 2'ye geçme.
5. Kalan fazları sırayla çalıştır. Her faz çıktısını Drive'a yaz.
6. Faz 3 öncesi **Çıktı Öncesi Checklist** (ARASTIRMA.md §3) uygula:
   - DOĞRULANMIŞ atıf ≥ 2 mi?
   - ≥2 DOĞRULANMAMIŞ atıf HARD FAIL → cevap yazma
   - Aleyhe içtihat varsa açıkça yaz
   - Lehe yorum dürtüsü reddedildi mi
7. Avukata `arastirma-cevabi.md/.docx` Drive yolunu ver + 1-2 cümle özet.

## Kişisel Veri Notu

Müvekkil adayı sorusu içinde TC/IBAN/telefon **olmamalı**. Ad-soyad geldiyse
soruyu jenerik formüle çevir (ör. "Ahmet 3 ay kira ödememe..." → "Kiracı 3 ay
kira ödememe..."). Jenerik formül hem gizlilik hem arama kalitesi için doğru.

## Hata Yönetimi (Hızlı Referans)

| Senaryo | Aksiyon |
|---|---|
| Yargı Pro bağlı değil (OAuth) | Avukata yetkilendirme gereği — Faz 1 çalışamaz |
| Yargı Pro down | 1 retry + CLI fallback; o da fail → HARD FAIL, Faz 3 iptal |
| Faz 1 DOĞRULANMIŞ < 2 | Cevap yazılmaz, ham bulgular avukata |
| ≥2 DOĞRULANMAMIŞ | HARD FAIL — Faz 3 iptal, ham bulgular avukata |
| NotebookLM yok | Faz 2.5 sessizce atlanır |

Tam hata tablosu: ARASTIRMA.md §5.

## Output

- `{research_root}/{YYYY-MM-DD}-{slug}/arastirma-cevabi.md` ★
- Aynı klasörde `arastirma-cevabi.docx`
- 2 ara dosya (Soru, İçtihat, Mülga) — şeffaflık/iz için
- Sohbete sadece 1-2 cümle özet + Drive yolu (tam metin dökülmez)
