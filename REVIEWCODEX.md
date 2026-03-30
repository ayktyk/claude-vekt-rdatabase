# Review And Fix Plan

## Tespit Edilen Eksikler

1. `udf-cli/src/udf/cdata-builder.ts`
   Paragraf sonu `\n` karakteri text run uzunluguna dahil ediliyor. Bu offset hesaplarini bozuyor ve roundtrip sirasinda son run icine satir sonu sizdiriyor.

2. `udf-cli/tests/real-udf.test.ts`
   Testler gelistirici makinesine sabit absolute path kullaniyor. Repo baska ortamda dogrudan kirmiziya dusuyor.

3. `udf-cli/src/html/serializer.ts`
   Liste seviyeleri korunmuyor. Ic ice listeler duzlesiyor.

4. `vektordb_v2_pilot/chunk_markdown.py`
   Chunk metadata degerleri sabit yaziliyor. Gercek OCR provider ve isleme yontemi kayboluyor.

5. `vektordb_v2_pilot/utils.py`
   `slugify` Turkce karakterleri donusturmek yerine fiilen siliyor. Dosya adlari anlamsizlasiyor ve cakisma riski olusuyor.

6. Repo hijyeni
   `.env` izleniyor, `.env.example` yok, Python bagimliliklari tanimli degil.

## Uygulama Plani

1. `udf-cli` test kiriklarini kapat:
   `buildCdata` davranisini duzelt, fixture testlerini tasinabilir yap, nested list serializasyonunu ekle.

2. Python OCR pipeline duzeltmeleri:
   `slugify` icin dogru Turkce transliterasyon ekle, chunk metadata parametrelerini dinamik yap.

3. Repo hijyeni:
   `.gitignore`, `.env.example`, `vektordb_v2_pilot/requirements.txt` ekle ve `.env` dosyasini takipten cikar.

4. Tum testleri tekrar calistir ve kalan hata kalmayana kadar kapat.
