# Dersler — Usul (ASAMA 3)

## 2026-08-05 — Tehiri icra mercii: BAM/Yargıtay DEĞİL, icra mahkemesi (dava: 018 Volkan / icra 2026/13870)

- **KACIRILAN:** Modelin ön bilgisi "İİK m.36 tehiri icra kararını bölge adliye mahkemesi veya Yargıtay verir" idi. Bu 2021 öncesi hukuktur. Mehil vesikasındaki "İcra Hukuk Mahkemesinden karar getirmek üzere" ibaresi ilk anda icra dairesi şablon hatası sanıldı.
- **DUZELTME:** 24.11.2021 tarihli 7343 s. Kanun m.5, İİK m.36/1'deki "bölge adliye mahkemesi veya Yargıtaydan" ibaresini **"takibin yapıldığı yer icra mahkemesinden"** şeklinde değiştirdi (RG 29.11.2021, geçiş hükmü YOK). Aynı Kanun m.36/3'ü de "icra mahkemesince" olarak değiştirdi. Yargıtay 2. HD istikrarlı biçimde "Dairemizden icranın geri bırakılması kararı istenmesinde hukuki yarar bulunmadığı" gerekçesiyle temyiz dilekçesini bu talep yönünden reddediyor (23.02.2026, 2026/619 E., 2026/2010 K. — documentId 1207726100).
- **KURAL ADAYI:** İcra/iflas usulüne dair her hükümde, model hafızasına GÜVENİLMEZ; madde metni `mevzuat_getir` ile çekilip **değişiklik dipnotları** (özellikle 7343 s. K. 2021 paketi) okunmadan merci/görev/süre beyanı yapılamaz. Avukatın tarif ettiği uygulama ile model bilgisi çeliştiğinde varsayılan doğru **uygulamadır**; model kendi bilgisini mevzuattan doğrulamadan avukatı düzeltmeye kalkışamaz.

## 2026-10-11 — 2026-050 Şaşmaz: iscilik-hesaplama.md modülünde iki hata
- KAÇIRILAN (modül): `ajanlar/usul-uzmani/iscilik-hesaplama.md` kıdem tavanı tablosu bir dönem kaymış (2025/1 satırında 41.828,42 yazıyor; ÇSGB tablosunda 2025/1 = 46.655,43, 41.828,42 ise 2024/2). İhbar öneli tablosu da 4857 m.17 ile uyumsuz ("3-6 yıl → 6 hafta"; kanun: 3 yıldan fazla → 8 hafta).
- DÜZELTME: Hesap kanun metni (mevzuat_getir) ve ÇSGB resmî tablosuyla yapıldı; modül düzeltilmedi (avukat onayı ile düzeltilecek).
- KURAL ADAYI: Tavan ve önel gibi sabitler modülden değil, her davada güncel resmî kaynaktan (ÇSGB/Hazine genelgesi + kanun maddesi) çekilerek yazılır; modül tablosu yalnız kontrol amaçlıdır.

## 2026-10-19 — 2026-054 Cemal Koçak: kapatılan mahkemeye dava dilekçesi (BÜRO KURALI)
- KAÇIRILAN: Dilekçe "Bakırköy Nöbetçi Asliye Ticaret Mahkemesi" başlığıyla yazıldı ve K2'den üç tur YEŞİL geçti. HSK GK 18.02.2026 t. 282 s. kararı (RG 20.02.2026) Bakırköy, İstanbul Anadolu ve Küçükçekmece ATM'lerini İstanbul ATM ile birleştirmiş, yargı çevresini "İstanbul ilinin mülki sınırları" yapmış; HSK 1. Daire 30.06.2026 t. 1420 s. kararıyla üç ATM kapatılmıştı. Avukat kendisi hatırladı ("aklıma gelmese usulden davayı kaybedecektik").
- DÜZELTME: Başlık "İSTANBUL NÖBETÇİ ASLİYE TİCARET MAHKEMESİ"; p.38'e 282 s. karar eklendi; UYAP'ta "İSTANBUL ADLİYESİ" seçilir.
- BÜRO KURALI (avukat talimatı): Her dava dilekçesinde görev ve yetki GÜNCEL araştırılır: kanun maddesine ek olarak HSK yargı çevresi / kuruluş / kapatma / birleştirme kararları (hsk.gov.tr, Resmî Gazete) ve UYAP duyuruları kontrol edilir; usul raporunda "Görev/yetki güncellik kontrolü" satırı kaynak ve tarihle yazılır. İçtihat ve mevzuat araçları HSK idari kararlarını göstermez; bu adım web/RG araştırmasıyla yapılır. DENETCI K2'de mahkeme adının güncelliğini de sorar.

## 2026-10-19 — 2026-054 Cemal Koçak: şirket muhatabının sıfatı MERSİS'ten okunmadı (BÜRO KURALI)
- KAÇIRILAN: Yazışmadaki muhatap Harun "davalının şantiye sorumlusu" (belgesiz avukat beyanı) kabul edildi; sıfatı SGK kaydı ve tanıkla ispat edilecekti, savunma simülasyonunda "Harun alt yükleniciydi" (S1) ANA RİSK sayıldı. Avukatın MERSİS ekran görüntüsünde Harun NAZ davalının "Müdür", "Münferiden Temsile Yetkili" tek yetkili kaydı çıktı.
- DÜZELTME: v4'te başlığa MERSİS no, sicil no, e-tebligat adresi ve temsilci; p.20'de TTK 629/1 → 371/1 ile müdürün beyanlarının şirketin beyanı olduğu; SGK bendi ve tanık isim yer tutucuları çıktı; MERSİS Ek-7.
- BÜRO KURALI (avukat talimatı): Davada şirket varsa ASAMA 1'de MERSİS kaydı istenir; şirket adına hareket eden kişinin sıfatı kayıt gelene kadar varsayımdır. Ayrıntı `AGENTS.md` ASAMA 1 "Şirket tarafsa MERSİS kaydı".
