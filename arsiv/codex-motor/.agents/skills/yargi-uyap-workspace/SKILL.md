---
name: yargi-uyap-workspace
description: UYAP Avukat'tan dava dosyası çekme (dava-cli clone/sync) veya çalışma klasörü hazırlama gerektiğinde kullan — "Yargı PRO'yu başlat", "davayı çek", "çalışma alanını hazırla" (beta, kaynak: prepare_workspace_guide)
---

# Çalışma Alanı Hazırlama — dava-cli (UYAP Entegrasyonu)

Kaynak: `prepare_workspace_guide` MCP tool'u (beta). Sunucu daha yeni sürüm ilan
ederse tool'u çağırıp bu dosyayı güncelle.

**dava-cli**: avukatın terminalinde çalışan yerel CLI — hukuki iş için çalışma
klasörü hazırlar ve **UYAP Avukat portalından dava dosyalarını avukatın kendi
bilgisayarına indirir**.

İki bağımsız başlangıç yolu (ikisi birden GEREKMEZ):

- **`clone`** — UYAP Avukat davası çek. TEK komut her şeyi yapar: klasörü
  oluşturur, agent katmanını yazar, belgeleri indirir. Öncesinde `init` gerekmez.
- **`init`** — UYAP'a bağlı OLMAYAN özel çalışma klasörü (taslak, araştırma,
  elle eklenen belgeler). Tarayıcı açmaz.

`sync` daha sonra clone'lanmış davaya yeni eklenen evrakı (delta) indirir.

## Tek seferlik giriş

CLI, bu MCP sunucusunu yetkilendiren AYNI yargi-mcp-pro hesabıyla (WorkOS
device flow) kimlik doğrular. Kullanıcı bir kez çalıştırır:

```bash
npx dava-cli@latest login
```

Kısa kod + URL basar, tarayıcı açılır, onaydan sonra refresh token yerel
saklanır (`~/.config/yargi/token.json`, mode 0600). Sonrası sessiz yenileme.

```bash
npx dava-cli@latest whoami    # giriş yapan e-posta + user id
npx dava-cli@latest logout    # kimlik bilgilerini siler
```

## Gereksinimler

- **Google Chrome kurulu** (CLI, Playwright ile kullanıcının sistem Chrome'unu
  sürer; ayrı tarayıcı indirmez, **tarayıcı eklentisi YOK**). `clone`/`sync`
  için gerekli; `init` tarayıcı açmaz.
- AuthKit girişi (yukarıda). `clone`, `sync`, `init` üçü de ister.

## Komutlar

### `clone` — UYAP Avukat davası çek (tek komut)

```bash
npx dava-cli@latest clone [--dir <path>] [--target antigravity,Codex] [--host avukat|avukatbeta] [--timeout <s>]
```

Varsayılan konum (UYAP kategorizasyonuna göre yönetilen ağaç):

```
~/Documents/YargiPRO/<yargı türü>/<mahkeme türü>/<mahkeme> <esas no>/
```

örn. `~/Documents/YargiPRO/Ceza/Asliye Ceza Mahkemesi/Ankara 5. Asliye Ceza Mahkemesi 2026-123/`.
İndirme bitince CLI mutlak yolu basar. `--dir <path>` ile konum değiştirilir.

CLI kullanıcının Chrome'unu açar (kalıcı özel profil — UYAP oturumu korunur).
Kullanıcı UYAP'a bir kez giriş yapar. CLI kendi **dava seçicisini** o Chrome
penceresinde gösterir: yargı/dosya türü listesi → tür seçilir → dava listesi
yüklenir → dava seçilir + onay. İlerleme paneli her belgeyi gösterir.
`--target` hangi aracın agent katmanının yazılacağını seçer (varsayılan
antigravity; virgül listesi olabilir — **Codex için `--target Codex`**).
Klasör zaten dava projesiyse (`uyap-project.json` var) reddeder — onun için
`sync`. Varsayılanlar: `--host avukat`, `--timeout 600`.

### `sync` — clone'lanmış davaya yeni evrak indir (delta)

```bash
npx dava-cli@latest sync [--dir <path>] [--host avukat|avukatbeta] [--timeout <s>]
```

Kayıtlı UYAP oturumu geçerliyse **tarayıcı AÇMAZ** — API'leri doğrudan çağırır,
yalnız YENİ evrakı indirir, `INDEX.md`'yi günceller. Oturum süresi dolmuşsa
kısa süreliğine Chrome açar (yeniden giriş), oturumu yakalar, kapatır, devam
eder. Dava klasöründen çalıştır veya `--dir` ver. `uyap-project.json` yoksa hata.

### `init` — UYAP'sız özel çalışma klasörü

```bash
npx dava-cli@latest init [--dir <path>] [--target antigravity,Codex]
```

Agent katmanı + boş `evraklar/` iskeleti (varsayılan: mevcut dizin), UYAP'a
DOKUNMAZ. Yine AuthKit girişi ister.

## Çalışma alanı yapısı

Tüm yazımlar yoksa-oluştur — kullanıcı düzenlemeleri asla ezilmez.

Agent katmanı (`init` + `clone`):
- `AGENTS.md` / `AGENTS.md` — sürekli proje talimatları + `.agents/`/`.Codex/`
  altında talep-üzerine agent katmanı (hukuki araştırma skill'leri, süre/
  zamanaşımı kuralları, dilekçe iş akışları).
- Projenin ajanının bu sunucunun araçlarına erişmesi için MCP config.

