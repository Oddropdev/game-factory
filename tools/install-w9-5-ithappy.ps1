# Owner-local installation only. Never commits, uploads or publishes paid files.
param([string]$ObstaclesZip='', [string]$DeathrunZip='')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
function Pick-Zip([string]$Title){
 $picker=New-Object System.Windows.Forms.OpenFileDialog
 $picker.Title=$Title; $picker.Filter='Asset archive (*.zip)|*.zip'
 if($picker.ShowDialog() -ne 'OK'){throw 'Installation cancelled'}
 return $picker.FileName
}
if(-not $ObstaclesZip){$ObstaclesZip=Pick-Zip 'Choose your Platformer 2 Obstacles GLB ZIP'}
if(-not $DeathrunZip){$DeathrunZip=Pick-Zip 'Choose your Platformer Deathrun GLB ZIP'}
& (Join-Path $PSScriptRoot 'install-w9-4-ithappy.ps1') -ObstaclesZip $ObstaclesZip -DeathrunZip $DeathrunZip
$dest=Join-Path $PSScriptRoot '..\spikes\w9-ball\public\licensed'
$want=@(
 @{Name='arch_001.glb';Sha='72c480ec095188f99eadf656bec263a1346ba071352d25eed43a12b1d95f7fe2'},
 @{Name='air_balloon_001.glb';Sha='0373c92c56827e68b6e5a8f5b15600963b40970f0f9b5c856cafa183fa3b39db'},
 @{Name='coin_001.glb';Sha='dc1642b5677c3e68ca6fc0a91694df326c33570af5072495ca9e8746c7d538ad'}
)
$zip=[System.IO.Compression.ZipFile]::OpenRead($ObstaclesZip)
try{
 foreach($item in $want){
  $entry=@($zip.Entries | Where-Object {($_.FullName -replace '\\','/').EndsWith('/'+$item.Name)})
  if($entry.Count -ne 1){throw "Missing or ambiguous $($item.Name)"}
  $memory=New-Object System.IO.MemoryStream
  $stream=$entry[0].Open()
  try{$stream.CopyTo($memory)}finally{$stream.Dispose()}
  $bytes=$memory.ToArray();$memory.Dispose()
  $sha=[System.Security.Cryptography.SHA256]::Create()
  try{$digest=([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-','').ToLowerInvariant()}finally{$sha.Dispose()}
  if($digest -ne $item.Sha){throw "Wrong version: $($item.Name)"}
  [IO.File]::WriteAllBytes((Join-Path $dest $item.Name),$bytes)
 }
}finally{$zip.Dispose()}
Write-Host 'W95_OWNER_ASSETS_PASS: nine models installed locally. Rebuild with npm run build:w9-4:ball.'
