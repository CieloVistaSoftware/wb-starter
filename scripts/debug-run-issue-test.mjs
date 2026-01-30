(async()=>{
  const res = await fetch('http://localhost:3000/api/run-issue-test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ issueId: 'note-1769293683522-p0' }) });
  console.log('status', res.status);
  try {
    const body = await res.json();
    console.log('body JSON:', JSON.stringify(body, null, 2));
  } catch (e) {
    const text = await res.text();
    console.log('body text:', text);
  }
})();