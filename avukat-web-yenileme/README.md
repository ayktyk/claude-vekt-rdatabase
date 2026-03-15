# Vega Hukuk Web

Kurumsal hukuk sitesi (Vite + React + TypeScript + Tailwind).

## Gereksinimler
- Node.js 20+
- npm 10+
- Vercel uzerinde deploy edilecekse bir Vercel hesabi
- Form mailleri icin Resend hesabi veya ayni REST sozlesmesini saglayan baska bir servis
- Yazi paneli icin bir GitHub OAuth App

## Lokal Gelistirme
```bash
npm install
npm run dev
```

Varsayilan gelistirme adresi: `http://localhost:8080`

## Vercel API ile Lokal Test
Frontend `npm run dev` ile calisir; ancak `api/contact` ve `api/cms/*` route'lari Vite dev server tarafindan servis edilmez.
Vercel function'larini da lokal test etmek icin Vercel CLI ile su akisi kullanilabilir:

```bash
npx vercel dev
```

## Build ve Onizleme
```bash
npm run build
npm run preview
```

## Blog ve Guncel Icerik Sistemi
- Blog yazilari: `src/content/blog/*.md`
- Guncel hukuk haberleri / Yargitay karar notlari: `src/content/legal-updates/*.md`
- Her icerik frontmatter + markdown govdesi ile tutulur.
- Site bu markdown dosyalarini otomatik okur ve yayinlar.
- Blog liste sayfasi: `/blog`
- Guncel hukuk gundemi sayfasi: `/guncel-hukuk-gundemi`
- Harici API kullanmak isterseniz `.env.local` veya `.env` icine `VITE_BLOG_API_URL=https://...` ekleyebilirsiniz.
- Gerekirse Bearer token icin `VITE_BLOG_API_TOKEN=...` kullanilabilir.
- API yaniti dogrudan dizi olabilir.
- Alternatif olarak post dizisi icin `VITE_BLOG_ITEMS_PATH=data.items` gibi bir yol verilebilir.
- Alan isimleri farkliysa `.env.example` icindeki `VITE_BLOG_FIELD_*` degiskenleriyle esleme yapilabilir.

## Admin Paneli
- Panel adresi: `/admin`
- CMS yapilandirma dosyasi: `public/admin/config.yml`
- Panel, GitHub backend ile su iki klasoru yonetir:
  - `src/content/blog`
  - `src/content/legal-updates`
- Vercel env'lerinde su alanlar tanimli olmali:
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
- GitHub OAuth App icin callback URL:
  - `https://vegahukukistanbul.com/api/cms/callback`
- Panel girisinde GitHub hesabi ile yetki verildikten sonra yeni blog yazisi, hukuk haberi veya onemli karar notu ekleyebilir, mevcut icerikleri duzenleyebilirsiniz.

## Iletisim Formu
- Browser tarafinda endpoint icin `VITE_CONTACT_FORM_ENDPOINT=/api/contact` kullanilabilir.
- Vercel deploy'unda bu endpoint, custom env verilmemisse production ortaminda otomatik olarak `/api/contact` kabul edilir.
- Serverless function dosyasi: `api/contact.ts`
- Sunucu tarafinda Resend entegrasyonu icin su env'ler tanimlanmalidir:
  - `RESEND_API_KEY`
  - `CONTACT_TO_EMAIL`
  - `CONTACT_FROM_EMAIL`
  - `CONTACT_ALLOWED_ORIGINS`
- Istemci tarafinda KVKK onayi, honeypot alan ve 60 saniyelik temel rate limit bulunur.
- Sunucu tarafinda origin kontrolu ve temel IP bazli rate limit bulunur.

## Vercel Deploy Notlari
- `vercel.json` dosyasi once filesystem'i servis eder, sonra SPA fallback uygular. Bu sayede `/admin` ve diger statik dosyalar 404 vermez.
- `api/contact.ts` ve `api/cms/*` Vercel Functions uzerinde calisir.
- Vercel dashboard icinde Production env'lerine `.env.example` dosyasindaki ilgili degiskenleri girin.
- Resend tarafinda `CONTACT_FROM_EMAIL` icin dogrulanmis bir domain veya test gondericisi kullanin.

## Test ve Lint
```bash
npm run test
npm run lint
```

## Klasorler
- `src/pages`: sayfalar
- `src/components`: UI bolumleri
- `src/content/blog`: markdown blog yazilari
- `src/content/legal-updates`: hukuk gundemi ve karar notlari
- `public/admin`: icerik paneli
- `public`: statik dosyalar
- `api`: Vercel serverless function'lari

## Yayin (Bagimsiz)
- Proje Vercel uzerinde static frontend + serverless function olarak yayinlanabilir.
- Build cikti klasoru: `dist/`
- Domain, DNS ve SSL ayarlari deploy sonrasi Vercel veya registrar uzerinden yonetilir.
