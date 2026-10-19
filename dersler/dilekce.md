# Dersler — Dilekce (ASAMA 5-7)

## 2026-08-10 — dava 2026-048 (ihtarname standardi)
KACIRILAN: Ilk ihtarname taslagi karar noktalari + kontrol notlariyla ic ice tek belgeydi; gonderime hazir degildi. Antet, IBAN ve gonderim sekli (noter vs iadeli taahhutlu) belge yapisini degistiriyor, bunlar bastan sorulmamisti.
DUZELTME: Avukat yonlendirdi: (1) Vega Hukuk anteti + telefon her ihtarnameye, (2) ihtarname TEMIZ tek belge (TASLAK ibaresi/karar noktasi/AI notu icermez), (3) tum kontrol notlari + kaynak dogrulama AYRI kontrol-notlari.md/.docx, (4) iadeli taahhutlu secilirse noter blogu yazilmaz + icerik-ispati uyarisi kontrol notuna, (5) belgeler (taranmis PDF dahil — PyMuPDF ile) okunup olgular oradan kurulur.
KURAL ADAYI: Ihtarname = gonderilebilir temiz belge + ayri kontrol notlari ciftii; kunye dogrulama ve olgu cikarimi yazimdan once. [TERFI → .claude/commands/ihtarname-yaz.md — 2026-08-10 islendi]

## 2026-08-10 — dava 2026-038 (dilekce v2→v3)
KACIRILAN: v2 dilekcede maddi tazminat HMK m.107 belirsiz alacak olarak kuruldu; oysa m.107, 7589 s.K. m.19 ile (kabul 16.07.2026, RG 31.07.2026) MULGA edilmisti. Model bilgi kesim tarihi sonrasi usul degisikligini kendiliginden yakalayamadi.
DUZELTME: Avukat yakaladi. mevzuat_getir ile teyit edildi; dogru yapi HMK m.109 kismi dava + m.109/4 (7589/20 ile eklenen) tek seferlik talep artirimi (zamanasimi artirilan kisim icin de dava tarihinden kesilir). Mulga m.107'ye dayali HGK 2023/1156 E.-2024/445 K. atfi cikarildi.
KURAL ADAYI: Dilekcede dava turu / usul kurumu (belirsiz alacak, kismi dava, arabuluculuk sarti, kanun yolu suresi vb.) kurulmadan ONCE dayanak usul maddesinin GUNCEL metni her seferinde mevzuat_getir ile cekilip mulga/degisiklik kaydi kontrol edilecek; icthat atfindan once o ictihadin dayandigi kanun hukmunun yururlukte oldugu dogrulanacak. [TERFI ADAYI → ajanlar/dilekce-yazari/SKILL.md + ajanlar/revizyon-ajani/SKILL.md]

## 2026-10-11 — dava 2026-050 (stratejik analiz KS SARI×2 → YEŞİL; v1→v2)
KACIRILAN: (1) Stratejik analizde üç Daire kararından "9. HD 2021'den bu yana istikrarla adli yargı der" genellemesi yapıldı; bir kararın hüküm fıkrası "düzeltilerek onama" iken "bozma" yazıldı; ispat yükü için ikinci kaynak olarak ispat yükünü düzenlemeyen 4857 m.25/son önerildi; görev için dayanılan HGK 2021/1118 dosyasında araştırma görevlisinin belirli süreli kabul edilip ihbarın reddedildiği (aleyhe nüans) beyan edilmedi. (2) v1'de sözleşme görülmeden "iş sözleşmesi belirsiz sürelidir" kesin cümlesi kuruldu; azami süre ve İŞKUR reddi belgesizken kesin olgu gibi yazıldı.
DUZELTME: DENETCI KS iki turda yakaladı; sayı yazıldı ("üç karar"), hüküm fıkrası düzeltildi, m.25/son önerisi kaldırılıp Ek-2 kararı kullanıldı, aleyhe nüans Risk 2'ye ve tabloya işlendi. Savunma simülasyonu v1'in D köprüsünü (belirsiz süre) zayıf halka olarak gösterdi; v2'de belgesiz olgular "davacının beyanına göre" + celp biçimine çevrildi.
KURAL ADAYI: (1) Daire kararı sayısı üç-beş ise sayı yazılır, "istikrar/yerleşik" yazılmaz. (2) Her kararın hüküm fıkrası (ONAMA / DÜZELTİLEREK ONAMA / BOZMA) tablo hücresine aynen yazılır. (3) Lehe kullanılan bir kararın aynı dosyasındaki aleyhe olgu (ör. belirli süre kabulü) "aleyhe nüans" satırı olarak tabloya girer ve o karar ilgili bölümde kullanılmaz. (4) Belge elde yokken olgu cümlesi "beyan + celp" kalıbıyla kurulur; belge gelince kesin cümleye dönülür. [TERFİ ADAYI → ajanlar/dilekce-yazari/SKILL.md + prompts/muhakeme/stratejik_analiz.md]


