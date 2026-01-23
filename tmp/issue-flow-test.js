(async () => {
  const base = 'http://localhost:3000';
  const unique = 'flow-test-' + Date.now();

  // Add issue
  let res = await fetch(base + '/api/add-issue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: unique }) });
  console.log('add status', res.status, res.headers.get('content-type'));
  let body = await res.text();
  console.log('add body:', body.slice(0, 400));

  // Poll pending issues
  let found;
  for (let i = 0; i < 10; i++) {
    res = await fetch(base + '/api/pending-issues?all=true');
    const data = await res.json();
    found = (data.issues || []).find(i => i.description && i.description.includes(unique));
    if (found) { console.log('found', found); break; }
    await new Promise(r => setTimeout(r, 500));
  }

  if (!found) { console.log('Did not find issue'); return; }

  // Update to resolved
  res = await fetch(base + '/api/update-issue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ issueId: found.id, status: 'resolved', resolution: 'test' }) });
  console.log('update resolved', res.status, await res.json());

  // Approve
  res = await fetch(base + '/api/update-issue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ issueId: found.id, status: 'approved' }) });
  console.log('approve', res.status, await res.json());

  // Clear resolved
  res = await fetch(base + '/api/clear-resolved-issues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
  console.log('clear', res.status, await res.json());

  // Check
  res = await fetch(base + '/api/pending-issues?all=true');
  const final = await res.json();
  console.log('final count', (final.issues||[]).length, 'contains issue?', (final.issues||[]).some(i=>i.id===found.id));
})();