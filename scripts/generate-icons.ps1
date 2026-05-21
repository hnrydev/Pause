$ErrorActionPreference = "Stop"
$dir = Join-Path $PSScriptRoot "..\icons"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

Add-Type -AssemblyName System.Drawing

function New-PauseIcon($size) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)

  if ($size -le 24) {
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  } else {
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  }

  $bg = [System.Drawing.Color]::FromArgb(29, 29, 31)
  $g.Clear($bg)

  $cx = $size / 2.0
  $cy = $size / 2.0

  # Circle inset — equal padding on all sides
  $inset = [Math]::Round($size * 0.14)
  $circleSize = $size - (2 * $inset)
  $circleX = $inset
  $circleY = $inset

  $stroke = [Math]::Max(1.0, $size / 16.0)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 255, 255, 255)), $stroke
  $g.DrawEllipse($pen, $circleX, $circleY, $circleSize, $circleSize)

  # Pause bars centered as a group inside the circle
  $barW = [Math]::Max(2, [int][Math]::Round($size * 0.09))
  $gap = [Math]::Max(2, [int][Math]::Round($size * 0.08))
  $barH = [int][Math]::Round($circleSize * 0.46)

  $groupW = (2 * $barW) + $gap
  $leftBarX = [int][Math]::Round($cx - ($groupW / 2.0))
  $rightBarX = $leftBarX + $barW + $gap
  $barY = [int][Math]::Round($cy - ($barH / 2.0))

  $fg = [System.Drawing.Brushes]::White
  $g.FillRectangle($fg, $leftBarX, $barY, $barW, $barH)
  $g.FillRectangle($fg, $rightBarX, $barY, $barW, $barH)

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
