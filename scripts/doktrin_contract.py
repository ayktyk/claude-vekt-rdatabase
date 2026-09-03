"""doktrin_contract.py — 0-Halüsinasyon + Anti-Sycophancy DOKTRİN KONTRATI.

Tek doğruluk kaynağı (single source of truth). Üç validator bunu import eder:
  - doktrin_lint.py   → prompt yüzeyleri preamble + clause taşıyor mu? (prompt-side)
  - cikti_dogrula.py  → dönen çıktı SENTINEL + Kaynak tablosu + Aleyhe beyanı taşıyor mu? (output-side)
  - blog_validator.py → cikti_dogrula + TBB + SEO (blog-side)

Bu dosya DEĞİŞTİRİLİRSE `prompts/_doktrin-preamble.md` ve testler senkron güncellenir.
Token eşleşmeleri Türkçe İ/ı sorunlarından kaçınmak için BÜYÜK/KÜÇÜK harfe DUYARLI
(case-sensitive) substring karşılaştırmasıdır — .lower() kullanılmaz.
"""
from __future__ import annotations

import re

# --- Air-gap köprüsü: Gemini çıktıya bunu AYNEN echo etmeli ---
SENTINEL = "<!-- DOKTRIN-PREAMBLE v1 -->"
PREAMBLE_VERSION = "v1"

# --- Prompt-side lint: doktrin taşıyan her prompt bu tokenleri AYNEN içermeli ---
# (case-sensitive; tokenler prompts/_doktrin-preamble.md'de birebir geçer)
REQUIRED_CLAUSE_TOKENS = [
    "UYDURMA YARGITAY",        # Yasak 1: uydurma karar atfı
    "ALINTISI UYDURULAMAZ",    # Yasak 2: alıntı uydurma
    "BAĞLAM KORUNMALI",        # Yasak 3: bağlam koruma (89/4→89/3)
    "LEHE YORUM YASAK",        # Yasak 4: anti-sycophancy
    "KAYNAK YOK",              # Yasak 5: dürüstlük
    "ÇİFT KAYNAK",             # Pozitif: çift kaynak doğrulama
    "KAYNAK DOĞRULAMA",        # Pozitif: doğrulama tablosu zorunlu
    "ALEYHE İÇTİHAT",          # Pozitif: aleyhe içtihat beyanı
    "ÇIKARIM GEÇERLİLİĞİ",     # Yasak 9: gerçek kaynaktan geçersiz sonuç (2026-09-02)
]

# --- Output-side: Kaynak Doğrulama Tablosu grameri (sabit kolonlar) ---
KAYNAK_TABLE_COLUMNS = ["İddia", "Kaynak", "documentId", "Tam Alıntı", "Doğrulama"]
# Tablo başlık satırı bu anahtar kolonların hepsini içermeli:
KAYNAK_TABLE_KEY_COLUMNS = ["İddia", "Kaynak", "documentId", "Doğrulama"]

# --- Output-side: Aleyhe içtihat beyanı (sycophancy-by-absence dedektörü) ---
ALEYHE_DECL_LABEL = "Aleyhe içtihat:"
ALEYHE_DECL_VALUES = ["VAR", "YOK", "ARANMADI"]

# --- TBB reklam yasağı / aşırı vaat ifadeleri (anti-sycophancy ek tarama) ---
TBB_BANNED_PHRASES = [
    "en iyi avukat",
    "ülkenin en başarılı",
    "lider hukuk bürosu",
    "garantili kazanım",
    "garanti ediyoruz",
    "%100 başarı",
    "yüzde yüz başarı",
    "kesin başarı",
    "kesin kazan",          # "kesin kazanırsınız" / "kesin kazanç"
    "mutlaka kazan",
    "asla kaybet",
    "kesin sonuç",
    "size kesin",
]

# Doğrulama-durumu işaretçileri (her künye satırı bunlardan birini taşımalı)
VERIFIED_TOKENS = ["✓ Tam metin çekildi", "Tam metin çekildi", "DOĞRULANMIŞ", "verified"]
UNVERIFIED_TOKENS = ["DOĞRULANMAMIŞ", "DOĞRULANMASI GEREKİR"]

