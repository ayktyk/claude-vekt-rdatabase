# NotebookLM MCP — Kurulum ve Notebook Hazırlık Rehberi

---

## 1. Kurulum

### uv paket yöneticisini kur

```bash
# Mac / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### NotebookLM MCP sunucusunu kur

```bash
uv tool install notebooklm-mcp-server
```

### Google hesabıyla yetkilendir

```bash
notebooklm-mcp-server auth
```

Tarayıcı açılır, Google hesabınla giriş yap, izin ver.

---

## 2. Claude Code'a Ekle

`~/.claude/settings.json` dosyasını aç. Yoksa oluştur.

```json
{
  "mcpServers": {
    "notebooklm": {
      "command": "notebooklm-mcp-server",
      "args": ["serve"]
    },
    "yargi": {
      "url": "https://yargimcp.fastmcp.app/mcp"
    },
    "mevzuat": {
      "url": "https://mevzuat.surucu.dev/mcp"
    }
  }
}
```

Zaten başka MCP'ler varsa yalnızca `notebooklm` bloğunu mevcut listeye ekle.

---

## 3. Notebook'ları Hazırla

NotebookLM'de dört notebook oluştur. İsimlerin aşağıdakiyle birebir aynı olması gerekiyor.
Büyük/küçük harf ve tire farkı sistemi bozar.

### `hukuk-bilgi-tabani`
İçine yüklenecekler:
- "Dilekçenin Anatomisi" kitabı (PDF)
- Hukuk usulü notların
- Sık başvurduğun akademik makaleler
- Dava türü bazında genel strateji notların

### `emsal-dilekce-arsivi`
İçine yüklenecekler:
- Kendi yazdığın en iyi 15-20 dilekçe (PDF olarak export et)
- Özellikle Yargıtay'dan geçmiş davaların dilekçeleri
- Kazandığın itiraz ve istinaf dilekçeleri

Bu notebook Ajan 2'nin üslup ve argüman yapısı için birincil referansıdır.
Ne kadar çok dilekçe yüklersen çıktı kalitesi o kadar artar.

### `iscilik-hukuku`
İçine yüklenecekler:
- İş Kanunu şerhleri (PDF)
- İş hukuku kitapları
- Tazminat hesaplama notların
- Fazla mesai ispatı, ibra geçersizliği gibi spesifik alan notların

### `yargi-karar-notlari`
İçine yüklenecekler:
- El altında tuttuğun önemli Yargıtay karar özetleri
- Dava kazandıran emsal kararlar
- Dikkat çekici HGK kararları

---

## 4. Kurulumu Test Et

Claude Code'u başlat:

```bash
claude
```

Şunu yaz:

```
NotebookLM MCP bağlı mı? hukuk-bilgi-tabani notebook'unu sorgula:
"İş hukukunda iyi bir dilekçenin temel unsurları nelerdir?"
```

Yanıt geliyorsa sistem hazır.

---

## 5. Sorun Giderme

**"notebooklm-mcp-server komut bulunamadı"**

```bash
export PATH="$HOME/.local/bin:$PATH"
# Bu satırı ~/.zshrc veya ~/.bashrc dosyasına da ekle
```

**"Yetkilendirme hatası"**

```bash
notebooklm-mcp-server auth --reauth
```

**Notebook görünmüyor**
NotebookLM'de notebook isminin CLAUDE.md'deki adlarla birebir eşleştiğini kontrol et.

---

## 6. Güvenlik

NotebookLM'e yalnızca genel hukuki kaynaklar yükle.
Müvekkile ait hiçbir belge (sözleşme, karar, yazışma) bu notebook'lara eklenmez.
Müvekkil verileri her zaman maskelenmiş şekilde API'ye gönderilir.
