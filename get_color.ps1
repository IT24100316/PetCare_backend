Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('d:\Y2S2\WMT\pawcare\PawCare\assets\images\hero_cat.png')
$bmp = new-object System.Drawing.Bitmap($img)
$pixel = $bmp.GetPixel(0,0)
'#{0:X2}{1:X2}{2:X2}' -f $pixel.R, $pixel.G, $pixel.B
