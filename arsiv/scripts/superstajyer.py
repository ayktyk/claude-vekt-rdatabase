#!/usr/bin/env python3
"""
2A Suer Stajyer Otomasyonu — CDP Attach + Playwright

Mevcut acik Chrome'a (port 9222) baglanir, Suer Stajyer sekmesinde prompt'u
yapistirir, cevabi polling ile bekler, UTF-8 olarak Drive'a yazar.

Tur-basina guvenli motor (`send_turn_and_wait`):
  - Gondermeden once "uretim bitti mi" boslta-bekleme kilidi (spam onleme).
  - Insan-gibi gecikme (turn_delay_sec + jitter).
  - Tamamlanma DELTA-tabanli: bu turda uretilen cevap buyuyup duruyor mu
    (eski "ekranda marker var mi" yontemi cok-turlu sohbette bayat damgaya
    takiliyordu — o hata duzeltildi). Marker yalniz SON tur icin ve YENI
    olusum (occurrence artisi) sartiyla hizli-yol olarak kullanilir.

Kullanim:
  python superstajyer.py health
    -> CDP baglantisini ve acik sekme sayisini dogrular.

  python superstajyer.py run --prompt-file <yol> --output <yol> [--config <yol>]
    -> Tek turu (son tur) yapistir, cevabi bekle, dosyaya yaz. Adaptif
       iterasyonda her gruplu turu ayri `run` ile gonderebilirsin; script
       her cagride onceki uretim bitene kadar bekledigi icin pes pese
       cagri dahi guvenli serilesir.

  python superstajyer.py run-batch --batch-file <yol> --output <yol> [--config <yol>]
    -> Planli sira: batch dosyasini `===BATCH===` ayraciyla turlara boler,
       her turu sirayla gonderir (son tur is_final), turlar arasi kilit +
       insan gecikmesi script icinde garanti. Tum konusmayi dosyaya yazar.

Cikis kodlari:
  0 -> basari
  10 -> CDP baglantisi yok (Chrome --remote-debugging-port=9222 ile baslatilmali)
  20 -> Suer Stajyer sekmesi bulunamadi VE yeni sekme acilamadi (login eksik)
  30 -> Cevap timeout (tur tamamlanmadi — kismi cevap yazilir)
  40 -> Config dosyasi eksik veya gecersiz
  50 -> Beklenmeyen Playwright hatasi
"""
from __future__ import annotations

import argparse
import json
import random
import sys
import time
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeoutError
except ImportError:
    sys.stderr.write(
        "[FATAL] playwright kurulu degil.\n"
        "  Kurulum: pip install playwright && playwright install chromium\n"
    )
    sys.exit(50)


DEFAULT_CONFIG = Path(__file__).resolve().parent.parent / "config" / "superstajyer.json"
CDP_URL = "http://localhost:9222"


def load_config(path: Path) -> dict:
    if not path.exists():
        sys.stderr.write(f"[FATAL] config bulunamadi: {path}\n")
        sys.exit(40)
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        sys.stderr.write(f"[FATAL] config gecersiz JSON: {e}\n")
        sys.exit(40)


def connect_cdp(p):
    try:
        return p.chromium.connect_over_cdp(CDP_URL)
    except Exception as e:
        sys.stderr.write(
            f"[FATAL] CDP baglanti yok: {e}\n"
            "  Cozum:\n"
            "    1. Mevcut Chrome'u kapat (sistem tray dahil)\n"
            "    2. scripts/launch-chrome-cdp.ps1 ile Chrome'u ac\n"
            "    3. curl http://localhost:9222/json/version ile dogrula\n"
        )
        sys.exit(10)


def find_or_open_ss_tab(browser, cfg: dict):
    """Suer Stajyer sekmesi varsa onu dondur, yoksa yeni sekme ac + URL'e git."""
    if not browser.contexts:
        sys.stderr.write("[FATAL] CDP'de context yok\n")
        sys.exit(10)
    context = browser.contexts[0]
    url_match = cfg.get("url_match", "")
    page = None
    for pg in context.pages:
        try:
            if url_match and url_match in pg.url:
                page = pg
                break
        except Exception:
            continue
    if page is None:
        page = context.new_page()
        url = cfg.get("url")
        if not url:
            sys.stderr.write("[FATAL] config.url eksik\n")
            sys.exit(40)
        page.goto(url, wait_until="domcontentloaded")
        # Login bekleme — kullaniciya gor
        try:
            page.wait_for_selector(cfg["prompt_selector"], timeout=15_000)
        except PWTimeoutError:
            sys.stderr.write(
                "[FATAL] Suer Stajyer sayfasinda prompt input bulunamadi.\n"
                "  Muhtemelen login eksik veya selector hatali.\n"
                f"  Selector denendi: {cfg['prompt_selector']}\n"
            )
            sys.exit(20)
    return page


