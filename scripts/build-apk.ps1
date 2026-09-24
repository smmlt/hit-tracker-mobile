$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent $projectRoot
$config = Get-Content (Join-Path $projectRoot 'app.json') -Raw | ConvertFrom-Json
$version = $config.expo.version
$versionCode = $config.expo.android.versionCode
$gradle = Join-Path $projectRoot 'android\gradlew.bat'

if (-not (Test-Path $gradle)) {
    Push-Location $projectRoot
    try {
        & npx expo prebuild --platform android --no-install
        if ($LASTEXITCODE -ne 0) { throw 'Expo prebuild failed.' }
    }
    finally {
        Pop-Location
    }
}

Push-Location $projectRoot
try {
    & $gradle -p android assembleRelease -PreactNativeArchitectures=arm64-v8a
    if ($LASTEXITCODE -ne 0) { throw 'Android build failed.' }
}
finally {
    Pop-Location
}

$source = Join-Path $projectRoot 'android\app\build\outputs\apk\release\app-release.apk'
$archive = Join-Path $workspaceRoot 'apk-builds'
$destination = Join-Path $archive "HitTracker-Android-v$version-build$versionCode-arm64.apk"

New-Item -ItemType Directory -Path $archive -Force | Out-Null
Copy-Item -LiteralPath $source -Destination $destination -Force
Write-Output "APK saved to $destination"
