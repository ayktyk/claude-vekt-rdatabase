# legal.local.md — Büro Kuralları ve Tercihleri

Bu dosya Avukat Aykut'un bürosuna özgü kuralları içerir.
Claude her dilekçe yazımında ve usul analizinde bu dosyayı oku ve kurallara uy.
Genel hukuk bilgisi bu dosyadaki büro tercihlerine göre şekillendirilir.

---

## Dilekçe Dili

- Cümleler kısa ve aktif yapıda kurulur.
- Her paragraf tek bir hukuki argümanı taşır.
- Yargıtay kararları künyesiyle birlikte gösterilir, sadece sonuç değil dayanak da yazılır.
- Müvekkilin duygusal ifadelerine yer verilmez. Olgular hukuki bağlamda aktarılır.
- Dilekçenin anatomisi kitabındaki yapıya uyulur: Olaylar → Hukuki değerlendirme → Deliller → Talep.

## Dava Türü Bazında Özel Kurallar

### İşçilik Alacakları

- 4857 sayılı İş Kanunu esas alınır.
- İş Mahkemesi görevlidir. Davalının yerleşim yeri veya işin yapıldığı yer mahkemesi yetkilidir.
- Arabuluculuk zorunludur (7036 sayılı Kanun m. 3).
- Zamanaşımı: 5 yıl (fesih tarihinden itibaren, 01.01.2018 sonrası davalar).
- Kıdem tazminatı tavanı her yıl güncellenir. Hesaplamadan önce güncel tavanı kontrol et.

### Kira Uyuşmazlıkları

- 6098 sayılı Türk Borçlar Kanunu ve 7343 sayılı Hukuk Muhakemeleri Kanunu esas alınır.
- Sulh Hukuk Mahkemesi görevlidir.
- Tahliye davalarında ihtarname şartı kontrol edilir.

### Tüketici Uyuşmazlıkları

- 6502 sayılı Tüketicinin Korunması Hakkında Kanun esas alınır.
- Tüketici Mahkemesi görevlidir.
- Belirli eşik altı uyuşmazlıklarda Tüketici Hakem Heyeti zorunludur.

---

## Dosya ve Klasör Adı Formatı

Google Drive'da klasör adı her zaman şu formatta olur:
`[YIL]-[SIRA] [Müvekkil Soyadı] - [Dava Türü Kısaltma]`

Örnekler:

- `2026-001 Yilmaz - Iscilik`
- `2026-002 Kaya - Kira Tespiti`
- `2026-003 Demir - Tuketici`

---

## Güncelleme Notu

Bu dosyayı avukat manuel olarak günceller.
Yeni bir büro kuralı eklendiğinde buraya yazılır.
Son güncelleme: Mart 2026

# Avukat Dava Rehberi — GitHub Copilot Site Yapım Talimatları

> Bu dosya, GitHub Copilot'un projeyi sıfırdan oluşturabilmesi için hazırlanmış tam bir spesifikasyon belgesidir.
> VS Code'da bu dosyayı açık tutarak `@workspace` veya `#file` ile Copilot'a referans verin.

---

## 1. PROJE TANIMI

**Her dava için:**

- Görevli ve yetkili mahkeme bilgisi
- Tahmini harç ve masraflar
- Ortalama yargılama süresi
- Tıklanabilir kontrol listesi (checklist)
- ⚠️ Vekaletnameye özel yetki ibaresi gerekip gerekmediği uyarısı

---

```

---


```

---