def cmd_health():
    """CDP baglantisini ve sekmeleri raporla."""
    with sync_playwright() as p:
        browser = connect_cdp(p)
        contexts = browser.contexts
        n_pages = sum(len(ctx.pages) for ctx in contexts)
        urls = []
        for ctx in contexts:
            for pg in ctx.pages:
                try:
                    urls.append(pg.url)
                except Exception:
                    urls.append("<unreadable>")
        print(f"[OK] CDP baglandi. {len(contexts)} context, {n_pages} sekme.")
        for u in urls[:10]:
            print(f"  - {u[:120]}")


def _read_body(page, response_sel: str) -> str:
    """Response container metnini oku. Hata SESSIZ YUTULMAZ.

    Timeout (içerik henüz gelmedi) beklenen durumdur -> sessiz "" döner.
    Diğer hatalar (selector kayıp / sayfa kapandı) -> stderr'e UYARI basar; yine
    "" döner ama operatör artık sessiz kesilmeyi (yanlış 'tamamlandı' sayımını)
    görebilir. Eski blanket-except, kesik araştırmayı sessizce 'bitti' sanıyordu.
    """
    try:
        return page.locator(response_sel).inner_text(timeout=5_000)
    except PWTimeoutError:
        return ""
    except Exception as e:
        print(
            f"[UYARI] _read_body okuma hatasi ({type(e).__name__}): {e} | "
            f"selector='{response_sel}' — yanit kesik olabilir, 'tamamlandi' SAYILMAZ.",
            file=sys.stderr,
        )
        return ""


def _submit_prompt(page, cfg: dict, prompt_text: str):
    """Prompt'u input alanina yaz + gonder (ProseMirror type veya klasik fill)."""
    prompt_sel = cfg["prompt_selector"]
    prompt_method = cfg.get("prompt_method", "fill")
    if prompt_method == "type":
        # ProseMirror / contenteditable icin: click + temizle + type
        locator = page.locator(prompt_sel)
        locator.click()
        page.keyboard.press("Control+A")
        page.keyboard.press("Delete")
        # delay=5ms her karakter arasinda — typing-detection bypass + reliability
        page.keyboard.type(prompt_text, delay=5)
    else:
        # Klasik textarea/input
        page.fill(prompt_sel, prompt_text)

    submit_sel = cfg.get("submit_selector")
    if submit_sel:
        page.click(submit_sel)
    else:
        # Enter ile gonder (Suer Stajyer canli test 2026-05-15)
        page.keyboard.press("Enter")