## 2026-10-16 — 2026-050
- Belirli süreli sözleşmede "süre içinde fesih" ihbar için ayırt edici değildir; sözleşme belirli süreli sayılırsa sonuç bakiye süre ücreti / cezai şarttır. İhbar bölümünde yalnız belirsizlik olguları (yazılı sözleşme yokluğu, örtülü sürdürme) kullanılır.
- Transkriptte "T" açıklamalı (transfer) dersler okunmadan "dersleri tamamladı" yazılmaz; transfer önceki bir lisansüstü kaydını ve azami süre riskini gösterir.
- Belgeden tırnaklı aktarım birebir olmalı; çekim eki değiştirilen kelime ("haklarınız" → "haklarının") tırnak dışına alınır.
- Bir kararı ihbar gibi farklı bir kaleme taşımadan önce o dosyadaki unvan ve ihbarın ödenip ödenmediği kontrol edilir (2026/4333: davacı profesör, ihbar ödenmiş).


## 2026-10-17 — 2026-050 (müvekkil yazışmasıyla son hal)
- [GEÇERSİZ — 2026-10-19 büro kuralıyla kaldırıldı] ~~müvekkil cevapları dilekçeye "davacının beyanına göre" kaydıyla girer~~. DOĞRUSU: belgesiz müvekkil olgusu dilekçede vekilin iddiası olarak doğrudan yazılır ve ispat aracı gösterilir; belge/beyan ayrımı yalnız eşlikte "MÜVEKKİL BEYANI" damgasıyla tutulur.
- Yeni beyan eski bir olgu cümlesini çürütebilir: "aynı dönemde başkalarının da sözleşmesi sona erdirildi" cümlesi, önerilen tanığın kendi isteğiyle ayrıldığı anlaşılınca çıkarıldı. Her yeni beyanda eski olgu cümleleri yeniden taranır.
- Müvekkilin lehe saydığı ayrıntı (mezuniyet belgesinin işe giriş yıldönümüne kadar istenmesi) karşı tarafa yıllık süre savunması verebilir; dilekçeye yazılmadan eşlikte risk olarak tartılır.


## 2026-10-19 — BÜRO KURALI (avukat talimatı)
- "Davacının beyanına göre" ve benzeri müvekkilden mesafe koyan kalıplar YASAK. Avukatın sözü: "müvekkilimi temsil ediyorken ondan yabancı gibi bahsedip ben onun yalancısıyım anlamı çıkacak sığ ifadeler kesinlikle kullanılmamalı". 0-halüsinasyon doktrinindeki belge/beyan ayrımı dilekçe metninde değil eşlikte tutulur.


## 2026-10-19 — BÜRO KURALI: vekilin sesi (avukat talimatı)
- Avukat: "Davacı vekili, 10.08.2026 tarihinde … başvurmuş; bu şekilde bir ifade de çok saçma … benim kendimden niye 3. kişi gibi bahsediyorum … belagate üsluba genel mantık kurallarına ve insan ağzından çıktığına inandıracak şekilde yaz."
- Kök neden: ORKESTRATOR dilekçeyi `dilekce-yazim-kurallari.md` (Tekin, Bir Dilekçenin Anatomisi özeti) ve `uslup-aykut.md` okunmadan yazdı; denetçi bulgularını düzeltirken eklenen dürüstlük cümleleri rapor diliyle metne girdi. Kural: dilekçeye dokunan her rol önce iki dosyayı okur; denetçi düzeltmeleri vekilin ağzından yazılır.
- 2026-050 v3 baştan yeniden yazıldı; 84 alıntı makine karşılaştırmasıyla birebir korundu (yöntem: eski/yeni metnin tırnak içi ifadeleri kümesi karşılaştırılır).
