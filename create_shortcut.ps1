param(
    [string]$Target,
    [string]$WorkingDir,
    [string]$Description = "J.A.R.V.I.S. Neural Interface & Voice HUD",
    [string]$ShortcutName = "J.A.R.V.I.S.lnk"
)

$desktopPath = [Environment]::GetFolderPath([Environment+SpecialFolder]::Desktop)
if (-not (Test-Path $desktopPath)) {
    $desktopPath = [Environment]::GetFolderPath('Desktop')
}

$shortcutPath = Join-Path $desktopPath $ShortcutName

$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut($shortcutPath)
$s.TargetPath = $Target
$s.WorkingDirectory = $WorkingDir
$s.Description = $Description
$s.WindowStyle = 1
$s.Save()

Write-Output "SUCCESS: Created desktop shortcut at $shortcutPath"
