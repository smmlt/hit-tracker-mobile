$ErrorActionPreference = 'Stop'

$javaCandidates = @(
    $env:JAVA_HOME,
    (Join-Path $env:ProgramFiles 'Android\Android Studio\jbr')
) | Where-Object { $_ }

$keytool = $null
foreach ($javaHome in $javaCandidates) {
    $candidate = Join-Path $javaHome 'bin\keytool.exe'
    if (Test-Path $candidate) {
        $keytool = $candidate
        break
    }
}

if (-not $keytool) {
    throw 'Android Studio Java keytool was not found.'
}

$signingDirectory = Join-Path $env:USERPROFILE '.android'
$keystore = Join-Path $signingDirectory 'hittracker-release.keystore'
$propertiesFile = Join-Path $signingDirectory 'hittracker-release.properties'

New-Item -ItemType Directory -Path $signingDirectory -Force | Out-Null

if ((Test-Path $keystore) -or (Test-Path $propertiesFile)) {
    throw "HitTracker signing credentials already exist in $signingDirectory. Nothing was overwritten."
}

$randomBytes = New-Object byte[] 32
$randomNumberGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try {
    $randomNumberGenerator.GetBytes($randomBytes)
}
finally {
    $randomNumberGenerator.Dispose()
}
$password = [Convert]::ToBase64String($randomBytes).Replace('+', 'A').Replace('/', 'B').TrimEnd('=')
$alias = 'hittracker'

& $keytool -genkeypair `
    -keystore $keystore `
    -storetype PKCS12 `
    -storepass $password `
    -keypass $password `
    -alias $alias `
    -keyalg RSA `
    -keysize 4096 `
    -validity 10000 `
    -dname 'CN=HitTracker'

if ($LASTEXITCODE -ne 0) {
    throw 'Android signing key generation failed.'
}

@"
storePassword=$password
keyAlias=$alias
keyPassword=$password
"@ | Set-Content -LiteralPath $propertiesFile -NoNewline

Write-Output "Permanent Android signing key created in $signingDirectory"
