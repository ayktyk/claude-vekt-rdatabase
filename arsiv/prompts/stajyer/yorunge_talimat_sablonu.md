<!-- DOKTRIN-PREAMBLE v1 -->
> **0-HALÜSİNASYON + ANTI-SYCOPHANCY (zorunlu — tam metin: `prompts/_doktrin-preamble.md`):**
> - UYDURMA YARGITAY/HGK/İBK kararı atfı YASAK — her künye Bedesten documentId ile doğrulanır; doğrulanmayan "DOĞRULANMAMIŞ" damgalanır.
> - Karar metni ALINTISI UYDURULAMAZ — tırnak içi alıntı birebir kaynaktan.
> - BAĞLAM KORUNMALI — bir fıkranın cevabı başka fıkraya genellenemez.
> - Avukatı memnun etmek için LEHE YORUM YASAK; ALEYHE İÇTİHAT açıkça gösterilir, gizlenmez.
> - "KAYNAK YOK" demek dürüstlüktür — sayı doldurmak için uydurma atıf HARD FAIL.
> - Kritik kuralda ÇİFT KAYNAK şart.
> - Çıktının sonunda KAYNAK DOĞRULAMA tablosu (| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |) + "Aleyhe içtihat: VAR/YOK/ARANMADI" beyanı ZORUNLU.

# 2A Yorunge Talimat Sablonu (Faz D + 2B/2C/2D icin)

> 2A Suer Stajyer cevabi geldiginde Director Agent (Faz D Ozet Uretici)
> bu sablonu doldurarak alt-modulleri icin "yorunge talimati" cikarir.
> Alt-moduller artik bagimsiz arama yapmiyor — bu talimatla yola cikiyor.
>
> **FAZ 3 2026-05-19:** Faz D — Arguman.ai Semantik Genisletme eklendi
> (2E Akademik kaldirildi).

---

## Doldurma Kaynagi

- 2A cikti dosyasi: `02-Arastirma/2A-superstajyer-cevap.md`
- Beklenen bolumler: "### 3. Yargitay/HGK/IBK Kararlari", "### 4. Karsi
  Tarafin Beklenen Savunmasi", "### 7. SAPMA UYARILARI", "Yan meseleler"

---

## 2B Yargi MCP Yorunge Talimati

```
ZORUNLU GIRDI: 2A bulgulari (asagida).

2A'nin getirdigi kararlar (her biri Bedesten documentId ile TEYIT edilecek):
{{HER_KARAR_ICIN}}
  - {Daire} {Tarih} E.{Esas} K.{Karar}
    - 2A teyit linki: {URL}
    - Beklenen documentId: <varsa>
    - Teyit modunda gore: tam metni `get_bedesten_document_markdown` ile cek

Ek arama yorungesi (2A'nin EKSIK biraktigi):
  - Yan mesele 1: {...}
  - Yan mesele 2: {...}
  - Sapma uyarisi: {...} — son 2 yil aleyhe icthat var mi tara
  - HGK/IBK 2A'da bulunmadiysa: ozel arama yap (`-b HGK`, `-b IBK`)

HEDEF: 2A kararlarini DOGRULA + 2A bos biraktigi yan meseleler icin yeni
arama. Min 15 sorgu kurali korunur (teyit cagrilari sayilir).

NOT: 2A kararinda "DOGRULANMAMIS" damgasi varsa OZEL ITINA: Bedesten'de
yoksa rapora "2A'da geciyor ama Bedesten'de yok — uydurma ihtimali"
flag'i dus.
```

## 2C Mevzuat MCP Yorunge Talimati

```
ZORUNLU GIRDI: 2B'nin atif maddeleri (atif-maddeleri.json) + 2A esas
mesele basligi.

Cekilecek maddeler:
{{HER_MADDE_ICIN}}
  - {Kanun adi} m.{no}/{fikra}
    - 2A kaynak: 2A esas mesele bolumu, alt-baslik {X}
    - Mulga denetimi ZORUNLU: olay tarihi {OLAY_TARIHI} versiyonu
    - Yururluk tarihi + degisiklik tarihcesi cek

Normlar hiyerarsisi etiketleri zorunlu (Anayasa/Antlasma/Kanun/CBK/Tuzuk/
Yonetmelik/Teblig). 2A'nin atif yaptigi alt-norm ust normu daraltiyor mu
kontrol et.

NOT: 2A'da gecen ama bedesten'de teyit edilmis bir karar mulga maddeye
dayaniyorsa o karar ELENIR (rapora not dus).
```

## 2D NotebookLM Yorunge Talimati

