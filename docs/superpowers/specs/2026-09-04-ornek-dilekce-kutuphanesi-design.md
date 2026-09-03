# Örnek Dilekçe Kütüphanesi Entegrasyonu — Tasarım (Spec)

**Tarih:** 2026-09-04
**Durum:** Onaylandı (avukat) — uygulamaya hazır
**İlgili aşamalar:** ASAMA 5 (Belge Yazarı) · ASAMA 7 (Revizyon Ajanı)
**Anayasa:** `AGENTS.md`

---

## 1. Amaç ve Kapsam

Avukatın masaüstündeki `hakandimdik.dilekceler.v2` klasöründe bulunan **47 adet
profesyonel iskelet dilekçe** (`.udf`), sistemin dilekçe yazım aşamalarında
otomatik referans alacağı kalıcı bir kütüphaneye dönüştürülür.

**Temel ilke:** Örnek dilekçe bir **FORM / İSKELET**'tir — bölüm sırasını, `KONU`
ifade kalıbını ve `SONUÇ VE TALEP` yapısını gösterir. Olgular müvekkil
dosyasından, künyeler MCP'den gelir. Örnek **asla** künye veya olgu kaynağı
değildir.

### Kapsam içi
- 47 UDF'in tek seferlik çıkarımı → repo içi MD + UDF kütüphanesi
- Dava türü → örnek eşleme indeksi (`KONU` + `SONUÇ VE TALEP` hızlı-referanslı)
- Belge Yazarı (ASAMA 5) ve Revizyon Ajanı (ASAMA 7) SKILL'lerine "Örnek
  Dilekçe Eşleme" adımı
- Playbook bulunan dava türlerine örnek işaret satırı

### Kapsam dışı (YAGNI)
- MemPalace drawer yükleme, Drive kopyalama, vektör DB — **yok**
- Otomatik UDF içerik güncelleme / yeni dosya izleme — **yok** (script yeniden
  çalıştırılabilir; yeni örnek eklenirse manuel çalıştırılır)
- Örneklerin gerçek müvekkil verisiyle doldurulması — **yok** (örnekler zaten
  anonim; `TC NO: ...`, isimler `...`)

---

## 2. Girdi Envanteri (mevcut durum)

- **Kaynak:** `~/Desktop/hakandimdik.dilekceler.v2/*.udf` (47 dosya, düz klasör)
- **Format:** Her UDF bir ZIP; içinde tek `content.xml`. Metin
  `<content><![CDATA[ ... ]]></content>` içinde düz metin olarak durur.
- **Adlandırma kuralı:** `{konu}-{alt-konu}...-{dava|cevap}.udf`
  - Örn: `kira-kirabedelininbelirlenmesi-kiratespit-dava.udf`,
    `kira-icra-13ornek-itiraziniptali-cevap.udf`
- **Dava türü kümeleri:** `aile` (boşanma), `deliltespiti`, `icra-sikayet`,
  `is` (işçilik/işe iade), `kira` (icra-itiraz / tahliye / tespit), `kisiler`
  (vesayet / yasal danışman), `miras`, `tasinmaz`
- **Taraf bilgisi:** Dosya adı `-dava` (davacı/başvuran) veya `-cevap`
  (davalı) ile biter; bir kısmında yok (tek yönlü örnek).

### Standart bölüm yapısı (kira tespit örneğinden doğrulandı)
```
{MAHKEME} ...NE
DAVACI / VEKİLİ / DAVALI / ADRES
KONU            : ...
HARCA ESAS DEĞER: ...
AÇIKLAMALAR     : (numaralı maddeler)
HUKUKİ NEDENLER : ...
HUKUKİ DELİLLER : ...
SONUÇ VE TALEP  : (numaralı talepler)
```

**Karakter kodlaması notu:** Bazı dosya adlarında bozuk karakter var
(`13îrnek` → `13ornek`, `onalçm` → `onalim`, `tapuiptaltescil-onalçm`).
Çıkarım scripti dosya adını **slug'a normalize eder** (Türkçe karakter +
bozuk bayt temizliği), orijinal adı frontmatter'da `kaynak` olarak saklar.

