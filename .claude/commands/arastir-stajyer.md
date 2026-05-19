# /arastir stajyer — 2A Yorunge Belirleyici (CDP Otomasyonu)

`$ARGUMENTS` formati: `[dava-id]` (orn: `2026-003`)

Suer Stajyer sitesini Chrome DevTools Protocol (CDP) uzerinden otomatik
sorgular. Cevap geldiginde 2A ciktisini Drive'a yazar, ozet uretip 2B'ye
gecisi onaylatir.

## Zorunlu Referans Dokumanlar

- `ajanlar/arastirmaci/SKILL.md` -> Bolum 0 (Stajyer Yorunge Protokolu)
- `prompts/stajyer/sorgu_protokolu.md` -> Suer Stajyer'e gidecek prompt sablonu
- `prompts/stajyer/yorunge_talimat_sablonu.md` -> 2A ciktisindan 2B-2E talimatlari
- `config/superstajyer.json` -> CDP konfigurasyonu (URL + selector'lar)
- `SUPERSTAJYEREGECISPLANI.md` -> Mimari karar
- Plan dosyasi: `C:\Users\user\.claude\plans\deep-discovering-pizza.md`

## Workflow

### ADIM -1: MemPalace Wake-up
- `mempalace_status`
- `mempalace_search "{dava-id} stajyer" --wing wing_buro_aykut --limit 2`
- `mempalace_search "kritik nokta" --wing wing_ajan_arastirmaci --limit 2`

### Faz A: Prompt Uretimi

1. **Briefing oku:**
   ```
   Read G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\00-Briefing.md
   ```
   Bulunmazsa: avukata "Briefing eksik, oncce `briefing: {dava-id}` calistir" de.

2. **KVKK mask kontrolu:**
   - `config/masks/{dava-id}.json` var mi? Yoksa avukata
     `python scripts/maske.py add` calistirmasi gerektigini bildir, DURDUR.

3. **Sablonu doldur:**
   ```
   Read prompts/stajyer/sorgu_protokolu.md
   ```
   `{{DAVA_ID}}`, `{{MUVEKKIL_TOKEN}}`, `{{KRITIK_NOKTA}}`, `{{OZET}}`,
   `{{BRIEFING}}` placeholder'lari briefing dosyasindaki maskeli verilerle
   degistir.

4. **Backup yaz:**
   ```
   Write tmp/2A-stajyer-prompt.md (doldurulmus prompt)
   ```

### Faz B: CDP Health Check

```bash
curl -s --max-time 3 http://localhost:9222/json/version
```

**OK durumu** (JSON donduyse): Faz C'ye gec.

**FAIL durumu** (bos cevap / timeout): Avukata sunu bildir:

```
[2A CDP HATASI]
Chrome CDP modunda acik degil (port 9222 yanit vermiyor).

Iki secenek:
  1. scripts\launch-chrome-cdp.ps1 ile Chrome'u baslat,
     Suer Stajyer'e login ol, sonra "devam" yaz.
  2. Manuel fallback: tmp/2A-stajyer-prompt.md icerigi panoda
     (otomatik Set-Clipboard ile). Chrome'u normal ac, Suer Stajyer'de
     yapistir, cevap geldikten sonra `2A cevap al: {dava-id}` komutu ver.

Tercih?
```

Avukatin secimini bekle. Secim 1: Chrome acilmasini bekle, tekrar curl
ile dogrula. Secim 2: prompt icerigini `Set-Clipboard` ile panoya yaz, dur.

### Faz C: CDP Otomasyon (superstajyer.py run)

```bash
python scripts/superstajyer.py run \
  --prompt-file tmp/2A-stajyer-prompt.md \
  --output "G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\02-Arastirma\2A-superstajyer-cevap.md" \
  --config config/superstajyer.json
```

Cikis kodlari (script icinde dokumante):
- 0 -> basari, Drive'a yazildi
- 10 -> CDP yok (avukata bildir + fallback teklif)
- 20 -> Suer Stajyer sekmesi bulunamadi (login eksik veya selector hatali)
- 30 -> Cevap timeout (kismi cevap kaydedildi, avukata "yine de devam mi?" sor)
- 40 -> Config eksik/hatali (avukata `config/superstajyer.json` selector
   dolduma rehberi goster)
- 50 -> Playwright hatasi (logu goster)

Script "[OK] yazildi: ..." mesaji verirse Faz D'ye gec.

### Faz D: Ozet Uretici (Claude terminal)

1. **Cikti dosyasini oku:**
   ```
   Read G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\02-Arastirma\2A-superstajyer-cevap.md
   ```
   Tam metin context'e girer ama sohbete dokulmez.

2. **Kalite Kapisi 0 kontrolu** (`Bolum 0 -> Kalite Kapisi 0`):
   - [ ] >=5 Yargitay karari var mi?
   - [ ] Her karar icin **TEYIT ET** linki var mi? (yoksa o karara
     "DOGRULANMAMIS" damgasi)
   - [ ] Mevzuat maddeleri >=3 farkli kaynaktan mi?
   - [ ] Sapma uyarisi bolumu doldurulmus mu?
   - [ ] Son satirda "ARASTIRMA TAMAMLANDI" var mi?

   Yetersiz cevap durumunda avukata: "Yetersiz cevap. Tekrar sorgu yapayim
   mi (revize prompt) yoksa elimizdekiyle devam mi edelim?"

3. **Yorunge talimati uret:**
   ```
   Read prompts/stajyer/yorunge_talimat_sablonu.md
   ```
   2A cevabindaki kararlari, atif maddelerini, yan meseleleri, sapma
   uyarilarini sablona doldur. **Faz D (Arguman.ai)** + 2B + 2C + 2D
   her biri icin ayri talimat bloku olustur (2E Akademik kaldirildi
   2026-05-19).

   **Drive'a yaz:**
   ```
   Write G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\02-Arastirma\2A-yorunge-talimatlari.md
   ```

4. **Sohbete dokulen OZET** (yalniz, tam metin degil):
   ```
   ## 2A Suer Stajyer — Yorunge Belirlendi

   **Esas mesele:** {1 cumle}

   **Bulunan kararlar (N adet, M dogrulanmis):**
   - {Daire} {Tarih} E./K. — emsal degeri: {yuksek/orta/dusuk}
   - ...

   **Atif yapilan maddeler:** {kanun adi} m.{no}, ...

   **Karsi taraf savunmasi (M madde):** {1 cumle ozet}

   **Sapma uyarilari:** {varsa kisa}

   **Kalite Kapisi 0:** PASS / SARTLI (eksik X) / FAIL

   **Yorunge talimatlari yazildi:** 02-Arastirma/2A-yorunge-talimatlari.md

   **Sira:** Faz D (Arguman.ai semantik genisletme — FAZ 3 2026-05-19) → 2B Yargi MCP → 2C Mevzuat MCP → 2D NotebookLM
   - Faz D 2A sonrasi, 2B oncesi calisir (komut: `arastir arguman: {kritik nokta}`)
   - 2D paralel olarak baslayabilir (2A yorunge talimatini kullanir)

   **Devam edeyim mi?** (Bu komutla Faz D → teyit + derinlestirme akisi baslar.)
   ```

### Faz E: Diary Write

```
mempalace_diary_write agent_name=arastirmaci
content="2A Suer Stajyer ile yorunge belirlendi. Dava: {dava-id}.
 Kararlar: N adet, M dogrulanmis. Kalite Kapisi 0: {PASS/SARTLI/FAIL}.
 Onemli sapma uyarisi: {varsa kisa}"
```

Yorunge eklesmesi gerekli durumlar (hall_arastirma_bulgulari'na yazma):
- 2A 5+ karar dogrulanmis ile geldi VE avukat "kullaniyorum" dedi -> drawer ac
- 2A SARTLI veya FAIL -> drawer YOK, sadece ajan diary

## Kalite Kontrol

- [ ] CDP health check yapildi mi?
- [ ] FAIL durumunda fallback teklifi sunuldu mu?
- [ ] KVKK token'lar prompt'ta korundu mu (`[MUVEKKIL_1]` formatinda)?
- [ ] 2A cevap dosyasi Drive'a UTF-8 ile yazildi mi?
- [ ] Sohbete TAM METIN dokulmedi mi (sadece ozet)?
- [ ] Yorunge talimat dosyasi olusturuldu mu?
- [ ] Kalite Kapisi 0 checklist tamamlandi mi?
- [ ] MemPalace diary yazildi mi?

## Hata Yonetimi

| Senaryo | Aksiyon |
|---|---|
| CDP port yanit vermiyor | `launch-chrome-cdp.ps1` talimati + manuel fallback teklifi |
| Suer Stajyer login eksik | Avukata "site sekmesine git, login ol, devam" de |
| config selector PLACEHOLDER | DURDUR. Avukata `config/superstajyer.json` "_kurulum_kilavuzu" bolumunu goster |
| Timeout (10 dk) | Kismi cevap kaydedildi (`exit 30`). Avukata "yine de devam edelim mi yoksa tekrar sorgu mu?" sor |
| 2A cevabinda <5 karar | "Yetersiz cevap. Tekrar sorgu (revize prompt) mu, devam mi?" |
| MemPalace baglantisi yok | Diary write atla, uyari ver |

## Output

- `tmp/2A-stajyer-prompt.md` — gonderilen prompt (backup)
- `G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\02-Arastirma\2A-superstajyer-cevap.md` — ham cevap
- `G:\Drive'im\Hukuk Burosu\Aktif Davalar\{dava-id}\02-Arastirma\2A-yorunge-talimatlari.md` — 2B-2E icin yorunge
- Sohbete sadece OZET dokulur (500-1000 token)
