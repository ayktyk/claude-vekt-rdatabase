# MASTER PLAN — Hukuk Ofis Otomasyon Sistemi Yeniden Yapılandırma

Tarih: 2026-03-31
Durum: FAZ 1-5 TAMAMLANDI

---

## SORUN TESPİTİ

### 1. Araştırma Sistemi (KRİTİK)
- IctihatSearchPage sadece CLI komutu üretiyor, terminale yönlendiriyor
- Kullanıcı terminale gidip komutu yapıştırmak zorunda — UX felaketi
- Backend'de researchOrchestrator.ts ve research.ts mevcut ve çalışır durumda
- Ama frontend bağlantısı yok — arama sonuçları web UI'da gösterilemiyor

### 2. İşçilik Alacakları Hesaplama
- Temel hesaplama çalışıyor ama Excel formülleriyle birebir uyumlu değil
- Fazla mesai, UBGT, hafta tatili modülleri eksik
- Giydirilmiş brüt ücret hesabı detaylı değil
- Kıdem tavanı döneme göre ayrı hesaplama yapılmıyor

### 3. Arabulucu Belgeleri
- 4 belge şablonu çalışıyor ama plain text
- UDF formatında indirilebilir belge üretimi yok
- udf-cli aracı projede mevcut ama entegre değil

### 4. Miras Hesaplama
- Sadece para tutarı üzerinden çalışıyor
- Taşınmaz (gayrimenkul) desteği yok
- 1/2, 1/4, 3/8 gibi kesirli pay gösterimi yok

### 5. Genel Akışkanlık
- Araçlar arası bağlantı zayıf
- Her kullanıcı kendi Claude hesabıyla kullanamamalı (API key yönetimi)

---

## UYGULAMA PLANI

### FAZ 1: Araştırma Sistemi — Site İçi İçtihat Arama [KRİTİK]
**Hedef:** IctihatSearchPage'i terminale yönlendirmek yerine doğrudan site içinde arama yapıp sonuçları gösteren bir araç haline getirmek.

- [x] Adım 1.1: Backend'e `/api/ictihat/search` endpoint'i ekle
  - yargi CLI'yi child_process ile çağır
  - Sonuçları JSON olarak parse et ve döndür
- [x] Adım 1.2: Backend'e `/api/ictihat/doc/:id` endpoint'i ekle
  - Karar tam metnini getir
- [x] Adım 1.3: Backend'e `/api/mevzuat/search` endpoint'i ekle
  - mevzuat CLI entegrasyonu
- [x] Adım 1.4: IctihatSearchPage'i yeniden yaz
  - Arama formu → API çağrısı → Sonuç listesi → Karar detay modal
  - Loading state, error handling, sonuç sayısı
  - Karar tam metni gösterme (yargi doc)
  - Alternatif sorgu önerileri
- [x] Adım 1.5: Orchestrated Research entegrasyonu
  - Opus 4.6 ile akıllı araştırma endpoint'ini frontend'e bağla
  - Kullanıcı kendi API key'ini girebilsin (Settings'ten)

### FAZ 2: İşçilik Alacakları — Excel Formülleriyle Tam Uyum
**Hedef:** CLAUDE.md'deki 9 modülü frontend'de tam olarak implement et.

- [x] Adım 2.1: Fazla mesai hesaplama modülü ekle
- [x] Adım 2.2: UBGT hesaplama modülü ekle
- [x] Adım 2.3: Hafta tatili ücreti modülü ekle
- [x] Adım 2.4: Giydirilmiş brüt ücret hesabı (yemek istisnası dahil)
- [x] Adım 2.5: Kıdem tavanı döneme göre ayrı hesaplama
- [x] Adım 2.6: İşe iade modülü
- [x] Adım 2.7: Sonuç tablosu + Excel export

### FAZ 3: Arabulucu — UDF Belge Oluşturma
**Hedef:** Arabulucu belgelerini otomatik UDF formatında üretip indirmeye hazır hale getir.

- [x] Adım 3.1: udf-cli'yi backend'e entegre et
- [x] Adım 3.2: `/api/mediation/generate-udf` endpoint'i
- [x] Adım 3.3: Frontend'de "UDF İndir" butonu
- [x] Adım 3.4: Tüm 4 belge türü için UDF desteği

### FAZ 4: Miras Hesaplama — Taşınmaz ve Kesirli Pay
**Hedef:** Taşınmaz varlıklar eklenebilsin, paylar kesir olarak gösterilsin.

- [x] Adım 4.1: Varlık türü seçimi (nakit, taşınmaz, araç, diğer)
- [x] Adım 4.2: Taşınmaz detayları (ada, parsel, m², değer)
- [x] Adım 4.3: Kesirli pay gösterimi (1/2, 1/4, 3/8 vb.)
- [x] Adım 4.4: Taşınmaz bazlı pay tablosu

### FAZ 5: Genel İyileştirmeler
- [x] Adım 5.1: Settings sayfasında API key yönetimi (localStorage tabanlı, per-user)
- [x] Adım 5.2: NotebookLM CLI fix (nlm.exe path + PYTHONIOENCODING + doğru komut sözdizimi)
- [x] Adım 5.3: Test ve doğrulama (tüm endpoint'ler çalışır durumda)

---

## TEKNİK KARARLAR

- Backend CLI çağrıları: PowerShell spawn (Windows uyumlu)
- UDF üretimi: Mevcut udf-cli TypeScript modülünü doğrudan import et
- API key: Server-side .env + kullanıcı bazlı override (DB'de encrypted)
- Kesirli paylar: GCD algoritması ile sadeleştirme
