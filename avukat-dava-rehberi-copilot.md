# Avukat Dava Rehberi — GitHub Copilot Site Yapım Talimatları

> Bu dosya, GitHub Copilot'un projeyi sıfırdan oluşturabilmesi için hazırlanmış tam bir spesifikasyon belgesidir.
> VS Code'da bu dosyayı açık tutarak `@workspace` veya `#file` ile Copilot'a referans verin.

---

## 1. PROJE TANIMI

**Hedef:** Türk avukatları için 80 dava türünü kapsayan, mobil uyumlu bir dava rehberi web uygulaması.

**Her dava için:**
- Görevli ve yetkili mahkeme bilgisi
- Tahmini harç ve masraflar
- Ortalama yargılama süresi
- Tıklanabilir kontrol listesi (checklist)
- ⚠️ Vekaletnameye özel yetki ibaresi gerekip gerekmediği uyarısı

---

## 2. TEKNOLOJİ STACK

```
Framework   : Next.js 14 (App Router) VEYA Vite + React 18
Dil         : TypeScript
Stil        : Tailwind CSS
İkon        : lucide-react
State       : useState / useReducer (localStorage ile persist)
Deploy      : Vercel (ücretsiz)
Paket yönet : npm veya pnpm
```

### Copilot'a kurulum komutu:
```bash
npx create-next-app@latest avukat-dava-rehberi \
  --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd avukat-dava-rehberi
npm install lucide-react
```

---

## 3. KLASÖR YAPISI

```
src/
├── app/
│   ├── layout.tsx          # Root layout, meta tags, PWA manifest
│   ├── page.tsx            # Ana sayfa (grup listesi + arama)
│   ├── globals.css
│   └── [grupId]/
│       ├── page.tsx        # Grup dava listesi sayfası
│       └── [davaId]/
│           └── page.tsx    # Dava detay sayfası (4 sekme)
├── components/
│   ├── SearchBar.tsx
│   ├── GrupKart.tsx
│   ├── DavaItem.tsx
│   ├── OzelYetkiBanner.tsx
│   ├── TabBar.tsx
│   ├── MahkemeTab.tsx
│   ├── HarcTab.tsx
│   ├── SureTab.tsx
│   ├── ChecklistTab.tsx
│   └── ProgressBar.tsx
├── data/
│   └── davalar.ts          # TÜM VERİ (aşağıda tam haliyle verilmiştir)
├── hooks/
│   └── useChecklist.ts     # localStorage persist checklist
└── types/
    └── index.ts            # TypeScript tipleri
```

---

## 4. TYPE TANIMLARI (`src/types/index.ts`)

```typescript
export type GrupId = "hukuk" | "ceza" | "idari" | "diger";

export interface HarcItem {
  kalem: string;
  tutar: string;
  toplam?: boolean;
}

export interface ChecklistKategori {
  baslik: string;
  maddeler: string[];
}

export interface Dava {
  id: number;
  grup: GrupId;
  ad: string;
  sure: string;
  kanun: string;
  gorevli: string;
  yetkili: string;
  harc: HarcItem[];
  sureDetay: string;
  ozelYetki: string | null; // null = gerekmiyor, string = uyarı metni
  checklist: ChecklistKategori[];
}

export interface Grup {
  id: GrupId;
  ad: string;
  aciklama: string;
  renk: string;      // Tailwind class veya hex
  emoji: string;
}
```

---

## 5. VERİ DOSYASI (`src/data/davalar.ts`)