`clone`/`sync` ek olarak:
- `evraklar/<Gelen|Giden|Dosya|Diger>/<kategori>/` — ham dava belgeleri
  (`.udf`, `.pdf`, `.tiff`), 8 kategoriye tasnifli. **Dönüştürme/OCR YOK** —
  format okuma için `udf_tiff_pdf_guide` tool'u (udf-cli, TIFF bölme, PDF
  metin çıkarma).
- `uyap-project.json` — proje manifesti (dava id, mahkeme, esas no, evrak listesi).
- `INDEX.md` — kronolojik evrak indeksi.

## ⚠️ Windows — `clone`/`sync` ÖNCESİ OKU (Session 0)

`clone` (ve oturum düşmüşse `sync`) kullanıcının GÖRMESİ gereken gerçek bir
Chrome penceresi açar. **Windows'ta arka-plan/ajan bağlamından doğrudan
çalıştırma NEREDEYSE KESİN çalışmaz** — çoğu kodlama ajanı masaüstü olmayan
"Session 0"da koşar; Chrome görünmez başlar, kullanıcı giriş yapamaz, komut
sonsuza dek bekler. Windows'ta clone'un "çalışmamasının" 1 numaralı sebebi bu.

**Karar kuralı:** Kullanıcının kendi açtığı, görebildiği etkileşimli terminal
olduğundan %100 emin değilsen — **Zamanlanmış Görev (Scheduled Task) yolunu
kullan.** Şüphede: Scheduled Task.

**Takılma kurtarması:** clone doğrudan çalıştırıldı ve Chrome penceresi yoksa
Session 0'dasın — beklemek çözmez; öldür, aşağıdaki yola geç.

1. Dava klasörüne `run_clone.bat` yaz (yolu düzelt; redirect'i koru — görev
   ayrık koşar, ilerleme `clone.log`'dan okunur):

   ```bat
   @echo off
   cd /d C:\path\to\case-folder
   npx.cmd dava-cli@latest clone > clone.log 2>&1
   ```

   **`npx.cmd`** kullan, çıplak `npx` değil (ayrık görevde shell shim çözülmez;
   `'npx' is not recognized` hatasının sebebi budur). `sync` için aynı desen.

2. Görevi oluştur ve hemen çalıştır. `/ru` için **o an oturum açmış** Windows
   kullanıcısını kullan (`whoami`) — parola istenmez:

   ```bat
   schtasks /create /tn "DavaCliClone" /tr "C:\path\to\case-folder\run_clone.bat" /sc once /st 23:59 /ru <username> /it /f
   schtasks /run /tn "DavaCliClone"
   ```

   `/it` görevi kullanıcının masaüstü oturumunda etkileşimli çalıştırır →
   Chrome ekranda görünür. Kullanıcı UYAP'a girer, davayı seçer. `clone.log`'u
   izle. (Parola sorarsa yanlış hesap adı; "Access is denied" → yönetici
   istemi; `/it` aktif oturum ister — kullanıcı Windows'ta oturum açık olmalı.)

3. Bitince geçici görevi sil:

   ```bat
   schtasks /delete /tn "DavaCliClone" /f
   ```

## macOS: ilk başlatmada Gizlilik ve Güvenlik onayı

Mac'te `clone`/`sync` Chrome'u ilk sürüşünde macOS çoğu zaman **Privacy &
Security** izni sorar — tipik olarak **Automation** ("… 'Google Chrome'u
kontrol etmek istiyor", bazen "System Events"), bazı kurulumlarda Accessibility
veya Screen Recording. Onaylanana kadar Chrome öne gelmeyebilir, seçici
görünmez, komut takılmış gibi durur. Makine başına tek seferlik onaydır.

**Ajan bu diyaloğa TIKLAYAMAZ, atlatamaz** — TCC istemleri korumalıdır; onay
KULLANICIDAN gelmek zorundadır:

1. Mac'te clone/sync Chrome penceresi olmadan takılırsa bu istemin beklediğini
   varsay (başka pencerelerin arkasında olabilir). **Kullanıcıya "macOS izin
   diyaloğu ara, 'İzin Ver' / 'Allow' tıkla" de.**
2. Kapatıldıysa/görünmüyorsa elle: **Sistem Ayarları → Gizlilik ve Güvenlik →
   Otomasyon** → seni çalıştıran uygulamayı bul (Terminal, iTerm, VS Code…) →
   **Google Chrome**'u (listeliyse **System Events**'i de) etkinleştir.
   Accessibility/Screen Recording altında engellendiyse aynı uygulamayı orada aç.
3. Onaydan sonra **aynı komutu yeniden çalıştır** — onay kalıcıdır.

Bu bir izin meselesidir, Gatekeeper/code-signing değildir — `xattr`/quarantine
kaldırma UYGULANMAZ.

## Ajanlar için notlar

- Komut satırına asla access token yazma/gömme — CLI kendi token'larını yerel
  depodan yönetir.
- "Önce giriş yapmalısınız" / "Not logged in" → kullanıcıya bir kez
  `npx dava-cli@latest login` çalıştırt, sonra tekrar dene.
- "Google Chrome yüklü değil" → kullanıcı Chrome kurmalı.
- `clone` etkileşimlidir (kullanıcı kendi Chrome'unda davayı seçer) ve
  varsayılan `~/Documents/YargiPRO/…` altına yazar — bastığı mutlak yolu oku.
  `sync` oturum canlıyken tarayıcısızdır. İkisi için de tarayıcı eklentisi
  GEREKMEZ.
- `clone` tüm projeyi kendisi kurar — önce `init` ÇALIŞTIRMA. `init` yalnız
  UYAP-dışı özel klasör içindir. Codex desteği için `--target Codex`.
