# Hukuk Otomasyon - Codex Worker Kurallari

Bu depoda once `CLAUDE.md`, `prompts/_doktrin-preamble.md` ve ilgili ajan
skill dosyasini oku. Model ve motor seciminde tek dogruluk kaynagi
`config/model-routing.json` dosyasidir.

`ROL 1/4`, `ROL 2/4` veya `ROL 3/4` yazan YargiMCP promptlari pipeline worker
gorevidir. Worker olarak `scripts/yargi_model_pipeline.py` dosyasini tekrar
cagirma, alt ajan baslatma veya dosya degistirme. Yalniz promptta istenen
arastirmayi yap ve son yanitini uret.

Yargi arastirmasinda MCP birincildir. Search sonucu atif icin yeterli degildir;
nihai rapora giren kararlar tam metinle ve documentId ile dogrulanir. Aleyhe
kararlar gizlenmez, dogrulanamayan kaynak uydurulmaz.
