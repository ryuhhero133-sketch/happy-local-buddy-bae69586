Add-Type -AssemblyName System.Drawing
$base = Join-Path $PSScriptRoot '../src/ambiente/xz'
foreach ($name in @('Snorlax', 'Snorlax Mitico', 'Kabutops', 'Kabutops Shiny', 'aerodactyl')) {
  $image = [System.Drawing.Bitmap]::FromFile((Join-Path $base "$name.png"))
  try {
    if ($image.Width % 4 -ne 0 -or $image.Height % 4 -ne 0) { throw "Grade 4x4 inválida: $name" }
    $rect = New-Object System.Drawing.Rectangle(0, 0, ($image.Width / 4), ($image.Height / 4))
    $icon = $image.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try { $icon.Save((Join-Path $base "$name-icon.png"), [System.Drawing.Imaging.ImageFormat]::Png) } finally { $icon.Dispose() }
    Write-Output "$name : $($image.Width)x$($image.Height), frame $($rect.Width)x$($rect.Height)"
  } finally { $image.Dispose() }
}
