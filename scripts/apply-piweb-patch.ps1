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
$already = (Select-String -Path $chatInput -SimpleMatch 'uploadPastedFile' -Quiet) -and (Select-String -Path $markdown -SimpleMatch 'LOCAL_IMAGE_PATH' -Quiet) -and (Select-String -Path $markdown -SimpleMatch 'maxWidth: "min(100%, 480px)"' -Quiet) -and (Select-String -Path $message -SimpleMatch 'maxHeight: 360' -Quiet)
Push-Location $SourceDir
try {
  if ($already) { Write-Output 'Pi Web image patch is already applied.' }
  else {
    $out = & git apply $PatchFile 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Patch failed:`n$($out -join [Environment]::NewLine)" }
    Write-Output 'Pi Web image patch applied.'
  }
  if ($InstallDependencies) { npm install }
} finally { Pop-Location }
