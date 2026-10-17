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

$('#sair').onclick = () => {
  sessionStorage.removeItem('tk');
  location.reload();
};

function entrar() {
  $('#lg').hidden = true;
  $('#ap').hidden = false;
  $('#sair').hidden = false;
  lista();
}

function aba(t) {
  $('#sp').hidden = t !== 'p';
  $('#so').hidden = t !== 'o';
  if (t === 'o') pedidos();
  if (t === 'p') lista();
}

async function lista() {
  const l = await api('GET', 'produtos?select=id,nome,ativo&order=id.desc&limit=200');
  $('#lp').innerHTML = '<h3>Seus produtos</h3>' + (l || []).map(p => `
    <div class="li">
      <span>${E(p.nome)} ${p.ativo ? '' : '(oculto)'}</span>
      <span>
        <button onclick="editar(${p.id})">Editar</button>
        <button onclick="ocultar(${p.id}, \( {!p.ativo})"> \){p.ativo ? 'Ocultar' : 'Mostrar'}</button>
      </span>
    </div>
  `).join('') || '<p>Nenhum produto cadastrado.</p>';
}

async function editar(id) {
  const p = (await api('GET', `produtos?id=eq.${id}&select=*,variacoes(*)`))[0];
  if (!p) return;
  eid = p.id;
  $('#ft').textContent = 'Editar produto';
  $('#pn').value = p.nome || '';
  $('#pc').value = p.categoria || '';
  $('#pd').value = p.descricao || '';
  $('#dtipo').value = p.desconto_tipo || '';
  $('#dvalor').value = p.desconto_valor || '';
  img = p.imagem || '';
  $('#pu').textContent = img ? 'Foto atual mantida' : '';
  $('#vl').innerHTML = '';
  (p.variacoes || []).forEach(v => {
    const d = document.createElement('div');
    d.className = 'li';
    d.innerHTML = `
      <input value="${E(Object.entries(v.opcoes || {}).map(([k, val]) => k + ': ' + val).join(' | '))}" placeholder="Opções">
      <input type="number" step="0.01" value="${v.preco}" placeholder="Preço">
      <input type="number" value="${v.estoque}" placeholder="Estoque">
      <button type="button" onclick="this.parentNode.remove()">✕</button>
    `;
    $('#vl').append(d);
  });
  window.scrollTo(0, 0);
}

function novo() {
  eid = null;
  img = '';
  $('#ft').textContent = 'Novo produto';
  $('#fp').reset();
  $('#pu').textContent = '';
  $('#vl').innerHTML = '';
  $('#dtipo').value = '';
  $('#dvalor').value = '';
}

function linha() {
  const d = document.createElement('div');
  d.className = 'li';
  d.innerHTML = `
    <input placeholder="Opções (ex: Cor: Preto)">
    <input type="number" step="0.01" placeholder="Preço">
    <input type="number" placeholder="Estoque">
    <button type="button" onclick="this.parentNode.remove()">✕</button>
  `;
  $('#vl').append(d);
}

function gerar() {
  const linhas = $('#vg').value.trim().split('\n').filter(Boolean);
  if (!linhas.length) return alert('Digite as opções no campo de variações');
  const grupos = {};
  linhas.forEach(l => {
    const [k, ...vals] = l.split(':');
    if (!k || !vals.length) return;
    grupos[k.trim()] = vals.join(':').split(',').map(v => v.trim()).filter(Boolean);
  });
  const keys = Object.keys(grupos);
  if (!keys.length) return;

  function combinar(i, atual) {
    if (i === keys.length) {
      const d = document.createElement('div');
      d.className = 'li';
      d.innerHTML = `
        <input value="${E(Object.entries(atual).map(([k, v]) => k + ': ' + v).join(' | '))}" placeholder="Opções">
        <input type="number" step="0.01" value="\( { \)('#vp').value || ''}" placeholder="Preço">
        <input type="number" value="\( { \)('#ve').value || ''}" placeholder="Estoque">
        <button type="button" onclick="this.parentNode.remove()">✕</button>
      `;
      $('#vl').append(d);
      return;
    }
    grupos[keys[i]].forEach(v => {
      combinar(i + 1, { ...atual, [keys[i]]: v });
    });
  }
  $('#vl').innerHTML = '';
  combinar(0, {});
}