---

## 3. Mimari

Üç bileşen + iki davranışsal kanca. Her biri bağımsız anlaşılır ve test
edilebilir.

```
[UDF kaynak klasörü]
        |
        v
scripts/udf_ornek_ice_aktar.py   (tek seferlik / yeniden çalıştırılabilir)
        |
        +--> sablonlar/dilekce-ornekleri/{slug}.md   (okunabilir metin + frontmatter)
        +--> sablonlar/dilekce-ornekleri/{slug}.udf   (orijinal, format referansı)
        +--> sablonlar/dilekce-ornekleri/index.json    (dava_turu -> örnekler)
        +--> sablonlar/dilekce-ornekleri/INDEX.md      (insan-okunur özet)
        |
        v
[ASAMA 5 Belge Yazarı]  ---okur--->  eşleşen örnek (iskelet + KONU + SONUÇ-TALEP)
[ASAMA 7 Revizyon]      ---okur--->  SONUÇ VE TALEP tamlık kıyası
[playbook/{tur}.md]     ---işaret--> ilgili örnek(ler)
```

### 3.1 Çıkarım scripti — `scripts/udf_ornek_ice_aktar.py`

**Ne yapar:** Kaynak klasördeki her `.udf`'i açar, `content.xml`'den metni
çıkarır, temizler, MD'ye çevirir; orijinal UDF'i kopyalar; indeksi üretir.

**Nasıl kullanılır:**
```bash
python scripts/udf_ornek_ice_aktar.py \
    --kaynak ~/Desktop/hakandimdik.dilekceler.v2 \
    --hedef  sablonlar/dilekce-ornekleri
# varsayılan hedef: sablonlar/dilekce-ornekleri (argüman verilmezse)
```

**Bağımlılık:** Yalnız Python stdlib (`zipfile`, `xml`/`re`, `html`, `json`,
`pathlib`, `unicodedata`). Harici paket yok.

**Adımlar (dosya başına):**
1. ZIP aç → `content.xml` oku.
2. `<content>...</content>` içindeki CDATA metnini çıkar, `html.unescape`,
   fazla boşluk/satır normalize.
3. Dosya adını slug'a çevir; `dava_turu`, `alt_konu`, `taraf` alanlarını
   addan türet.
4. Metinden `KONU` ve `SONUÇ VE TALEP` bloklarını regex ile ayıkla (başlık
   etiketleri: `KONU`, `SONUÇ VE TALEP` / `NETİCE-İ TALEP` / `TALEP SONUCU`
   varyantları).
5. `{slug}.md` yaz: frontmatter + tam metin. `{slug}.udf` kopyala.
6. Tüm dosyalar bitince `index.json` + `INDEX.md` yaz.

**MD frontmatter şeması:**
```yaml
---
kaynak: "kira-kirabedelininbelirlenmesi-kiratespit-dava.udf"
dava_turu: kira
alt_konu: kira-tespit          # kirabedelininbelirlenmesi
taraf: dava                    # dava | cevap | (yok)
mahkeme: "Sulh Hukuk Mahkemesi"   # metnin ilk satırından, tespit edilebilirse
konu_ozet: "Kira bedelinin tespiti istemidir."
bolumler: [KONU, HARCA_ESAS_DEGER, ACIKLAMALAR, HUKUKI_NEDENLER, HUKUKI_DELILLER, SONUC_VE_TALEP]
tur: ornek-dilekce
not: "İSKELET/FORM — künye ve olgu kaynağı DEĞİLDİR."
---
```

### 3.2 İndeks — `index.json`

```json
{
  "uretim_tarihi": "2026-09-04",
  "kaynak_klasor": "hakandimdik.dilekceler.v2",
  "toplam": 47,
  "turler": {
    "kira": [
      {
        "slug": "kira-kirabedelininbelirlenmesi-kiratespit-dava",
        "alt_konu": "kira-tespit",
        "taraf": "dava",
        "konu": "Kira bedelinin tespiti istemidir.",
        "sonuc_talep_ozet": "... rayiç bedele göre tespiti ve NET X'ten NET Y'ye yükseltilmesi ..."
      }
    ],
    "miras": [ ... ],
    "tasinmaz": [ ... ]
  }
}
```

