const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),R=v=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let C,T=sessionStorage.tk||'',eid=null,img='';
const api=async(m,p,b,x)=>{const r=await fetch(C.supabase_url+'/rest/v1/'+p,{method:m,headers:{apikey:C.supabase_key,Authorization:'Bearer '+T,'Content-Type':'application/json',...x},body:b?JSON.stringify(b):undefined});
 if(r.status==401){sessionStorage.removeItem('tk');location.reload()}
 if(!r.ok){alert('Erro: '+await r.text());throw 0}return r.status==204?null:r.json().catch(()=>null)};
async function init(){C=await(await fetch('data/config.json')).json();if(T)entrar()}
$('#lg').onsubmit=async e=>{e.preventDefault();
 try{
  const r=await fetch(C.supabase_url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:C.supabase_key,'Content-Type':'application/json'},body:JSON.stringify({email:$('#em').value.trim(),password:$('#se').value})});
  const j=await r.json();
  if(!j.access_token)return alert('Não entrou: '+(j.msg||j.error_description||j.message||JSON.stringify(j)));
  T=sessionStorage.tk=j.access_token;entrar();
 }catch(x){alert('Erro de conexão: '+x+'. Confira a URL e a chave no data/config.json.')}
};
$('#sair').onclick=()=>{sessionStorage.removeItem('tk');location.reload()};
function entrar(){$('#lg').hidden=true;$('#ap').hidden=false;$('#sair').hidden=false;lista()}
window.aba=a=>{$('#sp').hidden=a!='p';$('#so').hidden=a!='o';a=='o'?pedidos():lista()};
async function lista(){const l=await api('GET','produtos?select=id,nome,ativo&order=id.desc&limit=200');
 $('#lp').innerHTML='<h3>Seus produtos</h3>'+l.map(p=>`<div class="li"><span>${E(p.nome)}${p.ativo?'':' (oculto)'}</span><span><button onclick="edit(${p.id})">Editar</button> <button onclick="ocultar(${p.id},${!p.ativo})">${p.ativo?'Ocultar':'Mostrar'}</button> <button onclick="apagar(${p.id})">Apagar</button></span></div>`).join('')}
function linha(o='',p='',e=''){$('#vl').insertAdjacentHTML('beforeend',`<div class="li"><input placeholder="Cor=Preto; Tamanho=M" value="${E(o)}"><input type="number" step="0.01" placeholder="Preço" value="${p}" style="width:90px"><input type="number" placeholder="Estoque" value="${e}" style="width:80px"><button type="button" onclick="this.parentNode.remove()">✕</button></div>`)}
window.linha=linha;
window.gerar=()=>{const g=$('#vg').value.split('\n').map(l=>l.split(':')).filter(a=>a.length>1).map(([k,v])=>[k.trim(),v.split(',').map(x=>x.trim()).filter(Boolean)]);let c=[[]];g.forEach(([k,vs])=>c=c.flatMap(a=>vs.map(v=>[...a,k+'='+v])));$('#vl').innerHTML='';c.forEach(a=>linha(a.join('; '),$('#vp').value,$('#ve').value))};
window.novo=()=>{eid=null;img='';$('#fp').reset();$('#ft').textContent='Novo produto';$('#pu').textContent='';$('#vl').innerHTML=''};
window.edit=async id=>{const[p]=await api('GET','produtos?id=eq.'+id+'&select=*,variacoes(*)');eid=id;img=p.imagem||'';$('#ft').textContent='Editando: '+p.nome;$('#pn').value=p.nome;$('#pc').value=p.categoria;$('#pd').value=p.descricao||'';$('#pu').textContent=img?'Foto atual mantida':'';$('#vl').innerHTML='';p.variacoes.forEach(v=>linha(Object.entries(v.opcoes||{}).map(([k,x])=>k+'='+x).join('; '),v.preco,v.estoque));scrollTo(0,0)};
$('#pf').onchange=async e=>{const f=e.target.files[0];if(!f)return;const n=Date.now()+'-'+f.name.replace(/[^\w.-]/g,'_');const r=await fetch(C.supabase_url+'/storage/v1/object/fotos/'+n,{method:'POST',headers:{apikey:C.supabase_key,Authorization:'Bearer '+T,'Content-Type':f.type},body:f});if(!r.ok)return alert('Erro ao enviar a foto: '+await r.text());img=C.supabase_url+'/storage/v1/object/public/fotos/'+n;$('#pu').textContent='Foto enviada ✔'};
$('#fp').onsubmit=async e=>{e.preventDefault();
 const rows=[...$('#vl').children].map(d=>{const[i,p,s]=d.querySelectorAll('input');const o={};i.value.split(';').forEach(t=>{const[k,...v]=t.split('=');if(k&&k.trim()&&v.length)o[k.trim()]=v.join('=').trim()});return{opcoes:o,preco:parseFloat(p.value),estoque:parseInt(s.value)||0}});
 if(!rows.length||rows.some(r=>!(r.preco>=0)))return alert('Adicione ao menos uma variação com preço.');
 const b={nome:$('#pn').value,categoria:$('#pc').value,descricao:$('#pd').value,imagem:img||null};let id=eid;
 if(id){await api('PATCH','produtos?id=eq.'+id,b);await api('DELETE','variacoes?produto_id=eq.'+id)}else{id=(await api('POST','produtos',b,{Prefer:'return=representation'}))[0].id}
 await api('POST','variacoes',rows.map(r=>({...r,produto_id:id})));alert('Produto salvo!');novo();lista()};
window.ocultar=async(id,a)=>{await api('PATCH','produtos?id=eq.'+id,{ativo:a});lista()};
window.apagar=async id=>{if(confirm('Apagar este produto e suas variações?')){await api('DELETE','produtos?id=eq.'+id);lista()}};
async function pedidos(){const l=await api('GET','pedidos?select=*&order=id.desc&limit=100');
 $('#lo').innerHTML='<h3>Pedidos</h3>'+(l.length?l.map(p=>{const c=p.cliente||{};return`<div class="li" style="display:block"><b>#${p.id} · ${R(p.total)} · ${E(p.status)}</b><br><small>${new Date(p.criado).toLocaleString('pt-BR')}</small><br>${(p.itens||[]).map(i=>E(i.nome)+' x'+i.qtd).join('<br>')}<br><small>${E(c.nome)} · ${E(c.tel)} · ${E(c.end)}, ${E(c.num)}</small><br>${['aguardando','pago','enviado','cancelado'].map(s=>`<button onclick="st(${p.id},'${s}')">${s}</button>`).join(' ')}</div>`}).join(''):'<p>Nenhum pedido ainda.</p>')}
window.st=async(id,s)=>{await api('PATCH','pedidos?id=eq.'+id,{status:s});pedidos()};
init();