{
id: 1,
grup: "hukuk",
ad: "Boşanma (Anlaşmalı)",
sure: "1–3 ay",
kanun: "TMK md.166",
gorevli: "Aile Mahkemesi (yoksa Asliye Hukuk)",
yetkili: "Taraflardan birinin yerleşim yeri mahkemesi",
harc: [
{ kalem: "Başvuru Harcı", tutar: "~500–800 ₺" },
{ kalem: "Peşin Harç", tutar: "~1.000–2.000 ₺" },
{ kalem: "Tebligat", tutar: "~300–600 ₺" },
{ kalem: "TOPLAM TAHMİNİ", tutar: "2.500–5.000 ₺", toplam: true },
],
sureDetay:
"Protokol eksiksizse tek duruşmayla karar çıkabilir. Çocuk varsa velayet zorunlu düzenlenir.",
ozelYetki:
"Vekaletnameye açıkça 'boşanma davası açmaya ve takip etmeye' ibaresi yazılmalıdır.",
checklist: [
{
baslik: "Müvekkilden Alınacak Bilgiler",
maddeler: [
"Evlilik tarihi ve yeri",
"Çocukların adı ve yaşı",
"Nafaka tutarı üzerinde anlaşıldı mı?",
"Velayet düzenlemesi belirlendi mi?",
"Mal paylaşımı çözümlendi mi?",
"Eşin TC kimlik no ve adresi",
],
},
{
baslik: "Toplanacak Belgeler",
maddeler: [
"Nüfus cüzdanı fotokopisi",
"Evlilik cüzdanı",
"Nüfus kayıt örneği (e-Devlet)",
"Anlaşmalı boşanma protokolü",
"Çocuk varsa doğum belgesi",
],
},
{
baslik: "Hukuki Kontrol",
maddeler: [
"Protokol her iki tarafça imzalandı mı?",
"Velayet, nafaka, kişisel ilişki protokolde var mı?",
"Mal rejimi tasfiyesi protokole dahil mi?",
"Yoksulluk nafakası değerlendirildi mi?",
"Arabuluculuk bu davada zorunlu değil — teyit edildi mi?",
],
},
],
},
{
id: 2,
grup: "hukuk",
ad: "Boşanma (Çekişmeli)",
sure: "1–4 yıl",
kanun: "TMK md.161-166",
gorevli: "Aile Mahkemesi (yoksa Asliye Hukuk)",
yetkili:
"Davalının yerleşim yeri VEYA son 6 ay birlikte oturulan yer",
harc: [
{ kalem: "Başvuru Harcı", tutar: "~500–800 ₺" },
{ kalem: "Peşin Harç", tutar: "Dava değerinin %4,55'i" },
{ kalem: "Bilirkişi/Uzman", tutar: "~2.000–5.000 ₺" },
{ kalem: "Tebligat", tutar: "~500–1.500 ₺" },
{ kalem: "TOPLAM TAHMİNİ", tutar: "5.000–20.000 ₺+", toplam: true },
],
sureDetay:
"Nafaka, velayet, ziynet, mal paylaşımı uyuşmazlıkları süreci uzatır. Uzman (psikolog) raporu istenebilir.",
ozelYetki:
"'Boşanma davası açmaya, takip etmeye, feragat ve kabule' yetkisi açıkça belirtilmelidir.",
checklist: [
{
baslik: "Müvekkilden Alınacak Bilgiler",
maddeler: [
"Ayrılık tarihi ve nedeni",
"Evlilik birliğini sarsan olaylar (şiddet, aldatma vb.)",
"Çocukların mevcut durumu",
"Ortak mal varlıkları (tapu, araç, banka)",
"Ziynet/katkı alacağı talebi",
"Şiddet delilleri var mı?",
"Tanıklar",
],
},
{
baslik: "Toplanacak Belgeler",
maddeler: [
"Nüfus kayıt örneği",
"Evlilik cüzdanı",
"Adli tıp raporu (şiddet varsa)",
"Mesaj/e-posta ekran görüntüleri",
"SGK hizmet dökümü (nafaka için)",
"Tapu ve araç ruhsatı",
"Tanık listesi",
],
},
{
baslik: "Hukuki Kontrol",
maddeler: [
"Boşanma sebebi (TMK 161-166) belirlendi mi?",
"Tedbir nafakası ve velayet tedbiri talep edildi mi?",
"6284 kapsamında uzaklaştırma kararı gerekiyor mu?",
"Ziynet alacağı ispat durumu değerlendirildi mi?",
"Mal rejimi tasfiyesi hesaplandı mı?",
"Harca esas değer belirlendi mi?",
],
},
],
},
{
id: 3,
grup: "hukuk",
ad: "Nafaka Davası",
sure: "3 ay–1 yıl",
kanun: "TMK md.175-182",
gorevli: "Aile Mahkemesi",
yetkili: "Nafaka alacaklısının yerleşim yeri mahkemesi",
harc: [
{ kalem: "Başvuru Harcı", tutar: "~300–600 ₺" },
{ kalem: "Artırım: maktu harç", tutar: "~300 ₺" },
{ kalem: "Tebligat", tutar: "~300–500 ₺" },
{ kalem: "TOPLAM TAHMİNİ", tutar: "1.000–3.000 ₺", toplam: true },
],
sureDetay:
"Tedbir nafakası dava süresince hemen alınabilir. TÜİK enflasyon verileriyle artırım desteklenir.",
ozelYetki: null,
checklist: [
{
baslik: "Müvekkilden Alınacak Bilgiler",
maddeler: [
"Mevcut nafaka kararı var mı?",
"Her iki tarafın gelir durumu",
"Çocuğun artan ihtiyaçları",
"Nafaka ödeniyor mu?",
"Ödenmiyorsa icra takibi planlanıyor mu?",
],
},
{
baslik: "Toplanacak Belgeler",
maddeler: [
"Boşanma/ayrılık kararı",
"SGK hizmet dökümü",
"Maaş bordrosu",
"Kira sözleşmesi",
"Okul/sağlık giderleri",
"TÜİK verisi",
],
},
{
baslik: "Hukuki Kontrol",
maddeler: [
"Artırım için önemli değişiklik oluştu mu?",
"Tedbir nafakası hemen talep edilmeli mi?",
"Ödenmemişse icra takibi başlatıldı mı?",
"Yoksulluk nafakasında evlilik/çalışma değişimi var mı?",
],
},
],
},
{
id: 4,
grup: "hukuk",
ad: "Velayet / Kişisel İlişki Davası",
sure: "6 ay–2 yıl",
kanun: "TMK md.182-193",
gorevli: "Aile Mahkemesi",
yetkili: "Çocuğun yerleşim yeri mahkemesi",
harc: [
{ kalem: "Başvuru Harcı", tutar: "~300–600 ₺" },
{ kalem: "Bilirkişi/Psikolog", tutar: "~2.000–5.000 ₺" },
{ kalem: "Tebligat", tutar: "~300–600 ₺" },
{ kalem: "TOPLAM TAHMİNİ", tutar: "3.000–8.000 ₺", toplam: true },
],
sureDetay:
"Sosyal inceleme raporu ve uzman görüşü istenir. Çocuğun yaşına göre dinlenme yapılabilir.",
ozelYetki: null,
checklist: [
{
baslik: "Müvekkilden Alınacak Bilgiler",
maddeler: [
"Çocuğun yaşı ve mevcut durumu",
"Mevcut velayet düzenlemesi",
"Değişiklik talebi gerekçesi",
"Diğer tarafın yaşam/çalışma koşulları",
"Şiddet/ihmal iddiası var mı?",
],
},
{
baslik: "Toplanacak Belgeler",
maddeler: [
"Boşanma/velayet kararı",
"Nüfus kayıt örneği",
"Sosyal inceleme raporu (varsa)",
"Okul/sağlık kayıtları",
"Tanıklar (öğretmen, doktor, akraba)",
],
},
{
baslik: "Hukuki Kontrol",
maddeler: [
"Yeni ve önemli durum değişikliği oluştu mu?",
"Geçici velayet tedbiri gerekiyor mu?",
"Çocuğun üstün yararı kriterleri değerlendirildi mi?",
"Uluslararası çocuk kaçırma söz konusu mu? (Lahey)",
],
},
],
},
{
id: 5,
grup: "hukuk",
ad: "Mal Rejimi Tasfiyesi / Mal Paylaşımı",
sure: "1–3 yıl",
kanun: "TMK md.218-281",
gorevli: "Aile Mahkemesi",
yetkili:
"Boşanma davası mahkemesi; ayrı açılıyorsa eşin yerleşim yeri",
harc: [
{ kalem: "Başvuru Harcı", tutar: "~600–1.000 ₺" },
{ kalem: "Peşin Harç", tutar: "Dava değerinin %4,55'i" },
{ kalem: "Bilirkişi/Ekspertiz", tutar: "~3.000–10.000 ₺" },
{ kalem: "TOPLAM TAHMİNİ", tutar: "10.000–40.000 ₺+", toplam: true },
],
sureDetay:
"Katılma alacağı hesabı için tüm mal varlığı tespiti gerekir. Bilirkişi incelemesi süreci uzatır.",
ozelYetki:
"Vekaletnameye 'mal rejimi tasfiyesi davası açmaya ve feragate' yetkisi açıkça yazılmalıdır.",
checklist: [
{
baslik: "Müvekkilden Alınacak Bilgiler",
maddeler: [
"Evlilik tarihi (mal rejimi başlangıcı)",
"Evlilik öncesi mallar tespit edildi mi?",
"Edinilmiş mallar listesi (tapu, araç, banka, şirket)",
"Bağış/miras yoluyla edinilen mallar",
"Mal rejimi sözleşmesi var mı?",
],
},
{
baslik: "Toplanacak Belgeler",
maddeler: [
"Evlilik cüzdanı",
"Tapu kayıtları (evlilik öncesi/sonrası)",
"Araç ruhsatları",
"Banka hesap dökümleri",
"Şirket kuruluş belgeleri",
"Miras/bağış belgeleri",
],
},
{
baslik: "Hukuki Kontrol",
maddeler: [
"Mal rejimi türü belirlendi mi?",
"Kişisel mal-edinilmiş mal ayrımı yapıldı mı?",
"Denkleştirme ve katılma alacağı hesaplandı mı?",
"İhtiyati haciz talep edildi mi?",
"Muvazaalı devir şüphesi var mı?",
],
},
],
},
// ► Buraya kalan 26 hukuk davası (id:6-31) aynı pattern ile eklenir.
// Copilot: davalar.ts dosyasına aşağıdaki id listesini ekle:
// 6:Alacak Tahsili 7:Veraset İlamı 8:Miras Paylaşımı/Tenkis
// 9:Muris Muvazaası 10:Maddi/Manevi Tazminat 11:Trafik Kazası Tazminatı
// 12:İş Kazası Tazminatı 13:Tıbbi Malpraktis 14:Kira Tahliye
// 15:Kira Bedeli Uyarlama 16:Tapu İptali ve Tescil 17:El Atmanın Önlenmesi
// 18:Ecrimisil 19:Ortaklığın Giderilmesi 20:Kıdem Tazminatı
// 21:İhbar Tazminatı 22:Fazla Mesai/Yıllık İzin 23:İşe İade
// 24:Ticari Alacak/Ortaklık 25:Şirket Feshi/Konkordato 26:Tüketici Hakları
// 27:Kat Mülkiyeti/Aidat 28:Fikri Sınai Hak 29:Menfi Tespit
// 30:İtirazın İptali 31:Kamulaştırma Bedel Artırımı

