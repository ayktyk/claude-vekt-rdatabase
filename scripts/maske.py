"""
KVKK Seviye 2 - Müvekkil Verisi Maskeleme Sistemi

Kullanım senaryoları:
  1. Müvekkil verisi sisteme girerken maskelemek:
     python maske.py mask input.txt output.txt [--dict dava-id]

  2. Dilekçe tamamlandıktan sonra unmask:
     python maske.py unmask output.txt final.txt --dict dava-id

  3. Tek seferlik text maskeleme (stdin):
     echo "Selin Uyar - 17129455420" | python maske.py mask-stdin --dict selin-uyar

  4. Dict dosyasını görüntüleme (gerçek veri dict'te, maskeli çıktıda):
     python maske.py show-dict --dict dava-id

Regex patternleri:
  - TC Kimlik: 11 hanelik rakam (başı 1-9 arası olmalı, algoritma kontrolü)
  - IBAN: TR + 24 rakam
  - Telefon: +90 5XX XXX XX XX / 05XX XXX XX XX / 5XX XXX XXXX
  - E-posta: standart e-posta regex

İsim maskeleme: config/isim-listesi.json üzerinden
  - Her davada aktif müvekkil/karşı taraf isimleri tanımlanır
  - Script bu isimleri metinden bulup maskeler

Dict dosyası: config/masks/{dava-id}.json
  - Yerel diskte tutulur (Anthropic'e gitmez)
  - Gerekirse encrypt edilebilir

ÖNEMLİ KVKK NOTU:
  Bu script LLM'e veri gitmeden ÖNCE çalıştırılmalıdır.
  LLM ile konuşma öncesi müvekkil dosyaları maske.py üzerinden geçirilir.
  Unmask sadece nihai dilekçe UYAP'a yüklenmeden önce yapılır.
"""

import argparse
import json
import re
import sys
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).resolve().parent
CONFIG_DIR = SCRIPT_DIR.parent / 'config' / 'masks'
CONFIG_DIR.mkdir(parents=True, exist_ok=True)


TC_REGEX = re.compile(r'\b([1-9]\d{10})\b')
IBAN_REGEX = re.compile(r'\bTR[\s]?(\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{2})\b', re.IGNORECASE)
TELEFON_REGEX = re.compile(r'(\+90[\s]?5\d{2}[\s]?\d{3}[\s]?\d{2}[\s]?\d{2}|0[\s]?5\d{2}[\s]?\d{3}[\s]?\d{2}[\s]?\d{2}|5\d{2}[\s]?\d{3}[\s]?\d{4})')
EPOSTA_REGEX = re.compile(r'\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b')
NOTER_YEVMIYE_REGEX = re.compile(r'\b(0[0-9]{4}|[1-9][0-9]{4})\b')

ARABULUCULUK_DOSYA_REGEX = re.compile(r'\b(20\d{2}/\d{3,5})\b')


def _tc_validate(tc: str) -> bool:
    if len(tc) != 11 or not tc.isdigit():
        return False
    if tc[0] == '0':
        return False
    digits = [int(d) for d in tc]
    odd_sum = sum(digits[i] for i in range(0, 9, 2))
    even_sum = sum(digits[i] for i in range(1, 8, 2))
    d10 = ((odd_sum * 7) - even_sum) % 10
    d11 = (sum(digits[:10])) % 10
    return digits[9] == d10 and digits[10] == d11


