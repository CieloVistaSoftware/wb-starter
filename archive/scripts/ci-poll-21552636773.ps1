$runId = 21552636773
$repo = 'CieloVistaSoftware/wb-starter'
Write-Output "[monitor] watching run $runId on $repo"
for ($i=0; $i -lt 120; $i++) {
  $r = gh run view $runId --repo $repo --json status,conclusion,updatedAt | ConvertFrom-Json
  Write-Output "[monitor] poll $($i+1)/120 status=$($r.status) conclusion=$($r.conclusion) updated=$($r.updatedAt)"
  if ($r.status -eq 'completed') { break }
  Start-Sleep -Seconds 5
}

Write-Output "[monitor] fetching failed-step logs (if any)"
try {
  gh run view $runId --repo $repo --log-failed
} catch {
  Write-Output '[monitor] no failed-step logs'
}

Write-Output "[monitor] downloading artifacts (if any) to tmp/run-$runId-artifacts"
try {
  gh run download $runId --repo $repo --dir tmp/run-$runId-artifacts
} catch {
  Write-Output '[monitor] no artifacts found'
}
if (Test-Path "tmp/run-$runId-artifacts") { Get-ChildItem "tmp/run-$runId-artifacts" -Recurse | Select-Object FullName, Length }

# Inspect fix/ci-fs-watch-fallback run and merge PR #51 if green
$fixRunId = 21552594486
$fixRun = gh run view $fixRunId --repo $repo --json status,conclusion | ConvertFrom-Json
Write-Output "[monitor] fix branch run $fixRunId -> status=$($fixRun.status) conclusion=$($fixRun.conclusion)"
if ($fixRun.status -eq 'completed' -and $fixRun.conclusion -eq 'success') {
  Write-Output '[monitor] downloading artifacts for fix branch run'
try {
  gh run download $fixRunId --repo $repo --dir tmp/run-$fixRunId-artifacts
} catch {
  Write-Output '[monitor] no artifacts for fix run'
}
  if (Test-Path "tmp/run-$fixRunId-artifacts") { Get-ChildItem "tmp/run-$fixRunId-artifacts" -Recurse | Select-Object FullName, Length }

  # Merge PR #51 if not already merged
  $pr = gh pr view 51 --repo $repo --json number,state,merged,mergeStateStatus | ConvertFrom-Json
  Write-Output "[monitor] PR #$($pr.number) state=$($pr.state) merged=$($pr.merged) mergeState=$($pr.mergeStateStatus)"
  if (-not $pr.merged) {
    Write-Output '[monitor] merging PR #51'
    gh pr merge 51 --repo $repo --merge --delete-branch --body "fix(ci): fs.watch fallback - verified by run $fixRunId"
    Write-Output '[monitor] PR #51 merged'
  } else {
    Write-Output '[monitor] PR #51 already merged'
  }
} else {
  Write-Output '[monitor] fix branch run not green — skipping merge'
}