def send_turn_and_wait(page, cfg: dict, prompt_text: str, is_final: bool,
                       turn_label: str = "") -> tuple[bool, str]:
    """Tek bir gruplu turu gonder, cevabin TAM gelmesini bekle.

    Insan-gibi + spam-korumali tur motoru. Donus: (completed, body) — body
    response container'in (genelde <main>) tum konusma metnidir.

    Sira:
      1. Boslta bekle: onceki uretim bitmeden (metin hala buyurken) GONDERME.
      2. Insan-gibi gecikme (turn_delay_sec + 0..jitter).
      3. Baseline: pre_len + completion_marker mevcut olusum sayisi.
      4. Yaz + gonder.
      5. Basladi tespiti: metin pre_len + len(prompt) + min_growth esigini
         gecmeli (soru yankisi + cevabin gercekten baslamasi). Bu, modelin
         ilk-token gecikmesini "bitti" sanmamizi onler.
      6. Bitti tespiti: SON tur ve YENI marker olustuysa -> tamam (hizli yol);
         aksi halde uzunluk turn_stability_ticks boyunca sabitse -> tamam.
    """
    response_sel = cfg["response_selector"]
    completion_marker = cfg.get("completion_marker", "ARASTIRMA TAMAMLANDI")
    poll_interval = int(cfg.get("poll_interval_sec", 3))
    timeout_sec = int(cfg.get("timeout_sec", 600))
    idle_stable_ticks = int(cfg.get("idle_stable_ticks", 3))
    turn_stability_ticks = int(cfg.get("turn_stability_ticks", 6))
    min_growth_chars = int(cfg.get("min_growth_chars", 30))
    turn_delay_sec = float(cfg.get("turn_delay_sec", 4))
    turn_delay_jitter_sec = float(cfg.get("turn_delay_jitter_sec", 3))

    tag = f"[{turn_label}] " if turn_label else ""

    # 1) Boslta bekle — onceki uretim bitmeden yeni tur gonderme (SPAM KILIDI)
    sys.stderr.write(f"{tag}boslta bekleniyor (onceki uretim bitti mi)...\n")
    idle_last = -1
    idle_ticks = 0
    idle_deadline = time.time() + timeout_sec
    while time.time() < idle_deadline:
        cur = len(_read_body(page, response_sel))
        if cur == idle_last:
            idle_ticks += 1
            if idle_ticks >= idle_stable_ticks:
                break
        else:
            idle_ticks = 0
            idle_last = cur
        time.sleep(poll_interval)

    # 2) Insan-gibi gecikme
    delay = turn_delay_sec + random.uniform(0, turn_delay_jitter_sec)
    sys.stderr.write(f"{tag}insan gecikmesi: {delay:.1f}s\n")
    time.sleep(delay)

    # 3) Baseline (gonderim ONCESI)
    pre_body = _read_body(page, response_sel)
    pre_len = len(pre_body)
    marker_before = pre_body.count(completion_marker) if completion_marker else 0

    # 4) Yaz + gonder
    try:
        _submit_prompt(page, cfg, prompt_text)
    except Exception as e:
        sys.stderr.write(f"[FATAL] {tag}prompt gonderme hatasi: {e}\n")
        sys.exit(50)
    sys.stderr.write(f"{tag}gonderildi ({len(prompt_text)} karakter), cevap bekleniyor...\n")

    # 5+6) Tek dongude: basladi tespiti -> stabilizasyon / yeni marker
    start_threshold = pre_len + len(prompt_text) + min_growth_chars
    deadline = time.time() + timeout_sec
    last_len = -1
    stable_ticks = 0
    started = False
    body = pre_body
    completed = False
    while time.time() < deadline:
        body = _read_body(page, response_sel)
        cur_len = len(body)

        # SON tur hizli yolu: bu turda YENI bir completion_marker olustu mu?
        if is_final and completion_marker and body.count(completion_marker) > marker_before:
            completed = True
            sys.stderr.write(f"{tag}yeni '{completion_marker}' damgasi gorundu — tur tamam.\n")
            break

        if not started:
            # Cevap soru yankisinin otesinde gercekten buyudu mu?
            if cur_len >= start_threshold:
                started = True
                last_len = cur_len
                stable_ticks = 0
            time.sleep(poll_interval)
            continue

        # Basladi: uzunluk stabilizasyonu ile bitis tespiti
        if cur_len == last_len:
            stable_ticks += 1
            if stable_ticks >= turn_stability_ticks:
                completed = True
                sys.stderr.write(
                    f"{tag}cevap {turn_stability_ticks * poll_interval}s sabit — tur tamam.\n"
                )
                break
        else:
            stable_ticks = 0
            last_len = cur_len
        time.sleep(poll_interval)

    if not completed:
        sys.stderr.write(
            f"[WARN] {tag}{timeout_sec}s icinde tur tamamlanmadi "
            f"(basladi={started}, son uzunluk={len(body)}).\n"
        )
    return completed, body


