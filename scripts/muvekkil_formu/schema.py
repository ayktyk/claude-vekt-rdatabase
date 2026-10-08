"""İşçilik alacakları — müvekkil bilgi formu (SADE sürüm, varsayılan).

2026-10-08: 3-4 müvekkilde denenen ayrıntılı form "karışık ve uzun" bulundu,
doldurma gecikti. Bu sürüm yalnız hak kaybını önleyen ve hesaplama için
vazgeçilmez olan soruları tutar; ayrıntı avukat görüşmesine bırakılır.
Ayrıntılı sürüm: schema_detayli.py (`python -m scripts.muvekkil_formu --detayli`).

Alan türleri ve bölüm yapısı schema_detayli.py ile aynıdır.

Kesilenlerin nereye gittiği (kaybolmadı):
  - SGK giriş/çıkış tarihi, çıkış kodu, işveren unvanı, bordro kalemleri
    -> SGK hizmet dökümü + bordro belgesinden okunur (Belgeler bölümü)
  - Sendika, deneme süresi, sözleşme türü, ücret artışları, vardiya ayrıntısı,
    işsizlik maaşı, önceki şikâyetler, iş kazası, m.18/3 yasak sebepler
    -> avukat görüşmesi (playbook §1 listesi)
  - Yıllık izin yıl-yıl tablosu -> tek soru (toplam gün) + izin formları belgesi
"""

META = {
    "baslik": "İŞÇİLİK ALACAKLARI",
    "alt_baslik": "Müvekkil Bilgi Formu",
    "surum": "2026-10 sade",
    "aciklama": (
        "Haklarınızı hesaplayabilmemiz ve süreleri kaçırmamak için bu kısa formu "
        "doldurmanızı rica ederiz. Yaklaşık 10 dakika sürer. Bilmediğiniz soruya "
        "“bilmiyorum” yazabilirsiniz."
    ),
}

TALIMATLAR = [
    "Tarihleri gün.ay.yıl olarak yazın (örnek: 15.03.2021). Tam bilmiyorsanız ay ve yıl yeterli.",
    "Formu ve elinizdeki belgelerin fotoğrafını aynı WhatsApp hattından geri gönderin.",
]

SURE_UYARISI = {
    "baslik": "ÖNEMLİ",
    "maddeler": [
        "İşten çıkarıldıysanız bazı haklarınız için süre 1 AY ile sınırlıdır. "
        "Formu geciktirmeyin.",
        "İşverenin önünüze koyduğu hiçbir kâğıdı (istifa, ibraname, anlaşma) "
        "bize danışmadan imzalamayın.",
    ],
    "son_satir": "Lütfen formu en geç ______ / ______ / __________ tarihine kadar gönderin.",
}

