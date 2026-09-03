# Hukuki Yöntem Kontrol Listesi — Çıkarım Geçerliliği

**Ne işe yarar:** Doktrinimiz bugüne kadar **kaynağın gerçekliğini** denetliyordu
(künye Bedesten'de var mı, alıntı birebir mi, madde mülga mı). Denetlemediği şey,
gerçek bir kaynaktan **geçersiz sonuç çıkarmaktı**. Bu liste o boşluğu kapatır.

**Nerede kullanılır:** `ajanlar/arastirmaci/SKILL.md` → Yorum Yöntemi Protokolü;
`ajanlar/denetci/SKILL.md` → denetim sırası 4. adım; doktrinin 9. clause'u
(`prompts/_doktrin-preamble.md`).

**Sistemik gerekçe:** 2026-05-05 Tuğba 2026-89 hatası. Künye sahte değildi; İİK 89/4
bağlamındaki cevap 89/3'e taşınmıştı. Kaynak hatası değil, **çıkarım hatası**.

---

## Kaynak durumu — dürüst beyan

Bu listenin kaynak temeli **iki parçalıdır** ve ikisi ayrı etiketlenir:

**Kitaptan gelen (Polat, *Hukuk Nosyonu Cilt I*):** Kitap yorum yöntemlerini
**kural olarak anlatmaz.** Verdiği şey çerçevedir:
- Hukuk kurallarının uygulanma metodunun TMK m. 1'de ifade edildiği: "Kanun, sözüyle
  ve özüyle değindiği bütün konularda uygulanır. Kanunda uygulanabilir bir hüküm
  yoksa, hâkim, örf ve âdet hukukuna göre, bu da yoksa kendisi kanun koyucu olsaydı
  nasıl bir kural koyacak idiyse ona göre karar verir." `[s. 38]`
- Hukuk metodolojisinin araştırma konuları arasında "yorumlanması, ... hukukta akıl
  yürütme, boşluk ve boşlukların tamamlanması, hâkimin hukuk yaratması ve takdir
  yetkisi ve sınırları" sayılır — **sayılır, işlenmez** `[s. 38]`
- Hukukçunun mantıksal teknikleri (Serozan'dan aktarım): "soyutlama, genelleme,
  ayrıştırma, tümden gelim, tüme varım ve örnekseme" `[s. 37]`

**Sistem eki (kaynağı henüz kitap değil):** Aşağıdaki somut kurallar hukuk
metodolojisinin genel bilgisidir; **Polat'a atfedilmez.** Kaynaklandırılması
Rona Serozan, *Hukukta Yöntem – Mantık* (henüz temin edilmedi —
`EKLENECEKKITAPLAR.md` §1) geldiğinde yapılacak, sayfa referansları o zaman eklenecektir.
O güne kadar bu kurallar `[SİSTEM EKİ]` etiketiyle uygulanır.

> **Doğrulama borcu kaydı (2026-09-02):** `EKLENECEKKITAPLAR.md` §2, Polat'ın
> "kıyas / argumentum a contrario / kanun boşluğu" kurallarını içerdiğini varsayıyordu.
> 306 sayfa OCR üzerinden yapılan taramada bu varsayım **doğrulanmadı**: "kıyas" yalnız
> İİK m. 50 metninde ("kıyas yolu ile uygulanır", s. 204, 233) ve pratik çalışma
> tavsiyesinde (s. 31) geçiyor; "boşluk" yalnız s. 38'deki konu listesinde ve kaynakçada.
> Bu içerik Serozan'ın kitabındadır; öncelik ona kaydırıldı.

---

## 1. Yorum yöntemi beyanı [SİSTEM EKİ]

Bir normdan sonuç çıkarılırken **hangi yorum yöntemiyle** varıldığı yazılır:

| Yöntem | Ne yapar | Ne zaman yeterli |
|---|---|---|
| Lafzî | Normun sözüne bakar | Söz açık ve tek anlamlıysa — ilk durak, çoğu kez son durak |
| Sistematik | Normun kanun içindeki yerine ve komşu hükümlere bakar | Söz birden fazla anlama açıksa |
| Amaçsal | Normun korumak istediği menfaate bakar | Lafız ile sistem sonuç vermiyorsa; **gerekçe zorunlu** |
| Tarihsel | Kanun koyucunun iradesine, gerekçeye, değişiklik tarihçesine bakar | Amaçsal yorumu desteklemek için |

**Kural:** Lafzî yorum yeterliyken amaçsal yoruma geçmek gerekçe ister; gerekçesiz
amaçsal yorum "lehe yorum" şüphesi doğurur.
Çerçeve: TMK m. 1 "sözüyle ve özüyle" `[s. 38]` — "söz" lafzî, "öz" amaçsal yorumun
kanuni dayanağıdır.

## 2. Kıyas mı, argumentum a contrario mu [SİSTEM EKİ]

- **Kıyas (örnekseme):** Norm, düzenlemediği benzer olaya *aynı sonuçla* uygulanır.
  Ancak **genel ve düzenleyici** hükümlerde caizdir.
- **Argumentum a contrario (aksi-kavram):** Norm belirli bir hâli düzenlemişse,
  düzenlemediği hâl için *aksi sonuç* çıkar. **İstisnai, sınırlayıcı, hak düşürücü ve
  ceza niteliğindeki** hükümlerde kıyas caiz değildir; a contrario gerekir.
- **Denetim sorusu:** Uygulanan norm istisna mı, genel kural mı? İstisnaysa kıyas
  **HARD FAIL**.

Mantıksal teknik adı olarak "örnekseme" Polat'ta Serozan'dan aktarımla geçer `[s. 37]`;
caiz olma şartları Polat'ta yoktur.

## 3. Kanun boşluğu mu, bilinçli susma mu [SİSTEM EKİ]

- **Boşluk:** Kanun koyucunun *düzenlemeyi unuttuğu* veya öngöremediği hâl. TMK m. 1
  uyarınca örf-âdet, o da yoksa hâkimin kural koyması `[s. 38]`.
- **Bilinçli susma:** Kanun koyucunun *düzenlememeyi tercih ettiği* hâl. Boşluk
  doldurma **yasaktır**; susmanın kendisi hükümdür.
- **Denetim sorusu:** Gerekçe, komisyon raporu veya sistematik yapı susmanın bilinçli
  olduğunu gösteriyor mu? Gösteriyorsa "boşluk var, doldurdum" **HARD FAIL**.

## 4. Genelleme sınırları [SİSTEM EKİ] — Tuğba 2026-89 dersi

- Bir **fıkra veya bent** hakkındaki içtihat, aynı maddenin başka fıkrasına
  **taşınamaz**. Fıkralar farklı olguları düzenler; bağlam kaymasıdır.
- Taşınacaksa: iki fıkranın *ratio*'su aynı mı, Yargıtay ikisini aynı gerekçeyle mi
  ele alıyor — **gerekçe yazılır**, yazılmadan taşıma **HARD FAIL**.
- Bu madde `prompts/_doktrin-preamble.md` 3. clause'un ("bağlam korunmalı") *nasıl
  denetleneceğini* söyler; 9. clause'un ("çıkarım geçerliliği") çekirdeğidir.

## 5. Tümevarım eşiği [SİSTEM EKİ]

- Kaç karardan "yerleşik uygulama" denebilir? Sayı yoktur; **ölçüt niteliktir**:
  - HGK / İBK kararı varsa: yerleşik (tek karar yeter)
  - Aynı dairenin **farklı yıllarda** tutarlı en az 3 kararı: yerleşik
  - Tek daire, tek yıl, 2-3 karar: **"gelişen"** — `[YERLEŞİK]` etiketi verilemez
  - Aleyhe karar bulunmuş ve raporda yazılmamışsa: yerleşiklik iddiası **HARD FAIL**
    (aleyhe beyanı zorunluluğuyla birleşir)
- Argüman güven etiketleri (`[YERLEŞİK] / [GELİŞEN] / [AÇIK SORU] / [ZORLAMA]`) bu
  eşiğe göre verilir.

---

## DENETCI için özet — dört soru

Her hukuki sonuç için:

1. **Hangi yorum yöntemiyle vardım?** (yazılı mı)
2. **Kıyas mı yaptım, a contrario mu gerekiyordu?** (norm istisna mı)
3. **Boşluk mu var, bilinçli susma mı?** (gerekçe ne diyor)
4. **Genellemem meşru mu?** (fıkra→fıkra taşıma var mı; kaç karar, hangi nitelikte)

Dördünden birine "gerekçesiz" cevabı → **9. clause HARD FAIL**.

---

## Serozan geldiğinde yapılacaklar

- [ ] §1–5'teki `[SİSTEM EKİ]` kuralları Serozan'ın ilgili bölümleriyle karşılaştır
- [ ] Uyuşanları `[s. NNN]` sayfa referansına çevir; uyuşmayanları düzelt
- [ ] Serozan'ın "kaçınılması gereken mantık yanılgıları" listesini §6 olarak ekle
- [ ] `EKLENECEKKITAPLAR.md` §1 checklist'ini güncelle
