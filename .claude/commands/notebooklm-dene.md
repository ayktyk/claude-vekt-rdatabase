# /notebooklm-dene - NotebookLM Entegrasyon Denemesi

Amaç: NotebookLM entegrasyonunun gerçekten çalışıp çalışmadığını kısa bir prova ile görmek.

Ön koşul:

- `nlm` kurulu olmalı
- `nlm login` tamamlanmış olmalı
- Claude Code tarafında NotebookLM MCP bağlı olmalı

Deneme akışı:

1. `nlm notebook list` ile notebook'ları listele.
2. Kullanılacak notebook adını seç veya kullanıcıdan iste:
   - `hukuk-bilgi-tabani`
   - `emsal-dilekce-arsivi`
   - dava bazlı notebook
3. Şu tip kısa bir sorgu çalıştır:
   - "Fazla mesai ispatı bakımından güçlü delil kombinasyonları nelerdir?"
   - "Bu kritik nokta için daha önce kullanılan argümanlar var mı?"
4. Sonucu 5-8 maddelik kısa özet halinde kullanıcıya ver.
5. NotebookLM erişimi yoksa kurulum veya auth eksiklerini listele.