SECTIONS = [
    {
        "kod": "1",
        "baslik": "Siz",
        "alanlar": [
            ("pair", ("Ad Soyad", None), ("T.C. Kimlik No", None)),
            ("pair", ("Cep Telefonu", None), ("Adres (il / ilçe yeterli)", None)),
        ],
    },
    {
        "kod": "2",
        "baslik": "İşyeri",
        "alanlar": [
            ("text", "Çalıştığınız şirketin adı", "Bordroda veya SGK'da yazan ad; bilmiyorsanız bilinen adı"),
            ("text", "İşyerinin adresi", None),
            ("pair", ("Göreviniz", None), ("İşyerinde yaklaşık kaç kişi çalışıyor?", None)),
            ("yesno", "Maaşınızı başka bir şirket mi ödüyordu? (taşeron)", "Evet ise o şirketin adı"),
        ],
    },
    {
        "kod": "3",
        "baslik": "Çalışma Süresi ve Maaş",
        "alanlar": [
            ("pair", ("İşe başladığınız tarih", "GG.AA.YYYY"),
                     ("İşten ayrıldığınız tarih", "GG.AA.YYYY · hâlâ çalışıyorsanız boş bırakın")),
            ("yesno", "Sigortasız çalıştığınız dönem oldu mu?", "Hangi tarihler arasında"),
            ("pair", ("Son aylık maaşınız (elinize geçen)", "TL"),
                     ("Maaş nasıl ödeniyordu?", "Banka / elden / bir kısmı elden")),
            ("text", "Elden ödeme varsa aylık ne kadarı elden?", "TL"),
            ("pair", ("Yemek", "Yemekhane / kart / nakit — aylık tutar"),
                     ("Yol / servis", "Servis / yol parası — aylık tutar")),
            ("text", "Prim, ikramiye, bayram harçlığı gibi başka ödeme var mıydı?", "Türü ve tutarı"),
            ("yesno", "Ödenmemiş maaşınız var mı?", "Hangi aylar, toplam ne kadar"),
        ],
    },
    {
        "kod": "4",
        "baslik": "Çalışma Düzeni",
        "alanlar": [
            ("pair", ("Haftada kaç gün çalışıyordunuz?", None),
                     ("İşe giriş – çıkış saatleriniz", "Örnek: 08:00 – 19:00 · vardiya varsa yazın")),
            ("pair", ("Öğle ve çay molası toplam ne kadar?", "Örnek: 1 saat"),
                     ("Hafta tatilinde çalışıyor muydunuz?", "Ayda kaç kez")),
            ("yesno", "Resmî ve dini bayramlarda çalıştınız mı?", "Hangileri"),
            ("choice", "Fazla mesai paranız ödeniyor muydu?",
             ["Hiç ödenmedi", "Bir kısmı ödendi", "Tamamı ödendi", "Bilmiyorum"], False),
            ("yesno", "İşyerinde giriş-çıkış kaydı var mıydı?", "Parmak izi, kart, kamera, defter"),
            ("text", "Çalıştığınız süre boyunca toplam kaç gün yıllık izin kullandınız?",
             "Yaklaşık yeterli · hiç kullanmadıysanız 0 yazın"),
        ],
    },
    {
        "kod": "5",
        "baslik": "İşten Ayrılış",
        "alanlar": [
            ("choice", "İş nasıl bitti?",
             ["İşveren çıkardı", "Kendim ayrıldım", "İstifa dilekçesi imzalattılar",
              "Hâlâ çalışıyorum"], True),
            ("pair", ("İşten çıkarıldıysanız bunu size ne zaman bildirdiler?", "GG.AA.YYYY · yazılı mı sözlü mü?"),
                     ("Kendiniz ayrıldıysanız buna yol açan son olayın tarihi", "GG.AA.YYYY")),
            ("multi", "Ne oldu? Kısaca anlatın", 3,
             "İşverenin söylediği sebep ve sizce gerçek sebep"),
            ("choice", "Ayrılırken bir kâğıt imzaladınız mı?",
             ["İstifa dilekçesi", "“Alacağım kalmadı” yazısı (ibraname)", "Anlaşma (ikale)",
              "Boş kâğıt", "Hiçbir şey imzalamadım"], False),
            ("yesno", "Ayrılırken size bir ödeme yapıldı mı?", "Ne için, ne kadar, ne zaman"),
            ("yesno", "Bu konuda daha önce arabulucuya gittiniz veya dava açtınız mı?", "Ne zaman"),
        ],
    },
    {
        "kod": "6",
        "baslik": "Tanıklar ve Belgeler",
        "alanlar": [
            ("table", "Çalışma düzeninizi bilen iş arkadaşlarınız",
             ["Ad Soyad", "Telefon", "Hâlâ orada çalışıyor mu?"], 3),
            ("note", "Elinizde olan belgeleri işaretleyin ve fotoğrafını formla birlikte gönderin. "
                     "Olmayanlar için endişelenmeyin; gerekirse biz temin ederiz."),
            ("docs", [
                "SGK hizmet dökümü (e-Devlet'ten; yoksa e-Devlet şifreniz olup olmadığını yazın)",
                "Maaş bordroları (elinizde olanlar)",
                "Maaşın yattığı banka hesap dökümü",
                "İş sözleşmesi",
                "İşten çıkış kâğıdı, istifa, ibraname, anlaşma (imzaladıysanız)",
                "Yıllık izin kâğıtları",
                "Mesai, maaş veya işten çıkışla ilgili WhatsApp / mesaj yazışmaları",
                "İşyerinde çekilmiş fotoğraf, işyeri kartı, vardiya listesi",
            ], ("Elimde var",)),
            ("multi", "Eklemek istediğiniz başka bir şey var mı?", 3, None),
        ],
    },
]

BEYAN = (
    "Verdiğim bilgilerin doğru olduğunu beyan ederim. Bilgi ve belgelerim avukatımın "
    "sır saklama yükümlülüğü altında, yalnızca hukuki işlemlerim için kullanılacaktır "
    "(6698 sayılı KVKK, 1136 sayılı Avukatlık Kanunu)."
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
        "Görüşmede tamamlanacak: SGK çıkış kodu, sendika, sözleşme türü, ikale/ibraname içeriği, işsizlik maaşı, iş kazası",
    ],
}