// ─────────────────────────────────────────
// CEZA DAVALARI (id: 32-56)
// ─────────────────────────────────────────
{
id: 32,
grup: "ceza",
ad: "Kasten Yaralama",
sure: "6 ay–2 yıl",
kanun: "TCK md.86-87",
gorevli: "Asliye Ceza Mahkemesi (ağır haller Ağır Ceza)",
yetkili: "Suçun işlendiği yer mahkemesi",
harc: [
{ kalem: "Katılan başvuru harcı", tutar: "~300–600 ₺" },
{ kalem: "Tazminat davası", tutar: "Ayrıca hesaplanır" },
{ kalem: "TOPLAM TAHMİNİ", tutar: "300–2.000 ₺", toplam: true },
],
sureDetay:
"Uzlaşma kapsamındadır. Adli tıp raporu belirleyicidir. Ağır yaralama (TCK 87) Ağır Ceza'ya taşır.",
ozelYetki:
"Şikayetten vazgeçme için vekaletnameye 'şikayetten vazgeçmeye' yetkisi yazılmalıdır.",
checklist: [
{
baslik: "Müvekkilden Alınacak Bilgiler",
maddeler: [
"Olay tarihi, yeri ve gelişimi",
"Sanık-mağdur ilişkisi",
"Yaralanmanın niteliği",
"Uzlaşma isteği var mı?",
"Tanıklar",
],
},
{
baslik: "Toplanacak Belgeler",
maddeler: [
"Adli tıp raporu (iş göremezlik)",
"Hastane kayıtları",
"Kamera görüntüleri",
"Tanık ifadeleri",
"Fotoğraflar",
],
},
{
baslik: "Hukuki Kontrol",
maddeler: [
"Uzlaşma kapsamında mı?",
"Uzlaştırıcıya sevk yapıldı mı?",
"Basit/ağır yaralama adli tıpla teyitlendi mi?",
"Haksız tahrik indirimi var mı?",
"Şikayet süresi: 6 ay kontrol edildi mi?",
],
},
],
},
// ► Buraya kalan 24 ceza davası (id:33-56) aynı pattern ile eklenir:
// 33:Hırsızlık 34:Dolandırıcılık 35:Uyuşturucu 36:Hakaret 37:İftira
// 38:Tehdit 39:Kasten Öldürme 40:Cinsel Saldırı 41:Bilişim Suçları
// 42:Silahlı Örgüt 43:Kaçakçılık 44:Resmi Belgede Sahtecilik
// 45:İcra-İflasa Muhalefet 46:Çek Kanunu İhlali
// 47:Trafik Güvenliğini Tehlikeye Sokma 48:Çevre Kirliliği
// 49:Vergi Kaçakçılığı 50:Silahlı Saldırı 51:Çocuklara Karşı Suçlar
// 52:Kamu Görevlisine Hakaret 53:Görevi Kötüye Kullanma
// 54:Zimmet/Rüşvet 55:Terör Propagandası 56:Organize Suç/Yağma

