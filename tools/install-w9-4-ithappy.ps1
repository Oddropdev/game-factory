# W9.4-2 — install ONLY six owner-licensed GLBs from the two purchased ZIPs.
# Does not upload files, does not run Unity, and does not modify public Git history.
param(
  [string]$SelectedZip = '',
  [string]$ObstaclesZip = (Join-Path $env:USERPROFILE 'Downloads\Platformer_2_Obstacles_glb.zip'),
  [string]$DeathrunZip = (Join-Path $env:USERPROFILE 'Downloads\Platformer_Deathrun_glb.zip')
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$root = Join-Path $repo 'spikes\w9-ball'
$dest = Join-Path $root 'public\licensed'
$stage = Join-Path $env:TEMP ('ithappy-w942-' + [guid]::NewGuid().ToString('N'))
$want = @(
  @{ Pack='obstacles'; Name='road_001.glb'; Sha='96a0555b7b8a77bf4d3ccb35d0d031b68279ef3e40948d0128684ad782931702' },
  @{ Pack='obstacles'; Name='obstacle_1_001.glb'; Sha='c9703d2afc4e3ffce9ad0a3e5064c6c42df933ee66572616d4f259302bddd215' },
  @{ Pack='obstacles'; Name='obstacle_18_001.glb'; Sha='a4685ba62048c32908c42ecc5c9bd4fd16cb91182a522b03f0d7adeb1f9ea8e2' },
  @{ Pack='obstacles'; Name='checkpoint_001.glb'; Sha='d5bb02dd4c67ec96b5cb17577317eef76c8eb44f289bbf09e86684f5fea41d68' },
  @{ Pack='obstacles'; Name='ball_001.glb'; Sha='a3b2caf1f845bfac64713121651d9ca1663d9451dfd730be37d42abe581cb3bb' },
  @{ Pack='deathrun'; Name='tree_002.glb'; Sha='a1c8510fe9c00c68d4dae2212928aca51e71428a8c773bd0e8fc4a8f9cdfaca8' }
)
$zips = @{ obstacles=$ObstaclesZip; deathrun=$DeathrunZip }
if($SelectedZip){
  $zips['obstacles']=$SelectedZip
  $zips['deathrun']=$SelectedZip
}
foreach($p in @('obstacles','deathrun')){
  if(-not (Test-Path -LiteralPath $zips[$p])){ throw "ZIP not found: $($zips[$p])" }
}
New-Item -ItemType Directory -Path $stage -Force | Out-Null
try {
  foreach($p in @('obstacles','deathrun')) {
    $zip=[System.IO.Compression.ZipFile]::OpenRead($zips[$p])
    try {
      foreach($asset in @($want | Where-Object { $_.Pack -eq $p })){
        $matches=@($zip.Entries | Where-Object {
          ($_.FullName -replace '\\','/').EndsWith('/'+$asset.Name,
            [System.StringComparison]::OrdinalIgnoreCase)
        })
        if($matches.Count -ne 1){ throw "Expected exactly one $($asset.Name) in $p; got $($matches.Count)" }
        $file=Join-Path $stage $asset.Name
        $stream=$matches[0].Open()
        try{
          $output=[System.IO.File]::Create($file)
          try { $stream.CopyTo($output) } finally { $output.Dispose() }
        } finally { $stream.Dispose() }
        $actual=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
        if($actual -ne $asset.Sha){ throw "SHA256 mismatch: $($asset.Name) — wrong asset version" }
        $fs=[System.IO.File]::OpenRead($file)
        try{
          $magic=New-Object byte[] 4
          $null=$fs.Read($magic,0,4)
          if([System.Text.Encoding]::ASCII.GetString($magic) -ne 'glTF'){
            throw "Invalid GLB magic: $($asset.Name)"
          }
        } finally {$fs.Dispose()}
        Write-Host ("Verified {0}: {1} bytes" -f $asset.Name, (Get-Item $file).Length)
      }
    } finally { $zip.Dispose() }
  }
  if(Test-Path -LiteralPath $dest){Remove-Item -LiteralPath $dest -Recurse -Force}
  New-Item -ItemType Directory -Path (Split-Path $dest -Parent) -Force | Out-Null
  Move-Item -LiteralPath $stage -Destination $dest
  $envFile=Join-Path $root '.env.local'
  [System.IO.File]::WriteAllText($envFile,"VITE_ITHAPPY_ASSETS=1`n")
  Write-Host 'W9_4_2_LICENSED_ART_INSTALLED_PASS: 6/6'
  Write-Host 'Next: npm run build:w9-4:ball'
  Write-Host 'No licensed source files were committed or uploaded.'
} finally {
  if(Test-Path -LiteralPath $stage){Remove-Item -LiteralPath $stage -Recurse -Force}
}
