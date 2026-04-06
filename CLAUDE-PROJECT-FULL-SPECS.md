# CLAUDE-PROJECT-FULL-SPECS.md
## 5 Ajanli Stratejik Hukuk Otomasyon Sistemi (v2)

Bu dosya, https://github.com/ayktyk/claude-vekt-rdatabase.git reposunu temel alarak
**tamamen yeni 5 ajanli stratejik analiz katmanini** implement etmek icin tam spesifikasyondur.

---

## 1. Proje Amaci

Mevcut pipeline'i korurken (muvekkil belgeleri + gorusme notlari -> vektor DB analizi ->
kritik noktalar -> Yargitay CLI + Mevzuat CLI + NotebookLM CLI -> dilekce/savunma uretimi),
**arastirma tamamlandiktan sonra otomatik 5 perspektifli stratejik analiz** katmani eklemek.

Bu sayede sistem sadece "dilekce yazan" olmaktan cikip, **profesyonel bir hukuk strateji
danismani** seviyesine cikacak.

---

## 2. Mevcut Sistem (Korunacak)

- **Vektor Database** tabanli belge ve gorusme notu analizi
- **Arastirma Ajanlari**: yargi-cli, mevzuat-cli, notebooklm-cli, vector-search
- **Dilekce Uretim Ajanlari**: dilekce-yazari, savunma-simulatoru, revizyon-ajani
- **Director / Usul Uzmani** gibi ust duzey ajanlar
- Google Drive entegrasyonu, UDF-CLI, dava workspace'leri
- TypeScript ana dil

---

## 3. Yeni Mimari - 5 Ajanli Stratejik Katman

### Akis (Pipeline)

```
1. Mevcut Arastirma Katmani (DEGISMEDEN kalacak)
   - Belgeler + Gorusme Notlari -> Vektor DB
   - Kritik noktalar belirleme
   - yargi-cli -> Yargitay kararlari
   - mevzuat-cli -> ilgili mevzuat
   - notebooklm-cli -> sorularla derin analiz
   - Arastirma Paketi olusturulur (JSON + MD)

2. YENi 5 Ajan Katmani (paralel calisacak)
   - Arastirma Paketi tek seferde 4 perspektif ajana verilir
   - 4 rapor -> Sentez Ajani'na gider
   - Sentez Ajani nihai strateji + revize dilekce onerisi uretir
```

### 5 Ajan

| # | Ajan | Dosya | Perspektif |
|---|------|-------|------------|
| 1 | Davaci Avukat | `agents/prompts/davaci-avukat.prompt.ts` | Muvekkil lehine en guclu argumanlar |
| 2 | Davali Avukat | `agents/prompts/davali-avukat.prompt.ts` | Karsi taraf gozuyle zayif noktalar |
| 3 | Bilirkisi | `agents/prompts/bilirkisi.prompt.ts` | Tarafsiz teknik degerlendirme |
| 4 | Hakim | `agents/prompts/hakim.prompt.ts` | Mahkeme perspektifi, bozma riski |
| 5 | Sentez & Strateji | `agents/prompts/sentez-strateji.prompt.ts` | 4 raporu birlestiren lider ajan |

---

## 4. Dosya Yapisi

```
agents/
  prompts/
    davaci-avukat.prompt.ts      # Davaci perspektif prompt'u
    davali-avukat.prompt.ts      # Davali perspektif prompt'u
    bilirkisi.prompt.ts          # Bilirkisi perspektif prompt'u
    hakim.prompt.ts              # Hakim perspektif prompt'u
    sentez-strateji.prompt.ts    # Sentez ajan prompt'u
core/
  five-agent-orchestrator.ts     # Ana orkestrasyon motoru
types/
  dosya-paketi.types.ts          # Tip tanimlari
```

---

## 5. Cikti Formati Standardi

Tum ajanlar ayni yapilandirilmis formatta donecek (JSON + okunaklı MD).

Her perspektif ajan kendi basliklarini kullanir (prompt'larda tanimli).
Sentez ajani 4 raporu birlestirip su basliklarla uretir:

1. DOSYA OZETI
2. EN GUCLU 3 ARGUMAN
3. EN BUYUK 3 RISK ve Cozum Onerileri
4. ONERILEN GENEL STRATEJI
5. DILEKCE ICIN REVIZYON ONERILERI
6. DURUSMA STRATEJISI ve Muhtemel Sorular
7. SON TAVSIYE (kirmizi alarm / yesil isik / sartli ilerleme)

---

## 6. Claude Code Hooks Entegrasyonu

Orchestrator icinde su hook'lar aktif:

| Hook | Ne Yapar |
|------|----------|
| PreToolUse | Arastirma paketi validasyonu (JSON yapisi, gerekli alanlar) |
| PostToolUse | Her ajanin ciktisini format kontrolu (bos mu, cok kisa mi) |
| TaskCompleted | Her perspektif ajan bittiginde otomatik log + sure olcumu |
| BeforeSentez | 4 raporun formatini zorunlu kil, eksik varsa uyar |
| OnError | Bir ajan cokerse graceful fallback (eksik raporla sentez yap) |

---

## 7. Entegrasyon Kurali

- 5 ajanli sistem **varsayilan olarak KAPALI**.
- `stratejik analiz` komutuyla tetiklenir.
- Mevcut arastirma pipeline'inin SONUNA opsiyonel katman olarak eklenir.
- Mevcut ajanlar klasorune (arastirmaci, usul-uzmani, dilekce-yazari vb.) DOKUNULMAZ.
- main branch'e DOKUNULMAZ. Tum gelistirme v2-five-agent-system branch'inde yapilir.

---

## 8. Teknik Gereksinimler

- Dil: TypeScript
- Paralel calistirma: 4 perspektif ajani ayni anda (Promise.allSettled)
- Hata toleransi: 4 ajandan en az 2'si basariliysa sentez yapilir
- Ciktilar: JSON + MD (avukatin okuyabilecegi format)
- Disclaimer: Her raporda "Bu AI ciktisidir, nihai karar avukata aittir."

---

## 9. Tetikleyici Komut

```
stratejik analiz: [dava-id]
```

Bu komut:
1. Dava workspace'inden arastirma paketini toplar
2. 4 perspektif ajani paralel calistirir
3. Sentez ajanini tetikler
4. Nihai raporu Drive'a ve yerel workspace'e kaydeder