// ─────────────────────────────────────────
// İDARİ DAVALAR (id: 57-67)
// ─────────────────────────────────────────
{
id: 57,
grup: "idari",
ad: "İdari İşlem İptali",
sure: "1–3 yıl",
kanun: "İYUK md.2, 7",
gorevli: "İdare Mahkemesi",
yetkili:
"İdari işlemi yapan idarenin bulunduğu yer mahkemesi",
harc: [
{ kalem: "Başvuru Harcı", tutar: "~300–600 ₺" },
{ kalem: "Posta/tebligat", tutar: "~300–600 ₺" },
{ kalem: "TOPLAM TAHMİNİ", tutar: "1.000–3.000 ₺", toplam: true },
],
sureDetay:
"Tebliğden 60 gün içinde dava açılmalıdır. Yürütmenin durdurulması talebi eklenmelidir.",
ozelYetki: null,
checklist: [
{
baslik: "Müvekkilden Alınacak Bilgiler",
maddeler: [
"İptal istenen işlemin türü ve tarihi",
"Tebliğ tarihi (60 gün başlar)",
"Önceden idareye itiraz yapıldı mı?",
"Yürütmeyi durdurma gerekli mi?",
],
},
{
baslik: "Toplanacak Belgeler",
maddeler: [
"İdari işlem belgesi",
"Tebligat belgesi",
"İdareye itiraz ve cevabı",
"İlgili mevzuat",
],
},
{
baslik: "Hukuki Kontrol",
maddeler: [
"60 günlük dava açma süresi geçmedi mi?",
"YD talebi eklenecek mi?",
"Yetki/şekil/sebep/konu/amaç unsurları incelendi mi?",
"Tam yargı davası da birlikte açılacak mı?",
],
},
],
},
// ► id: 58-67 aynı pattern ile eklenir.

