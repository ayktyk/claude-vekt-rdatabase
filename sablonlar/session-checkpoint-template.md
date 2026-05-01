# Session Checkpoint Template

Bu sablon, uzun session'larda context window dolmadan once
periyodik olarak doldurulur ve kaydedilir.

---

## Kullanim

Her 5 sorgu sonrasi veya context window %70'e ulastiginda:
1. Bu sablonu doldur
2. Drive dava klasorune kaydet (02-Arastirma/checkpoint-{saat}.md)
3. QMD sessions koleksiyonuna indexlenmesini bekle

Session kesilirse: Yeni session'da "arastirmaya devam et" komutuyla
bu checkpoint dosyasindan devam edilir.

---

## Sablon

```markdown
# Arastirma Checkpoint - {YYYY-MM-DD} {HH:MM}

## Meta
- Dava: {dava-id veya konu}
- Kritik Nokta: {kritik nokta}
- Ajan: {calistirilmakta olan ajan}
- Akis: {tam dava / arastirma-talebi / usul / dilekce}

## Sorgu Durumu
- Tamamlanan sorgu sayisi: {N} / {beklenen toplam}
- Yargi CLI sorgusu: {X} / {min 15}
- Mevzuat CLI sorgusu: {Y} / {min 8}
- NotebookLM sorgusu: {Z} / {min 10}

## Tamamlanan Sorgular
1. "{arama terimi 1}" -> {sonuc sayisi} sonuc, {alakali sayisi} alakali
   En iyi: {documentId} - {1 cumle ozet}
2. "{arama terimi 2}" -> ...
3. ...

## Bulunan Kritik Kararlar
| # | Daire | Tarih | Esas/Karar | Ozet | GUVEN NOTU |
|---|---|---|---|---|---|
| 1 | | | | | [DOGRULANMIS] |
| 2 | | | | | [DOGRULANMASI GEREKIR] |

## Bulunan Mevzuat
| # | Kanun | Madde | Degisiklik Var Mi? |
|---|---|---|---|
| 1 | | | |

## Henuz Aranmamis Terimler
- "{terim}"
- "{terim}"

## MemPalace Eslesmeler
- {drawer ozeti ve distance score}

## Alinan Ara Kararlar
- {karar 1}: {neden}
- {karar 2}: {neden}

## Sonraki Adimlar
1. {yapilacak is 1}
2. {yapilacak is 2}

## Notlar
- {varsa ozel durumlar, engeller, uyarilar}
```
