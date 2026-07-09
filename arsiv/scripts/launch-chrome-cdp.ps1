# launch-chrome-cdp.ps1
# Chrome'u CDP (Chrome DevTools Protocol) acik sekilde baslatir.
# 2A Stajyer otomasyonu (scripts/superstajyer.py) bu Chrome'a bagalanir.
#
# KULLANIM (avukat icin):
#   1. Masaustune kisayol koy (saglikli ikon: bu .ps1 dosyasi)
#   2. NORMAL Chrome ikonundan acmak yerine her gun bu kisayoldan ac
#   3. Suer Stajyer'e login ol, oturum acik kalsin
#
# DOGRULAMA:
#   curl http://localhost:9222/json/version
#   -> JSON donmesi gerek ("Browser": "Chrome/...")
#
# UYARI: Normal Chrome zaten acik ise bu script ayni profille yeni instance
# acamaz (Windows lock). Once normal Chrome'u tamamen kapat (sistem tray
# dahil), sonra bu kisayoldan ac.

$ErrorActionPreference = "Stop"

$cdpPort = 9222

# ONEMLI: Chrome 136+ guvenlik kurali - default user-data-dir ile CDP calismaz.
# Bu yuzden AYRI bir profile dizini kullaniyoruz. Bu dizin sadece Suer Stajyer
# otomasyonu icin. Ilk acilista Suer Stajyer sitesine tekrar login olman gerekir
# (sonraki acilislarda oturum korunur).
$userDataDir = "$env:LOCALAPPDATA\Google\Chrome\CDP-Profile"

# Yeni profile dizini yoksa olustur
if (-not (Test-Path $userDataDir)) {
    New-Item -ItemType Directory -Path $userDataDir -Force | Out-Null
    Write-Host "[INFO] Yeni CDP profile dizini olusturuldu: $userDataDir" -ForegroundColor Cyan
    Write-Host "[INFO] Ilk acilis: Suer Stajyer sitesine login olman gerekecek." -ForegroundColor Cyan
}

# Chrome.exe yolunu sirayla dene (kullanici profile + system-wide)
$chromeCandidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$chromeExe = $null
foreach ($candidate in $chromeCandidates) {
    if (Test-Path $candidate) {
        $chromeExe = $candidate
        break
    }
}

if (-not $chromeExe) {
    Write-Host "HATA: chrome.exe bulunamadi. Aranan yollar:" -ForegroundColor Red
    $chromeCandidates | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
    exit 1
}

# Port zaten kullanimda mi?
$portInUse = Get-NetTCPConnection -LocalPort $cdpPort -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "UYARI: Port $cdpPort zaten kullanimda." -ForegroundColor Yellow
    Write-Host "Muhtemelen Chrome CDP modunda zaten acik. Doğrula:" -ForegroundColor Yellow
    Write-Host "  curl http://localhost:$cdpPort/json/version" -ForegroundColor Cyan
    exit 0
}

Write-Host "Chrome baslatiliyor:" -ForegroundColor Green
Write-Host "  exe: $chromeExe" -ForegroundColor Gray
Write-Host "  CDP port: $cdpPort" -ForegroundColor Gray
Write-Host "  user-data-dir: $userDataDir" -ForegroundColor Gray

Start-Process -FilePath $chromeExe -ArgumentList @(
    "--remote-debugging-port=$cdpPort",
    "--user-data-dir=`"$userDataDir`""
)

Write-Host "OK. Birkac saniye icinde Chrome acilacak." -ForegroundColor Green
Write-Host ""
Write-Host "Sonraki adim: Suer Stajyer sitesine git, login ol (oturum kalir)." -ForegroundColor Cyan
Write-Host "Dogrulama:" -ForegroundColor Cyan
Write-Host "  curl http://localhost:$cdpPort/json/version" -ForegroundColor Cyan
