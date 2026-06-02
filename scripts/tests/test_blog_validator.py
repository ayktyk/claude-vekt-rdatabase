"""blog_validator.py trust + SEO kapısı testleri.

Çalıştır: python -m pytest scripts/tests/test_blog_validator.py -q
"""
import blog_validator as bv
import doktrin_contract as dc

SENT = dc.SENTINEL


def _clean_blog() -> str:
    fm = (
        "---\n"
        "slug: istifa-eden-isci-kidem-tazminati\n"
        'seoTitle: "İstifa Eden İşçi Kıdem Tazminatı Alabilir mi Detaylı Rehber"\n'
        'seoDescription: "İstifa eden işçinin kıdem tazminatı hakkı, haklı fesih şartları ve Yargıtay yaklaşımı bu rehberde adım adım, güncel içtihatla açıklanıyor."\n'
        "tldr: |\n"
        "  İstifa eden işçi kural olarak kıdem tazminatı alamaz ancak işverenin haklı\n"
        "  fesih sayılan ihlalleri varsa hak doğar. Yargıtay ödenmeyen ücret ve fazla\n"
        "  mesaiyi haklı neden saymaktadır; somut olayda belge ve tanık önemlidir burada.\n"
        "emsal_kararlar:\n"
        "  - bedesten_id: bedesten:abc123\n"
        "    verified: true\n"
        "---\n"
    )
    body = (
        "# İstifa Eden İşçi Kıdem Tazminatı Alabilir mi?\n\n"
        "Aleyhe içtihat: VAR (aksi yönde 9. HD kararları mevcut)\n\n"
        "## Olay\nMetin.\n\n## Mahkeme Ne Dedi\n"
        "Yargıtay 9. HD E.2024/123 K.2024/456 kararında ele alındı. Kaynak: mevzuat.gov.tr\n\n"
        "## Okuyucu İçin Anlamı\nMetin.\n\n## Aleyhe İçtihat / Risk\n"
        "Aksi yönde kararlar da vardır; somut olaya bağlıdır.\n\n"
        "## Sık Sorulan Sorular\n"
        "### Soru 1\nCevap.\n### Soru 2\nCevap.\n### Soru 3\nCevap.\n"
        "### Soru 4\nCevap.\n### Soru 5\nCevap.\n\n"
        '<script type="application/ld+json">{"@graph":['
        '{"@type":"Article"},{"@type":"FAQPage"},{"@type":"Person"},'
        '{"@type":"Organization"},{"@type":"BreadcrumbList"}]}</script>\n'
        'og:title meta var\n'
    )
    return SENT + "\n" + fm + body


def test_temiz_blog_hard_fail_yok():
    hard, warn = bv.validate_blog(_clean_blog(), denylist=[], author_path=None)
    assert hard == [], f"temiz blog HARD FAIL almamalı: {hard}"


def test_verified_false_hard_fail():
    metin = _clean_blog().replace("verified: true", "verified: false")
    hard, _ = bv.validate_blog(metin, denylist=[], author_path=None)
    assert any("verified:false" in h for h in hard)


def test_tbb_yasak_ifade_hard_fail():
    metin = _clean_blog() + "\nDavanızı garantili kazanım ile sonuçlandırırız.\n"
    hard, _ = bv.validate_blog(metin, denylist=[], author_path=None)
    assert any("TBB" in h for h in hard)


def test_kvkk_tc_hard_fail():
    metin = _clean_blog() + "\nMüvekkil TC: 10000000078\n"
    hard, _ = bv.validate_blog(metin, denylist=[], author_path=None)
    assert any("TC" in h for h in hard)


def test_sentinel_yok_hard_fail():
    metin = _clean_blog().replace(SENT, "", 1)
    hard, _ = bv.validate_blog(metin, denylist=[], author_path=None)
    assert any("SENTINEL" in h for h in hard)


def test_dogrulanmamis_kunye_hard_fail():
    # frontmatter'dan emsal bloğunu çıkar; gövdede künye kalsın → doğrulanmamış
    metin = _clean_blog().replace(
        "emsal_kararlar:\n  - bedesten_id: bedesten:abc123\n    verified: true\n", ""
    )
    hard, _ = bv.validate_blog(metin, denylist=[], author_path=None)
    assert any("künye" in h or "emsal" in h for h in hard)
