# /yeni-dava - Director Agent ile Yeni Dava Başlatma

`$ARGUMENTS` bilgisini al. Format beklentisi:

```text
yeni dava: [Müvekkil Adı], [Dava Türü]
özet: [2-3 cümle dava özeti]
kritik nokta: [Spesifik araştırılacak hukuki mesele]
```

Director Agent akışı:

1. Dava parametrelerini parse et.
2. Kritik nokta yoksa tahmin etme, sor.
3. `aktif-davalar/` altında dava hafızasını aç:
   - `{yil}-{sira}-{muvekkil_kisa}-{dava_turu}/`
   - `01-Usul/`
   - `02-Arastirma/`
   - `03-Sentez-ve-Dilekce/`
   - `04-Muvekkil-Belgeleri/`
   - `05-Durusma-Notlari/`
4. Dava hafızasına şu alanları yaz:
   - dava no
   - müvekkil
   - dava türü
   - özet
   - kritik nokta
   - kaynak durumu
   - NotebookLM notebook adı varsa
5. Kaynak sorgulamasını zorunlu yap.
6. Cevaba göre araştırma işçilerini seç:
   - Vector RAG
   - Yargı
   - Mevzuat
   - NotebookLM / Drive
7. AJAN 1 ile araştırma hattını paralel yürüt.
8. Yeterli çıktı oluşunca AJAN 3'e belge yazımı için pas ver.

Kural:

- kaynak cevabı gelmeden usul ve araştırmayı başlatma
- NotebookLM seçildiyse notebook adını dava hafızasına kaydet
