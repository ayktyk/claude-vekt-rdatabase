# Hukuk Başasistanı

Avukat bürosu için uçtan uca hukuki üretim sistemi: derin araştırma, usul analizi,
stratejik analiz, dilekçe taslağı, savunma simülasyonu ve blog.

**Sistem tek motorla çalışır** — oturumu hangi LLM ile açtıysanız o. Anayasa
`AGENTS.md`'dir; `CLAUDE.md`, `GEMINI.md` ve `.cursor/rules/hukuk.mdc` yalnızca <!-- vendor-ok: adaptör dosya adları -->
oraya yönlendiren stub'lardır, kural içermezler.

Her çıktı **TASLAK**'tır. Son kontrol avukattadır.

## Nereden başlanır

| Ne arıyorsanız | Dosya |
|---|---|
| Sistemin tüm kuralları, 7 ASAMA akışı, doktrin, kalite kapıları | `AGENTS.md` |
| Yargı PRO ile karma mimari, çalışma modları (TAM/HIZLI), denetim politikası (K1 + KS + K2, belge + eşlik çifti) | `AGENTS.md` → "Karma Mimari", "Çalışma Modları", "DENETCI Kapısı ve Denetim Politikası" |
| Bir davanın akış durumu (hangi ASAMA, denetim ne dedi) | `00-AKIS.md` (dava klasöründe) · `python scripts/akis.py goster <dava-klasoru>` |
| Yargı PRO'nun 107 becerisi, büro iş hatları (duruşma, karar, müzakere, takip …) | `AGENTS.md` → "Beceri Haritası ve Büro İş Hatları" · `config/beceri-haritasi.json` · görsel harita `docs/karma-mimari-yargipro.html` |
| Bir davanın süreleri (Süre Kalkanı) ve günlük pano | `00-Sure-Kalkani.json` (dava klasöründe) · `python scripts/sure_kalkani.py liste` · `/pano` |
| UYAP takibi (Yargı PRO uygulaması), büyük eşitleme, icra özeti ve iş takip Excel'i | `python scripts/uyap_takip.py oku/rapor` · `python scripts/uyap_esitle.py plan/calistir/devam` · `python scripts/icra_ozet.py` · `python scripts/excel_takip.py guncelle` |
| Projenin son durumu (araştırma ve iş takibi, 9 Ekim 2026) | `docs/proje-son-durum.html` |
| Büronun kendi kuralları ve tercihleri | `legal.local.md` |
| Dilekçe biçim ve üslup standardı | `dilekce-yazim-kurallari.md` |
| İlk dava incelemesi metodolojisi | `ajanlar/director/olay-cozum-protokolu.md` |
| Dava türü bazlı kişisel kontrol listeleri | `playbook/` |
| "Model kaçırdı, avukat düzeltti" kayıtları | `dersler/` |
| Ajan protokolleri (araştırmacı, usul, dilekçe, blog, denetçi) | `ajanlar/*/SKILL.md` |
| 5-ajan stratejik analiz protokolü | `ajanlar/perspektif/PROTOKOL.md` |
| Hızlı danışma hattı (müvekkil adayı sorusu) | `ajanlar/arastirmaci/danisma-hatti.md` |
| Blog hattı (THEMIS) | `ajanlar/blog-yazari/THEMIS.md` |
| Motor rolleri ve aktif motor kaydı | `config/motor-haritasi.json` |
| Doktrin tam metni | `prompts/_doktrin-preamble.md` |
| Muhakeme prompt yüzeyleri | `prompts/muhakeme/` |
| Tasarım spec'leri ve uygulama planları | `docs/superpowers/` |
| UDF (UYAP) format referansı | `docs/udf-format.md` |
| Emekliye ayrılmış modüller ve eski notlar | `arsiv/` (bkz. `arsiv/README.md`) |

## Roller

Dört rol de aynı motorda çalışır; ayrım **görev ayrımıdır**, motor ayrımı değil.

| Rol | İş |
|---|---|
| `ORKESTRATOR` | Komut sınıflandırma, ASAMA geçişleri, kalite kapıları, Drive/Gmail/Takvim, DOCX/UDF üretimi |
| `ARASTIRMACI` | MCP çağrıları: Yargı (2B), Mevzuat (2C), NotebookLM (2D), MemPalace |
| `MUHAKEME` | Usul, 5-ajan analiz, dilekçe, savunma simülasyonu, revizyon, blog |
| `DENETCI` | Sıfır bağlamlı bağımsız çıktı denetimi — üretim bağlamını görmez |

## Denetim komutları

```bash
python scripts/doktrin_lint.py        # prompt yüzeyleri doktrin taşıyor mu
python scripts/referans_kontrol.py    # kırık dosya referansı var mı
python scripts/vendor_lint.py         # kanonik yüzeyde sağlayıcı adı sızıntısı
python scripts/paths.py check         # Drive yolları çözümleniyor mu
python -m pytest scripts/tests -q     # tüm testler
```

Bağımsız denetim iki sabit noktada, `ajanlar/denetci/SKILL.md` protokolüyle
yapılır: K1 araştırma raporu, K2 dışarı giden nihai belge. Künyeler kaynaktan
yeniden çekilir, alıntılar birebir kıyaslanır, sonuç `00-AKIS.md`'ye yazılır.
Ara çıktılar yapısal kapı ve künye havuzu kuralıyla ilerler.
**KIRMIZI kararda çıktı Drive'a yazılmaz.**

## Veri nerede

Kalıcı dava ve araştırma çıktısı repoda değil Google Drive'dadır
(`1Hukuk Bürosu/Aktif Davalar/...` — klasör 2026-10'da bu adla yeniden adlandırıldı). Yol çözümlemesi platforma göre
`config/paths.json` + `scripts/paths.py` üzerinden yapılır:

```bash
python scripts/paths.py data-root       # çözümlenen kök
python scripts/paths.py dava {dava-id}  # dava klasörü
```

Müvekkil evrakı ve geçici çalışma dosyaları git dışındadır
(`tmp/`, `.case_review_*/` — KVKK).
