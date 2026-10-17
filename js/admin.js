let C, T = sessionStorage.tk || '', eid = null, img = '';

const api = async (m, p, b, x) => {
  const r = await fetch(C.supabase_url + '/rest/v1/' + p, {
    method: m,
    headers: {
      apikey: C.supabase_key,
      Authorization: 'Bearer ' + T,
      'Content-Type': 'application/json',
      ...x
    },
    body: b ? JSON.stringify(b) : undefined
  });
  if (r.status == 401) {
    sessionStorage.removeItem('tk');
    location.reload();
  }
  if (!r.ok) {
    alert('Erro: ' + await r.text());
    throw 0;
  }
  return r.status == 204 ? null : r.json().catch(() => null);
};

async function init() {
  C = await loadConfig();
  if (T) entrar();
}

$('#lg').onsubmit = async e => {
  e.preventDefault();
  try {
    const r = await fetch(C.supabase_url + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        apikey: C.supabase_key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: $('#em').value.trim(),
        password: $('#se').value
      })
    });
    const j = await r.json();
    if (!j.access_token) return alert('Não entrou: ' + (j.msg || j.error_description || j.message || JSON.stringify(j)));
    T = sessionStorage.tk = j.access_token;
    entrar();
  } catch (x) {
    alert('Erro de conexão: ' + x + '. Confira a URL e a chave no data/config.json.');
  }
};

$('#sair').onclick =