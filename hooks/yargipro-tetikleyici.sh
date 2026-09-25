#!/usr/bin/env bash
# UserPromptSubmit hook: hukuki soru tespit edilirse Yargı PRO skill haritasını hatırlatır.
# Girdi: stdin'de {"prompt": "..."} JSON. Çıktı: stdout'a yazılan metin modele context olarak eklenir.

input="$(cat)"
prompt="$(printf '%s' "$input" | sed -n 's/.*"prompt"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/p' | head -c 4000)"
[ -z "$prompt" ] && prompt="$input"

# Hukuki anahtar kelimeler (Türkçe büyük/küçük harf ve ASCII varyantları)
pattern='yarg[iı]tay|emsal|i[cç]tihat|hgk|ibk|dan[iı][sş]tay|kanun|madde|mevzuat|zamana[sş][iı]m|hak d[uü][sş][uü]r|s[uü]re|son g[uü]n|tebligat|tebli[gğ]|mazbata|dava|dilek[cç]e|istinaf|temyiz|itiraz|savunma|cevap dilek|replik|[iı]slah|arabulucu|har[cç]|vek[aâ]let|tazminat|k[iı]dem|ihbar|fazla mesai|kira|tahliye|t[uü]ketici|ay[iı]p|fesih|icra|haciz|[oö]deme emri|takip|bor[cç]|alacak|s[oö]zle[sş]me|ihtarname|bilirki[sş]i|duru[sş]ma|tan[iı]k|hakim|mahkeme|g[oö]revli|yetkili|ceza|su[cç]|iddianame|tutuk|aym|a[iı]hm|bireysel ba[sş]vuru|idari|iptal davas|y[uü]r[uü]tme|hukuk'

if printf '%s' "$prompt" | grep -qiE "$pattern"; then
  cat <<'EOF'
[YARGI PRO TETİKLEYİCİ] Bu istek hukuki içerik taşıyor. Cevap üretmeden ÖNCE:
1. `ajanlar/yargipro-skill-haritasi.md` haritasını oku (Bölüm A: tekil soru, Bölüm B: dava akışı).
2. Uyan skill'leri `mcp__claude_ai_YargiMCP__hukuk_skill skill:"<ad>"` ile çek ve talimatlarını uygula.
3. Vazgeçilmez kapılar: künye/madde varsa 11-8-atif-dogrulama; emsal kullanılıyorsa 11-4-emsal-guncellik-denetimi; süre söyleniyorsa 12-1-sure-hesaplama.
4. Kaynak Doğrulama Tablosuna hangi skill'lerin uygulandığını yaz. Salt sohbet/kod isteğiyse bu notu yok say.
EOF
fi
exit 0
