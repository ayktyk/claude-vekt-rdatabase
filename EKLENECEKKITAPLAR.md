# EKLENECEK KİTAPLAR — Temin Bekleyen Kaynaklar ve Entegrasyon Planı

> Durum: BEKLEMEDE (kitaplar henüz temin edilmedi)
> Oluşturma: 2026-07-22 · Analiz: terminal Claude (Opus 4.8)
> Amaç: Kitap eline geçtiğinde ne yapılacağı hazır dursun; analiz kaybolmasın.

---

## 1. Rona Serozan — Hukukta Yöntem – Mantık

**Künye (doğrulandı):**
- Yayınevi: **On İki Levha Yayıncılık** (İstanbul)
- Baskı: 3. baskı, Şubat 2024
- Sayfa: 257 · ISBN: 9786254327520
- Not: Avukatın verdiği Vedat Kitapçılık linki satış sayfasıdır; yayınevi On İki Levha.
- Kaynak: https://ronaserozanvakfi.org/yayinlar/hukukta-yontem3/

**İçerik (arama sonuçlarından — kitap eline geçince İÇİNDEKİLER'den teyit edilecek):**
- Tümdengelim, tümevarım ve örnekseme (kıyas)
- Hukukçunun kullandığı başlıca mantık araçları ve **kaçınılması gereken mantık yanılgıları**
- Örf ve âdet / töre hukuku
- Hukukta yaptırımlar, özellikle hükümsüzlükler

**Bizim için değeri: 0-Halüsinasyon doktrininin EKSİK AYAĞI.**

Doktrinimiz bugün **kaynak doğruluğunu** denetliyor: künye Bedesten'de var mı, alıntı birebir mi,
madde mülga mı. Denetlemediği şey **çıkarımın geçerliliği** — gerçek bir karardan geçersiz
sonuç çıkarmak.

2026-05-05 Tuğba 2026-89 hatası tam olarak buydu. Sorun künyenin sahteliği değildi; İİK 89/4
bağlamındaki cevabın 89/3'e taşınmasıydı. Yani **geçersiz genelleme** — kaynak hatası değil,
mantık hatası. Doktrindeki "bağlam korunmalı" maddesi bunu yasaklıyor ama *nasıl denetleneceğini*
söylemiyor. Serozan'ın mantık yanılgıları bölümü doğrudan buraya oturur:
- Kıyas nerede caiz, nerede *argumentum a contrario* gerekir?
- Tümevarımla kaç karardan "yerleşik uygulama" denebilir?
- Bir fıkranın cevabı hangi şartlarda başka fıkraya taşınabilir (taşınamaz)?

---

## 2. Dr. Halil Polat — Teori ve Pratikte Hukuk Nosyonu

**Künye (doğrulandı):**
- Cilt I — ISBN 9786253772178 (piyasada 4. baskı mevcut)
- Cilt II — Ceza ve Ceza Muhakemesi Hukuku
- Kaynaklar:
  - https://www.seckin.com.tr/kitap/teori-ve-pratikte-hukuk-nosyonu-cilt-i-halil-polat-s-p-169257473
  - https://www.seckin.com.tr/kitap/teori-ve-pratikte-hukuk-nosyonu-cilt-ii-ceza-ve-ceza-muhakemesi-hukuku-halil-polat-s-p-687896356
  - https://www.pandora.com.tr/kitap/teori-ve-pratikte-hukuk-nosyonu-cilt-i/929367

**İçerik — Cilt I, üç bölüm:**
1. Nosyon ve hukuk nosyonu kavramı; nosyon edinme ve öneriler
2. Yöntem/metodoloji kavramları, hukuk metodolojisi, **hukuki uyuşmazlıklarda çözüm metodolojisi**
3. Pratik olay çözümleri — hukuki çareler, **yol haritası belirleme, delil toplama, dava hazırlığı,
   ispat, usul kuralları, masraflar**

**Bizim için değeri: ASAMA akışının kavramsal karşılığı.**

Cilt I'in 2. ve 3. bölümü bizim ASAMA 1→2→3 akışıyla (briefing → araştırma → usul) birebir
eşleşiyor. Özellikle "yol haritası belirleme / delil toplama / ispat" başlıkları
`ajanlar/usul-uzmani/SKILL.md` ve `playbook/{dava-turu}.md` ile örtüşür.

Bize yeni bir şey öğretmez; **ad-hoc kurduğumuz sırayı denetlenebilir bir kontrol listesine
çevirir.** Değeri budur.

---

## 3. KRİTİK KARAR: Vektör DB'ye ATILMAYACAK

En kolay entegrasyon (`D:\hukuk-vektordb\pdf-kaynak\`'a at, `dosya-izleyici.py` işlesin)
burada **en yanlış olanıdır.**

Gerekçe: `hukuk_ara` semantik araması dava sorusuna **emsal ve doktrin** döndürmek için kurulu.
Yöntem kitabı künye içermez, dava-spesifik cevap üretmez. Ham metin olarak indekslenirse her
sorguda "yorum yöntemleri" ve "nosyon edinme" chunk'ları alakalı kararların önüne geçer —
retrieval'i temizlemek yerine **gürültü eklenir.**

İndekslenecek olan **kitap değil, kitaptan çıkan kontrol listesidir.**

---

## 4. ENTEGRASYON PLANI — 3 Katman

### Katman 1: Okuma çıktısı
`bilgi-tabani/hukuki-yontem-kontrol-listesi.md` üretilir.
- Her kural **sayfa referanslı** yazılır (0-halüsinasyon doktrini gereği).
- Vektör DB'ye giren bu dosyadır, kitabın tam metni DEĞİL.

### Katman 2: Araştırmacı SKILL'ine yeni kapı
`ajanlar/arastirmaci/SKILL.md` içinde mevcut **"Normlar Hiyerarşisi Protokolü"**nün yanına
**"Yorum Yöntemi Protokolü"** eklenir:
- Lafzî → sistematik → amaçsal → tarihsel yorum sırası
- Kıyas caiz mi, yoksa *argumentum a contrario* mu gerekiyor?
- Kanun boşluğu mu, bilinçli susma mı?

### Katman 3: Doktrine yeni clause (EN YÜKSEK DEĞERLİ ADIM)
`prompts/_doktrin-preamble.md`'ye **9. madde** eklenir:

> **Çıkarım geçerliliği:** Kaynak gerçek olsa dahi ondan çıkarılan sonuç geçersizse HARD FAIL.

Bu madde air-gap'in ötesine geçer, çünkü preamble Gemini/Antigravity çıktısına da taşınır.
Ayrıca `scripts/doktrin_contract.py` içindeki clause token listesi ve `doktrin_lint.py`
sayımı buna göre güncellenir (8 clause → 9 clause).

### Katman 4 (opsiyonel): Playbook şablonu
Polat'ın "olay çözüm yol haritası" iskeleti `playbook/{dava-turu}.md` içine, avukatın kendi
muhakemesiyle doldurulacak boş şablon olarak konur.

---

## 5. SINIRLAR VE UYARILAR

- **Telif:** Her iki eser de teliflidir. Büro içi kullanım için özet/kontrol listesi çıkarmak
  makul; tam metni vektör DB'ye gömüp blog veya dilekçeye uzun pasaj kopyalamak ayrı bir
  meseledir — o çizgi geçilmeyecek.
- **Dürüst sınır:** Kitaplar retrieval kalitesini veya künye doğrulamasını iyileştirmez.
  İyileştirdikleri şey **muhakeme çerçevesidir** — yani şu an prompt'lara serpiştirilmiş
  ad-hoc metnin taşıdığı iş.
- **Doğrulama borcu:** Yukarıdaki içerik başlıkları satıcı/katalog sayfalarından derlendi.
  Kitap eline geçtiğinde İÇİNDEKİLER'den teyit edilecek; sapma varsa bu dosya güncellenecek.

---

## 6. ÖNCELİK

1. **Polat Cilt I** — önce. Akışımıza birebir oturuyor, pratik olay çözümleri var.
2. **Serozan** — sonra. Daha soyut, ama ondan çıkacak **"mantık yanılgıları" listesi tek başına
   doktrin için en yüksek değerli parça.**
3. **Polat Cilt II (ceza)** — şimdilik atlanır. Aktif dava profili iş hukuku ağırlıklı;
   ceza yalnızca blog tarafında (yasadışı bahis vb.) gündeme geliyor.

---

## 7. KİTAP GELDİĞİNDE YAPILACAKLAR (checklist)

- [ ] İÇİNDEKİLER'den bu dosyadaki içerik başlıklarını teyit et, sapma varsa güncelle
- [ ] `bilgi-tabani/hukuki-yontem-kontrol-listesi.md` üret (sayfa referanslı)
- [ ] `ajanlar/arastirmaci/SKILL.md` → "Yorum Yöntemi Protokolü" bölümü ekle
- [ ] `prompts/_doktrin-preamble.md` → 9. clause "Çıkarım geçerliliği"
- [ ] `scripts/doktrin_contract.py` → clause token listesini 9'a çıkar
- [ ] `python scripts/doktrin_lint.py` çalıştır — tüm prompt yüzeyleri PASS vermeli
- [ ] 16 Gemini prompt + 5 perspektif ajanı + arastir/blog komutlarındaki inline preamble'ları
      yeni clause ile güncelle (doktrin_lint bunları yakalar)
- [ ] `playbook/` şablonuna olay çözüm yol haritası iskeleti (opsiyonel)
- [ ] MemPalace: `wing_buro_aykut/room_zero_halusinasyon` → yeni clause'un gerekçesi
      (Tuğba 2026-89 bağlantısı) drawer olarak yazılsın
