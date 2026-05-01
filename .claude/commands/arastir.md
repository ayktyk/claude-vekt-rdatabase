# /arastir - Director Agent ile Kritik Nokta Araştırması

`$ARGUMENTS` olarak verilen kritik noktayı Director Agent mantığıyla araştır.

Akış:

1. Kritik noktayı netleştir.
2. Gerekli araştırma işçilerini seç:
   - AJAN 2B -> Yargı (rate limit: sorgu arası min 3 sn bekleme)
   - AJAN 2C -> Mevzuat (page_size her zaman ≤20)
   - AJAN 2D -> NotebookLM / Drive
   - AJAN 2E -> Akademik Doktrin (DergiPark + YÖK Tez)
3. Araştırmayı mümkünse paralel yürüt.
4. Sonuçları tek araştırma raporunda birleştir.
5. Güncellik farkı, çelişki ve eksik kaynak notlarını görünür yaz.

Kalite kriteri:

- mümkünse en az 3 güncel Yargıtay kararı
- mümkünse 1 HGK veya İBK araması
- ilgili mevzuat maddeleri tam metinle doğrulanmış olmalı
- dahili kaynak kullanıldıysa açıkça belirtilmeli
