$ErrorActionPreference = "Stop"
$dir = Join-Path $PSScriptRoot "..\icons"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

Add-Type -AssemblyName System.Drawing

function New-PauseIcon($size) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(29, 29, 31))

  $fg = [System.Drawing.Brushes]::White
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 255, 255, 255)), ([Math]::Max(1, $size / 16))
  $g.DrawEllipse($pen, $size * 0.12, $size * 0.12, $size * 0.76, $size * 0.76)

  $barW = [Math]::Max(2, [int]($size * 0.11))
  $barH = [int]($size * 0.42)
  $x1 = [int]($size * 0.36)
  $x2 = [int]($size * 0.54)
  $y = [int]($size * 0.28)
  $g.FillRectangle($fg, $x1, $y, $barW, $barH)
  $g.FillRectangle($fg, $x2, $y, $barW, $barH)

  $g.Dispose()
  $pen.Dispose()
  return $bmp
}

foreach ($s in @(16, 48, 128)) {
  $icon = New-PauseIcon $s
  $path = Join-Path $dir "icon$s.png"
  $icon.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $icon.Dispose()
  Write-Host "Wrote $path"
}