`INDEX.md` aynı bilgiyi tablo halinde insan-okunur sunar (avukat elle
göz atabilsin).

**Eşleme mantığı (tüketiciler için sözleşme):**
- Anahtar = `dava_turu` (+ mümkünse `alt_konu`).
- Müvekkil davacı/başvuran ise `taraf: dava`, davalı ise `taraf: cevap`
  tercih edilir.
- Birebir eşleşme yoksa aynı `dava_turu` içindeki en yakın `alt_konu` seçilir.
- Hiç eşleşme yoksa örnek kullanılmaz, çıktıya not düşülür.

### 3.3 Belge Yazarı entegrasyonu — `ajanlar/dilekce-yazari/SKILL.md`

Yazımdan **önce** çalışan yeni adım: **"Örnek Dilekçe Eşleme"**.

1. `index.json`'dan dava türü + tarafa göre eşleşen örneği bul.
2. Örneği oku; şunları **referans al** (kopyalama):
   - **Bölüm iskeleti** ve sırası
   - **KONU** ifade kalıbı (tek cümle, "…istemidir" formu)
   - **SONUÇ VE TALEP** numaralı talep yapısı ve kapanış kalıbı
   - AÇIKLAMALAR'ın numaralı-madde akış disiplini (içerik değil, biçim)
3. `...` boşluklarını **gerçek dosya verisiyle**, künyeleri **MCP'den** doldur.
4. Eşleşme yoksa: en yakın türün örneğini genel iskelet için kullan +
   çıktının Avukat Kontrol Notu'na `Örnek dilekçe: eşleşme yok, genel yapı`.
5. Kullanılan örneği çıktı metadatasında belirt:
   `ornek_dilekce: {slug} (iskelet referansı)`.

### 3.4 Revizyon Ajanı entegrasyonu — `ajanlar/revizyon-ajani/SKILL.md`

ASAMA 7'de: eşleşen örneğin **SONUÇ VE TALEP** bölümüyle v2 dilekçenin talep
sonucunu kıyasla — eksik talep kalemi (vekalet ücreti, yargılama gideri, faiz,
icra inkâr tazminatı vb.) atlanmış mı kontrol et. Eksik varsa revizyon
notuna yaz.

### 3.5 Playbook işaret satırları — `playbook/{dava-turu}.md`