# Yargıtay/HGK/İBK künye paterni (gövdede künye var mı tespiti için)
KUNYE_RE = re.compile(
    r"\b(?:Yargıtay\s+)?\d{1,2}\.?\s*(?:HD|CD|HGK|CGK)\b|"
    r"\bE\.?\s*\d{4}/\d+\b|\bK\.?\s*\d{4}/\d+\b|"
    r"\b[İI]BK\b",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Paylaşılan saf yardımcılar (DRY — üç validator da kullanır)
# ---------------------------------------------------------------------------

def has_sentinel(text: str) -> bool:
    """SENTINEL satırı metinde var mı (air-gap echo kanıtı)."""
    return SENTINEL in text


def missing_clauses(text: str) -> list[str]:
    """Eksik zorunlu doktrin clause tokenlerini döndürür (boş liste = tam)."""
    return [tok for tok in REQUIRED_CLAUSE_TOKENS if tok not in text]


def has_kaynak_table(text: str) -> bool:
    """Kaynak Doğrulama Tablosu başlık satırı var mı (anahtar kolonların hepsi tek satırda)."""
    for line in text.splitlines():
        if "|" in line and all(col in line for col in KAYNAK_TABLE_KEY_COLUMNS):
            return True
    return False


def has_aleyhe_declaration(text: str) -> bool:
    """ 'Aleyhe içtihat: VAR/YOK/ARANMADI' beyanı var mı."""
    idx = text.find(ALEYHE_DECL_LABEL)
    if idx == -1:
        return False
    tail = text[idx: idx + len(ALEYHE_DECL_LABEL) + 40]
    return any(v in tail for v in ALEYHE_DECL_VALUES)


def find_banned_phrases(text: str) -> list[str]:
    """Metinde geçen TBB yasak / aşırı vaat ifadelerini döndürür."""
    low = text.casefold()
    return [p for p in TBB_BANNED_PHRASES if p.casefold() in low]


def body_has_kunye(text: str) -> bool:
    """Gövdede Yargıtay künye paterni var mı."""
    return KUNYE_RE.search(text) is not None


# ---------------------------------------------------------------------------
# Enjekte edilecek kompakt başlık (tüm prompt yüzeylerine AYNEN eklenir)
# ---------------------------------------------------------------------------
# Tam doktrin: prompts/_doktrin-preamble.md. Bu kompakt blok tüm 9 clause token'ı
# + SENTINEL'i içerir; doktrin_lint bu tokenleri arar. Prompt dosyalarına bunu
# prepend etmek lint'i geçirir; devir bloğuna TAM preamble gömülür.
STANDARD_HEADER = """<!-- DOKTRIN-PREAMBLE v1 -->
> **0-HALÜSİNASYON + ANTI-SYCOPHANCY (zorunlu — tam metin: `prompts/_doktrin-preamble.md`):**
> - UYDURMA YARGITAY/HGK/İBK kararı atfı YASAK — her künye Bedesten documentId ile doğrulanır; doğrulanmayan "DOĞRULANMAMIŞ" damgalanır.
> - Karar metni ALINTISI UYDURULAMAZ — tırnak içi alıntı birebir kaynaktan.
> - BAĞLAM KORUNMALI — bir fıkranın cevabı başka fıkraya genellenemez.
> - Avukatı memnun etmek için LEHE YORUM YASAK; ALEYHE İÇTİHAT açıkça gösterilir, gizlenmez.
> - "KAYNAK YOK" demek dürüstlüktür — sayı doldurmak için uydurma atıf HARD FAIL.
> - Kritik kuralda ÇİFT KAYNAK şart.
> - ÇIKARIM GEÇERLİLİĞİ: Kaynak gerçek olsa dahi ondan çıkarılan sonuç geçersizse HARD FAIL — bağlam kayması, meşru olmayan genelleme, caiz olmayan kıyas, bilinçli susmayı boşluk sayma reddedilir.
> - Çıktının sonunda KAYNAK DOĞRULAMA tablosu (| İddia | Kaynak | documentId | Tam Alıntı | Doğrulama |) + "Aleyhe içtihat: VAR/YOK/ARANMADI" beyanı ZORUNLU.
"""

# ---------------------------------------------------------------------------
# KVKK allowlist — KAMUYA AÇIK ama naive dedektörü tetikleyen değerler
# ---------------------------------------------------------------------------
# Avukatın baro sicil no'su checksum-geçerli bir TC desenidir (FC10) → leak sayma.
LAWYER_NAME = "Aykut Yeşilkaya"
ALLOWLIST_NUMBERS = {
    "20096838578",  # Aykut Yeşilkaya baro sicil no (kamuya açık, TC değil)
}
