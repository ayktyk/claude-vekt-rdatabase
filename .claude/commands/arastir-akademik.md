# /arastir-akademik - Akademik Doktrin ve Tez Araştırması (2E)

`$ARGUMENTS` kritik noktası için DergiPark akademik makaleleri ve YÖK tezlerini tara.

ASAMA 2 paralel araştırmanın 5'inci alt-işi (2E). Arastirmaci ajanı 2E alt-modunda çalışır.

Sıra:

1. **Literatür MCP (DergiPark)** — min 5 sorgu:
   - `mcp__claude_ai_Literat_r_MCP__search_articles` ile ana terim + 2-3 alternatif
   - 2018-2026 dönem filtresi (yıl-bazlı)
   - En alakalı 3 makaleyi `pdf_to_html` ile tam metin oku.

2. **Yoktez MCP (YÖK Tez Merkezi)** — min 3 sorgu:
   - `mcp__claude_ai_Yoktez_MCP__search_yok_tez_detailed` — doktora + yüksek lisans
   - Son 7 yıl filtresi
   - En alakalı 2 tezin **TOC'tan ilgili 2-3 bölümünü** `get_yok_tez_document_markdown` ile oku (tüm tez çekme YASAK — context tasarrufu).

3. **Atıf zinciri** — en güçlü makalenin `mcp__claude_ai_Literat_r_MCP__get_article_references` ile referansları çek. Referans listesinde Yargıtay kararı/İBK varsa 2B'ye flag düş.

4. **Doktrin çelişki tespiti** — Yazar A: X görüşü vs Yazar B: Y görüşü çatışması varsa raporda göster (hâkim görüş / baskın görüş / azınlık).

5. **Atıf doğrulama** — her atıf için etiket:
   - `[DOGRULANMIS]` — pdf_to_html ile tam metin okundu, görüş içerikle uyumlu
   - `[DOGRULANMASI GEREKIR]` — sadece özet/künye var
   - `[BULUNAMADI]` — arama sonuç döndürmedi → uydurma yazma

6. **Çıktı formatı** — `ajanlar/arastirmaci/SKILL.md` → "Akademik Doktrin ve Tez Bulguları (2E)" bölümünü kullan. Her makale: yazar + dergi/cilt(sayı) + sayfa + DOI/URL + erişim tarihi. Her tez: yazar + üniversite + tip + tez no + ilgili sayfa.

7. **Dilekçe önerisi** — "Öğretide X görüşü hâkimdir/baskındır (Yazar, Yıl)..." tarzı destekleyici kullanım yaz. Doktrin-İçtihat çelişki kuralı: **Yargıtay > doktrin**; doktrin bağlayıcı emsal değildir.

KVKK: DergiPark + YÖK Türkiye sunucusu, kamuya açık veri. Sorguya muvekkil tokenı ([MUVEKKIL_X]) yansıtma — doktrin sorgusu kişiye değil, hukuki probleme yapılır.

Diary Write (iş bitince): `mempalace_diary_write agent_name: "arastirmaci-2E"` ile en önemli 3 öğrenmeyi yaz.

Uydurma yazma — kaynak bulunamazsa rapora `[BULUNAMADI]` ve "manuel arama önerilir" notu düş.