class MaskeSistem:
    def __init__(self, dava_id: str = 'default'):
        self.dava_id = dava_id
        self.dict_path = CONFIG_DIR / f'{dava_id}.json'
        self.dict_data = {
            'dava_id': dava_id,
            'olusturulma': datetime.now().isoformat(),
            'isimler': {},
            'tc': {},
            'iban': {},
            'telefon': {},
            'eposta': {},
            'adres': {},
            'noter': {},
            'sayac': {
                'muvekkil': 0,
                'karsi_taraf': 0,
                'tc': 0,
                'iban': 0,
                'telefon': 0,
                'eposta': 0,
                'adres': 0,
                'noter': 0,
            }
        }
        self._load_dict()

    def _load_dict(self):
        if self.dict_path.exists():
            with open(self.dict_path, 'r', encoding='utf-8') as f:
                self.dict_data = json.load(f)

    def _save_dict(self):
        with open(self.dict_path, 'w', encoding='utf-8') as f:
            json.dump(self.dict_data, f, ensure_ascii=False, indent=2)

    def add_isim(self, gercek_isim: str, rol: str = 'taraf') -> str:
        if gercek_isim in self.dict_data['isimler']:
            return self.dict_data['isimler'][gercek_isim]
        if rol == 'muvekkil':
            self.dict_data['sayac']['muvekkil'] += 1
            token = f"[MUVEKKIL_{self.dict_data['sayac']['muvekkil']}]"
        elif rol == 'karsi_taraf':
            self.dict_data['sayac']['karsi_taraf'] += 1
            token = f"[KARSI_TARAF_{self.dict_data['sayac']['karsi_taraf']}]"
        else:
            self.dict_data['sayac']['muvekkil'] += 1
            token = f"[KISI_{self.dict_data['sayac']['muvekkil']}]"
        self.dict_data['isimler'][gercek_isim] = token
        return token

    def add_adres(self, adres: str) -> str:
        if adres in self.dict_data['adres']:
            return self.dict_data['adres'][adres]
        self.dict_data['sayac']['adres'] += 1
        token = f"[ADRES_{self.dict_data['sayac']['adres']}]"
        self.dict_data['adres'][adres] = token
        return token

    def _get_or_add(self, kategori: str, gercek: str, prefix: str) -> str:
        if gercek in self.dict_data[kategori]:
            return self.dict_data[kategori][gercek]
        self.dict_data['sayac'][kategori] += 1
        token = f"[{prefix}_{self.dict_data['sayac'][kategori]}]"
        self.dict_data[kategori][gercek] = token
        return token

    def mask_text(self, text: str) -> str:
        """Metindeki tüm hassas verileri maskeler."""

        def _mask_tc(m):
            tc = m.group(1)
            if _tc_validate(tc):
                return self._get_or_add('tc', tc, 'TC')
            return m.group(0)
        text = TC_REGEX.sub(_mask_tc, text)

        text = IBAN_REGEX.sub(lambda m: self._get_or_add('iban', m.group(0), 'IBAN'), text)
        text = TELEFON_REGEX.sub(lambda m: self._get_or_add('telefon', m.group(0), 'TEL'), text)
        text = EPOSTA_REGEX.sub(lambda m: self._get_or_add('eposta', m.group(0), 'EPOSTA'), text)

        for gercek_isim, token in self.dict_data['isimler'].items():
            pattern = re.compile(r'\b' + re.escape(gercek_isim) + r'\b', re.IGNORECASE)
            text = pattern.sub(token, text)

        for gercek_adres, token in self.dict_data['adres'].items():
            text = text.replace(gercek_adres, token)

        self._save_dict()
        return text

    def unmask_text(self, text: str) -> str:
        """Maskeli metni gerçek veriye geri çevirir."""
        for kategori in ['isimler', 'adres', 'tc', 'iban', 'telefon', 'eposta', 'noter']:
            for gercek, token in self.dict_data[kategori].items():
                text = text.replace(token, gercek)
        return text

    def show_dict(self):
        """Dict içeriğini (dikkat: gerçek veri içerir!) gösterir."""
        return json.dumps(self.dict_data, ensure_ascii=False, indent=2)


def cmd_mask(args):
    sistem = MaskeSistem(args.dict)
    if args.muvekkil:
        for isim in args.muvekkil:
            token = sistem.add_isim(isim, 'muvekkil')
            print(f'[INFO] Müvekkil eklendi: {isim} -> {token}')
    if args.karsi_taraf:
        for isim in args.karsi_taraf:
            token = sistem.add_isim(isim, 'karsi_taraf')
            print(f'[INFO] Karşı taraf eklendi: {isim} -> {token}')
    if args.adres:
        for adres in args.adres:
            token = sistem.add_adres(adres)
            print(f'[INFO] Adres eklendi: {adres[:40]}... -> {token}')

    src = Path(args.input)
    if not src.exists():
        print(f'[HATA] Girdi dosyası bulunamadı: {src}')
        sys.exit(1)
    text = src.read_text(encoding='utf-8')
    masked = sistem.mask_text(text)
    dst = Path(args.output) if args.output else src.with_stem(src.stem + '.masked')
    dst.write_text(masked, encoding='utf-8')
    print(f'[OK] Maskelendi -> {dst}')
    print(f'[OK] Dict dosyası -> {sistem.dict_path}')


