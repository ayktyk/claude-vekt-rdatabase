# MacBook kurulumu ve iki makine düzeni (2026-10-23)

Bu proje Windows PC ve MacBook'ta birlikte geliştirilir. Kod GitHub'dan, dava verisi Google Drive'dan, Claude hafıza
notları Drive aynasından gelir. **GitHub deposu herkese açıktır:** depoya müvekkil/karşı taraf adı, T.C. no, adres,
IBAN, paylaşım linki ya da API anahtarı yazılmaz. Bunlar Drive'da, `tmp/` altında ya da gitignore'daki yerel
dosyalarda durur.

## 1. Kod

En güncel kod `+mempalace` dalındadır (varsayılan `main` dalı geride kalabilir). Dal adındaki `+` yüzünden adı tırnakla
yazın; `git push origin +mempalace` biçimi zorla push anlamına gelir, kullanmayın.

```bash
git clone -b "+mempalace" https://github.com/ayktyk/claude-vekt-rdatabase.git "Eski Claude antıgravıty"
# zaten klon varsa:
git fetch origin && git checkout "+mempalace" && git pull
```

Her iki makinede: işe başlarken `git pull`, iş bitince `git commit` + `git push` (upstream ayarlı olduğu için yalın
`git push`). Aynı dosyayı (AGENTS.md, dersler/*.md, playbook/*) iki makinede aynı anda düzenlemeyin.

## 2. Araçlar

```bash
xcode-select --install
brew install python@3.13 node git uv
# `python` komutu da çalışsın (.mcp.json ve hook'lar `python` çağırır):
echo 'export PATH="$(brew --prefix python@3.13)/libexec/bin:$PATH"' >> ~/.zshenv
python -m pip install -r requirements.txt mcp mempalace
```

`pywin32` kurulmaz; Excel COM adımı (`scripts/excel_takip.py guncelle`) yalnız Windows'ta çalışır. Mac'te Excel için
`scripts/excel_indir.py` ve `scripts/isbu_excel.py` (openpyxl, salt okuma) kullanılır.

## 3. Drive ve yollar

1. Google Drive for desktop'ta büro hesabıyla oturum açın; `1Hukuk Bürosu` klasörü çevrimdışı kullanılabilir olsun.
2. Gerçek yolu bulun: `ls ~/Library/CloudStorage/` (klasör adı `Drive'ım` ya da `My Drive` olabilir).
3. Kontrol: `python scripts/paths.py check`. Yol yanlışsa `config/paths.json`'u değiştirmeyin; makineye özel değeri
   gitignore'daki `config/paths.local.json` dosyasına yazın:

```json
{
  "data_root": { "darwin": "/Users/<kullanıcı>/Library/CloudStorage/GoogleDrive-<hesap>/Drive'ım/1Hukuk Bürosu" },
  "yargipro_cli": { "darwin": "<Yargı PRO > Ayarlar > Komut satırı'ndaki yol>" },
  "buro_excel_onedrive": { "paylasim": "<OneDrive paylaşım linki>" }
}
```

Aynı değerler ortam değişkeniyle de verilebilir: `HUKUK_BUROSU_ROOT`, `YARGIPRO_CLI`, `BURO_EXCEL`.

## 4. Gizli anahtarlar

Depo kökünde `.env` (gitignore) oluşturun ve değerleri Windows'taki `.env` dosyasından elle taşıyın:
`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `ISBU_OFIS_API_KEY` (isteğe bağlı `ISBU_OFIS_API_URL`). Değerler hiçbir dosyaya,
commit'e ya da sohbete yapıştırılmaz.

## 5. Claude hafızası

Hafıza notları dava ayrıntısı içerdiği için git'e girmez; Drive'daki `Sistem/claude-hafiza/` aynası üzerinden eşitlenir.

1. Mac'te depoda bir kez `claude` açın (hafıza klasörü o zaman oluşur), çıkın.
2. `python scripts/hafiza_esitle.py durum` → ne taşınacağını gösterir; `python scripts/hafiza_esitle.py esitle` → taşır.
3. Sonra her oturumun başında ve sonunda, iki makinede de `python scripts/hafiza_esitle.py esitle`.

Eşitleme iki yönlüdür: yalnız bir makinede değişen not öbürüne geçer; iki tarafta değişen hafıza dizini (MEMORY.md) satır satır
birleşir, öteki notlarda yeni olan kazanır. Üzerine yazılan ya da silinen her sürüm `_eski/` altında saklanır.

Genel davranış dosyaları (`~/.claude/CLAUDE.md`, `~/.claude/rules/`) ve MemPalace büro hafızası
(`C:/Users/user/mempalace_palace`, Mac'te `export MEMPALACE_PALACE_PATH="$HOME/mempalace_palace"`) bu eşitlemeye dahil
değildir; bir kez elle kopyalanır.

## 6. MCP ve UYAP araçları

- Yargı PRO masaüstü uygulamasının macOS sürümü kurulur; indirme klasörü `<Drive kökü>/Aktif Davalar` yapılır. CLI
  yolu 3. adımdaki gibi yerel ayara yazılır; CLI yalnız uygulama açıkken çalışır.
- `uv tool install notebooklm-mcp-cli` ve `nlm login`; `npm i -g @tobilu/qmd` ve `qmd update` (dizin yereldir).
- Uzak MCP sunucuları (Yargı PRO, argüman) Claude Code'da yeniden yetkilendirilir.
- UYAP eşitlemesi (`scripts/uyap_esitle.py`) aynı anda YALNIZ BİR makinede çalışır: iki makine aynı Drive kaydını ve
  UYAP kotasını kullanır. Mac'te sürekli çalıştırma: `caffeinate -i python scripts/uyap_esitle.py surekli`.