def cmd_run(prompt_file: Path, output_file: Path, config_file: Path):
    """Tek tur (son tur kabul edilir) gonder ve cevabi dosyaya yaz."""
    cfg = load_config(config_file)
    if not prompt_file.exists():
        sys.stderr.write(f"[FATAL] prompt dosyasi yok: {prompt_file}\n")
        sys.exit(40)
    prompt_text = prompt_file.read_text(encoding="utf-8")
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = connect_cdp(p)
        page = find_or_open_ss_tab(browser, cfg)

        completed, body = send_turn_and_wait(
            page, cfg, prompt_text, is_final=True, turn_label="tek tur"
        )
        # Kismi cevap dahi yazilir (debug + kesinti guvenligi)
        output_file.write_text(body, encoding="utf-8")
        if not completed:
            sys.stderr.write(
                f"[FATAL] cevap tamamlanmadi. Kismi cevap yazildi: {output_file}\n"
            )
            sys.exit(30)
        print(f"[OK] yazildi: {output_file}")
        print(f"     uzunluk: {len(body):,} karakter ({len(body)/1024:.1f} KB)")


def cmd_run_batch(batch_file: Path, output_file: Path, config_file: Path):
    """Planli sira: batch dosyasini turlara bol, sirayla gonder, hepsini bekle.

    Turlar `===BATCH===` (config.batch_separator) ile ayrilir. Her tur
    `send_turn_and_wait` ile gonderilir; turlar arasi boslta-kilit + insan
    gecikmesi script icinde garanti edilir (orkestrator spam edemez).
    Son tur is_final=True ile gonderilir (ARASTIRMA TAMAMLANDI beklenir).
    """
    cfg = load_config(config_file)
    if not batch_file.exists():
        sys.stderr.write(f"[FATAL] batch dosyasi yok: {batch_file}\n")
        sys.exit(40)
    raw = batch_file.read_text(encoding="utf-8")
    separator = cfg.get("batch_separator", "===BATCH===")
    batches = [b.strip() for b in raw.split(separator) if b.strip()]
    if not batches:
        sys.stderr.write(
            f"[FATAL] batch dosyasinda tur bulunamadi "
            f"(ayrac: '{separator}').\n"
        )
        sys.exit(40)
    max_turns = int(cfg.get("max_turns", 5))
    if len(batches) > max_turns:
        sys.stderr.write(
            f"[FATAL] {len(batches)} tur > max_turns ({max_turns}). "
            f"Sorulari daha az/daha toplu batch'e indir.\n"
        )
        sys.exit(40)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = connect_cdp(p)
        page = find_or_open_ss_tab(browser, cfg)

        body = ""
        total = len(batches)
        for i, batch in enumerate(batches):
            is_final = (i == total - 1)
            label = f"tur {i + 1}/{total}"
            print(f"[..] {label} gonderiliyor ({len(batch):,} karakter, son={is_final})...")
            completed, body = send_turn_and_wait(
                page, cfg, batch, is_final=is_final, turn_label=label
            )
            # Her tur sonrasi ara kayit (kesinti guvenligi)
            output_file.write_text(body, encoding="utf-8")
            if not completed:
                sys.stderr.write(
                    f"[FATAL] {label} tamamlanmadi. Kismi konusma yazildi: {output_file}\n"
                )
                sys.exit(30)
            print(f"[OK] {label} tamam. Birikmis konusma: {len(body):,} karakter.")

        print(f"[OK] yazildi: {output_file}")
        print(f"     {total} tur, {len(body):,} karakter ({len(body)/1024:.1f} KB)")


def main():
    parser = argparse.ArgumentParser(description="Suer Stajyer CDP otomasyonu")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("health", help="CDP baglantisini dogrula")

    p_run = sub.add_parser("run", help="Tek tur (son tur) yapistir, cevabi cek")
    p_run.add_argument("--prompt-file", type=Path, required=True)
    p_run.add_argument("--output", type=Path, required=True)
    p_run.add_argument("--config", type=Path, default=DEFAULT_CONFIG)

    p_batch = sub.add_parser(
        "run-batch",
        help="Cok-turlu planli sira: ===BATCH=== ayracli dosyayi sirayla gonder",
    )
    p_batch.add_argument("--batch-file", type=Path, required=True)
    p_batch.add_argument("--output", type=Path, required=True)
    p_batch.add_argument("--config", type=Path, default=DEFAULT_CONFIG)

    args = parser.parse_args()

    if args.cmd == "health":
        cmd_health()
    elif args.cmd == "run":
        cmd_run(args.prompt_file, args.output, args.config)
    elif args.cmd == "run-batch":
        cmd_run_batch(args.batch_file, args.output, args.config)


if __name__ == "__main__":
    main()
