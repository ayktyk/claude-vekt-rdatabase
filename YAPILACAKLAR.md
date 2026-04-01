# YAPILACAKLAR

Son guncelleme: 2026-03-31

Bu belge SECERE.md ve SONCLAUDE.md'nin sentezinden uretildi.
FAZA 1 (modullarizasyon, SKILL.md'ler, hesaplama ayrimi, kalite gate) tamamlandi.
Asagidaki fazalar sirali bagimliliga sahiptir — bir onceki bitmeden sonrakine gecme.

---

## Durum Tablosu

| Faz | Baslik | Durum |
|---|---|---|
| 1 | Modularizasyon + Kalite Kontrol | TAMAMLANDI |
| 2A | Usul Paketi | TAMAMLANDI |
| 2B | Arastirma Kalite Kontrolu | TAMAMLANDI |
| 2C | Dilekce v1 | TAMAMLANDI |
| 2D | Savunma Simulasyonu | TAMAMLANDI |
| 2E | Dilekce v2 + Final Onay | TAMAMLANDI |
| 2F | UDF Donusumu | TAMAMLANDI |
| **UI** | **UI/UX Tasarim Revizyonu** | **TAMAMLANDI** |
| 3A | Dashboard AI Workspace Sekmesi | TAMAMLANDI |
| UI+ | 21st.dev Bilesen Entegrasyonu (5 bilesen) | TAMAMLANDI |
| 3B | AI -> Gorev/Not/Bildirim Baglantisi | TAMAMLANDI |
| 3C | Dashboard AI Durum Paneli | TAMAMLANDI |
| 3D | Yeni Dava AI Secenegi | TAMAMLANDI |

---

## FAZA 2A — Usul Paketi

SECERE'nin 1 numarali eksik halkasi.
Arastirma ve dilekce hattinin on kosulu.
Usul tamamlanmadan arastirma baslatilmamali.

### Adimlar

- [ ] 1. `case_procedure_reports` tablosunu `schema.ts`'e ekle
  - caseId, courtType, jurisdiction, arbitrationRequired
  - statuteOfLimitations, courtFees (JSON), precheckPassed
  - reportMarkdown, storagePath, status, approvedBy, approvedAt
  - Migration olustur

- [ ] 2. `POST /api/procedure/precheck` endpoint
  - Dava turune gore on kontrol (arabuluculuk, zamanasiimi, dava sarti)
  - `precheckPassed` alanini guncelle

- [ ] 3. `POST /api/procedure/generate` endpoint
  - Anthropic API ile usul raporu uretimi
  - SKILL.md sablonuna uygun cikti
  - Raporu DB'ye ve workspace'e yaz

- [ ] 4. `POST /api/procedure/review` endpoint
  - Avukat onay/ret + notlar
  - Onaylaninca `automationStatus` -> `research_ready`

- [ ] 5. `GET /api/procedure/:caseId` endpoint

- [ ] 6. CaseDetailPage'e "Usul" sekmesi/karti ekle
  - Precheck durumu gostergesi
  - Rapor onizleme (markdown render)
  - Onayla / Revize Et butonlari

- [ ] 7. Usul raporunu Drive'a artifact olarak kaydet

- [ ] 8. Kalite gate: usul tamamlanmadan arastirma baslatma
  - `automationStatus` kontrolu research.ts'de

Dosyalar:
- `isbu-ofis/hukuk-takip/server/src/db/schema.ts`
- `isbu-ofis/hukuk-takip/server/src/routes/procedure.ts` (yeni)
- `isbu-ofis/hukuk-takip/client/src/pages/CaseDetailPage.tsx`
- `ajanlar/usul-uzmani/SKILL.md` (referans)

---

## FAZA 2B — Arastirma Kalite Kontrolu

Mevcut arastirma kosusu var ama QC yok.
`ai_job_reviews` tablosu mevcut — yeni tablo gerekmez.

### Adimlar

- [x] 1. `POST /api/research/:caseId/review` endpoint
  - Kaynak celisik tespiti
  - Arguman secimi

- [x] 2. "Dilekceye tasinacak argumanlar" al/alma isaretleme
  - `ai_job_artifacts` metadata alani uzerinden

- [x] 3. CaseDetailPage arastirma sekmesine QC paneli ekle
  - Kaynak listesi + celiski uyarilari
  - Arguman checklist

- [x] 4. Arastirma QC gecmeden dilekce asamasina gecilemesin
  - review onaylaninca `automationStatus` -> `draft_ready`

Dosyalar:
- `isbu-ofis/hukuk-takip/server/src/routes/research.ts` (genislet)
- `isbu-ofis/hukuk-takip/client/src/hooks/useAiJobs.ts`

---

## FAZA 2C — Dilekce v1

Ilk dilekce taslagi uretimi.

### Adimlar

- [x] 1. `POST /api/pleading/generate` endpoint
  - Girdi: briefing + usul + arastirma raporu + secilmis argumanlar
  - Cikti: v1 taslak (markdown)
  - Kalite gate: `automationStatus` >= `draft_ready` olmali

- [x] 2. `GET /api/pleading/:caseId` endpoint
  - Job, artifact, steps, reviews birlikte doner

- [x] 3. Artifact preview bileseni (markdown render)
  - CaseDetailPage'de "Dilekce" sekmesi olarak eklendi

- [x] 4. Manuel revizyon textarea alani
  - `PUT /api/pleading/:caseId/draft` endpoint
  - Duzenle/Iptal/Kaydet modu

- [x] 5. v1'i artifact olarak kaydet + review hatti
  - `POST /api/pleading/:caseId/review` (onay/ret)
  - Onayda `automationStatus` -> `review_ready`

Dosyalar:
- `isbu-ofis/hukuk-takip/server/src/routes/pleading.ts` (yeni)
- `ajanlar/dilekce-yazari/SKILL.md` (referans)

---

## FAZA 2D — Savunma Simulasyonu

Dilekce v1 sonrasi karsi taraf perspektifi.

### Adimlar

- [ ] 1. `POST /api/defense-simulation/generate` endpoint
  - 3 guclu savunma + yanit stratejisi + paragraf onerisi

- [ ] 2. Artifact olarak kaydet
  - `ai_job_artifacts`, artifactType: `defense_simulation`

- [ ] 3. CaseDetailPage'de savunma simulasyonu karti

- [ ] 4. Risk flag varsa bildirim uret

Dosyalar:
- `isbu-ofis/hukuk-takip/server/src/routes/defenseSimulation.ts` (yeni)
- `ajanlar/savunma-simulatoru/SKILL.md` (referans)

---

## FAZA 2E — Dilekce v2 + Final Onay

### Adimlar

- [x] 1. `POST /api/pleading/:caseId/revise` endpoint
  - Girdi: v1 + savunma simulasyonu + arastirma raporu
  - Cikti: revizyon raporu + v2 taslak (iki AI cagrisi sirayla)

- [x] 2. Revizyon raporu uretimi
  - `revisionAi.ts` — revizyon-ajani SKILL.md kurallarına gore

- [x] 3. `POST /api/pleading/:caseId/final-review` endpoint
  - v2 final onay/ret
  - Onayda `automationStatus` -> `completed`

- [x] 4. CaseDetailPage dilekce sekmesine v2 bolumu
  - v2 uret butonu, final onay/ret formu

- [x] 5. v2 artifact olarak kaydediliyor
  - `pleading_v2` artifactType

Dosyalar:
- `isbu-ofis/hukuk-takip/server/src/routes/pleading.ts` (genislet)
- `ajanlar/revizyon-ajani/SKILL.md` (referans)

---

## FAZA 2F — UDF Donusumu

### Adimlar

- [x] 1. `GET /api/pleading/:caseId/export-udf` endpoint
  - Onaylanmis markdown -> `udf-cli md2udf` -> binary download
  - v2 varsa onu, yoksa v1'i donusturur

- [x] 2. UDF dosyasi gecici dizinde uretilip stream olarak gonderiliyor

- [x] 3. CaseDetailPage'de UDF indirme butonu
  - Dilekce sekmesinde yesil "UDF Indir" butonu

Dosyalar:
- `udf-cli` paketi (mevcut, calisir durumda)
- `isbu-ofis/hukuk-takip/server/src/routes/pleading.ts` (genislet)

---

## FAZA UI — UI/UX Tasarim Revizyonu

Tum sayfalar ve bilesenlerin gorsel kalitesini profesyonel hukuk burosu seviyesine cikarmak.
Skill referanslari: `.claude/skills/frontend-design/SKILL.md`, `.claude/skills/ui-ux-pro-max/SKILL.md`

### UI-1: Tasarim Sistemi ve Temeller — TAMAMLANDI

- [x] 1. Renk paleti revizyonu — deep navy + gold accent + professional blue
  - 5 tema: Light, Dark, Navy, Warm, Forest
  - CSS degiskenleri `@layer` disinda, `html.theme-*` specificity
  - Tailwind token'lari CSS variable bazli (tema otomatik degisir)
- [x] 2. Tipografi yukseltmesi — EB Garamond (serif baslik) + Lato (body)
- [x] 3. Animasyon sistemi — fade-in, fade-in-up, scale-in, shimmer
- [x] 4. ThemeProvider + localStorage persistance + Ayarlar sayfasi tema secici
- [x] 5. 12 sayfada hardcoded renk temizligi (design system token'larina gecis)

### UI-2: Sidebar ve Layout Revizyonu — TAMAMLANDI

- [x] 1. Sidebar — gold accent aktif gosterge, serif logo, gradient ayirici, tema uyumlu
- [x] 2. Header — tema uyumlu bg/border/text, refined hover efektleri, aria-label
- [ ] 3. Mobile responsive drawer modu (ERTELENDI)
- [ ] 4. Sayfa gecis animasyonlari (ERTELENDI)

### UI-3: Login Sayfasi — TAMAMLANDI

- [x] 1. Split-screen layout (dekoratif sol panel + sag form)
- [x] 2. Gavel ikon + serif logo + gold accent detaylar
- [x] 3. Tema uyumlu input/card/background
- [x] 4. Arrow hover animasyonu, loading state

### UI-4: Dashboard Sayfasi — TAMAMLANDI

- [x] 1. Istatistik kartlari yeniden tasarim — trend gostergesi, renkli sol border, tema uyumlu ikon bg
- [x] 2. Yaklasan durusmalar karti — dashed empty state, tema uyumlu
- [x] 3. Bekleyen gorevler karti — oncelik renkleri, dashed empty state
- [x] 4. Hizli erisim butonlari — Yeni Dava, Yeni Muvekkil, Gorev Ekle, Durusma Takvimi
- [x] 5. Bos durum (empty state) gorsel iyilestirmesi — dashed circle icon wrapper

### UI-5: Dava ve Muvekkil Liste Sayfalari — TAMAMLANDI

- [x] 1. DataTable bileseni iyilestirmesi — hover, zebra (even:bg-muted/20)
- [x] 2. Filtre/arama cubugu tema uyumlu (bg-background)
- [x] 3. Durum badge'leri renk ve ikon uyumu (mevcut, tema uyumlu)
- [x] 4. Pagination ve sayfa basina kayit gosterimi (mevcut)
- [x] 5. Skeleton loading gorunumleri (mevcut)
- [x] 6. Hardcoded hover:bg-[#1d4ed8] temizligi → hover:opacity-90

### UI-6: Dava Detay Sayfasi (CaseDetailPage) — TAMAMLANDI

- [x] 1. Sekme navigasyonu iyilestirmesi — ikon + aktif cizgi (law-accent)
- [x] 2. Usul, Arastirma, Dilekce kartlari tema uyumlu (bg-card)
- [x] 3. Tema uyumlu input/card/background (onceki dark fix ile)
- [x] 4. Onay/Red butonlari tema uyumlu

### UI-7: Form Sayfalari (Dava/Muvekkil Ekle-Duzenle) — TAMAMLANDI

- [x] 1. Tum input'lara bg-background eklendi (tema uyumlu)
- [x] 2. Input, select, textarea gorunumu tutarliligi (focus:border-law-accent)
- [x] 3. Hata mesajlari gorsel geri bildirimi (mevcut, text-red-600)
- [x] 4. Kaydet/Iptal buton grubu hover:opacity-90 ile tema uyumlu

### UI-8: Takvim ve Durusma Sayfalari — TAMAMLANDI

- [x] 1. Takvim etkinlik chip renkleri opacity bazli (dark mode uyumlu)
- [x] 2. Durusma kartlari — tarih, mahkeme, durum renk kodu (mevcut, zebra eklendi)
- [x] 3. Yaklasan durusma uyari gorunumu (mevcut, tema uyumlu)

### UI-9: Bildirim ve Ayarlar — TAMAMLANDI

- [x] 1. Bildirim ikon renkleri opacity bazli (dark mode uyumlu)
- [x] 2. Ayarlar sayfasi tema secici (5 tema, gorsel onizleme)
- [x] 3. Bildirim okunmus/okunmamis gosterimi (mevcut, tema uyumlu)

Dosyalar:
- `isbu-ofis/hukuk-takip/client/src/components/` (tum bilesenler)
- `isbu-ofis/hukuk-takip/client/src/pages/` (tum sayfalar)
- `isbu-ofis/hukuk-takip/client/tailwind.config.ts`
- `isbu-ofis/hukuk-takip/client/src/index.css`

---

## FAZA 3A — Dashboard AI Workspace Sekmesi

### Adimlar

- [ ] 1. CaseDetailPage'e "AI Workspace" sekmesi ekle

- [ ] 2. Briefing ozeti karti

- [ ] 3. Usul raporu durum karti

- [ ] 4. Arastirma raporu durum karti

- [ ] 5. Dilekce taslaklari listesi (v1, v2, final)

- [ ] 6. Savunma simulasyonu karti

- [ ] 7. Her cikti yaninda [Onayla] ve [Revize Et] butonlari

Dosyalar:
- `isbu-ofis/hukuk-takip/client/src/pages/CaseDetailPage.tsx`
- Yeni bilesenler: `AiWorkspaceTab.tsx`, `ArtifactCard.tsx`

---

## FAZA 3B — AI -> Gorev/Not/Bildirim Baglantisi

### Adimlar

- [ ] 1. Eksik evrak -> otomatik `tasks` tablosuna kayit

- [ ] 2. Dusuk guvenli cikti -> `tasks` tablosuna dogrulama gorevi

- [ ] 3. Risk flag -> `notifications` tablosuna kayit

- [ ] 4. Arastirma bulgulari -> `notes` tablosuna kayit

- [ ] 5. Yardimci fonksiyonlar: `createAiTask()`, `createAiNotification()`

Dosyalar:
- `isbu-ofis/hukuk-takip/server/src/routes/` (mevcut tasks, notifications, notes)
- `isbu-ofis/hukuk-takip/server/src/utils/aiIntegration.ts` (yeni)

---

## FAZA 3C — Dashboard AI Durum Paneli

### Adimlar

- [ ] 1. DashboardPage'e "AI Durum" karti ekle

- [ ] 2. Ajan durumlari: Bosta / Calisiyor / Tamamlandi

- [ ] 3. Inceleme Bekleyen sayisi

- [ ] 4. Eksik Evrak sayisi

- [ ] 5. Polling ile durum kontrolu (WebSocket yok)

Dosyalar:
- `isbu-ofis/hukuk-takip/client/src/pages/DashboardPage.tsx`
- `isbu-ofis/hukuk-takip/server/src/routes/dashboard.ts`

---

## FAZA 3D — Yeni Dava AI Secenegi

### Adimlar

- [ ] 1. CaseFormPage'e "AI ile Baslat" butonu

- [ ] 2. Dava turu + kisa ozet + kritik nokta form alanlari

- [ ] 3. Opsiyonel: Advanced Briefing formu

- [ ] 4. [Baslat] -> Director Agent tetiklenir

- [ ] 5. Sonuclar mevcut case kaydina baglanir

Dosyalar:
- `isbu-ofis/hukuk-takip/client/src/pages/CaseFormPage.tsx`

---

## Dogrulama Protokolu (Her Faz Sonrasi)

1. `docker compose up` ile lokal test ortaminda calistir
2. Migration uygula: `npx drizzle-kit push`
3. Seed data ile endpoint'leri test et
4. Gercek bir dava senaryosuyla end-to-end test
5. Stabil olduktan sonra bir sonraki faza gec
6. SKILL.md'lerin "Ogrenilmis Dersler" bolumune kaydet

---

## Yapilmayacak Seyler (Su An Icin Erken)

- Hakim / mahkeme skorculugu
- Client self-service portal
- Billing / time tracking
- Real-time streaming / WebSocket
- Capacitor / PWA donusumu
- Next.js'e gecis
- Sayi bazli confidence score
- Tam UYAP entegrasyonu (en son faz olarak kalacak)
