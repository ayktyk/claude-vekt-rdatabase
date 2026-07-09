<!-- DOKTRIN-PREAMBLE v1 -->
> **0-HALÜSİNASYON + ANTI-SYCOPHANCY (zorunlu — tam metin: `prompts/_doktrin-preamble.md`):**
> - UYDURMA YARGITAY/HGK/İBK kararı atfı YASAK — her künye Bedesten documentId ile doğrulanır; doğrulanmayan "DOĞRULANMAMIŞ" damgalanır.
> - Karar metni ALINTISI UYDURULAMAZ — tırnak içi alıntı birebir kaynaktan.
> - BAĞLAM KORUNMALI — bir fıkranın cevabı başka fıkraya genellenemez.
> - Avukatı memnun etmek için LEHE YORUM YASAK; ALEYHE İÇTİHAT açıkça gösterilir, gizlenmez.
> - "KAYNAK YOK" demek dürüstlüktür — sayı doldurmak için uydurma atıf HARD FAIL.
> - Kritik kuralda ÇİFT KAYNAK şart.
> - Çıktının sonunda KAYNAK DOĞRULAMA tablosu (| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |) + "Aleyhe içtihat: VAR/YOK/ARANMADI" beyanı ZORUNLU.

# /2A cevap al — Manuel Pano Fallback (CDP yokken)

`$ARGUMENTS` formati: `[dava-id]` (orn: `2026-003`)

CDP otomasyonu basarisiz oldugunda veya avukat tercih ederse, manuel
pano yoluyla 2A cevabini Drive'a yazar. SUPERSTAJYEREGECISPLANI.md'deki
orijinal manuel akis bu.

## Ne Zaman Kullanilir

| Durum | Aksiyon |
|---|---|
| `arastir stajyer:` calistirildi, CDP fail oldu | Avukat secenek 2'yi sectiyse buraya yonlendirir |
| Avukat manuel akis tercih ediyor | Direkt `2A cevap al: {dava-id}` yazar |
| Chrome'da Claude for Chrome extension manuel sorgulandi | Avukat cevabi Ctrl+A + Ctrl+C ile aldi, buraya yapistirilacak |

## On-kosul

Avukat Suer Stajyer cevabini panoya kopyalamis olmali (Ctrl+A + Ctrl+C).
Pano bos ise islem fail edilmeli, avukata aciklama verilmeli.

## Workflow

### ADIM -1: MemPalace Wake-up (yalniz dava-id varsa)
- `mempalace_status`
- `mempalace_search "{dava-id}" --wing wing_buro_aykut --limit 2`

### Faz B: Pano -> Dosya

1. **Pano kontrolu:**
   ```powershell
   $clip = Get-Clipboard -Raw
   if (-not $clip -or $clip.Length -lt 100) {
       Write-Host "[FAIL] Pano bos veya cok kisa." -ForegroundColor Red
       exit 1
   }
   ```

   Bash uyarlamasi (PowerShell yoksa Get-Clipboard mevcut Windows
   Claude Code'da varsayilan):
   ```bash
   powershell -NoProfile -Command "Get-Clipboard -Raw" > tmp/clip-2a-raw.txt
   ```

2. **Drive yoluna yaz:**
   ```powershell
   $output = "G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\02-Arastirma\2A-superstajyer-cevap.md"
   New-Item -ItemType Directory -Force -Path (Split-Path $output) | Out-Null
   $clip | Out-File -Encoding utf8 -FilePath $output
   Write-Host "[OK] yazildi: $output ($($clip.Length) karakter)" -ForegroundColor Green
   ```

3. **Hata kontrolu:**
   - Pano bos -> avukata "Suer Stajyer sayfasinda Ctrl+A + Ctrl+C
     yapip tekrar dene"
   - Yaz hatasi (drive lock vb.) -> avukata path goster, manuel kayit oner

### Faz C: Ozet ve Yorunge (arastir-stajyer.md ile AYNI)

Faz B basariliysa, `arastir-stajyer.md` Faz D ile birebir ayni:

1. **Cikti dosyasini oku:**
   ```
   Read G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\02-Arastirma\2A-superstajyer-cevap.md
   ```

2. **Kalite Kapisi 0** (5+ karar, teyit linkleri, ARASTIRMA TAMAMLANDI).

3. **Yorunge talimati uret** (`prompts/stajyer/yorunge_talimat_sablonu.md`),
   `02-Arastirma/2A-yorunge-talimatlari.md`'ye yaz.

4. **Sohbete sadece ozet** (500-1000 token).

5. **MemPalace diary write** (arastirmaci agent_name).

## Kalite Kontrol

- [ ] Pano kontrol edildi mi?
- [ ] Drive klasoru mevcut mu (yoksa olusturuldu mu)?
- [ ] UTF-8 encoding korundu mu? (Out-File `-Encoding utf8` ZORUNLU)
- [ ] Turkce karakter sorunu var mi? (Ornek karaktere bak: "ş", "ğ", "ı")
- [ ] Tam metin sohbete dokulmedi mi (sadece ozet)?

## Hata Yonetimi

| Senaryo | Aksiyon |
|---|---|
| Pano bos | Avukata "Chrome'da Ctrl+A + Ctrl+C yap, tekrar dene" de |
| Pano <100 karakter | "Bu cok kisa, dogru sayfayi mi kopyaladin?" sor |
| Drive lock (G:\ yok) | Avukata fiziksel disk durumunu sor, geçici tmp/'ye yaz |
| UTF-8 hatasi | `Out-File -Encoding utf8BOM` dene veya PowerShell sürüm kontrol |
| Cevapta hic karar yok | Avukata "Bu Suer Stajyer cevabi mi yoksa baska sayfa mi?" sor |

## Output

Identical to arastir-stajyer.md Faz D ciktisi:
- `G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\02-Arastirma\2A-superstajyer-cevap.md`
- `G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\02-Arastirma\2A-yorunge-talimatlari.md`
- Sohbete ozet
