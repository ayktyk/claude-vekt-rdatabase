# MCP Envanteri

Bu klasör Yargı-MCP-Pro ve Arguman.ai MCP server'larının **tool envanterini**
tutar. ASAMA 2 yeniden tasarım planında Faz 0 (Discovery) adımı bu envanteri
üretir; sonraki fazların (komut yeniden yazımı, denetim mekaniği) detayı
buradaki tool isimlerine + dönüş tiplerine bağlıdır.

## Dosya Listesi

- `yargi-mcp-pro.md` — Yargı-MCP-Pro tool envanteri (Faz 0 sonrası doldurulur)
- `arguman-ai.md` — Arguman.ai tool envanteri (Faz 0 sonrası doldurulur)

## Faz 0 Discovery Akışı

1. **Avukat — MCP kurulum** (terminal):
   ```bash
   claude mcp add yargi-mcp-pro --transport http https://yargi-mcp-pro-production.up.railway.app/mcp
   claude mcp add --transport http arguman https://mcp.arguman.ai/mcp
   ```

2. **Avukat — Auth/OAuth** (yeni Claude oturumu):
   - `/mcp` komutu → her iki server için `Authenticate`
   - Arguman: tarayıcıda OAuth onayı
   - Yargı-MCP-Pro: mühendisle teyit (API key mi, OAuth mu)

3. **Claude — Discovery**:
   - `claude mcp list` her iki server için ✓ connected doğrulanır
   - `ListMcpResourcesTool` ile tool envanteri çıkarılır
   - Her tool için 1 örnek küçük sorgu denenir
   - Bulgular bu klasördeki `yargi-mcp-pro.md` ve `arguman-ai.md`'ye yazılır

4. **Doğrulama:**
   - Her tool için **isim + parametre + dönüş tipi + örnek payload + rate-limit gözlemi** dokümante
   - En az 1 örnek 200 OK
   - Mühendise sorulacak 6 madde (plan dosyasında, "İletişim Noktaları") cevaplandı

## Plan Referansı

Tam plan: `~/.claude/plans/sistemimizi-geli-tirece-iz-ara-t-rma-a-a-rippling-clock.md`
