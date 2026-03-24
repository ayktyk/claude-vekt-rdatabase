# NotebookLM CLI + MCP Entegrasyon Rehberi

Bu rehber `jacob-bd/notebooklm-mcp-cli` paketine göre günceldir.
Eski `notebooklm-mcp-server` akışının yerini artık birleşik paket aldı:

- `nlm` -> CLI otomasyonu
- `notebooklm-mcp` -> MCP sunucusu

Bu sayede NotebookLM'i yalnızca sorgulamak değil, notebook oluşturmak,
kaynak eklemek ve belirli kaynakları yeniden senkronize etmek de mümkün olur.

---

## 1. Kurulum

### `uv` kur

```bash
# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Birleşik paketi kur

```bash
uv tool install notebooklm-mcp-cli
```

Kurulumdan sonra iki komut gelir:

```bash
nlm --help
notebooklm-mcp --help
```

---

## 2. Yetkilendirme

NotebookLM erişimi için Google hesabıyla giriş yap:

```bash
nlm login
```

Kontrol:

```bash
nlm login --check
nlm doctor
```

Notlar:

- Oturum/cookie mantığı kullandığı için zaman zaman `nlm login` tekrarı gerekebilir.
- Araç resmi bir Google API'sine değil, iç API davranışına dayanır.
- Bu yüzden kırılma riski vardır; kritik süreçlerde fallback olarak vektör DB ve Drive akışı korunmalıdır.

---

## 3. Claude Code'a Ekle

Önerilen kurulum:

```bash
nlm setup add claude-code
```

Bu komut NotebookLM MCP yapılandırmasını otomatik ekler.

Elle eklemek istersen `~/.claude/settings.json` içine benzer bir blok gerekir:

```json
{
  "mcpServers": {
    "notebooklm": {
      "command": "notebooklm-mcp",
      "args": []
    }
  }
}
```

Mevcut başka MCP'ler varsa yalnızca `notebooklm` bloğunu ekle.

Kurulumdan sonra Claude Code'u yeniden başlat.

---

## 4. Sistemde Nasıl Konumlandırılmalı

Bu otomasyon sistemi için NotebookLM iki farklı modda kullanılabilir:

### Mod A - Kalıcı bilgi notebook'ları

Büronun ortak, tekrar kullanılan bilgi kaynakları için:

- `hukuk-bilgi-tabani`
- `emsal-dilekce-arsivi`
- `iscilik-hukuku`
- `yargi-karar-notlari`

Bu mod mevcut `CLAUDE.md` akışıyla doğrudan uyumludur.
Araştırma ajanı sabit veya avukatın seçtiği notebook'u sorgular.

### Mod B - Dava bazlı çalışma notebook'u

Her yeni dosya için ayrı NotebookLM notebook üretilebilir:

- örnek: `2026-001-NZ-iscilik-alacagi`

Bu mod özellikle şu durumda değerlidir:

- aynı dosya için çok sayıda PDF, Word, Drive dokümanı ve çalışma notu varsa
- o dosyaya özel podcast, özet, briefing veya sunum üretilecekse
- dava klasörü ile NotebookLM arasında tekrar eden senkron ihtiyacı varsa

Pragmatik öneri:

- Ortak kaynaklar için Mod A
- Büyük ve belge yoğun dosyalar için buna ek olarak Mod B

---

## 5. Otomatik Entegrasyon Modeli

Bu repo ile otomatik entegrasyon teknik olarak mümkündür.
En kritik nokta şudur: NotebookLM'i sistemin birincil veri katmanı değil,
vektör DB ile Google Drive'ın üstüne eklenen ikinci dahili kaynak katmanı olarak kullanmak gerekir.

Önerilen akış:

1. Yeni dava klasörü yerelde veya Drive'da oluşturulur.
2. Eğer dava için çalışma notebook'u isteniyorsa `nlm notebook create` ile notebook açılır.
3. Notebook'a dava klasöründeki PDF/DOCX/Drive kaynakları eklenir.
4. Drive bağlantılı kaynaklar için gerektiğinde `nlm source sync` çalıştırılır.
5. Ajan 2 araştırmada:
   - önce vektör DB
   - sonra Yargı/Mevzuat
   - sonra ilgili NotebookLM notebook
6. NotebookLM çıktıları istenirse tekrar dava klasörüne kaydedilir.

Bu model mevcut mimarinizle çakışmaz.
Tersine, `CLAUDE.md` içindeki "dahili kaynak" katmanını güçlendirir.

---

## 6. Kullanılacak Temel CLI Komutları

### Notebook oluştur

```bash
nlm notebook create "2026-001-NZ-iscilik-alacagi"
```

### Notebook listesini gör

```bash
nlm notebook list
nlm notebook list --json
```

### Kısaltma/alias ata

```bash
nlm alias set dava-2026-001 <notebook-id>
```

### Yerel dosya ekle

```bash
nlm source add dava-2026-001 --file "C:\\dosyalar\\bordro.pdf" --wait
```

### Metin notu ekle

```bash
nlm source add dava-2026-001 --text "Arabuluculukta işveren fazla mesaiyi reddetti." --title "Toplantı Notu"
```

### Drive kaynağı ekle

```bash
nlm source add dava-2026-001 --drive <drive-dosya-id> --wait
```

### Drive kaynaklarını tazele

```bash
nlm source stale dava-2026-001
nlm source sync dava-2026-001 --confirm
```

### Notebook'u sorgula

```bash
nlm notebook query dava-2026-001 "Bu dosyada fazla mesai ispatı için güçlü belgeler hangileri?"
```

---

## 7. Mevcut Sisteme Bağlama

Mevcut `CLAUDE.md` yapısına göre minimum değişiklikle şu yaklaşım uygundur:

### Ajan 0 / Yeni dava akışı

- Dava klasörü oluşturulduğunda opsiyonel olarak bir `NotebookLM notebook adı` alanı da üret.
- Avukat isterse aynı anda çalışma notebook'u aç.

Örnek:

```text
NotebookLM notebook: 2026-001-NZ-iscilik-alacagi
```

### Ajan 2 / Araştırma akışı

Kaynak önceliği aynı kalır:

1. Vektör DB
2. Yargı CLI
3. Mevzuat CLI
4. İlgili NotebookLM notebook

NotebookLM burada özellikle şunlar için değer üretir:

- avukatın kendi çalışma notları
- dava bazlı belge yığınından hızlı sentez
- eski emsal dilekçe arşivinden argüman çıkarımı
- briefing/podcast/slayt gibi ikincil üretimler

### Dosya izleyici ile birlikte kullanım

Şu ayrımı koru:

- Kalıcı hukuki kaynaklar -> vektör DB'ye
- Dava içi geçici çalışma seti -> NotebookLM notebook'a

Böylece her dosyayı iki yerde aynı rol için tutmamış olursun.

---

## 8. Ne Otomatikleştirilebilir

Bu repo ile otomatikleştirilebilenler:

- notebook oluşturma
- notebook listeleme
- notebook sorgulama
- PDF/metin/URL/Drive kaynağı ekleme
- Drive kaynaklarında stale kontrolü
- stale kaynakları senkronize etme
- ses, video, rapor, slayt gibi Studio çıktıları üretme
- çıktıları dosya olarak indirme

Sizin sisteminiz açısından en değerli otomasyonlar:

- yeni dava açılınca çalışma notebook'u oluşturma
- dava klasöründeki seçili belgeleri notebook'a ekleme
- Drive değişince notebook kaynaklarını sync etme
- araştırma raporu öncesi notebook sorgusunu standart adım haline getirme

---

## 9. Sınırlar ve Riskler

Bu entegrasyonu kurabiliriz, ama şu sınırlarla:

- Resmi API değil; iç API davranışı değişirse entegrasyon kırılabilir.
- Giriş oturumu/cookie yenilemesi gerekebilir.
- MCP tarafında çok sayıda tool gelir; kullanılmadığı zaman devre dışı tutmak context açısından faydalıdır.
- Müvekkil verisi NotebookLM'e kör biçimde yüklenmemeli.

Güvenlik kuralı:

- Genel hukuk kaynakları, emsal dilekçeler, anonimleştirilmiş çalışma notları yüklenir.
- Ham müvekkil evrakı ancak gerekiyorsa ve maskelenmişse yüklenir.

---

## 10. Test

Önce CLI testi:

```bash
nlm notebook list
```

Sonra MCP testi:

```text
NotebookLM MCP bağlı mı?
`hukuk-bilgi-tabani` veya dava notebook'unu sorgula:
"Fazla mesai ispatı bakımından güçlü delil kombinasyonları nelerdir?"
```

Yanıt geliyorsa bağlantı hazırdır.

---

## 11. Sonuç

Evet, `jacob-bd/notebooklm-mcp-cli` ile NotebookLM çalışma notebook'larını
sisteme otomatik entegre etmek mümkündür.

En doğru model:

- vektör DB'yi kalıcı hukuk kütüphanesi olarak bırakmak
- NotebookLM'i dava bazlı çalışma notebook'u ve dahili sentez katmanı olarak eklemek
- Drive değişikliklerinde `nlm source sync` ile güncelliği korumak

Tam otomasyon istenirse bir sonraki adımda şu parçalardan biri yazılabilir:

- `yeni-dava` akışına NotebookLM notebook oluşturma adımı eklemek
- dava klasöründen NotebookLM'e kaynak yükleyen bir PowerShell scripti eklemek
- araştırma ajanına standart `nlm notebook query` adımı eklemek
