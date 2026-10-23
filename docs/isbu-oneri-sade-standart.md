# isbu-ofis öneri sade standardı (avukat kararı 20.10.2026)

Avukat: "isbu-ofis'e giden yapay zeka önerileri çok kompleks; daha basit olsun. Ölçü, işleri takip ettiğim
Excel." Ölçü dosyası avukatın iş takip Excel'idir. Canlı nüshası OneDrive'dadır; proje Drive veri kökündeki
kopyasını okur (`scripts/paths.py` → `buro_excel()`; ortam değişkeni `BURO_EXCEL` öndedir).

## Excel satırı = öneri ölçüsü

DOSYALAR sayfasında bir dosya tek satırdır: Müvekkil · Karşı Taraf · Mahkeme / Kurum · Dosya No · Konu · Aşama ·
Sorumlu · Özet (2-3 satır) · Sıradaki İş (tek satır). İŞLER sayfasında bir iş tek satırdır: Müvekkil · Yapılacak İş ·
Sorumlu · Son Gün.

isbu-ofis'te avukatın gördüğü alanlar ve karşılıkları (örnekler kurgusaldır):

| isbu-ofis ekranı | Kural | Örnek |
|---|---|---|
| Başlık (`summary`) | Tek satır, Excel satırı gibi: "Müvekkil – Karşı taraf · Mahkeme No · Konu · Aşama"; dolgu önerisinde sonuna "· eksik: esas no, mahkeme" | `Örnek Müvekkil – Örnek A.Ş. · İstanbul 1. İş Mahkemesi 2026/1 · İşçilik alacağı · Bilirkişi · eksik: esas no` |
| Gerekçe (`reason`) | En çok iki kısa cümle; önce "Sıradaki iş: …", sonra kaynak tek kelimeyle (parantez içinde "ortak Excel satır 12") | `Sıradaki iş: 01.01.2027 duruşma; hesap bilirkişisi raporu tebliğinden itibaren 2 hafta içinde beyan (ortak Excel satır 10)` |
| Değişecek alanlar | Yalnız isbu'da BOŞ olan alan: esas no, mahkeme, özet (Excel "Özet" hücresi). Dolu alana dokunulmaz. | |
| Beklenen / aşama | Excel "Sıradaki İş" hücresi dosyanın "Beklenen" alanına (`waiting_for`; uygulama `next_step` metnini uygulamıyor), aşama Excel "Aşama"; avukatın yazdığı beklenen varsa dokunulmaz | |
| Görev | Excel İŞLER satırı: başlık = Yapılacak İş, son gün = Son Gün | |

## Anahtarlar satıra değil içeriğe bağlı

Excel'de satır eklenince/silinince öneri başka kayda yazılmasın diye dış kimlikler satır numarasından üretilmez:
dosya → `uyap:avukat:<mahkeme>|<no>` (mahkeme+no varsa) yoksa `excel:dosya:<müvekkil no>:<kurum>:<konu>`; beklenen →
`excel:siradaki:<aynı anahtar>`; iş → `excel:is:<sha1(müvekkil|iş metni)[:16]>`. Aynı anahtarı üreten iki satır
"belirsiz" sayılır. Önceki çalıştırmadan kalan, artık üretilmeyen `excel:` anahtarlı bekleyenler "Eski anahtar ·
reddedin: …" başlığıyla güncellenir; avukat bunları toplu reddeder. Başlık/gerekçe metni değişince de bekleyen öneri
güncellenir (`request_id` metin özetini içerir; sunucu aynı kimliği "duplicate" sayıp yazmaz).

## Yasak (sistem dili)

Avukata görünen hiçbir metinde: `uyap:avukat:…` dış kimlik, `KALKAN#`, `request_id` / `external_ref`, eşleşme tablosu
kodu (`eslesme-C`), öneri türü adı (`case_upsert` …), betik adı, "dış kimlik bağlama", "önbellek", "klon", dosya yolu,
UUID. `scripts/isbu_sade.py` → `denetle_oge()` bunu zorlar; `isbu_esitle.oge()` her öneriyi oradan geçirir, ihlal
`ValueError` olur (MCP `isbu_oneri` aracı da aynı yoldan geçer).

## Eşleştirme (tahmin yok)

isbu davası şu sırayla bulunur: (1) UYAP bağı (`externalRef`), (2) mahkeme + esas no, (3) müvekkil adının BİREBİR
eşleşmesi (kelime dizisi aynı; isbu müvekkil adı boşsa başlık) — adla bulunan dava yalnız müvekkilin Excel'de TEK açık
dosyası varsa kullanılır; aynı isbu davasına ikinci Excel satırı bağlanmaz. Birden çok aday → "belirsiz", öneri yok,
raporda listelenir. Excel'de olup isbu'da bulunmayan satır için yeni dava önerisi yalnız isbu'da benzer adlı dava ve
kuyrukta aynı müvekkile UYAP kaynaklı "Yeni dava" yoksa üretilir ("benzer ad freni"; örn. Excel "Ayşe Örnek" ↔ isbu
"Ayşe İşçilik Alacakları" avukat onayı ister). Kuyrukta aynı (tür, dış kimlik) bekliyorsa Excel öğesi onunla birleşir
(alanlar birleşir; Excel satırı var olan davaya bağlıysa dava kimliği Excel'inki olur, çift dava açılmaz). Tek bir
hatalı hücre planı düşürmez: öneri üretilemeyen satır raporun "Hatalar" bölümüne yazılır.

## Kapsam: dört ayak (avukat kararı 22.10.2026)

isbu-ofis tüm dava ve işlerin takip yeridir. Excel YALNIZ ortak (Mücahit'le) dosyaları tutar ve isbu'nun alt
kümesidir. Yargı PRO vekil olunan tüm UYAP dosyalarını getirir. Proje üretim yeridir (dilekçe, araştırma, hesap).
Excel'de olmayan UYAP dosyası "Yeni dava (UYAP) · …" önerisi olarak kalır; Excel'de olmamak ret sebebi değildir.

## Çalıştırma

```
python scripts/isbu_excel.py plan            # kuru: tmp/isbu-ofis/<tarih>-excel/plan.md
python scripts/isbu_excel.py plan --gonder   # kuyruğa yazar; avukat uygulamada onaylar/reddeder
python scripts/excel_indir.py --dosya <xlsx> # tarayıcıdan indirilen canlı nüshayı doğrulayıp yerine koyar
```

Canlı Excel'in OneDrive paylaşım linki yalnız `config/paths.local.json` içinde durur (gitignore; depo herkese
açıktır, link müvekkil listesine erişim verir). Link tanımlıysa `isbu_excel.py` her çalıştırmada önce canlı nüshayı
çeker; tanımlı değilse eldeki kopyayla sürer ve uyarı yazar. Kuyruktaki eski öneriler aynı dış kimlikle yeniden
gönderilince güncellenir (`request_id` için `tuz`).

Çalıştırma raporu (belirsiz satırlar ve benzer ad freni listesi, müvekkil adlarıyla) yalnız gitignore'daki
`tmp/isbu-ofis/<tarih>-excel/plan.md` dosyasında tutulur; bu belgeye ad yazılmaz.
