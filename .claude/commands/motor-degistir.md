---
description: "Aktif motoru bildirir (çıktı frontmatter damgası için; sistem motoru tahmin etmez)"
---
# /motor-degistir — Aktif Motoru Bildir (tek motor)

Sistem **tek motorla** çalışır: oturumu hangi LLM ile açtıysanız o. Alternatif
motor, devir bloğu veya fallback zinciri **yoktur**. Bu komut yalnızca çıktı
frontmatter damgası için **hangi motorla çalışıldığını kaydeder** — sistem tahmin etmez.

## Kullanım

```
motor: <motor-adi>
```

Örnek: `motor: fable-5` · `motor: gemini-cli` · `motor: yerel-llama`

## Ne yapar

```bash
python scripts/motor.py ayarla <motor-adi>   # config/motor-haritasi.json -> aktif_motor
python scripts/motor.py goster               # kayıtlı motoru yazar
python scripts/motor.py damga <task_type>    # çıktı frontmatter'ı üretir
```

Bildirilmemişse her çıktı `engine: bildirilmedi` ile damgalanır; bu bir hata değil,
dürüst beyandır.

## Çıktıdan memnun değilseniz

Aynı ASAMA yeniden üretilir. Çıktı bir denetim noktasıysa (K1, KS, K2) **DENETCI**
(`ajanlar/denetci/SKILL.md`) sıfır bağlamla yeniden denetler; ara çıktıda yapısal kapı +
`havuz_kontrol.py` çalışır, avukat isterse `denetle: <dosya>` ile DENETCI'ye gönderir. "Başka motora ver" seçeneği tek motorlu mimaride yoktur; farklı bir
LLM ile çalışmak istiyorsanız oturumu o araçla açıp `motor: <ad>` bildirirsiniz —
`AGENTS.md` hangi araçtan okunursa okunsun aynıdır.

Tarihçe (iki motorlu dönem, 2026-05-13 → 2026-09-02): `arsiv/eski-notlar/ANTIGRAVITY.md`
