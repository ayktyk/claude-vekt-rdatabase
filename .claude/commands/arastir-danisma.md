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
(CLAUDE.md ASAMA 0-7, `arastir:` komutu, FIVEAGENTS 2A→2B→2C→2D) **DOKUNMAZ**.

## Zorunlu Referans Dokümanlar

- **`ARASTIRMA.md`** (proje kökü) — modülün tam protokolü, faz tanımları, kalite kapısı
- `ajanlar/0-halusinasyon-doktrini.md` — kaynak doğrulama doktrini
- `scripts/superstajyer.py` — CDP otomasyonu (Faz 1)
- `config/superstajyer.json` — CDP konfigurasyonu

## Workflow (6 Faz — Detay ARASTIRMA.md'de)

```
Faz 0  Soru kabul + slug üret + Drive Research/{tarih}-{slug}/ klasörü + 00-Soru.md
Faz 1  Süper Stajyer (CDP) — scripts/superstajyer.py run-batch (2 gruplu tur,
       insan-gibi bekleyerek) → 01-Stajyer-cevap.md
       (atlanabilir: CDP yoksa veya avukat "stajyer atla" derse)
Faz 2  Argüman.ai semantik genişletme — mcp__arguman__search (expand=true)
       + min 3 mcp__arguman__get_full_text → 02-Arguman-bulgulari.md
Faz 3  Yargı Pro Doğrulama Köprüsü (0-Halüsinasyon kapısı) —
       mcp__yargi-mcp-pro__search_bedesten_unified + get_bedesten_document_markdown
       → 03-Yargi-Pro-dogrulama.md (DOĞRULANMIŞ/DOĞRULANMAMIŞ/HARD FAIL tablosu)
Faz 4  Mülga denetimi — mcp__yargi-mcp-pro__search_mevzuat + get_mevzuat_document
       → 04-Mulga-denetim.md
Faz 5  Sentez cevap (Claude tek-elden) → arastirma-cevabi.md + DOCX
       (HARD FAIL eşiği: DOĞRULANMIŞ atif ≥2 olmalı, aksi halde yazılmaz)
Faz 6  Memory yazımı — MemPalace wing_arastirma + proje memory
```

## Adımlar

1. **ARASTIRMA.md'yi tam oku.** Protokolünü uygula, ezberden çalışma.
2. `$ARGUMENTS`'ten slug üret. Tarih önekiyle klasör adı: `{YYYY-MM-DD}-{slug}`.
3. Drive klasörünü oluştur: `G:\Drive'ım\Hukuk Bürosu\Research\{klasör}\`.
4. Faz 0-6'yı sırayla çalıştır. Her faz çıktısını Drive'a yaz.
5. Faz 5 öncesi **Çıktı Öncesi Checklist** (ARASTIRMA.md §3) uygula:
   - DOĞRULANMIŞ atif ≥ 2 mi?
   - ≥2 DOĞRULANMAMIŞ atif HARD FAIL → cevap yazma
   - Aleyhe içtihat varsa açıkça yaz
   - Lehe yorum dürtüsü reddedildi mi
6. Avukata `arastirma-cevabi.md/.docx` Drive yolunu ver + 1-2 cümle özet.

## KVKK Notu

Müvekkil adayı sorusu içinde TC/IBAN/telefon/ad-soyad **olmamalı**. Eğer geldiyse
soruyu jenerik formüle çevir (ör. "Ahmet 3 ay kira ödememe..." → "Kiracı 3 ay
kira ödememe..."). Süper Stajyer'e maskeli isim göndermek bile gereksiz; jenerik
formül yeterli.

## Hata Yönetimi (Hızlı Referans)

| Senaryo | Aksiyon |
|---|---|
| CDP yok | Faz 1 atla, raporda `STAJYER YOK` flag, devam |
| Argüman.ai 0 sonuç | Faz 2 boş, devam |
| Yargı Pro down | HARD FAIL — Faz 5 iptal |
| ≥2 DOĞRULANMAMIŞ | HARD FAIL — Faz 5 iptal, ham bulgular avukata |

Tam hata tablosu: ARASTIRMA.md §5.

## Output

- `G:\Drive'ım\Hukuk Bürosu\Research\{YYYY-MM-DD}-{slug}\arastirma-cevabi.md` ★
- Aynı klasörde `arastirma-cevabi.docx`
- 5 ara dosya (Soru, Stajyer, Argüman, Yargı Pro, Mülga) — şeffaflık/iz için
- Sohbete sadece 1-2 cümle özet + Drive yolu (tam metin dökülmez)
