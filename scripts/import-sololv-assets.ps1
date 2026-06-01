param(
  [string]$SourceRoot = "C:\Program Files\Netmarble\Netmarble Game\sololv",
  [string]$OutputRoot = "src\assets\sololv",
  [string]$ToolsRoot = "tools",
  [string]$StagingRoot = "",
  [int]$MaxAssetBytes = 5242880,
  [int]$MaxMusicBytes = 83886080,
  [int]$MaxMusicTracks = 20,
  [int]$MaxCandidates = 250,
  [switch]$RequireExtractor
)

$ErrorActionPreference = "Stop"

function Resolve-FullPath([string]$PathValue) {
  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return [System.IO.Path]::GetFullPath($PathValue)
  }
  return [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $PathValue))
}

function ConvertTo-SafeAssetId([string]$Name) {
  $base = [System.IO.Path]::GetFileNameWithoutExtension($Name).ToLowerInvariant()
  $base = $base -replace '[^a-z0-9]+', '-'
  $base = $base.Trim('-')
  if ([string]::IsNullOrWhiteSpace($base)) { return "asset" }
  return $base
}

function Get-AssetKind([System.IO.FileInfo]$File) {
  $extension = $File.Extension.ToLowerInvariant()
  $name = $File.Name.ToLowerInvariant()
  if ($extension -in @(".mp3", ".ogg", ".wav", ".m4a") -and $name -match 'bgm|music|battle|gate|dungeon|lobby|training|result|system|shadow') { return "music" }
  if ($extension -in @(".mp3", ".ogg", ".wav", ".m4a")) { return "audio" }
  if ($name -match 'ui|button|panel|frame|icon|quest|system|hud') { return "ui" }
  if ($extension -in @(".png", ".jpg", ".jpeg", ".webp") -and $name -match 'vfx|fx|effect|gate|portal|aura|slash|reward|system') { return "effect" }
  if ($extension -in @(".png", ".jpg", ".jpeg", ".webp")) { return "ui" }
  return "unknown"
}

function Get-BundleCandidateKind([System.IO.FileInfo]$File) {
  $name = $File.Name.ToLowerInvariant()
  $path = $File.FullName.ToLowerInvariant()

  if ($path -match '\\sound\\source\\bgm\\' -or $name -match '^bgm_|music|lobby_bgm|battle_bgm') { return "music" }
  if ($path -match '\\sound\\' -or $name -match 'sound|audio|sfx|voice|foley') { return "audio" }
  if ($path -match '\\ui\\' -or $path -match '\\hud\\' -or $name -match 'ui|icon|hud|panel|frame|button|quest|system') { return "ui" }
  if ($path -match '\\effect\\' -or $path -match '\\fx_' -or $name -match 'vfx|fx|effect|gate|portal|aura|slash|reward') { return "effect" }
  if ($path -match '\\animation\\' -or $name -match 'animationset|timelinedata|playable') { return "effect" }

  return "unknown"
}

function Get-ExtractorPath([string]$Root) {
  $candidates = @()
  if ($env:ASSETSTUDIO_CLI) { $candidates += $env:ASSETSTUDIO_CLI }
  if ($env:ASSETRIPPER_CLI) { $candidates += $env:ASSETRIPPER_CLI }
  $candidates += @(
    (Join-Path $Root "AssetStudioCLI.exe"),
    (Join-Path $Root "AssetStudio\AssetStudioCLI.exe"),
    (Join-Path $Root "AssetRipper\AssetRipper.CLI.exe"),
    (Join-Path $Root "AssetRipper\AssetRipper.exe")
  )
  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) {
      return (Resolve-FullPath $candidate)
    }
  }
  return $null
}

function New-ManifestAsset([string]$Id, [string]$Kind, [string]$FileName, [string]$SourcePath, [long]$SizeBytes, [string]$Status) {
  [ordered]@{
    id = $Id
    kind = $Kind
    fileName = $FileName
    sourcePath = $SourcePath
    sizeBytes = $SizeBytes
    status = $Status
  }
}

$source = Resolve-FullPath $SourceRoot
$output = Resolve-FullPath $OutputRoot
$tools = Resolve-FullPath $ToolsRoot
$warnings = New-Object System.Collections.Generic.List[string]
$assets = New-Object System.Collections.Generic.List[object]
$candidates = New-Object System.Collections.Generic.List[object]

if (!(Test-Path -LiteralPath $source -PathType Container)) {
    throw "Game source folder not found: $source"
}

New-Item -ItemType Directory -Force -Path $output, (Join-Path $output "audio"), (Join-Path $output "music"), (Join-Path $output "effects"), (Join-Path $output "ui") | Out-Null