```typescript
import { Dava, Grup } from "@/types";

export const gruplar: Grup[] = [
  {
    id: "hukuk",
    ad: "Hukuk Davaları",
    aciklama: "Boşanma, tazminat, tapu, iş, miras ve daha fazlası",
    renk: "#0891B2",
    emoji: "⚖️",
  },
  {
    id: "ceza",
    ad: "Ceza Davaları",
    aciklama: "Yaralama, dolandırıcılık, terör, organize suç ve daha fazlası",
    renk: "#DC2626",
    emoji: "🔴",
  },
  {
    id: "idari",
    ad: "İdari Davalar",
    aciklama: "İptal, tam yargı, vergi, ihale ve idari işlemler",
    renk: "#1D4ED8",
    emoji: "🏛️",
  },
  {
    id: "diger",
    ad: "Diğer Davalar",
    aciklama: "İcra, arabuluculuk, tahkim, AYM, yabancı karar tenfizi",
    renk: "#7C3AED",
    emoji: "📋",
  },
];

export const davalar: Dava[] = [
  // ─────────────────────────────────────────
  // HUKUK DAVALARI (id: 1-31)
  // ─────────────────────────────────────────
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
```

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
```

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

## 9. TASARIM SİSTEMİ

### Renk Paleti
| Grup    | Ana Renk  | Açık Renk | Kullanım |
|---------|-----------|-----------|----------|
| Hukuk   | `#0891B2` | `#CFFAFE` | Kenarlık, aktif sekme, başlık |
| Ceza    | `#DC2626` | `#FEE2E2` | Kenarlık, aktif sekme, başlık |
| İdari   | `#1D4ED8` | `#DBEAFE` | Kenarlık, aktif sekme, başlık |
| Diğer   | `#7C3AED` | `#EDE9FE` | Kenarlık, aktif sekme, başlık |
| Özel Yetki Uyarı | `#F59E0B` | `#FEF3C7` | Banner arka plan |
| Özel Yetki Tamam | `#22C55E` | `#F0FDF4` | Banner arka plan |

### Tipografi
- Başlıklar: `font-bold`
- Kanun kodu: `text-sm text-gray-500 font-mono`
- Checklist madde: `text-sm text-gray-700`
- Tamamlanan madde: `line-through text-gray-400`

### Spacing
- Kartlar arası: `mb-3`
- İç padding: `p-4`
- Border radius: `rounded-xl`
- Mobile max-width: `max-w-md mx-auto`

---

## 10. PWA AYARLARI (`public/manifest.json`)

```json
{
  "name": "Avukat Dava Rehberi",
  "short_name": "Dava Rehberi",
  "description": "80 dava türü için avukat rehberi",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f0ede8",
  "theme_color": "#1a1a2e",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 11. SEO VE META (`app/layout.tsx`)

```tsx
export const metadata = {
  title: "Avukat Dava Rehberi | 80 Dava Türü",
  description:
    "Görevli mahkeme, harç, süre ve checklist bilgileriyle Türk avukatları için kapsamlı dava rehberi.",
  keywords: "avukat, dava rehberi, görevli mahkeme, harç hesaplama, vekaletname özel yetki",
};
```

---

## 12. DEPLOY (Vercel)

```bash
# 1. Vercel hesabı aç: vercel.com
# 2. GitHub'a push et
# 3. Vercel'de "Import Project" → GitHub repo seç
# 4. Framework: Next.js (otomatik algılar)
# 5. Deploy — 2 dakikada canlı

# Özel domain (isteğe bağlı):
# Vercel Dashboard → Domains → avukatrehberi.com
```

---

## 13. COPILOT CHAT KOMUTLARI

VS Code'da bu dosyayı açıkken şu komutları kullanabilirsiniz:

```
@workspace #file:avukat-dava-rehberi-copilot.md
"Yukarıdaki spesifikasyona göre src/data/davalar.ts dosyasını oluştur.
Tüm 80 davayı id:1'den başlayarak TypeScript Dava[] array olarak yaz."

@workspace
"ChecklistTab.tsx komponentini useChecklist hook'unu kullanarak oluştur.
Her madde tıklanabilir, tamamlananlar üzeri çizili olmalı, progress bar üstte görünmeli."

@workspace
"OzelYetkiBanner.tsx komponentini oluştur.
ozelYetki null ise yeşil 'Genel vekalet yeterli' banner,
string ise sarı ⚠️ uyarı banner render etmeli."

@workspace
"app/[grupId]/[davaId]/page.tsx sayfasını oluştur.
4 sekme: Mahkeme, Harç, Süre, Checklist. 
URL parametrelerinden davaId alarak davalar.ts'den ilgili davayı bul."
```

---

## 14. KONTROL LİSTESİ (Site tamamlandığında)

- [ ] 80 dava türünün tamamı davalar.ts'e eklendi
- [ ] Her dava için 4 sekme çalışıyor
- [ ] Özel yetki banner'ları doğru gösteriliyor
- [ ] Checklist localStorage'da persist ediliyor
- [ ] Arama (isim + kanun maddesi) çalışıyor
- [ ] Mobil görünüm max-w-md ile kısıtlandı
- [ ] PWA manifest eklendi
- [ ] Vercel'e deploy edildi
- [ ] Özel domain bağlandı (opsiyonel)

---

*Son güncelleme: 2026 · Tüm harç ve süreler tahminidir. Güncel bilgi için adalet.gov.tr / UYAP kontrol ediniz.*
