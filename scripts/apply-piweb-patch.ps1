param(
    [Parameter(Mandatory=$true)][string]$SourceDir,
    [string]$PatchFile = (Join-Path $PSScriptRoot '..\patches\piweb-image-render.patch'),
    [switch]$InstallDependencies
)
$ErrorActionPreference = 'Stop'
$SourceDir = (Resolve-Path $SourceDir).Path
$PatchFile = (Resolve-Path $PatchFile).Path
if (-not (Test-Path (Join-Path $SourceDir '.git'))) { throw "SourceDir is not a Git checkout: $SourceDir" }
$chatInput = Join-Path $SourceDir 'components\ChatInput.tsx'
$markdown = Join-Path $SourceDir 'components\MarkdownBody.tsx'
$message = Join-Path $SourceDir 'components\MessageView.tsx'
$pwa = Join-Path $SourceDir 'components\PwaRegistration.tsx'
$serviceWorker = Join-Path $SourceDir 'public\sw.js'
$baseMarkers = (Select-String -Path $chatInput -SimpleMatch 'uploadPastedFile' -Quiet) -and (Select-String -Path $markdown -SimpleMatch 'LOCAL_IMAGE_PATH' -Quiet) -and (Select-String -Path $markdown -SimpleMatch 'maxWidth: "min(100%, 480px)"' -Quiet) -and (Select-String -Path $message -SimpleMatch 'maxHeight: 360' -Quiet) -and (Select-String -Path $pwa -SimpleMatch 'getRegistrations' -Quiet) -and (Select-String -Path $serviceWorker -SimpleMatch 'networkFirst' -Quiet)
$newMarkers = (Select-String -Path $message -SimpleMatch 'imageToolCalls' -Quiet) -and (Select-String -Path $message -SimpleMatch 'contentHash' -Quiet) -and (Select-String -Path $message -SimpleMatch 'data-interleaved-images' -Quiet) -and (Select-String -Path $message -SimpleMatch 'imageTargetLines' -Quiet) -and (Select-String -Path $message -SimpleMatch 'suppressToolImages' -Quiet)
$already = $baseMarkers -and $newMarkers
$legacy = $baseMarkers -and -not $newMarkers
Push-Location $SourceDir
try {
  if ($already) { Write-Output 'Pi Web local attachments patch v0.2.7 is already applied.' }
  elseif ($legacy) { throw 'A legacy v0.2.5/v0.2.6 patch is already applied. Do not overwrite local changes; restore a clean Pi Web checkout or apply the documented upgrade patch first.' }
  else {
    $out = & git apply --check $PatchFile 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Patch check failed:`n$($out -join [Environment]::NewLine)" }
    $out = & git apply $PatchFile 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Patch failed:`n$($out -join [Environment]::NewLine)" }
    Write-Output 'Pi Web local attachments patch applied.'
  }
  if ($InstallDependencies) { npm install }
} finally { Pop-Location }
