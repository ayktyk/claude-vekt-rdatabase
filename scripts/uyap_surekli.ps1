# UYAP sürekli eşitleme (avukat talimatı 2026-10-12): her gün en çok 8 dosya, dosyalar arası 20-30 dk,
# herhangi bir hata veya UYAP doğrulamasında durur. Pencere açık kaldıkça günler boyunca sürer.
# Başlatma: sağ tık > PowerShell ile çalıştır, ya da: powershell -ExecutionPolicy Bypass -File scripts\uyap_surekli.ps1
chcp 65001 > $null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONUNBUFFERED = '1'
$kok = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $kok
$aktif = (python scripts\paths.py aktif 2>$null)
if (-not $aktif) { $aktif = $kok }
$log = Join-Path $aktif '00-uyap-surekli-cikti.txt'
$Host.UI.RawUI.WindowTitle = 'UYAP surekli esitleme - kapatmayin'
Write-Host "UYAP surekli esitleme basladi. Cikti: $log" -ForegroundColor Yellow
python scripts\uyap_esitle.py surekli
Write-Host 'Esitleme durdu. Nedeni yukarida; log dosyasinda da var.' -ForegroundColor Yellow
Read-Host 'Kapatmak icin Enter'