// ─────────────────────────────────────────
// DİĞER DAVALAR (id: 68-80)
// ─────────────────────────────────────────
{
id: 68,
grup: "diger",
ad: "İcra Takibi ve İcra Hukuk Mahkemesi İtirazları",
sure: "1 ay–2 yıl",
kanun: "İİK md.1 vd.",
gorevli:
"İcra Dairesi (takip) / İcra Hukuk Mahkemesi (itiraz/şikayet)",
yetkili: "İcra dairesinin bulunduğu yer mahkemesi",
harc: [
{ kalem: "İcra harcı", tutar: "Alacağın %2,27'si" },
{ kalem: "Şikayet harcı", tutar: "~300–600 ₺" },
{ kalem: "TOPLAM TAHMİNİ", tutar: "Miktara göre değişir", toplam: true },
],
sureDetay:
"İlamsız icra itiraz süresi 7 gündür. İtirazın kaldırılması veya iptali davası sonraki adımdır.",
ozelYetki: null,
checklist: [
{
baslik: "Müvekkilden Alınacak Bilgiler",
maddeler: [
"Takip türü (ilamsız/ilamlı/kambiyo)",
"Borçlunun itiraz gerekçesi",
"7 günlük itiraz süresi geçmedi mi?",
"Alacak belgesi türü",
],
},
{
baslik: "Toplanacak Belgeler",
maddeler: [
"İcra takip belgesi",
"İtiraz dilekçesi",
"Alacak belgesi",
"Banka dekontları",
],
},
{
baslik: "Hukuki Kontrol",
maddeler: [
"7 günlük itiraz süresi kontrol edildi mi?",
"İtirazın kaldırılması mı, iptali mi?",
"Haksız itiraz %20 tazminatı talep edildi mi?",
"İcra şikayeti için 7 günlük şikayet süresi de kontrol edildi mi?",
],
},
],
},
// ► id: 69-80 aynı pattern ile eklenir.
];

