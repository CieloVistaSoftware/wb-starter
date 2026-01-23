(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/add-issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'node-fetch-test-' + Date.now() })
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log(text.slice(0, 800));
  } catch (e) {
    console.error('ERR', e);
  }
})();