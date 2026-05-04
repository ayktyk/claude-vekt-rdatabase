# /arastir-mevzuat — Mevzuat MCP Derin Protokolü (FIVEAGENTS ASAMA 2C)

`$ARGUMENTS` kritik noktasının mevzuat dayanaklarını **FIVEAGENTS.md ASAMA 2C**
protokolüne uyarak çıkar. Mevcut kısa prompt YASAK — bu komut tam protokolü
zorunlu uygular.

## Zorunlu Referans Dokümanlar
- `FIVEAGENTS.md` → ASAMA 2C (satır ~656 civarı) + Normlar Hiyerarşisi (satır ~780)
- `ajanlar/arastirmaci/SKILL.md` → Bölüm 2 (Mevzuat MCP Derin Protokolü, 4 Faz + Mulga) + Bölüm 2.5 (Mulga Eleme)

## Girdi (Zorunlu)
2B'nin verdiği `02-Arastirma/atif-maddeleri.json` — 2C bu olmadan başlayamaz.

## Zorunlu Adımlar (Min 8 Sorgu / 9 Faz + Mulga Denetim)

### Faz 1 — Ana Kanun Maddesi (Query 1-3)
- `search_mevzuat(query="<kanun adı>", page_size=20)` — **page_size her zaman 20'nin altında**
- `search_kanun(kanun_no=N)` (kanun no biliniyorsa daha hassas)
- `get_mevzuat_madde_tree(mevzuat_id=...)` — kanun başına 1 kez (cache'lenir)
- `get_mevzuat_content(madde_id=...)`

### Faz 2 — Madde Değişiklik Geçmişi (Query 4-5)
- `get_mevzuat_gerekce(madde_id=...)`
- Olay tarihine göre doğru versiyon tespiti

### Faz 3 — İlgili Madde Zinciri (Query 6-9)
- Önceki/sonraki madde + atıf maddeleri

### Faz 4 — Alt Mevzuat (Query 10-12)
- Yönetmelik + tebliğ + genelge

### Faz 5 — Hiyerarşik Etiketleme (Normlar Hiyerarşisi, ZORUNLU)
- Anayasa / Antlaşma / Kanun / OHAL CBK / İBK / Tüzük / Yönetmelik / Tebliğ
- Her bulunan hüküm için seviye etiketi

### Faz 6 — Norm Denetimi
- Sınır aşımı + CBK münhasır kanun alanı kontrolü

### Faz 7 — Çatışma Analizi
- Lex Superior / Specialis / Posterior

### Faz 8 — Zımni İlga Taraması

### Faz 9 — LLM Web Fallback (CLI ulaşamayan hüküm için)
- WebSearch + kaynak URL + tarih ZORUNLU

## Mulga Eleme Protokolü (Kalite Kapısı)
2B'den gelen her karar için atıf maddesi denetimi:
1. **Yürürlük:** madde bugün yürürlükte mi?
2. **Mülga tarihi:** yürürlükten kaldırıldı mı?
3. **Olay tarihi versiyonu:** o tarihte hangi versiyon?
4. **Zımni ilga:** yeni kanun eskiyi ilga etmiş mi?

Eleme kararı:
- GEÇERLİ → rapora alınır
- TARİH UYUMSUZ → "olay tarihi versiyonu Y" notuyla alınır
- MULGA ATIF → `[DEĞER YOK — mülga atıf]` ELENİR
- ZIMNİ İLGA → `[ESKİ NORM]` ELENİR

**Eleme sonrası geçerli karar < 5 ise:** 2B'ye geri dön, 3 alternatif terimle ek arama.

## Kanun Cache (Faz B'de devreye girer)
Aynı kanun ikinci sorguda cache'ten okunur:
```json
{"6098": {"tree_fetched": true, "articles": {"344": "fetched"}}}
```

## Çıktı Dosyaları (Zorunlu)
- `02-Arastirma/mevzuat-bulgulari.md` — kanunlar + maddeler + hiyerarşi
- `02-Arastirma/mulga-eleme.json` — eleme tablosu (geçerli/elenen)

## Sentez Aşaması — ZORUNLU Bridge Çağrısı
```bash
ASAMA=2C DAVA_ID="<dava-id>" \
  bash scripts/gemini-bridge.sh arastirma_sentezi \
    tmp/.gemini-input-mevzuat-{dava-id}.md \
    tmp/.gemini-output-mevzuat-{dava-id}.md
```

## Kalite Kapısı
- [ ] `atif-maddeleri.json` (2B çıkışı) okundu mu?
- [ ] Min 8 sorgu yapıldı mı?
- [ ] `page_size: 20` her search'te explicit verildi mi?
- [ ] Madde ağacı kanun başına 1 kez çekildi mi (cache)?
- [ ] `mulga-eleme.json` doldu mu?
- [ ] Geçerli karar ≥ 5 mi (yoksa 2B'ye geri dön)?
- [ ] Normlar Hiyerarşisi etiketleri var mı?
- [ ] Çatışma analizi (Lex Superior/Specialis/Posterior) yapıldı mı?
- [ ] Engine frontmatter var mı (sentez bridge çıktısında)?