````

> **Copilot Notu:** Yukarıdaki listedeki `// ►` yorum satırlarını gördüğünde aynı TypeScript pattern'i kullanarak eksik davaları davalar.ts dosyasına ekle. Her dava için id, grup, ad, sure, kanun, gorevli, yetkili, harc[], sureDetay, ozelYetki ve checklist[] alanları doldurulmalıdır.

---

## 6. CUSTOM HOOK (`src/hooks/useChecklist.ts`)

```typescript
"use client";
import { useState, useEffect } from "react";

type CheckState = Record<string, boolean>;

export function useChecklist(davaId: number) {
  const storageKey = `checklist-${davaId}`;

  const [checks, setChecks] = useState<CheckState>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(checks));
  }, [checks, storageKey]);

  const toggle = (key: string) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const reset = () => {
    setChecks({});
    localStorage.removeItem(storageKey);
  };

  const progress = (total: number) => {
    const done = Object.values(checks).filter(Boolean).length;
    return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  return { checks, toggle, reset, progress };
}
````

---

## 7. COMPONENT TANIMLARI

### `OzelYetkiBanner.tsx`

```tsx
interface Props {
  ozelYetki: string | null;
}

// ozelYetki null ise yeşil "Genel vekalet yeterli" banner göster
// ozelYetki string ise sarı/turuncu uyarı banner göster
// İçinde ⚠️ ikonu ve kalın "ÖZEL YETKİ GEREKLİDİR" başlığı olmalı
```

### `ChecklistTab.tsx`

```tsx
// useChecklist hook'unu kullan
// Her madde için checkbox — tıklanınca toggle
// Tamamlananlar üzeri çizili ve yeşil arka plan
// Üstte ProgressBar: "X/Y (%Z) tamamlandı"
// Alt kısımda "Bu Davayı Sıfırla" kırmızı buton
```

### `TabBar.tsx`

```tsx
// 4 sekme: Mahkeme ⚖️ | Harç 💳 | Süre ⏱️ | Checklist ✅
// Aktif sekme grup renginde alt çizgi
// Mobil: eşit genişlik, ikonlar + kısa etiket
```

---

## 8. SAYFA DESENLERİ

### Ana Sayfa (`app/page.tsx`)

```
┌──────────────────────────────────┐
│  ⚖️ Avukat Dava Rehberi          │
│  80 dava türü · özel yetki uyarısı│
├──────────────────────────────────┤
│  🔍 [Dava türü veya kanun ara...]│
├──────────────────────────────────┤
│  ⚖️ Hukuk Davaları    [31 dava]  │
│  🔴 Ceza Davaları     [25 dava]  │
│  🏛️ İdari Davalar    [11 dava]  │
│  📋 Diğer Davalar     [13 dava]  │
└──────────────────────────────────┘
```

### Dava Listesi (`app/[grupId]/page.tsx`)

```
┌──────────────────────────────────┐
│ ← Geri   ⚖️ Hukuk Davaları       │
├──────────────────────────────────┤
│ ⚠️ Boşanma (Anlaşmalı)           │
│    ⏱ 1–3 ay · TMK md.166         │
│    [Özel Yetki Gerekli]           │
├──────────────────────────────────┤
│    Boşanma (Çekişmeli)            │
│    ⏱ 1–4 yıl · TMK md.161-166    │
└──────────────────────────────────┘
```

### Dava Detay (`app/[grupId]/[davaId]/page.tsx`)

```
┌──────────────────────────────────┐
│ ← Geri   Boşanma (Anlaşmalı) ⚠️ │
├────────┬──────┬──────┬───────────┤
│ Mahkeme│ Harç │ Süre │ Checklist │
├────────┴──────┴──────┴───────────┤
│  [İçerik seçilen sekmeye göre]   │
└──────────────────────────────────┘
```

---

---

]
}

```

---

};
```

---

```

---

```

---
