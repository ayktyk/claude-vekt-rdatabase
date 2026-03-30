# CODEXPLAN

## Durum Ozeti

`SONCLAUDE.md` hedefleri mevcut repo ile karsilastirildi.

Tamamlanan ana basliklar:
- `ALLSKILL.md` kokte mevcut
- Ana ajan skill dosyalari olusturulmus
- `iscilik-hesaplama.md` ayri dosyaya tasinmis
- `CLAUDE.md` buyuk olcude modularize edilmis
- Kalite gate, guven notu ve kisayol komutlari eklenmis
- `udf-cli` calisiyor; UDF okuma/yazma dogrulandi
- `sablonlar/` icine reusable operasyon dosyalari eklendi
- Kalici kayit politikasi netlesti: yeni dava `Aktif Davalar`, sadece arastirma `Bekleyen Davalar`

Acik kalan veya yari tamamlanmis alanlar:
- Belgelerin yapilandirilmasi dokumanda var ama operasyonel akisa baglanmamis
- Bazi aktif dava ve briefing dosyalarinda Turkce karakter/encoding bozulmasi var
- Repo temizligi yarim; eski/ikincil dosya ve klasorler ayiklanmamis
- HukukTakip dashboard kodu artik `isbu-ofis/hukuk-takip` altinda mevcut

## HukukTakip Entegrasyon Fazlari

11. Faz 3A - HukukTakip teknik saglamlastirma
   Hedef: `isbu-ofis/hukuk-takip` projesini once kendi icinde derlenebilir,
   guvenli ve stabil hale getirmek.
   Kapsam:
   - TypeScript build kiriklarini gider
   - Route bazli sahiplik/yetki kontrollerini sertlestir
   - Hassas dosya ve gelistirme kalintilarini temizle veya ignore et
   Durum: Tamamlandi.

12. Faz 3B - Hukuk otomasyon sistemiyle veri modeli entegrasyonu
   Hedef: HukukTakip davalari ile Google Drive tabanli otomasyon klasorleri
   arasinda birebir bag kurmak.
   Kapsam:
   - `case` kaydina kanonik dava klasoru / Drive yolu / otomasyon durumu alanlari ekle
   - briefing, usul, arastirma, savunma, revizyon ve UDF artefaktlarini
     dashboard icinden izlenebilir hale getir
   - AI Workspace mantigini API + UI katmanina tasi
   Durum: Buyuk olcude tamamlandi.

## Sabit Calisma Kurali

Kalici belge kaydi yalnizca su Drive alani altina yapilir:
- `G:\Drive'im\Hukuk Burosu\Aktif Davalar`
- `G:\Drive'im\Hukuk Burosu\Bekleyen Davalar`

Kural:
- Yeni dava -> `Aktif Davalar`
- Sadece arastirma -> `Bekleyen Davalar`
- Repo ici `aktif-davalar/` klasoru referans/ornek amaclidir; yeni kalici cikti buraya yazilmaz

## Nihai Hedefe Giden Sirali Yol

### FAZA 1.5 - Operasyonel Tamamlama

1. Reusable sablonlari ekle
   Hedef: `sablonlar/` altina briefing, savunma simulasyonu, revizyon raporu,
   evrak listesi ve dava iskeleti sablonlarini eklemek.
   Durum: Bu turda yapiliyor.

2. Sablon referanslarini merkezi dosyalara bagla
   Hedef: `CLAUDE.md` ve ilgili `SKILL.md` dosyalarinin, sablon dosyalarini
   dogrudan isaret etmesi.
   Durum: Bu turda yapiliyor.

3. Encoding normalizasyonu
   Hedef: `CLAUDE.md`, `SONCLAUDE.md`, aktif briefing dosyalari ve ornek
   dava belgelerindeki bozuk Turkce karakterleri temizlemek.
   Neden: Nihai cikti kalitesini dogrudan etkiliyor.
   Durum: Bekliyor.

4. Repo temizligi
   Hedef: `SONCLAUDE.md`de artik gereksiz sayilan dosyalari ve muhtemel
   tekrar klasorleri kontrollu sekilde ayiklamak.
   Not: Kullaniciya ait icerik silinmeden once dosya bazli onay kontrolu yap.
   Durum: Bekliyor.

### FAZA 2 - Is Akisini Gercekten Calisir Hale Getirme

5. Dava scaffold akisi
   Hedef: Yeni dava basladiginda kullanilacak standart klasor/markdown
   iskeletini tanimlamak.
   Cikti:
   - `00-Briefing.md`
   - `01-Usul/usul-raporu.md`
   - `02-Arastirma/arastirma-raporu.md`
   - `02-Arastirma/savunma-simulasyonu.md`
   - `03-Sentez-ve-Dilekce/revizyon-raporu-v1.md`
   - `04-Muvekkil-Belgeleri/evrak-listesi.md`
   Durum: Bekliyor.

6. Belge yapilandirma proseduru
   Hedef: `04-Muvekkil-Belgeleri/00-Ham` ve `01-Tasnif` icin somut
   isimlendirme, tasnif ve eksik evrak kurallarini dokumante etmek.
   Durum: Bekliyor.

7. Ornek dava uzerinde tam akis provasi
   Hedef: Bir aktif dava klasorunde briefing -> usul -> arastirma ->
   savunma simulasyonu -> v1 dilekce -> revizyon -> v2 akisini sonuna kadar
   calistirmak ve "Ogrenilmis Dersler" bolumlerine not dusmek.
   Durum: Bekliyor.

### FAZA 3 - Dashboard Entegrasyonu

8. HukukTakip teknik tabanini saglamlastir
   Hedef: `isbu-ofis/hukuk-takip` projesini build alir ve guvenli hale getirmek.
   Durum: Tamamlandi.

9. AI Workspace veri modeli planlamasi
   Hedef: case -> ai artifacts -> task/note/notification ve Drive klasoru
   baglantilarini tablo ve endpoint bazinda planlamak.
   Durum: Tamamlandi.

10. Dashboard UI ve backend entegrasyonu
   Hedef: AI Workspace sekmesi, AI durum paneli ve AI ile dava baslat akisini
   gerceklestirmek.
   Durum: Ilk calisan surum hazir.

## Bu Turun Ciktisi

Bu turda su isler tamamlandi:
- `isbu-ofis/hukuk-takip` build zinciri ve paylasilan paket cozumleme sorunu duzeltildi
- Route bazli sahiplik kontrolleri sertlestirildi
- Dava kaydina Drive yolu, otomasyon durumu ve AI artefakt alanlari eklendi
- Briefing, usul, arastirma, savunma, revizyon, markdown ve UDF yollarini
  otomatik tureten AI Workspace varsayimlari baglandi
- Case formu, case detayi, dava listesi ve dashboard AI Workspace bilgisini
  gosterecek sekilde guncellendi
- Case detail ekranina `AI ile Dava Baslat` aksiyonu eklendi; Drive klasoru,
  temel dosyalar, gorevler ve AI workspace notu olusturuluyor
- `npm run build` basariyla gecti

## Sonraki Uygulanacak Adim

Bu tur tamamlandiktan sonra siradaki teknik adim:

`AI ile dava baslat` akisina ikinci adimlari eklemek

Sebep:
- Ilk calisan akista klasor, temel dosyalar ve ilk gorevler uretiliyor
- Sonraki katman, briefing/sablon icerigini daha zenginlestirmek ve belge
  modulunu dashboard icinde yonetilebilir hale getirmek
- Ardindan encoding temizligi ve ornek tam dava provasi ile operasyonel kalite
  kapanacak
