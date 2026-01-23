export async function openSiteIssues() {
  // Lazily create or find the singleton issues element
  let issuesEl = document.getElementById('siteIssuesDrawer') || document.querySelector('wb-issues#siteIssuesDrawer') || document.querySelector('wb-issues');

  if (!issuesEl) {
    issuesEl = document.createElement('wb-issues');
    issuesEl.id = 'siteIssuesDrawer';
    issuesEl.style.zIndex = 9999;
    document.body.appendChild(issuesEl);
    if (window.WB && typeof window.WB.scan === 'function') {
      try { window.WB.scan(issuesEl); } catch (e) { console.warn('[WB] Failed to scan issues element', e); }
    }

    // Wait for behavior to initialize (give it a bit longer to attach methods)
    const start = Date.now();
    while ((issuesEl.dataset.wbReady !== 'issues') && (Date.now() - start < 2000)) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 50));
    }
  }

  // Use its public API if present, otherwise click its trigger
  if (issuesEl && typeof issuesEl.open === 'function') {
    try { console.debug('[issues-helper] calling issuesEl.open()'); return issuesEl.open(); } catch (e) { console.warn('issuesEl.open() failed', e); }
  }
  const trigger = issuesEl.querySelector('.wb-issues-trigger, .wb-issues__trigger');
  if (trigger) trigger.click();
}

export default openSiteIssues;