---
name: yargipro-tetikleyici
description: >
  Avukat hukuki bir soru sorduğunda veya bir dava akışı ASAMA'sı başladığında
  Yargı PRO hukuk_skill kütüphanesinden hangi skill'lerin çağrılacağını belirler
  ve çağırır. Tetikleyiciler: emsal/içtihat sorusu, kanun maddesi, zamanaşımı,
  süre/son gün, tebligat, harç/oran/tavan, dava stratejisi, "hakkımız ne",
  ıslah, arabuluculuk, istinaf/temyiz, dilekçe yazımı, revizyon, savunma
  simülasyonu. Selamlama, kod ve sistem işleri tetiklemez.
---

# Yargı PRO Tetikleyici

Bu skill bir yönlendiricidir; hukuki içerik üretmez. Görevi, soruya veya
ASAMA'ya uyan Yargı PRO skill'lerini `ajanlar/yargipro-skill-haritasi.md`
haritasına göre seçip `mcp__claude_ai_YargiMCP__hukuk_skill` ile çekmek ve
talimatlarını uygulatmaktır.

## Akış

1. `ajanlar/yargipro-skill-haritasi.md` dosyasını oku.
2. İstek türünü belirle:
   - Tekil hukuki soru → Bölüm A tablosu
   - Dava akışı ASAMA'sı (`yeni dava`, `arastir:`, `usul:`, `dilekce`, `revize et`,
     `savunma simule et`, `istinaf yaz`) → Bölüm B tablosu
   - Dava türü HMK dışındaysa → Bölüm C'den kol ailesini ekle
3. Seçilen her skill için sırayla `hukuk_skill skill:"<ad>"` çağır, talimatı
   uygula. Skill başka bir skill'e iade ediyorsa (ret kodu) o skill'i de çağır.
4. `hukuki-sorgu-protokolu` skill'i de yüklüyse iki protokol birlikte uygulanır:
   araç katmanı oradan, kapı sırası buradan gelir.
5. Çıktının Kaynak Doğrulama Tablosuna her skill için bir satır yaz:
   `Yargı PRO skill: <ad> — uygulandı / uygulanamadı (neden)`.

## Vazgeçilmez kapılar

Ne olursa olsun atlanmayan üç skill:

- Cevapta künye veya madde numarası varsa → `11-8-atif-dogrulama`
- Emsal dilekçeye veya cevaba girecekse → `11-4-emsal-guncellik-denetimi`
- Süre veya son gün söyleniyorsa → `12-1-sure-hesaplama` (tebligat varsa önce `12-2`)

## MCP erişilemezse

Yargı PRO bağlantısı düşükse skill çekilemez. O zaman:
- 0-Halüsinasyon Doktrini ve `hukuki-sorgu-protokolu` tek başına uygulanır,
- Çıktıya `[YARGIPRO SKILL ÇEKİLEMEDİ — kapı manuel uygulandı]` notu düşülür,
- Künye doğrulaması yapılamıyorsa "DOĞRULANMAMIŞ" damgası kalır.
