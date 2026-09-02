# /ihtarname-yaz - İhtarname Hazırlama (2026-048 standardı)

`$ARGUMENTS` konusuna göre GÖNDERİME HAZIR ihtarname + ayrı kontrol notları üret.
Referans uygulama: 2026-048 Araç KM Tahrifatı dosyası (avukat onayı: 2026-08-10 —
"bundan sonra ihtarname hazırla deyince böyle hazırla").

## 1. Hazırlık (yazmadan önce — sırayla)

1. **Dava klasöründeki TÜM belgeleri oku.** Taranmış PDF ise PyMuPDF (`fitz`) ile
   PNG'ye çevirip görüntü olarak oku (pdftoppm yok); JPEG/PNG'yi doğrudan Read ile.
   Sözleşme/senet üzerindeki taraf kimlik, adres, tarih, tutar, beyan cümleleri
   birebir çıkarılır — ihtarnamenin olgu iskeleti belgelerden kurulur, avukata
   yalnızca belgede OLMAYAN bilgi sorulur.
2. **MemPalace wake-up:** `mempalace_search` (limit: 2) ile aynı konuda geçmiş
   dosya/argüman var mı bak; MEMORY MATCH varsa künyeleri sıfırdan aramak yerine
   oradan al AMA Bedesten'den yeniden doğrula.
3. **Künye doğrulama (0-halüsinasyon — ZORUNLU):** İhtarnameye yazılacak her
   Yargıtay kararı `ictihat_ara` (esas_no + karar_no docket lookup) ile bulunur,
   `ictihat_getir` ile TAM METNİ çekilir, alıntı birebir teyit edilir. Dayanak
   kanun maddeleri `mevzuat_getir` (madde_no kısayolu) ile güncel metinden çekilir
   (mülga/değişiklik denetimi). Doğrulanmamış künye ihtarnameye GİRMEZ.
4. **Vekaletname kontrolü:** Dosyadaki vekaletnamede "ihtarname, ihbarname,
   protesto çekmeye" yetkisi ve (tahsilat isteniyorsa) ahzu kabz var mı bakılır.
5. **Avukata sorulacaklar (belgede yoksa):** öğrenme tarihi/olgusu, talep tutarı,
   gönderim şekli (noter / iadeli taahhütlü), IBAN.

## 2. İhtarname Biçimi (Vega Hukuk standardı)

Belge SADECE şunlardan oluşur — içine karar noktası, TASLAK ibaresi, AI çalışma
notu, doktrin preamble YAZILMAZ (bunlar kontrol notlarına gider):

```
**VEGA HUKUK İSTANBUL**
**Av. Aykut YEŞİLKAYA** — İstanbul Barosu, Sicil No: 61223
Osmanağa Mah. Karadut Sok. No: 14/10 Kadıköy / İstanbul
Tel: 0551 981 49 37 — E-posta: vegalaw.contact@gmail.com — vegahukukistanbul.com

---

# İHTARNAME

**İHTAR EDEN** : {ad} (T.C. Kimlik No: {tc})  + adres
**VEKİLİ** : Av. Aykut YEŞİLKAYA (İstanbul Barosu — Sicil No: 61223) + adres
**MUHATAP** : {ad} (T.C. Kimlik No: {tc varsa}) + adres
**KONU** : {tek cümle: dayanak belge + olgu + talep}

## AÇIKLAMALAR
{numaralı, kronolojik; her olgu belgeye bağlanır; hukuki dayanak maddeleri ve
doğrulanmış 1-2 Yargıtay künyesi ile}

## SONUÇ VE TALEP
{fazlaya ilişkin haklar saklı + tutar + tebliğden itibaren 7 gün + aksi halde
dava/faiz/yargılama gideri + "sair her türlü yasal başvuru hakkımız saklıdır" +
"vekâleten ihtar ederiz." + tarih}

**Hesap Bilgisi** : Av. Aykut YEŞİLKAYA
**IBAN** : TR52 0015 7000 0000 0085 3063 17   ← her dosyada avukata teyit ettir

**İhtar Eden Vekili**
Av. Aykut YEŞİLKAYA
```

- Antet bilgileri `config/author.json`'dan (değişirse oradan güncelle).
- Süre varsayılanı 7 gün.
- Suç duyurusu TEHDİDİ yazılmaz (TBB meslek kuralları); "her türlü yasal başvuru
  hakkı saklıdır" yeterli.
- **Gönderim şekline göre kapanış:** Noter kanalı seçilirse sona "Sayın Noter;
  üç nüshadan ibaret işbu ihtarnamenin bir nüshasının muhataba tebliğini..."
  bloğu eklenir. İadeli taahhütlü seçilirse noter bloğu YAZILMAZ.

## 3. Kontrol Notları (AYRI belge — ZORUNLU)

`kontrol-notlari.md` + `.docx` ayrı dosya olarak üretilir; içeriği:
- Gönderim kontrol listesi (imza, fotokopi + barkod + alındı saklama, tebliğ
  dönüşü → temerrüt tarihi hesabı)
- İadeli taahhütlü seçildiyse ispat uyarısı: teslimi ispatlar, İÇERİĞİ ispatlamaz;
  noter kanalı ikisini de ispatlar — tercih avukatın
- Avukatın karar noktaları (tutar, süre, gönderim şekli, riskler)
- Argüman güven etiketleri ([YERLEŞİK]/[GELİŞEN]/[AÇIK SORU])
- Kaynak Doğrulama Tablosu (iddia + kaynak + documentId + tam alıntı + ✓)
- Aleyhe içtihat: VAR/YOK/ARANMADI beyanı
- Zaman baskısı notu (gizli ayıp vb. "hemen ihbar" gereken hallerde ivedilik)

## 4. Çıktı ve Kayıt

1. `{dava-klasörü}/03-Sentez-ve-Dilekce/ihtarname-v1.md` (temiz, gönderilebilir)
2. `{dava-klasörü}/03-Sentez-ve-Dilekce/kontrol-notlari.md` (büro içi)
3. Her ikisi `python scripts/md_to_docx.py <klasör>` ile DOCX'e çevrilir
   (script klasör alır, dosya değil; DOCX Word'de açıksa Permission denied —
   avukata kapattır, yeniden dene)
4. Frontmatter: `status: GONDERIME-HAZIR (avukat son kontrolu sonrasi)` +
   `gonderim: noter | iadeli-taahhutlu-posta`
5. MemPalace diary write + ilgili ders varsa `dersler/dilekce.md`