```
ZORUNLU GIRDI: 2A esas hukuki mesele + yan meseleler.

NotebookLM'e su sorulari yonelt (her biri SADECE KAYNAKLARA GORE CEVAP,
UYDURMA YOK ibareli):

1. "Bu kaynaklarda {2A_ESAS_MESELE} hakkinda doktrin gorusu var mi?
    Hangi yazarlar, hangi sayfalar?"
2. "{2A_YAN_MESELE_1} bu kaynaklarda nasil isleniyor?"
3. "{2A_YAN_MESELE_2} bu kaynaklarda nasil isleniyor?"
4. "Karsi tarafin beklenen savunmasina ({2A_KARSI_SAVUNMA}) karsi
    bu kaynaklarda hangi argumanlar var?"
5. "{2A_SAPMA_UYARISI} bu kaynaklarda dogruluyor mu yoksa eski mi?"
6-10. Avukatin ozel sorulari (briefing'den)

Hedef: 2A'nin tespit ettigi yorungeyi IC kutuphaneyle eslestir, doktrin
zenginlestirmesi yap. Min 10 iteratif sorgu.
```

## Faz D Arguman.ai Yorunge Talimati (YENI — FAZ 3 2026-05-19)

```
ZORUNLU GIRDI: 2A esas mesele + yan meseleler.

Komut: arastir arguman: {2A_ESAS_MESELE}

Koleksiyon secimi (dava turune gore):
  - is hukuku / kira / aile / tazminat → "hukuk"
  - suc davasi → "ceza"
  - vergi / belediye / kamu → "idare"
  - KHK / temel hak ihlali → "anayasa"
  - karsilastirmali / AIHS m.6 → "aihm"
  - gorev uyusmazligi → "uyusmazlik"

Doktrinal terim cevrimi (halk dili → hukuki):
  - {2A_HALK_DILI_OLAY} → {2A_DOKTRINEL_TERIM}
  Ornek: "kavga edip vurdum" → "haksiz tahrik"

Iteratif arama (3-5 search = 3-5 kredi, get_full_text/case_lookup/find_similar UCRETSIZ):
  1. expand=True ile genis arama (kavramsal sorgular)
  2. Drift denetimi — daire/snippet uyumlu mu?
  3. Daraltma: daire/yil_min filtresiyle expand=False
  4. Min 3 karar tam metni (get_full_text)
  5. Karsit emsal taramasi (karsi-arguman skill otomatik tetiklenir)

Server-side skill'ler (Claude tarafindan secilmez, otomatik tetiklenir):
  - caselaw-search: koleksiyon + doktrin cevrim + drift detection
  - citation-network: atif agi izleme + HGK/CGK bagliyicilik etiketi
  - karsi-arguman: 5 seviyeli tehdit (KRITIK/YUKSEK/ORTA/DUSUK/YOK)
    → ASAMA 6 Savunma Simulatoru on-sorgu icin altin deger

Dogrulama koprusu (zorunlu):
  Her Arguman bulgusu icin → Yargi-MCP-Pro:
    search_bedesten_unified(esas_no=..., karar_no=..., birimAdi=...)
    → documentId al
    → get_bedesten_document_markdown ile tam metin esleme
  Etiketle:
    - DOGRULANMIS → rapora alinir
    - DOGRULANMAMIS → flag ile alinir (kaynak: sadece Arguman)
    - HARD FAIL → tam metin konuyla ilgisiz, ELENIR

HEDEF: 2A'nin tespit ettigi yorungeyi Arguman.ai 11M+ karar havuzunda
semantik olarak genislet. 2B Yargi MCP'ye girdi olarak documentId
listesini hazirla. 2A'nin EKSIK biraktigi karsi-icthat atomarini
karsi-arguman skill ile bul (ASAMA 6 icin de kullanilir).

Cikti: 02-Arastirma/2A-arguman-bulgulari.md
Frontmatter: engine=claude, mcp=arguman+yargi-mcp-pro, arguman_credits_used=N,
            verified_count=V, unverified_count=U, hard_fail_count=H

KVKK kurali: Sorgu MUVEKKIL ADI/TC ICERMEZ. Briefing'den maskeli
token'larla hukuki tez kurulur. Karar metinleri kamuya acik oldugu
icin icindeki isimler aynen kalir.
```

---

## Yorunge Talimat Cikti Lokasyonu

Director Agent bu doldurulmus talimatlari su dosyaya yazar:

```
02-Arastirma/2A-yorunge-talimatlari.md
```

Alt-modul komutlari (`arastir arguman:`, `arastir yargi:`, `arastir mevzuat:`,
`arastir notebook:`) calistirildiginda ONCE bu dosyayi okur, sonra kendi ic
protokollerini bu yorungenin ustune oturtarak ilerler.

## Yorunge Eksik Durumu (2A Atlandi)

Avukat "2A atla" derse veya CDP+manuel fallback ikisi de basarisizsa,
`02-Arastirma/2A-yorunge-talimatlari.md` OLUSMAZ. Alt-moduller bu durumda
eski bagimsiz akis modunda calisir. Director Agent her ASAMA 2 raporuna
**`YORUNGE EKSIK`** flag'i koyar.
