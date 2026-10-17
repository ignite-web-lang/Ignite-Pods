const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),R=v=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let C,P={},cur,cart={},pg=0,fim=false,carr=false,pend=false;
try{cart=JSON.parse(localStorage.cart2||'{}')}catch{cart={}}
const save=()=>localStorage.cart2=JSON.stringify(cart),badge=()=>$('#n').textContent=Object.values(cart).reduce((a,b)=>a+b.q,0);
const img=(n,u)=>u||'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e9ece8"/><text x="200" y="150" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#16231f">${E(n)}</text></svg>`);
const H=()=>({apikey:C.supabase_key,Authorization:'Bearer '+C.supabase_key,'Content-Type':'application/json'});
const db=async(t,q)=>{try{const r=await fetch(`${C.supabase_url}/rest/v1/${t}?${q}`,{headers:H()});return r.ok?r.json():null}catch{return null}};
async function init(){C=await(await fetch('data/config.json')).json();
document.title=C.nome;$('#logo').textContent=C.nome;$('#hero').innerHTML=`<h2>${E(C.banner_titulo)}</h2><p>${E(C.banner_texto)}</p>`;$('#rodape').textContent=C.rodape;
const cs=await db('categorias','select=categoria&order=categoria');
$('#cat').innerHTML='<option value="">Todas as categorias</option>'+(cs||[]).map(x=>`<option>${E(x.categoria)}</option>`).join('');
let t;$('#q').oninput=()=>{clearTimeout(t);t=setTimeout(()=>mais(1),350)};$('#cat').oninput=$('#ord').oninput=()=>mais(1);$('#cep').onblur=cepOk;
const s=document.createElement('div');$('#grid').after(s);new IntersectionObserver(e=>e[0].isIntersecting&&mais(),{rootMargin:'400px'}).observe(s);badge()}
async function mais(r){if(r){pg=0;fim=false;$('#grid').innerHTML=''}else if(carr||fim)return;carr=true;
const q=$('#q').value.trim().replace(/[^\p{L}\p{N} ]/gu,''),c=$('#cat').value,o=$('#ord').value;
let u='select=id,nome,categoria,imagem,descricao,preco_min,variacoes(id,opcoes,preco,estoque,imagem)&ativo=eq.true&limit=20&offset='+pg*20+'&order='+(o?'preco_min.'+o:'id.desc');
if(q)u+='&nome=ilike.*'+encodeURIComponent(q)+'*';if(c)u+='&categoria=eq.'+encodeURIComponent(c);
const l=await db('produtos',u);carr=false;
if(!Array.isArray(l))return $('#grid').innerHTML='<p>Não foi possível carregar os produtos. Tente novamente em instantes.</p>';
l.forEach(p=>P[p.id]=p);if(l.length<20)fim=true;pg++;
$('#grid').insertAdjacentHTML('beforeend',l.map(p=>`<article class="card"><img src="${E(img(p.nome,p.imagem))}" alt="${E(p.nome)}" loading="lazy"><h3>${E(p.nome)}</h3><small>${E(p.categoria)}</small><div>a partir de <b>${R(p.preco_min)}</b></div><button class="btn" onclick="ver(${+p.id})">Ver opções</button></article>`).join(''));
if(!$('#grid').children.length)$('#grid').innerHTML='<p>Nenhum produto encontrado. Tente outra busca.</p>'}
window.ver=id=>{const p=P[id],v=p&&p.variacoes||[];if(!v.length)return;
const ks=[...new Set(v.flatMap(x=>Object.keys(x.opcoes||{})))];cur={p,ks,sel:{}};ks.forEach(k=>cur.sel[k]=(v[0].opcoes||{})[k]);
$('#dp').innerHTML=`<button class="x" onclick="dp.close()" aria-label="Fechar">✕</button><img id="pi" src="${E(img(p.nome,p.imagem))}" alt="${E(p.nome)}"><h2>${E(p.nome)}</h2><p>${E(p.descricao||'')}</p>${ks.map(k=>`<p><label>${E(k)}<br><select data-k="${E(k)}" onchange="esc(this)">${[...new Set(v.map(x=>(x.opcoes||{})[k]).filter(Boolean))].map(o=>`<option${o==cur.sel[k]?' selected':''}>${E(o)}</option>`).join('')}</select></label></p>`).join('')}<p><b id="pp"></b> <small id="pe"></small></p><button class="btn" id="pb" onclick="add()">Adicionar ao carrinho</button>`;atual();dp.showModal()};
window.esc=s=>{cur.sel[s.dataset.k]=s.value;atual()};
function atual(){const{p,ks,sel}=cur,x=p.variacoes.find(x=>ks.every(k=>(x.opcoes||{})[k]==sel[k]));cur.x=x;
$('#pp').textContent=x?R(x.preco):'';$('#pe').textContent=!x?'Combinação indisponível':x.estoque>0?x.estoque+' em estoque':'Esgotado';$('#pb').disabled=!x||x.estoque<1;$('#pi').src=img(p.nome,(x&&x.imagem)||p.imagem)}
window.add=()=>{const{p,x}=cur,o=x.opcoes||{},n=p.nome+(Object.keys(o).length?' · '+Object.values(o).join(' / '):''),i=cart[x.id]||{q:0};cart[x.id]={q:Math.min(i.q+1,x.estoque),n,p:x.preco,e:x.estoque};save();badge();dp.close();abrir()};
const sub=()=>Object.values(cart).reduce((s,i)=>s+i.p*i.q,0);
window.qtd=(id,d)=>{const i=cart[id];if(!i)return;i.q+=d;if(i.q<=0)delete cart[id];else i.q=Math.min(i.q,i.e);save();badge();abrir()};
function abrir(){$('#itens').innerHTML=Object.entries(cart).map(([id,i])=>`<div class="li"><span>${E(i.n)}</span><span><button onclick="qtd(${+id},-1)" aria-label="Menos">−</button> ${i.q} <button onclick="qtd(${+id},1)" aria-label="Mais">+</button></span><b>${R(i.p*i.q)}</b></div>`).join('')||'<p>Seu carrinho está vazio. Escolha um produto para começar.</p>';
$('#resumo').innerHTML=`Subtotal ${R(sub())}<br>Frete estimado ${R(C.frete_exibicao||0)}<br><small>Cupom e total final são confirmados ao enviar o pedido.</small>`;if(!dc.open)dc.showModal()}
async function cepOk(){const c=$('#cep').value.replace(/\D/g,'');if(c.length!=8)return;try{const a=await(await fetch(`https://viacep.com.br/ws/${c}/json/`)).json();if(!a.erro)$('#end').value=`${a.logradouro}, ${a.bairro}, ${a.localidade}-${a.uf}`}catch{}}
const cpfOk=s=>{s=s.replace(/\D/g,'');if(s.length!=11||/^(\d)\1+$/.test(s))return 0;for(let t=9;t<11;t++){let d=0;for(let i=0;i<t;i++)d+=s[i]*(t+1-i);if(d*10%11%10!=s[t])return 0}return 1};
function pedido(){if(!Object.keys(cart).length)return alert('Seu carrinho está vazio.');const f=$('#f');if(!f.reportValidity())return;if(!cpfOk(f.cpf.value))return alert('CPF inválido. Confira os números.');
const c=Object.fromEntries(new FormData(f));return{p_itens:Object.entries(cart).map(([id,i])=>({id:+id,qtd:i.q})),p_cep:c.cep,p_cupom:$('#cup').value.trim(),p_cliente:c}}
async function enviar(){if(pend)return;const d=pedido();if(!d)return;pend=true;
try{const r=await fetch(C.supabase_url+'/rest/v1/rpc/criar_pedido',{method:'POST',headers:H(),body:JSON.stringify(d)});const j=await r.json();
if(!r.ok)return alert('Não foi possível enviar o pedido: '+(j.message||'erro desconhecido'));
const m=`Olá! Fiz o pedido #${j.id} no site.\n`+Object.values(cart).map(i=>`${i.q}x ${i.n}`).join('\n')+`\nTotal: ${R(j.total)} (frete ${R(j.frete)})\nNome: ${d.p_cliente.nome}`;
cart={};save();badge();dc.close();
$('#dp').innerHTML=`<button class="x" onclick="dp.close()" aria-label="Fechar">✕</button><h2>Pedido #${+j.id} registrado!</h2><p>Total: <b>${R(j.total)}</b> (frete ${R(j.frete)})</p><p>Toque abaixo para falar com a loja e combinar o pagamento.</p><a class="btn" style="display:block;text-align:center;text-decoration:none" href="https://wa.me/${E(C.whatsapp)}?text=${encodeURIComponent(m)}">Continuar no WhatsApp</a>`;dp.showModal()
}catch{alert('Falha de conexão. Tente novamente.')}finally{pend=false}}
init();
