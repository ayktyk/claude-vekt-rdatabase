# /arastir - Director Agent ile Kritik Nokta Araştırması

`$ARGUMENTS` olarak verilen kritik noktayı Director Agent mantığıyla araştır.

Akış:

1. Kritik noktayı netleştir.
2. Gerekli araştırma işçilerini seç:
   - AJAN 2A -> Vector RAG
   - AJAN 2B -> Yargı
   - AJAN 2C -> Mevzuat
   - AJAN 2D -> NotebookLM / Drive
3. Araştırmayı mümkünse paralel yürüt.
4. Sonuçları tek araştırma raporunda birleştir.
5. Güncellik farkı, çelişki ve eksik kaynak notlarını görünür yaz.

Kalite kriteri:

- mümkünse en az 3 güncel Yargıtay kararı
- mümkünse 1 HGK veya İBK araması
- ilgili mevzuat maddeleri tam metinle doğrulanmış olmalı
- dahili kaynak kullanıldıysa açıkça belirtilmeli
