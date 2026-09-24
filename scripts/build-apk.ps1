$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent $projectRoot
$config = Get-Content (Join-Path $projectRoot 'app.json') -Raw | ConvertFrom-Json
$version = $config.expo.version
$versionCode = $config.expo.android.versionCode
$gradle = Join-Path $projectRoot 'android\gradlew.bat'

$javaCandidates = @(
    $env:JAVA_HOME,
    (Join-Path $env:ProgramFiles 'Android\Android Studio\jbr')
) | Where-Object { $_ }

foreach ($javaHome in $javaCandidates) {
    $java = Join-Path $javaHome 'bin\java.exe'
    if (-not (Test-Path $java)) { continue }
    try {
        & $java -version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $env:JAVA_HOME = $javaHome
            break
        }
    }
    catch {}
}

if (-not (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    throw 'A working Java installation was not found.'
}

if (-not $env:GRADLE_USER_HOME) {
    $env:GRADLE_USER_HOME = Join-Path $env:USERPROFILE '.gradle'
}

$signingDirectory = Join-Path $env:USERPROFILE '.android'
$keystore = Join-Path $signingDirectory 'hittracker-release.keystore'
$signingPropertiesFile = Join-Path $signingDirectory 'hittracker-release.properties'

if (-not (Test-Path $keystore) -or -not (Test-Path $signingPropertiesFile)) {
    throw 'The permanent Android signing key is missing. Run scripts/setup-android-signing.ps1 once.'
}

$signingProperties = ConvertFrom-StringData (Get-Content $signingPropertiesFile -Raw)
foreach ($property in @('storePassword', 'keyAlias', 'keyPassword')) {
    if (-not $signingProperties[$property]) {
        throw "Android signing property '$property' is missing."
    }
}

$env:HITTRACKER_KEYSTORE_FILE = $keystore
$env:HITTRACKER_KEYSTORE_PASSWORD = $signingProperties.storePassword
$env:HITTRACKER_KEY_ALIAS = $signingProperties.keyAlias
$env:HITTRACKER_KEY_PASSWORD = $signingProperties.keyPassword

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

$appGradle = Join-Path $projectRoot 'android\app\build.gradle'
$appGradleContent = Get-Content $appGradle -Raw
if (-not $appGradleContent.Contains('buildStagingDirectory')) {
    $cmakeConfig = @'
    externalNativeBuild {
        cmake {
            buildStagingDirectory new File(System.getProperty("java.io.tmpdir"), "hittracker-cxx")
        }
    }

'@
    $appGradleContent = $appGradleContent.Replace("android {`r`n", "android {`r`n$cmakeConfig")
}

if (-not $appGradleContent.Contains('HITTRACKER_KEYSTORE_FILE')) {
    $signingConfig = @'

android {
    signingConfigs {
        hitTrackerRelease {
            storeFile file(System.getenv("HITTRACKER_KEYSTORE_FILE"))
            storePassword System.getenv("HITTRACKER_KEYSTORE_PASSWORD")
            keyAlias System.getenv("HITTRACKER_KEY_ALIAS")
            keyPassword System.getenv("HITTRACKER_KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.hitTrackerRelease
        }
    }
}
'@
    $appGradleContent += $signingConfig
}

Set-Content -LiteralPath $appGradle -Value $appGradleContent

Push-Location $projectRoot
try {
    & $gradle -p android assembleRelease
    if ($LASTEXITCODE -ne 0) { throw 'Android build failed.' }
}
finally {
    Pop-Location
}

$source = Join-Path $projectRoot 'android\app\build\outputs\apk\release\app-release.apk'
$archive = Join-Path $workspaceRoot 'apk-builds'
$destination = Join-Path $archive "HitTracker-Android-v$version-build$versionCode-universal.apk"

New-Item -ItemType Directory -Path $archive -Force | Out-Null
Copy-Item -LiteralPath $source -Destination $destination -Force
Write-Output "APK saved to $destination"
