"""İşçilik alacakları — müvekkil bilgi formu şeması.

Tek doğruluk kaynağı: hem PDF hem DOCX bu şemadan üretilir.
Alan türleri:
  text     : tek satır cevap        (label, hint?)
  pair     : aynı satırda iki text  ((label, hint?), (label, hint?))
  date     : tarih (GG.AA.YYYY)     (label, hint?)
  multi    : çok satırlı kutu       (label, satır_sayısı, hint?)
  choice   : tek/çok seçim          (label, [seçenekler], other?)
  yesno    : Evet/Hayır + açıklama  (label, açıklama_hint?)
  table    : tablo                  (label, [sütunlar], satır_sayısı)
  docs     : belge kontrol listesi  ([belgeler])
  note     : bilgi kutusu           (metin)

Kaynak dayanağı (madde atıfları müvekkile gösterilmez, büro için):
  - 4857 s.K. m.17, 18, 20, 24, 26, 32, 41, 46, 47, 53-59, Ek m.3
  - 7036 s.K. m.3 (dava şartı arabuluculuk), 1475 s.K. m.14
  - playbook/iscilik-isveren-feshi.md §1-2, playbook/iscilik-isci-hakli-fesih.md §1-2,
    playbook/ise-iade.md §0
"""

META = {
    "baslik": "İŞÇİLİK ALACAKLARI",
    "alt_baslik": "Müvekkil Bilgi Formu",
    "surum": "2026-09",
    "aciklama": (
        "Bu formdaki bilgiler, haklarınızın eksiksiz hesaplanması ve kanuni "
        "süreler içinde talep edilebilmesi için gereklidir. Lütfen her soruyu "
        "elinizden geldiğince tam ve tarihli cevaplayın."
    ),
}

TALIMATLAR = [
    "Tarihleri gün.ay.yıl biçiminde yazın (örnek: 15.03.2021). Bazı haklarınız "
    "kanuni sürelere bağlıdır; bir gün dahi önem taşır.",
    "Emin olmadığınız bilgiyi “tahmini” diye işaretleyin. Bilmediğiniz "
    "soruyu boş bırakmak yerine “bilmiyorum” yazın.",
    "Formu ve elinizdeki belgeleri (fotoğraf veya PDF olarak) aynı WhatsApp "
    "hattından geri gönderin.",
    "Verdiğiniz bilgiler avukatın sır saklama yükümlülüğü kapsamındadır; yalnızca "
    "sizin hukuki işleriniz için kullanılır.",
]

SURE_UYARISI = {
    "baslik": "ÖNEMLİ — SÜRELER",
    "maddeler": [
        "İşten çıkarıldıysanız ve işe iade istiyorsanız: fesih bildiriminin size "
        "ulaşmasından itibaren 1 AY içinde arabulucuya başvurulması zorunludur.",
        "Kıdem, ihbar, yıllık izin, fazla mesai ve ücret alacakları 5 YILLIK "
        "zamanaşımına tabidir. Süre, alacağın türüne göre işten ayrılma tarihinden "
        "veya ödemenin yapılması gereken tarihten itibaren işler.",
        "Hâlâ çalışıyorsanız ve ayrılmayı düşünüyorsanız: istifa dilekçesi veya "
        "başka bir belge imzalamadan önce mutlaka büromuzla görüşün. Hakaret, "
        "baskı, görev değişikliği gibi bir olaya dayanarak ayrılacaksanız olaydan "
        "itibaren 6 İŞ GÜNÜ içinde işlem yapılması gerekir.",
    ],
    "son_satir": "Bu nedenle formu en geç ______ / ______ / __________ tarihine kadar geri gönderin.",
}

