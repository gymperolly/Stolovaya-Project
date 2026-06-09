async function check() {
  try {
    const response = await fetch('https://uidywnmzzfedstfgqqhi.supabase.co/rest/v1/menu_items?select=category', {
      headers: {
        'apikey': 'sb_publishable_o3nNuie9EsV8O3l4n2bQUA_j1BPSgHg',
        'Authorization': 'Bearer sb_publishable_o3nNuie9EsV8O3l4n2bQUA_j1BPSgHg'
      }
    });
    const data = await response.json();
    console.log(data);
  } catch(e) {
    console.error(e);
  }
}
check();
