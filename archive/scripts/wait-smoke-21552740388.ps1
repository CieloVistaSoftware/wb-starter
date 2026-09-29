$runId = 21552740388
$repo = 'CieloVistaSoftware/wb-starter'
Write-Output "[wait-smoke] monitoring run $runId"
for ($i=0; $i -lt 120; $i++) {
  $r = gh run view $runId --repo $repo --json status,conclusion,updatedAt | ConvertFrom-Json
  Write-Output "[wait-smoke] poll $($i+1)/120 status=$($r.status) conclusion=$($r.conclusion) updated=$($r.updatedAt)"
  if ($r.status -eq 'completed') { break }
  Start-Sleep -Seconds 4
}

Write-Output "[wait-smoke] fetching failed-step logs (if any)"
try { gh run view $runId --repo $repo --log-failed } catch { Write-Output '[wait-smoke] no failed-step logs' }

Write-Output "[wait-smoke] downloading artifacts to tmp/run-$runId-artifacts"
try { gh run download $runId --repo $repo --dir tmp/run-$runId-artifacts } catch { Write-Output '[wait-smoke] no artifacts found' }
if (Test-Path "tmp/run-$runId-artifacts") { Get-ChildItem "tmp/run-$runId-artifacts" -Recurse | Select-Object FullName, Length }
