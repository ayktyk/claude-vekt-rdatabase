# ARGUMAN.md — Araştırma Katmanı Yeniden Tasarım Handoff

> **Bu dosya yeni Claude oturumu için handoff. Oturum açtığında ilk önce bu dosyayı oku, sonra `~/.claude/plans/sistemimizi-geli-tirece-iz-ara-t-rma-a-a-rippling-clock.md`'ye git (tam plan), sonra aşağıdaki "DEVAM ETME PROTOKOLÜ"yle devam et.**

**Son güncelleme:** 2026-05-19 — **Faz 0, 1, 2, 3, 4, 5 TAMAMLANDI. Sadece Faz 6 (pilot test) kaldı.**

## DURUM ÖZETİ (2026-05-19 — 2. oturum)

İki MCP bağlı (`✓ Connected`), 12 tool şeması yüklendi, pilot sorgular OK.
Senaryo B uygulandı (ayrı tool'lar — sıralı zincir korunur).

| Faz | Durum | Commit |
|---|---|---|
| 0 — Discovery + envanter | ✅ | `4b7b35c` |
| 1 — 2E Akademik decommission | ✅ (önceki oturum) | (uncommitted) |
| 2 — Yargı-MCP-Pro entegrasyonu | ✅ | `4b7b35c` |
| 3 — Arguman.ai entegrasyonu (+ tanıtım sayfası 3 server skill) | ✅ | `4b7b35c` |
| 4 — Denetim mekaniği (karsi-arguman → Savunma Sim + HARD FAIL netleştirildi) | ✅ | `4b7b35c` |
| 5 — Komut + yapısal güncellemeler (toparlama) | ✅ | (uncommitted) |
| 6 — Pilot test (avukat dava seçer) | ⏸ | - |

**Üretilen ana dokümanlar:**
- `SON.md` — 1364 satır, bir davada baştan sona tam akış (CLAUDE.md + FIVEAGENTS.md + ANTIGRAVITY.md sentezi)
- `docs/mcp-envanteri/yargi-mcp-pro.md` + `arguman-ai.md` — tool envanterleri
- `.claude/commands/arastir-arguman.md` — yeni Faz D komutu

---

## Hedef (1 cümle)

ASAMA 2 araştırma katmanını yeniden kuruyoruz: **Yargı-MCP-Pro + Arguman.ai** ile **0 halüsinasyon + normlar hiyerarşisi otomatik**, eski Yargı/Mevzuat/Akademik MCP'lerin yerine.

## Yeni Mimari

```
ESKİ:                                  YENİ:
2A Stajyer (yörünge)                   2A Stajyer + Arguman.ai (ESAS araştırma)
├ 2D NotebookLM (paralel)              ├ 2D NotebookLM (paralel — dokunulmaz)
├ 2E Akademik (DergiPark+YÖK Tez)      └ Yargı-MCP-Pro (DENETLEYİCİ:
└ 2B Yargı → 2C Mevzuat (zincir)         · her künye otomatik documentId fetch
                                         · tam metin eşleştirme
                                         · 7-seviye normlar hiyerarşisi etiket
                                         · başarısız → [DOĞRULANMAMIŞ])
```

**Kullanıcı kararları (sabit):**
- 2E Akademik tamamen kaldırılıyor → ✓ tamamlandı
- 2D NotebookLM korunuyor (avukatın iş hukuku/aile hukuku notebook'ları)
- Pro MCP otomatik documentId fetch + DOĞRULANMAMIŞ damgalaması yapacak
- Eski Yargı/Mevzuat/Literatur/Yoktez MCP'leri zamanla emekli (pilot başarılıysa)

---

## Faz Durumu

| Faz | Durum | Notlar |
|---|---|---|
| **FAZ 0** — MCP kurulumu + discovery | 🟡 **YARIDA** | İki MCP `.mcp.json`'a eklendi, workspace trust + OAuth bekliyor |
| **FAZ 1** — 2E Akademik decommissioning | ✅ **TAMAMLANDI** | Tüm 2E referansları aktif sistem dosyalarından çıkarıldı |
| FAZ 2 — Yargı-MCP-Pro entegrasyonu | ⏸ Beklemede | Faz 0 → tool listesi → senaryo A/B kararı |
| FAZ 3 — Arguman.ai entegrasyonu | ⏸ Beklemede | Faz 0 → tool listesi |
| FAZ 4 — Denetim mekaniği | ⏸ Beklemede | Faz 2+3 sonrası |
| FAZ 5 — Komut + yapısal güncellemeler | ⏸ Beklemede | Faz 4 sonrası |
| FAZ 6 — Pilot test | ⏸ Beklemede | Hepsi tamam olduktan sonra |

---

## FAZ 1'DE TAMAMLANAN İŞLER (yapıldı, geri dönülmez)

### Silinen dosya
- `.claude/commands/arastir-akademik.md` (git status: `D`)

### Değiştirilen dosyalar — 2E Akademik referansları temizlendi
- `config/model-routing.json` — `akademik_mcp` task'ı silindi
- `ajanlar/arastirmaci/SKILL.md` — Bölüm 3 (~110 satır, 2E protokol) silindi + 12 spesifik referans temizlendi
- `ajanlar/director/SKILL.md` — 4 yerden 2E temizlendi (komut tablosu + cagri tipi + sample status)
- `FIVEAGENTS.md` — ASAMA 2 diyagramı yeniden çizildi, 2E AKADEMIK blok çıkarıldı, 11+ spesifik referans temizlendi
- `CLAUDE.md` (proje kökü) — Araç tablosu (Literatur+Yoktez), hata yönetimi, kısayollar + 6 diğer satır temizlendi
- `.claude/commands/arastir.md` — Master komut akışı 2E'siz hale getirildi
- `.claude/commands/yeni-dava.md` — 2E referansı temizlendi
- `prompts/stajyer/yorunge_talimat_sablonu.md` — 2E akademik yörünge talimatı bölümü kaldırıldı

### Oluşturulan dosyalar
- `docs/mcp-envanteri/README.md` — Faz 0 discovery rehberi
- `docs/mcp-envanteri/yargi-mcp-pro.md` — envanter şablonu (Faz 0 sonrası doldurulacak)
- `docs/mcp-envanteri/arguman-ai.md` — envanter şablonu

### Bilinçli olarak bırakılan tarihsel notlar (silinmemiş, açıklayıcı)
Aşağıdaki dosyalarda "2E Akademik 2026-05-19 itibariyla kaldırıldı" notları kaldı — tarihsel bilinç için:
- `ajanlar/arastirmaci/SKILL.md` satır ~1161
- `FIVEAGENTS.md` satır ~362, ~777
- `.claude/commands/arastir.md` satır ~47
- `.claude/commands/yeni-dava.md` satır ~54
- `prompts/stajyer/yorunge_talimat_sablonu.md` satır ~85

### Untracked tarihsel notlar (DOKUNULMADI)
`FORLEGALCLAUDE.md`, `FORLEGALCLAUDE2.md`, `ANTIGRAVITY.md`, `HIZ.md`, `HIZCODEX.md` — bunlar avukatın kişisel çalışma notları, sistem dosyası değil.

---

## FAZ 0'DA YAPILANLAR (yarıda)

### Tamamlandı
1. ✅ `claude mcp add yargi-mcp-pro --transport http https://yargi-mcp-pro-production.up.railway.app/mcp -s project`
2. ✅ `claude mcp add arguman --transport http https://mcp.arguman.ai/mcp -s project`
3. ✅ Project scope `.mcp.json`'a eklendi (mevcut buro-hafizasi, notebooklm, qmd-hafiza yanına)
4. ✅ `claude mcp list` → ikisi de `! Needs authentication` durumunda
5. ✅ `claude mcp reset-project-choices` → workspace trust dialog'u yeni açılışta tekrar gelecek

### `.mcp.json` mevcut durumu
```json
{
  "mcpServers": {
    "notebooklm": { "command": "notebooklm-mcp", "args": [] },
    "buro-hafizasi": { "command": "python", "args": ["-m", "mempalace.mcp_server"], "env": {...} },
    "qmd-hafiza": { "command": "qmd", "args": ["mcp"], "env": {...} },
    "yargi-mcp-pro": {
      "type": "http",
      "url": "https://yargi-mcp-pro-production.up.railway.app/mcp"
    },
    "arguman": {
      "type": "http",
      "url": "https://mcp.arguman.ai/mcp"
    }
  }
}
```

### Auth bilgileri (test edildi)
- **Arguman.ai:** OAuth 2.0 standart MCP flow, self-hosted authorization server (`https://mcp.arguman.ai`), scope: `mcp`, docs: `https://arguman.ai/docs/mcp`
- **Yargı-MCP-Pro:** OAuth 2.0 standart MCP flow, **AuthKit/WorkOS** authorization server (`https://talented-bear-32-staging.authkit.app`), scopes: `openid profile email offline_access` — **staging instance** (mühendisin hesap bilgisi vermesi gerekiyor)

---

## ⚠️ AVUKAT — YENİ OTURUM AÇTIĞINDA YAPACAKLARIN

### 1. Claude Code'u TAMAMEN kapat, yeniden aç
- Şu anki pencereyi X ile kapat (sadece /clear yetmez)
- Aynı klasörde (`C:\Users\user\Desktop\Eski Claude antıgravıty`) Claude Code'u yeniden başlat

### 2. Workspace Trust dialog'u onayla
Açılırken muhtemelen şu dialog gelecek:
> "This project's `.mcp.json` defines new MCP servers: `yargi-mcp-pro`, `arguman`. Do you trust them?"

**"Yes, trust"** veya benzer onayı seç. Bu olmadan MCP'ler load edilmez.

### 3. Bu sohbet konusunu Claude'a aç
Yeni oturumda **ilk mesaj** olarak şunu yaz:

> "ARGUMAN.md'yi oku ve Faz 0'a devam et"

Claude bu dosyayı okuyacak, durumu anlayacak ve aşağıdaki "DEVAM ETME PROTOKOLÜ"nü uygulayacak.

### 4. /mcp dialog'u — Authenticate
- `/mcp` yaz
- Açılan listede artık `yargi-mcp-pro` ve `arguman` "Project MCPs" altında görünmeli
- Her birini seç → **Authenticate** → tarayıcı açılır → onay
  - **Arguman:** tarayıcıda Arguman.ai hesabıyla login (yoksa kayıt) → izin ver
  - **Yargı-MCP-Pro:** AuthKit ekranı açılacak → **mühendisin sana verdiği staging hesabı** ile login

### 5. Mühendise sorman gereken bilgiler (henüz yoksa)
Mühendise WhatsApp/mail:
- **Yargı-MCP-Pro staging hesabı:** kullanıcı adı + şifre (AuthKit için)
- **Tool listesi:** Tek-shot tool mu (yargi+mevzuat+mülga+hiyerarşi tek dönüş), yoksa ayrı tool'lar mı?
- **Mülga eleme:** Otomatik mi? Hangi flag ile dönüyor (`mulga: true/false`)?
- **Normlar hiyerarşisi:** 7-seviye etiketi otomatik mi? Hangi alanda?
- **Document fetch:** documentId tabanlı tam metin destekliyor mu?
- **Rate limit:** Sınırlama nasıl çözüldü?

---

## 🤖 CLAUDE — DEVAM ETME PROTOKOLÜ

Yeni oturumda avukat "ARGUMAN.md'yi oku ve Faz 0'a devam et" dediğinde sırayla:

### Adım 1: Durum doğrulama
```bash
claude mcp list 2>&1 | grep -E "yargi-mcp-pro|arguman"
```
Beklenen: ya "✓ Connected" (auth tamamlandıysa) ya da "! Needs authentication" (hala yapılmadıysa).

### Adım 2: Eğer hala "Needs authentication"
Avukata `/mcp` ile auth yapması gerektiğini hatırlat (yukarıdaki "Avukat — adım 4").

### Adım 3: Eğer "✓ Connected" (her ikisi)

**3a. Tool envanteri çıkar:**
- `/context` çıktısında `mcp__yargi-mcp-pro__*` ve `mcp__arguman__*` tool'larını ara
- Her tool için ToolSearch veya doğrudan çağrı ile schema bilgisi al
- Her MCP'ye 1 örnek küçük test sorgusu at:
  - Yargı-MCP-Pro: `"TBK m.49 manevi tazminat"` gibi basit bir test
  - Arguman: `"kira tespit davasi hakkaniyet"` gibi semantik test

**3b. Envanter dosyalarını doldur:**
- `docs/mcp-envanteri/yargi-mcp-pro.md` → tool listesi tablosu doldur (isim, parametre, dönüş, örnek payload, rate-limit gözlemi)
- `docs/mcp-envanteri/arguman-ai.md` → aynı şekilde

**3c. Senaryo kararı (FAZ 2 için kritik):**
Tool listesine bakarak karar:
- **Senaryo A** — Tek-shot tool (yargi+mevzuat+mülga+hiyerarşi tek dönüş) → `arastir-yargi.md` + `arastir-mevzuat.md` BİRLEŞİR, tek `arastir-yargi-pro.md` olur
- **Senaryo B** — Ayrı tool'lar (pro_yargi_search + pro_mevzuat_lookup) → İki komut da kalır, sıralı zincir mantığı prompt seviyesinde korunur, tool isimleri güncellenir

Senaryoyu avukata bildir ve onay al.

### Adım 4: Faz 2 başlat
Senaryo onaylandıktan sonra:
- `config/model-routing.json` → `yargi_mcp` + `mevzuat_mcp` → tek `yargimcp_pro` task'ı, `_history` 2026-05-19 girdisi
- `ajanlar/arastirmaci/SKILL.md` → Bölüm 1+2 birleştir, mülga eleme protokolünü "Pro MCP denetim checklist'i" haline dönüştür, rate-limit 3sn protokolünü kaldır
- Komut dosyaları senaryoya göre güncelle/birleştir/sil
- `CLAUDE.md` (proje kökü) → araç tablosu + hata tablosu + kısayollar
- `FIVEAGENTS.md` → ASAMA 2 diyagramı yeniden çiz

### Adım 5: Faz 3 başlat (Arguman.ai)
- `ajanlar/arastirmaci/SKILL.md` Bölüm 0 (2A)'ya "Faz D — Arguman.ai Semantik Genişletme" ekle
- YENİ komut: `.claude/commands/arastir-arguman.md`
- `.claude/commands/arastir-stajyer.md`'ye Arguman.ai opsiyonel adımı ekle
- `config/model-routing.json` → yeni `arguman_ai` task
- `CLAUDE.md` araç tablosu güncelle
- FIVEAGENTS.md diyagramı güncelle
- Yeni çıktı: `02-Arastirma/2A-arguman-bulgulari.md`

### Adım 6: Faz 4 (Denetim mekaniği)
- `ajanlar/arastirmaci/SKILL.md` "Denetim Protokolü" bölümü ekle
- `ajanlar/revizyon-ajani/SKILL.md` HARD FAIL kuralı güçlendir
- `prompts/gemini/self_review.md` Pro MCP doğrulama maddeleri ekle

### Adım 7: Faz 5 (toparlama) + Faz 6 (pilot)
Tam plan dosyasına bak: `~/.claude/plans/sistemimizi-geli-tirece-iz-ara-t-rma-a-a-rippling-clock.md`

---

## Görev Listesi (Güncel — 2026-05-19)

```
#1 FAZ 0 — MCP kurulumu + discovery        ✅ COMPLETED
#2 FAZ 1 — 2E Akademik decommissioning     ✅ COMPLETED (önceki oturum)
#3 FAZ 2 — Yargı-MCP-Pro entegrasyonu      ✅ COMPLETED (Senaryo B)
#4 FAZ 3 — Arguman.ai entegrasyonu         ✅ COMPLETED (+ 3 server skill)
#5 FAZ 4 — Denetim mekaniği                ✅ COMPLETED (karsi-arguman + HARD FAIL)
#6 FAZ 5 — Komut + yapısal güncellemeler   ✅ COMPLETED (toparlama)
#7 FAZ 6 — Pilot test (avukat dava seçer)  ⏸ PENDING — AVUKAT DAVA SEÇMELİ
```

**Pilot test için hazır:** Avukat bir dava verdiğinde tüm akış (ASAMA 0-7,
2A + Faz D + 2D + 2B→2C, BATCH 1-2-3, Antigravity tek sohbet) test edilebilir.
10 maddelik kontrol listesi: bu dokümanın "Pilot Test Plan" bölümünde.

---

## Önemli Referans Dosyaları

| Dosya | Amaç |
|---|---|
| `~/.claude/plans/sistemimizi-geli-tirece-iz-ara-t-rma-a-a-rippling-clock.md` | TAM PLAN (6 faz, dosya değişiklikleri, doğrulama, rollback) |
| `docs/mcp-envanteri/README.md` | Faz 0 discovery rehberi |
| `docs/mcp-envanteri/yargi-mcp-pro.md` | Yargı-MCP-Pro envanter şablonu (doldurulacak) |
| `docs/mcp-envanteri/arguman-ai.md` | Arguman.ai envanter şablonu (doldurulacak) |
| `.mcp.json` | Project-scope MCP tanımları (yargi-mcp-pro + arguman eklendi) |
| `CLAUDE.md` (proje kökü) | Sistem dokümantasyonu |
| `ajanlar/arastirmaci/SKILL.md` | Araştırmacı ajan protokolleri |

---

## Pilot Test Plan (Faz 6 — referans)

10 maddelik kontrol:
- [ ] Faz 0 — MCP'ler `connected`
- [ ] 2A Süper Stajyer çıktı üretti (`2A-yorunge-talimatlari.md`)
- [ ] Arguman.ai ≥ 5 künye döndürdü (`2A-arguman-bulgulari.md`)
- [ ] Her künye için Pro MCP fetch denemesi loglandı
- [ ] [DOĞRULANMIŞ] / [DOĞRULANMAMIŞ] flag'leri rapora yazıldı
- [ ] 7-seviye normlar hiyerarşisi etiketi her atıf madde için var
- [ ] Mülga karar atfı sıfır
- [ ] 2D NotebookLM async paralel çalıştı, bloklamadı
- [ ] Revizyon Ajanı audit: DOĞRULANMAMIŞ atif < 2 → Drive'a yazıldı
- [ ] Self-review HARD FAIL yok

**Rollback:**
- Git branch: `feat/asama2-pro-arguman` (henüz oluşturulmadı, avukat oluşturmalı)
- Başarısız ise: `.mcp.json` eski haline döndür, Faz 1 değişiklikleri `git checkout` ile geri al

---

## Notlar (önceki oturumdan)

- Avukat teknik olarak güçsüz olduğunu söyledi — komutları Claude çalıştırıyor, OAuth gibi interaktif adımları avukat yapacak
- Mühendisin Yargı-MCP-Pro için kullanıcı bilgisini avukatın hala alması gerek
- Eski Yargı/Mevzuat MCP'leri (`mcp__claude_ai_Yarg_MCP__*`, `mcp__claude_ai_Mevuzat_MCP__*`) hala `claude mcp list`'te bağlı duruyor — pilot başarısı sonrası emekli edilecek
- 0-Halüsinasyon doktrini (`ajanlar/0-halusinasyon-doktrini.md`) ve revizyon ajanının "≥2 DOĞRULANMAMIŞ → HARD FAIL" kuralı korunuyor — Pro MCP entegrasyonu bunu güçlendirecek