$('#pf').onchange = async e => {
  const f = e.target.files[0];
  if (!f) return;
  const fd = new FormData();
  fd.append('file', f);
  try {
    const r = await fetch(C.supabase_url + '/storage/v1/object/produtos/' + Date.now() + '-' + f.name, {
      method: 'POST',
      headers: {
        apikey: C.supabase_key,
        Authorization: 'Bearer ' + T
      },
      body: fd
    });
    if (!r.ok) throw await r.text();
    const j = await r.json();
    img = C.supabase_url + '/storage/v1/object/public/produtos/' + j.Key.split('/').pop();
    $('#pu').textContent = 'Foto enviada com sucesso';
  } catch (x) {
    alert('Erro ao enviar foto: ' + x);
  }
};

$('#fp').onsubmit = async e => {
  e.preventDefault();
  const nome = $('#pn').value.trim();
  const categoria = $('#pc').value.trim();
  const descricao = $('#pd').value.trim();
  const desconto_tipo = $('#dtipo').value || null;
  const desconto_valor = \( ('#dvalor').value ? Number( \)('#dvalor').value) : null;

  if (!nome || !categoria) return alert('Preencha nome e categoria');

  const vars = [...$('#vl').children].map(d => {
    const inputs = d.querySelectorAll('input');
    const opcoesTxt = inputs[0].value.trim();
    const preco = Number(inputs[1].value) || 0;
    const estoque = Number(inputs[2].value) || 0;
    const opcoes = {};
    opcoesTxt.split('|').forEach(p => {
      const [k, ...v] = p.split(':');
      if (k && v.length) opcoes[k.trim()] = v.join(':').trim();
    });
    return { opcoes, preco, estoque };
  }).filter(v => Object.keys(v.opcoes).length);

  if (!vars.length) return alert('Adicione pelo menos uma variação');

  const preco_min = Math.min(...vars.map(v => v.preco));

  const dados = {
    nome,
    categoria,
    descricao,
    imagem: img || null,
    preco_min,
    desconto_tipo,
    desconto_valor,
    ativo: true
  };

  try {
    let pid = eid;
    if (eid) {
      await api('PATCH', `produtos?id=eq.${eid}`, dados);
      await api('DELETE', `variacoes?produto_id=eq.${eid}`);
    } else {
      const r = await api('POST', 'produtos', dados, { Prefer: 'return=representation' });
      pid = r[0].id;
    }

    for (const v of vars) {
      await api('POST', 'variacoes', {
        produto_id: pid,
        opcoes: v.opcoes,
        preco: v.preco,
        estoque: v.estoque
      });
    }

    alert('Produto salvo com sucesso!');
    novo();
    lista();
  } catch (x) {
    alert('Erro ao salvar: ' + x);
  }
};

async function ocultar(id, ativo) {
  await api('PATCH', `produtos?id=eq.${id}`, { ativo });
  lista();
}

async function pedidos() {
  const l = await api('GET', 'pedidos?select=*&order=id.desc&limit=50');
  $('#lo').innerHTML = '<h3>Pedidos recentes</h3>' + (l || []).map(p => `
    <div class="li">
      <div>
        <b>#${p.id}</b> — ${E(p.cliente?.nome || 'Cliente')}<br>
        <small>${new Date(p.created_at).toLocaleString('pt-BR')} · ${R(p.total || 0)}</small>
      </div>
      <span>${E(p.status || 'novo')}</span>
    </div>
  `).join('') || '<p>Nenhum pedido ainda.</p>';
}

init();