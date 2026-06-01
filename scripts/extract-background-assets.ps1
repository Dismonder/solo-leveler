param(
  [string]$SourceDir = (Join-Path (Join-Path $PSScriptRoot "..") ("t" + [char]0x0142 + "a")),
  [string]$OutputDir = (Join-Path $PSScriptRoot "..\src\assets\backgrounds")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function Save-JpegCrop {
  param(
    [Parameter(Mandatory = $true)][string]$SourcePath,
    [Parameter(Mandatory = $true)][string]$OutputPath,
    [Parameter(Mandatory = $true)][int]$X,
    [Parameter(Mandatory = $true)][int]$Y,
    [Parameter(Mandatory = $true)][int]$Width,
    [Parameter(Mandatory = $true)][int]$Height,
    [int]$Quality = 90
  )

  $image = [System.Drawing.Image]::FromFile($SourcePath)
  try {
    $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $sourceRect = New-Object System.Drawing.Rectangle($X, $Y, $Width, $Height)
        $targetRect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
        $graphics.DrawImage($image, $targetRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
      } finally {
        $graphics.Dispose()
      }

      $parent = Split-Path -Parent $OutputPath
      if (!(Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent | Out-Null
      }

      $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" } | Select-Object -First 1
      $encoder = [System.Drawing.Imaging.Encoder]::Quality
      $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
      $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($encoder, [int64]$Quality)
      $bitmap.Save($OutputPath, $codec, $encoderParams)
      $encoderParams.Dispose()
    } finally {
      $bitmap.Dispose()
    }
  } finally {
    $image.Dispose()
  }
}

function Get-GridRect {
  param(
    [int]$ImageWidth,
    [int]$ImageHeight,
    [int]$Columns,
    [int]$Rows,
    [int]$Column,
    [int]$Row
  )

  $x0 = [int][Math]::Round(($Column * $ImageWidth) / $Columns)
  $x1 = [int][Math]::Round((($Column + 1) * $ImageWidth) / $Columns)
  $y0 = [int][Math]::Round(($Row * $ImageHeight) / $Rows)
  $y1 = [int][Math]::Round((($Row + 1) * $ImageHeight) / $Rows)
  return [PSCustomObject]@{
    X = $x0
    Y = $y0
    Width = $x1 - $x0
    Height = $y1 - $y0
  }
}

$singlePath = Join-Path $SourceDir "jedno.png"
$appGridPath = Join-Path $SourceDir "wiele.png"
$gameGridPath = Join-Path $SourceDir "wiele do mini gier.png"

if (!(Test-Path -LiteralPath $singlePath)) { throw "Missing source: $singlePath" }
if (!(Test-Path -LiteralPath $appGridPath)) { throw "Missing source: $appGridPath" }
if (!(Test-Path -LiteralPath $gameGridPath)) { throw "Missing source: $gameGridPath" }

$singleOut = Join-Path $OutputDir "app\solo-purple-citadel.jpg"
$singleImage = [System.Drawing.Image]::FromFile($singlePath)
try {
  Save-JpegCrop -SourcePath $singlePath -OutputPath $singleOut -X 0 -Y 0 -Width $singleImage.Width -Height $singleImage.Height -Quality 91
} finally {
  $singleImage.Dispose()
}

$appNames = @(
  "shadow-citadel-purple",
  "frost-temple-blue",
  "blood-eclipse-red",
  "rain-city-night",
  "azure-gate-ruins",
  "golden-wasteland",
  "void-eclipse-purple",
  "cyan-ruins-gate",
  "distant-tower-night"
)

$appImage = [System.Drawing.Image]::FromFile($appGridPath)
try {
  for ($row = 0; $row -lt 3; $row++) {
    for ($column = 0; $column -lt 3; $column++) {
      $index = ($row * 3) + $column
      $rect = Get-GridRect -ImageWidth $appImage.Width -ImageHeight $appImage.Height -Columns 3 -Rows 3 -Column $column -Row $row
      $out = Join-Path $OutputDir ("app\{0:D2}-{1}.jpg" -f ($index + 1), $appNames[$index])
      Save-JpegCrop -SourcePath $appGridPath -OutputPath $out -X $rect.X -Y $rect.Y -Width $rect.Width -Height $rect.Height -Quality 90
    }
  }
} finally {
  $appImage.Dispose()
}

$gameNames = @(
  "solo-gate-purple",
  "siege-wall-sunset",
  "shinobi-mountain",
  "blue-moon-tower",
  "demon-moon-town",
  "cursed-red-city",
  "sunny-pirate-island",
  "dragon-golden-wasteland",
  "red-rain-streets",
  "green-storm-city"
)

$gameImage = [System.Drawing.Image]::FromFile($gameGridPath)
try {
  for ($row = 0; $row -lt 5; $row++) {
    for ($column = 0; $column -lt 2; $column++) {
      $index = ($row * 2) + $column
      $rect = Get-GridRect -ImageWidth $gameImage.Width -ImageHeight $gameImage.Height -Columns 2 -Rows 5 -Column $column -Row $row
      $out = Join-Path $OutputDir ("mini-games\{0:D2}-{1}.jpg" -f ($index + 1), $gameNames[$index])
      Save-JpegCrop -SourcePath $gameGridPath -OutputPath $out -X $rect.X -Y $rect.Y -Width $rect.Width -Height $rect.Height -Quality 90
    }
  }
} finally {
  $gameImage.Dispose()
}

Write-Host "Extracted app and mini-game backgrounds to $OutputDir"