$extractor = Get-ExtractorPath $tools
if (!$extractor) {
  $warnings.Add("AssetStudio/AssetRipper CLI was not found in tools/ or ASSETSTUDIO_CLI/ASSETRIPPER_CLI. Unity .bundle files were indexed only.")
  if ($RequireExtractor) {
    throw "Unity extractor missing. Add AssetStudioCLI.exe or AssetRipper.CLI.exe to tools/ or set an environment variable."
  }
}

$searchRoots = @(
  (Join-Path $source "GameAsset"),
  (Join-Path $source "Solo_Leveling_ARISE_Data")
) | Where-Object { Test-Path -LiteralPath $_ -PathType Container }

$bundleFiles = foreach ($root in $searchRoots) {
  Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Extension.ToLowerInvariant() -in @(".bundle", ".unity3d", ".resource") }
}

$candidatePattern = 'sound|audio|sfx|voice|bgm|music|battle|dungeon|lobby|training|shadow|ui|system|quest|reward|gate|portal|effect|vfx|fx|icon|sprite|texture|hud|panel|frame|button'
$bundleFiles |
  Where-Object { $_.Name -match $candidatePattern } |
  Sort-Object Length |
  Select-Object -First $MaxCandidates |
  ForEach-Object {
    $kind = Get-BundleCandidateKind $_
    if ($kind -eq "unknown") { $kind = "effect" }
    $candidates.Add((New-ManifestAsset (ConvertTo-SafeAssetId $_.Name) $kind $_.Name $_.FullName $_.Length "candidate"))
  }

$looseRoots = @()
if ($StagingRoot -and (Test-Path -LiteralPath $StagingRoot -PathType Container)) {
  $looseRoots += (Resolve-FullPath $StagingRoot)
}
$looseRoots += $searchRoots

$supportedExtensions = @(".mp3", ".ogg", ".wav", ".m4a", ".png", ".jpg", ".jpeg", ".webp")
$looseFiles = foreach ($root in $looseRoots) {
  Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Extension.ToLowerInvariant() -in $supportedExtensions -and $_.Length -le $MaxAssetBytes }
}

$usedNames = @{}
$importedMusicBytes = 0
$importedMusicTracks = 0
foreach ($file in $looseFiles) {
  $kind = Get-AssetKind $file
  if ($kind -eq "unknown") { continue }

  if ($kind -eq "music") {
    if ($importedMusicTracks -ge $MaxMusicTracks) { continue }
    if (($importedMusicBytes + $file.Length) -gt $MaxMusicBytes) { continue }
  }

  $id = ConvertTo-SafeAssetId $file.Name
  if ($id -notmatch $candidatePattern) { continue }

  $folder = if ($kind -eq "music") { "music" } elseif ($kind -eq "audio") { "audio" } elseif ($kind -eq "effect") { "effects" } else { "ui" }
  $extension = $file.Extension.ToLowerInvariant()
  $targetName = "$id$extension"
  $counter = 2
  while ($usedNames.ContainsKey($targetName) -or (Test-Path -LiteralPath (Join-Path (Join-Path $output $folder) $targetName))) {
    $targetName = "$id-$counter$extension"
    $counter++
  }
  $usedNames[$targetName] = $true

  $target = Join-Path (Join-Path $output $folder) $targetName
  Copy-Item -LiteralPath $file.FullName -Destination $target -Force
  $assets.Add((New-ManifestAsset ([System.IO.Path]::GetFileNameWithoutExtension($targetName)) $kind $targetName $file.FullName $file.Length "imported"))
  if ($kind -eq "music") {
    $importedMusicTracks++
    $importedMusicBytes += $file.Length
  }
}

if ($assets.Count -eq 0) {
  $warnings.Add("No loose audio/UI/VFX files were found for copying. Export Unity bundles first, then pass the exported folder as -StagingRoot.")
}

if ($extractor) {
  $warnings.Add("Extractor detected: $extractor. This importer consumes ready staging exports because CLI arguments differ between AssetStudio and AssetRipper.")
}

$catalogPath = Join-Path $source "GameAsset\com.unity.addressables\catalog_CDN.json"
$catalogValue = $null
if (Test-Path -LiteralPath $catalogPath -PathType Leaf) {
  $catalogValue = $catalogPath
}
$manifest = [ordered]@{
  version = 1
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  sourceRoot = $source
  importer = "scripts/import-sololv-assets.ps1"
  extractor = $extractor
  catalog = $catalogValue
  assets = @($assets.ToArray())
  candidates = @($candidates.ToArray())
  warnings = @($warnings.ToArray())
}

$manifestPath = Join-Path $output "manifest.json"
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

Write-Host "Manifest: $manifestPath"
Write-Host "Imported assets: $($assets.Count)"
Write-Host "Imported music: $importedMusicTracks tracks / $importedMusicBytes bytes"
Write-Host "Bundle candidates: $($candidates.Count)"
foreach ($warning in $warnings) {
  Write-Warning $warning
}
