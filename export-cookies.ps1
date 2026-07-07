Write-Host "Exporting YouTube cookies via Firefox..." -ForegroundColor Cyan
Write-Host "Make sure you're logged into YouTube in Firefox." -ForegroundColor Yellow
Write-Host ""

$cookiesDir = "$env:LOCALAPPDATA\yt-dlp"
if (-not (Test-Path $cookiesDir)) {
    New-Item -ItemType Directory -Path $cookiesDir -Force | Out-Null
}

$exe = "$env:LOCALAPPDATA\yt-dlp\yt-dlp.exe"
$cookiesFile = "$cookiesDir\cookies.txt"

Write-Host "Extracting cookies..." -ForegroundColor Cyan
& $exe --cookies-from-browser firefox --cookies $cookiesFile --skip-download --print title "https://www.youtube.com/watch?v=dQw4w9WgXcQ" 2>&1

if (Test-Path $cookiesFile) {
    Write-Host "`nCookies exported successfully to: $cookiesFile" -ForegroundColor Green
    Write-Host "You can now restart the dev server." -ForegroundColor Green
} else {
    Write-Host "`nFailed to export cookies. Try Chrome instead:" -ForegroundColor Red
    Write-Host "  & $exe --cookies-from-browser chrome --cookies $cookiesFile --skip-download --print title `"https://www.youtube.com/watch?v=dQw4w9WgXcQ`"" -ForegroundColor Yellow
    Write-Host "(Close Chrome completely before running the above)" -ForegroundColor Yellow
}

Read-Host "`nPress Enter to exit"