def cmd_unmask(args):
    sistem = MaskeSistem(args.dict)
    src = Path(args.input)
    if not src.exists():
        print(f'[HATA] Girdi dosyası bulunamadı: {src}')
        sys.exit(1)
    text = src.read_text(encoding='utf-8')
    unmasked = sistem.unmask_text(text)
    dst = Path(args.output) if args.output else src.with_stem(src.stem + '.final')
    dst.write_text(unmasked, encoding='utf-8')
    print(f'[OK] Unmask edildi -> {dst}')


def cmd_add(args):
    sistem = MaskeSistem(args.dict)
    if args.muvekkil:
        for isim in args.muvekkil:
            token = sistem.add_isim(isim, 'muvekkil')
            print(f'  Müvekkil: {isim} -> {token}')
    if args.karsi_taraf:
        for isim in args.karsi_taraf:
            token = sistem.add_isim(isim, 'karsi_taraf')
            print(f'  Karşı taraf: {isim} -> {token}')
    if args.adres:
        for adres in args.adres:
            token = sistem.add_adres(adres)
            print(f'  Adres: {adres[:40]}... -> {token}')
    sistem._save_dict()
    print(f'[OK] Kayıt -> {sistem.dict_path}')


def cmd_show(args):
    sistem = MaskeSistem(args.dict)
    print(sistem.show_dict())


def cmd_mask_stdin(args):
    sistem = MaskeSistem(args.dict)
    text = sys.stdin.read()
    masked = sistem.mask_text(text)
    print(masked)


def main():
    parser = argparse.ArgumentParser(description='KVKK Seviye 2 Maskeleme Sistemi')
    parser.add_argument('--dict', default='default', help='Dava-ID (config/masks/<dict>.json)')

    sub = parser.add_subparsers(dest='cmd', required=True)

    p_mask = sub.add_parser('mask', help='Dosyayı maskele')
    p_mask.add_argument('input')
    p_mask.add_argument('output', nargs='?', default=None)
    p_mask.add_argument('--muvekkil', nargs='*', help='Müvekkil isimleri')
    p_mask.add_argument('--karsi-taraf', nargs='*', help='Karşı taraf isimleri')
    p_mask.add_argument('--adres', nargs='*', help='Maskelenecek adresler')

    p_unmask = sub.add_parser('unmask', help='Maskeli dosyayı geri çevir')
    p_unmask.add_argument('input')
    p_unmask.add_argument('output', nargs='?', default=None)

    p_add = sub.add_parser('add', help='Dict dosyasına isim/adres ekle (önceden)')
    p_add.add_argument('--muvekkil', nargs='*')
    p_add.add_argument('--karsi-taraf', nargs='*')
    p_add.add_argument('--adres', nargs='*')

    p_show = sub.add_parser('show-dict', help='Dict içeriğini göster')

    p_stdin = sub.add_parser('mask-stdin', help='Stdin metnini maskele')

    args = parser.parse_args()

    if args.cmd == 'mask':
        cmd_mask(args)
    elif args.cmd == 'unmask':
        cmd_unmask(args)
    elif args.cmd == 'add':
        cmd_add(args)
    elif args.cmd == 'show-dict':
        cmd_show(args)
    elif args.cmd == 'mask-stdin':
        cmd_mask_stdin(args)


if __name__ == '__main__':
    # Faz 1.4 profiling wrapper (graceful: _timing yoksa normal çalışır)
    try:
        import os as _os, sys as _sys
        _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
        from _timing import TimedScript
        with TimedScript(__file__):
            main()
    except ImportError:
        main()
