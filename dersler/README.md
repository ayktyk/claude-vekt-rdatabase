# Dersler — Bileşiklenme Mekanizması

> "Model bir şeyi kaçırır, avukat düzeltir ve düzeltme bir sonraki
> çalıştırmanın parçası olur." — sistemin oturumlar arası öğrenme döngüsü.

## Kural (ZORUNLU — her iş kapanışında)

Her dava akışı, tekil komut veya danışma araştırması KAPANIRKEN Claude
avukata şu tek soruyu sorar:

> **"Bu işte ben neyi kaçırdım / sen neyi düzelttin? (yoksa 'yok' de)"**

Cevap 2-3 satır olarak ilgili alan dosyasına eklenir. Format:

```
## {YYYY-MM-DD} — {dava-id veya konu}
- KAÇIRILAN: {model neyi görmedi / yanlış yaptı}
- DÜZELTME: {avukat ne yaptı / doğrusu ne}
- KURAL ADAYI: {bir sonraki çalıştırmada nasıl önlenir — 1 cümle}
```

## Terfi Kuralı (ayda 1 veya 5 ders birikince)

Aynı yönde 2+ ders birikirse veya bir ders kritikse → ilgili kalıcı
dosyaya TERFİ ettirilir:
- Araştırma dersi → `ajanlar/arastirmaci/SKILL.md`
- Dilekçe/üslup dersi → `dilekce-yazim-kurallari.md` veya ilgili Gemini protokolü
- Dava türü muhakemesi → `playbook/{dava-turu}.md`
- Sistem/altyapı dersi → `CLAUDE.md` veya ilgili config
Terfi eden ders, dosyadan silinmez; başına `[TERFİ → hedef-dosya]` yazılır.

## Dosyalar

| Dosya | Kapsam |
|---|---|
| `arastirma.md` | ASAMA 2 + danışma araştırmaları (sorgu stratejisi, kaynak, doğrulama) |
| `dilekce.md` | ASAMA 5-7 (dilekçe, savunma sim, revizyon, üslup) |
| `usul.md` | ASAMA 3 (yetki, süre, harç, arabuluculuk) |
| `sistem.md` | Altyapı/araç dersleri (MCP, script, platform) |

Not: Bu dosyalar git'te İZLENİR (KVKK'lı içerik YAZILMAZ — müvekkil adı
yerine dava-id kullanılır). MemPalace bağlıysa diary'ye de yansıtılabilir;
birincil kayıt BU dosyalardır.
