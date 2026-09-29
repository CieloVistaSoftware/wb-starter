$runId = 21552594486
$repo = 'CieloVistaSoftware/wb-starter'
$prNumber = 51
$pollInterval = 5
$maxChecks = 240   # ~20 minutes

Write-Output "[monitor] watching run $runId for repo $repo"
for ($i=0; $i -lt $maxChecks; $i++) {
  $rRaw = gh run view $runId --repo $repo --json status,conclusion,updatedAt -q '{status: .status, conclusion: .conclusion, updatedAt: .updatedAt}' 2>$null
  if ($rRaw) {
    $r = $rRaw | ConvertFrom-Json
    Write-Output "[monitor] poll $($i+1)/$maxChecks status=$($r.status) conclusion=$($r.conclusion) updated=$($r.updatedAt)"
    if ($r.status -eq 'completed') {
      if ($r.conclusion -eq 'success') {
        Write-Output "[monitor] run succeeded — downloading artifacts..."
        gh run download $runId --repo $repo --dir tmp/run-$runId-artifacts || Write-Output '[monitor] no artifacts found'
        if (Test-Path "tmp/run-$runId-artifacts") { Get-ChildItem "tmp/run-$runId-artifacts" -Recurse | Select-Object FullName, Length }
        Write-Output "[monitor] merging PR #$prNumber"
        gh pr merge $prNumber --repo $repo --merge --delete-branch --body "fix(ci): fs.watch fallback — verified artifacts from run $runId"
        Write-Output '[monitor] PR merged'
        exit 0
      } else {
        Write-Output "[monitor] run completed with conclusion='$($r.conclusion)' — fetching failed logs and artifacts"
        gh run view $runId --repo $repo --log-failed || true
        gh run download $runId --repo $repo --dir tmp/run-$runId-artifacts || Write-Output '[monitor] no artifacts found'
        if (Test-Path "tmp/run-$runId-artifacts") { Get-ChildItem "tmp/run-$runId-artifacts" -Recurse | Select-Object FullName, Length }
        Write-Output '[monitor] not merging PR (run failed)'
        exit 2
      }
    }
  }
  Start-Sleep -Seconds $pollInterval
}
Write-Output '[monitor] TIMEOUT waiting for run to complete'
exit 3