Örnek bulunan ve **playbook'u da olan** dava türlerine bir satır eklenir
(playbook zaten ASAMA 1'de okunuyor):

```markdown
> **Örnek dilekçe:** `sablonlar/dilekce-ornekleri/{slug}.md`
> (iskelet + SONUÇ VE TALEP referansı; künye/olgu kaynağı değildir)
```

Eşleme (mevcut playbook dosyaları ↔ örnek türleri):

| playbook | örnek türü/slug |
|---|---|
| `kira-tespit.md` | `kira-kirabedelininbelirlenmesi-kiratespit-dava` |
| `kira-tahliye.md` | `kira-tahliye-*` (ihtiyaç/akde aykırılık/iki haklı ihtar/10 yıl) |
| `iscilik-*` / `ise-iade.md` | `is-iscilikalacaklari-dava`, `is-iseiade-dava` |
| `icra-itiraz-hatti.md` | `kira-icra-*-itiraz*`, `icra-sikayet-meskeniyet-dava` |
| `aile-bosanma.md` | `aile-bosanma-anlasmali/cekismeli-dava` |
| `miras-ret.md` | `miras-*` (en yakın: `miras-terekenintespiti`, diğerleri) |
| `gayrimenkul.md` | `tasinmaz-*` (tapu iptal/kamulaştırma/ortaklığın giderilmesi vb.) |

Playbook'u olmayan türler (delil tespiti, vesayet/yasal danışman) yalnız
`index.json`'dan bulunur; playbook satırı eklenmez.

---

## 4. Doktrin Koruması (0-Halüsinasyon — bağlayıcı)

Bu bölüm SKILL'lere **açıkça** yazılır:

1. Örnek dilekçe **FORM'dur**; içindeki hiçbir künye, mevzuat maddesi veya
   emsal atıf doğrulanmadan çıktıya taşınmaz.
2. Örnekteki `...` ve örnek değerler (örn. `NET 25.000,00 TL`) **placeholder**'dır;
   gerçek dava verisiyle değiştirilir, aynen bırakılmaz.
3. Örnekten alınan `HUKUKİ NEDENLER` madde numaraları (örn. TBK 344/3, 345)
   davaya uygunluk açısından **mevzuat MCP'den teyit** edilir; körü körüne
   kopyalanmaz (mülga/güncel denetimi geçerli).
4. Örnek eşleşmesi çıktının **künye doğrulama tablosunu** veya **DENETCI**
   kapısını **hafifletmez** — tüm doktrin kapıları aynen çalışır.

---

## 5. Test / Doğrulama

Çıkarım scripti için (`scripts/tests/test_udf_ornek_ice_aktar.py`, stdlib
`unittest`):

1. **Çıkarım doğruluğu:** Bilinen bir UDF (kira tespit) → MD'de `KONU` metni
   ve `SONUÇ VE TALEP` bloğu doğru ayıklanmış mı.
2. **Slug normalizasyonu:** `13îrnek` → `13ornek`, `onalçm` → `onalim`;
   bozuk karakter kalmamış.
3. **Taraf türetme:** `-dava` → `dava`, `-cevap` → `cevap`, eksikse `null`.
4. **İndeks bütünlüğü:** `index.json` toplam = kaynak UDF sayısı (47);
   her türde ≥1 örnek.
5. **Idempotent:** Script iki kez çalışınca aynı çıktı (fark yok).

Manuel kabul (avukat):
- `INDEX.md`'yi gözden geçir → dava türü eşlemeleri doğru mu.
- Bir kira tespit davası taslağında Belge Yazarı'nın örneği referans alıp
  almadığını gör (çıktı metadatasında `ornek_dilekce` alanı).

---

## 6. Uygulama Sırası (öneri)

1. `scripts/udf_ornek_ice_aktar.py` + testleri yaz, çalıştır → kütüphane +
   indeks üretilir, commit'lenir.
2. `sablonlar/dilekce-ornekleri/` (MD + UDF + index) git'e eklenir.
3. `ajanlar/dilekce-yazari/SKILL.md` → "Örnek Dilekçe Eşleme" adımı + doktrin
   notu.
4. `ajanlar/revizyon-ajani/SKILL.md` → SONUÇ VE TALEP kıyas adımı.
5. Playbook işaret satırları (yukarıdaki tablo).
6. `AGENTS.md` Araç/Şablon bölümüne kısa referans (kütüphanenin varlığı).

---

## 7. Açık Riskler / Notlar

- **Bölüm ayıklama kırılganlığı:** `SONUÇ VE TALEP` başlığı bazı örneklerde
  `NETİCE-İ TALEP` / `TALEP` varyantıyla geçebilir. Script çoklu-etiket regex
  kullanır; ayıklayamazsa `sonuc_talep_ozet: null` bırakır (MD tam metni
  yine mevcut, ajan tümünü okuyabilir). Bu bir bozulma değil, zarif düşüş.
- **Karakter kodlaması:** UDF `content.xml` UTF-8 varsayılır; değilse script
  `errors="replace"` ile okur ve etkilenen dosyayı log'lar.
- **UDF kopyaları repo boyutu:** 47 × ~13KB ≈ 0.6 MB. Kabul edilebilir;
  format referansı ve `md_to_udf.py` doğrulaması için değerli.
- **Senkron:** Kütüphane repo içinde olduğundan `git push`/`pull` ile
  Windows PC'ye otomatik gider; ayrı işlem gerekmez.