SECTIONS = [
    {
        "kod": "A",
        "baslik": "Kimlik ve İletişim",
        "alanlar": [
            ("pair", ("Ad Soyad", None), ("T.C. Kimlik No", None)),
            ("pair", ("Doğum Tarihi", "GG.AA.YYYY"), ("Cep Telefonu (WhatsApp)", None)),
            ("pair", ("E-posta", None), ("İkinci Telefon (ulaşılamadığında bir yakınınız)", None)),
            ("multi", "İkamet Adresi", 2, None),
            ("yesno", "e-Devlet şifreniz var mı?",
             "Yoksa PTT şubesinden alınabilir. SGK dökümü için gereklidir."),
            ("yesno", "Büromuza daha önce vekâletname verdiniz mi?", "Verdiyseniz noter adı ve tarihi"),
        ],
    },
    {
        "kod": "B",
        "baslik": "İşveren ve İşyeri",
        "alanlar": [
            ("text", "İşverenin tam unvanı", "Bordroda veya SGK dökümünde yazan şirket adı"),
            ("multi", "İşverenin adresi", 2, None),
            ("multi", "Fiilen çalıştığınız işyerinin adresi (farklıysa)", 2, None),
            ("text", "İşyerinin faaliyet alanı / sektörü", None),
            ("multi", "Çalıştığınız süre boyunca SGK'da göründüğünüz şirketler",
             3, "Birden fazlaysa hepsini, hangi tarihler arasında olduğunu yazın"),
            ("yesno", "Taşeron (alt işveren) olarak mı çalıştınız?",
             "Evet ise asıl işin sahibi olan şirketi yazın"),
            ("text", "Maaşınızı hangi şirket veya kişi ödüyordu?", None),
            ("choice", "Ayrıldığınız tarihte işyerinde (tüm şubeler dâhil) kaç çalışan vardı?",
             ["30'dan az", "30 ve üzeri", "Bilmiyorum"], False),
            ("yesno", "İşyerinde sendika var mıydı? Üye miydiniz?", "Sendika adı"),
        ],
    },
    {
        "kod": "C",
        "baslik": "Çalışma Dönemi ve Görev",
        "alanlar": [
            ("pair", ("İşe fiilen başladığınız tarih", "GG.AA.YYYY"),
                     ("SGK'ya bildirilen giriş tarihi (farklıysa)", "GG.AA.YYYY")),
            ("pair", ("İşten fiilen ayrıldığınız tarih", "GG.AA.YYYY"),
                     ("SGK çıkış tarihi", "GG.AA.YYYY")),
            ("text", "SGK işten ayrılış kodu",
             "e-Devlet > SGK Tescil ve Hizmet Dökümü'nde görünür (örnek: 04, 22, 29)"),
            ("yesno", "Sigortasız çalıştığınız bir dönem var mı?", "Hangi tarihler arasında"),
            ("multi", "Çalışma sürenizde ara verme oldu mu?", 2,
             "Askerlik, ücretsiz izin, çıkış-yeniden giriş, başka şirkete devir; tarihleriyle"),
            ("pair", ("Göreviniz / unvanınız", None), ("Çalıştığınız bölüm", None)),
            ("choice", "İş sözleşmeniz",
             ["Yazılı", "Sözlü", "Belirsiz süreli", "Belirli süreli (proje / sezon)", "Bilmiyorum"], False),
            ("yesno", "Deneme süresi uygulandı mı?", "Kaç ay"),
        ],
    },
    {
        "kod": "D",
        "baslik": "Ücret ve Yan Haklar",
        "alanlar": [
            ("pair", ("Son aylık NET ücretiniz (elinize geçen)", "TL"),
                     ("Bordroda görünen BRÜT ücret (biliyorsanız)", "TL")),
            ("choice", "Ücretiniz nasıl ödeniyordu?",
             ["Tamamı bankaya", "Tamamı elden", "Bir kısmı banka, bir kısmı elden"], False),
            ("pair", ("Elden ödeme varsa: bankaya yatan kısım", "TL"),
                     ("Elden ödenen kısım", "TL")),
            ("yesno", "Bordroda asgari ücret gösterilip fazlası elden mi ödeniyordu?", None),
            ("choice", "Yemek",
             ["İşyerinde yemek / yemekhane", "Yemek kartı", "Nakit", "Yok"], False),
            ("choice", "Yol", ["Servis", "Yol parası / kart", "Yok"], False),
            ("pair", ("Yemek için aylık tutar", "TL"), ("Yol / servis için aylık tutar", "TL")),
            ("multi", "Prim, ikramiye, bayram harçlığı, yakacak, lojman, telefon vb. yan haklar",
             2, "Türü, tutarı ve ne sıklıkla ödendiği"),
            ("multi", "Son 2 yıldaki ücret artış tarihleri ve tutarları", 2, None),
            ("yesno", "Ödenmemiş maaşınız var mı?", "Hangi aylar, toplam ne kadar"),
            ("multi", "Maaşınız düzenli ödeniyor muydu? Gecikmeler oluyor muydu?", 1, None),
            ("choice", "Bordrolarınızı imzaladınız mı?",
             ["Her ay", "Bazen", "Hiç", "Hatırlamıyorum"], False),
            ("choice", "Bordroda “fazla mesai” kalemi görünüyor muydu?",
             ["Evet", "Hayır", "Bilmiyorum"], False),
        ],
    },
    {
        "kod": "E",
        "baslik": "Çalışma Düzeni — Fazla Mesai, Hafta Tatili, Bayramlar",
        "alanlar": [
            ("pair", ("Haftada kaç gün çalışıyordunuz?", None), ("Hafta tatili gününüz", None)),
            ("pair", ("Günlük işe giriş saati", None), ("Günlük çıkış saati", None)),
            ("text", "Ara dinlenme (öğle, çay) toplam süresi", "Örnek: 1 saat"),
            ("multi", "Vardiyalı çalıştıysanız vardiya düzenini yazın", 2,
             "Örnek: 08-16 / 16-24 / 24-08, haftalık dönüşümlü"),
            ("multi", "Çalışma düzeniniz dönem dönem değişti mi?", 3,
             "Yaz-kış, yoğun sezon, pandemi, farklı görev; tarihleriyle"),
            ("text", "Hafta tatilinde çalıştınız mı? Ayda kaç kez?", None),
            ("multi", "Resmî ve dini bayramlarda çalıştınız mı? Hangi bayramlarda?", 2,
             "Örnek: her Ramazan ve Kurban Bayramı, 1 Mayıs, 29 Ekim"),
            ("choice", "Fazla mesai ücretiniz ödendi mi?",
             ["Hiç ödenmedi", "Kısmen ödendi", "Tamamı ödendi", "Bilmiyorum"], False),
            ("choice", "İşyerinde giriş-çıkış kaydı var mıydı? (birden fazla işaretlenebilir)",
             ["Parmak izi / yüz tanıma", "Kart", "Kamera", "Puantaj defteri", "Yok", "Bilmiyorum"], False),
            ("multi", "Fazla mesai yaptığınızı gösteren mesaj, e-posta, vardiya listesi, fotoğraf var mı?",
             2, None),
        ],
    },
    {
        "kod": "F",
        "baslik": "Yıllık İzin",
        "alanlar": [
            ("table", "Çalışma süreniz boyunca kullandığınız yıllık izinler",
             ["Yıl", "Kullanılan gün", "İzin formu imzaladınız mı?"], 6),
            ("yesno", "Kullanmadığınız izinler için size ücret ödendi mi?", "Ne zaman, ne kadar"),
            ("multi", "Yıllık izin yerine “ücretsiz izin” veya “idari izin” gösterilen dönem var mı?",
             2, None),
        ],
    },
    {
        "kod": "G",
        "baslik": "İş İlişkisinin Sona Ermesi",
        "alanlar": [
            ("choice", "İş ilişkiniz nasıl sona erdi?",
             ["İşveren çıkardı", "Kendim ayrıldım (istifa)", "İstifa dilekçesi imzalatıldı",
              "Karşılıklı anlaşma (ikale) imzaladım", "Emeklilik", "Askerlik",
              "Evlilik nedeniyle (kadın işçi)", "İşyeri kapandı / devredildi",
              "Hâlâ çalışıyorum"], True),
            ("pair", ("Ayrılma / çıkarılma tarihi", "GG.AA.YYYY"),
                     ("Yazılı bildirimi teslim aldığınız tarih", "GG.AA.YYYY")),
            ("choice", "Fesih size nasıl bildirildi?",
             ["Elden, imza karşılığı", "Noter", "E-posta / SMS / WhatsApp", "Sözlü", "Bildirilmedi"], False),
            ("multi", "İşverenin gösterdiği sebep (kendi ifadesiyle)", 2, None),
            ("multi", "Sizce gerçek sebep neydi?", 3, None),
            ("choice", "İşveren çıkardıysa: ihbar süresi tanındı mı veya ihbar tazminatı ödendi mi?",
             ["Süre tanındı", "Tazminat ödendi", "İkisi de yok", "Bilmiyorum"], False),
            ("choice", "Kendiniz ayrıldıysanız: neden? (birden fazla işaretlenebilir)",
             ["Ücret / mesai ödenmedi", "Sigorta eksik veya hiç yatırılmadı",
              "Hakaret, baskı, mobbing", "Görev veya işyeri değiştirildi",
              "Sağlık nedeni"], True),
            ("pair", ("Ayrılmanıza yol açan olayın tarihi", "GG.AA.YYYY"),
                     ("Olayı öğrendiğiniz tarih", "GG.AA.YYYY")),
            ("yesno", "Ayrılmadan önce işverene yazılı bildirim veya noter ihtarnamesi gönderdiniz mi?",
             "Tarih ve içeriği"),
            ("choice", "Ayrılırken bir belge imzaladınız mı? (birden fazla işaretlenebilir)",
             ["İstifa dilekçesi", "İbraname (“alacağım kalmadı” yazısı)",
              "İkale sözleşmesi", "Boş kâğıt", "Hiçbir şey imzalamadım"], False),
            ("multi", "İmzaladıysanız: tarih, belgede ne yazıyordu, kim hazırladı, karşılığında ne ödendi?",
             3, None),
            ("multi", "Ayrılırken size ödeme yapıldı mı? Kıdem, ihbar, izin, maaş — tutar ve tarih",
             2, None),
            ("yesno", "İşsizlik maaşına başvurdunuz mu?", "Sonuç: kabul / ret, tarih"),
            ("text", "Ayrıldıktan sonra yeni bir işe başladınız mı? Tarih ve işyeri", None),
            ("multi", "Hamilelik, doğum izni, rapor, sendika üyeliği, şikâyet (ALO 170, CİMER) gibi "
                      "bir durumun hemen ardından mı işten çıkarıldınız?", 2, None),
            ("yesno", "İş kazası geçirdiniz mi veya meslek hastalığı teşhisi aldınız mı?", "Tarih ve olay"),
        ],
    },
    {
        "kod": "H",
        "baslik": "Önceki Girişimler",
        "alanlar": [
            ("yesno", "Bu konuda daha önce arabulucuya başvurdunuz mu?", "Tarih ve sonuç"),
            ("multi", "Bu işverene karşı daha önce dava, icra takibi veya şikâyet (ALO 170, CİMER, "
                      "İş Müfettişliği) yaptınız mı?", 2, "Tarih, dosya numarası, sonuç"),
            ("multi", "Aynı işverenden ayrılıp dava açan başka çalışan tanıyor musunuz?", 1, None),
        ],
    },
    {
        "kod": "I",
        "baslik": "Tanıklar",
        "alanlar": [
            ("note", "Çalışma düzeninizi, mesainizi ve ayrılış şeklinizi bilen mesai arkadaşlarınızı "
                     "yazın. Hâlâ aynı işyerinde çalışanlar da tanık olabilir."),
            ("table", "Tanık listesi",
             ["Ad Soyad", "Görevi", "Hâlâ orada mı?", "Telefon", "Neyi biliyor?"], 4),
        ],
    },
    {
        "kod": "J",
        "baslik": "Belgeler",
        "alanlar": [
            ("note", "Elinizde olan belgeleri işaretleyin ve fotoğrafını veya PDF'ini formla birlikte "
                     "gönderin. Elinizde olmayanları temin edebilecekseniz ikinci sütunu işaretleyin."),
            ("docs", [
                "SGK Tescil ve Hizmet Dökümü (e-Devlet, barkodlu)",
                "SGK İşten Ayrılış Bildirgesi (çıkış kodu görünen)",
                "İş sözleşmesi",
                "Ücret bordroları (tüm dönem; en az son 1 yıl)",
                "Maaşın yattığı banka hesabının dökümü (tüm çalışma dönemi)",
                "Fesih bildirimi, ihtarname, işverenle yazışmalar",
                "İstifa dilekçesi, ibraname, ikale (imzaladıysanız)",
                "Yıllık izin formları",
                "Giriş-çıkış kayıtları, vardiya listeleri, mesai çizelgeleri",
                "WhatsApp / e-posta yazışmaları (mesai, ücret, fesih)",
                "İşyerinde çekilmiş fotoğraf, işyeri kimlik kartı",
                "Sağlık raporları (varsa)",
                "İşsizlik maaşı başvuru veya karar yazısı",
                "Nüfus cüzdanı fotokopisi (vekâletname için)",
            ]),
        ],
    },
    {
        "kod": "K",
        "baslik": "Eklemek İstedikleriniz",
        "alanlar": [
            ("multi", "Sorulmayan ama önemli olduğunu düşündüğünüz her şeyi buraya yazın", 7, None),
        ],
    },
]

BEYAN = (
    "Bu formda verdiğim bilgilerin doğru ve eksiksiz olduğunu; bilgi ve belgelerimin "
    "6698 sayılı Kişisel Verilerin Korunması Kanunu ile 1136 sayılı Avukatlık Kanunu'nun "
    "sır saklama yükümlülüğü çerçevesinde, yalnızca hukuki iş ve işlemlerimin yürütülmesi "
    "amacıyla işleneceğini bildiğimi beyan ederim."
)

BURO_KUTUSU = {
    "baslik": "BÜRO KULLANIMI — müvekkil doldurmaz",
    "satirlar": [
        ("Dosya No", "Formun alındığı tarih"),
        ("Fesih bildirimi tebliğ tarihi", "İşe iade için arabuluculuk son günü (+1 ay, İş K. m.20/1)"),
        ("Fesih tarihi", "Kıdem / ihbar / izin zamanaşımı (+5 yıl, İş K. Ek m.3)"),
        ("En eski ödenmemiş ücret ayı", "Ücret zamanaşımı (+5 yıl, İş K. m.32)"),
        ("Haklı fesih olayını öğrenme tarihi", "6 iş günü son günü (İş K. m.26)"),
        ("Arabuluculuk başvuru tarihi", "Son tutanak tarihi"),
        ("İşe iade davası son günü (son tutanak + 2 hafta, İş K. m.20/1)", "Not"),
    ],
    "kontrol": [
        "Süreler takvime işlendi",
        "Playbook seçildi: isveren-feshi / isci-hakli-fesih / ise-iade",
        "Hesaplama girdi sayfasına aktarıldı",
    ],
}
