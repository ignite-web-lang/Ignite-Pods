const C=require('../data/config.json');
module.exports=async(req,res)=>{
 if(req.method!=='POST')return res.status(405).end();
 const{itens,cep,cupom,cliente}=req.body||{};
 const ids=(itens||[]).map(i=>parseInt(i.id,10));
 if(!ids.length||ids.some(n=>!(n>0)))return res.status(400).json({erro:'itens'});
 try{
  const h={apikey:C.supabase_key,Authorization:'Bearer '+C.supabase_key};
  const V=await(await fetch(`${C.supabase_url}/rest/v1/variacoes?id=in.(${ids.join(',')})&select=id,preco,estoque,opcoes,produtos!inner(ativo,nome)`,{headers:h})).json();
  let total=0;const reg=[];
  for(const i of itens){const v=Array.isArray(V)&&V.find(x=>x.id===parseInt(i.id,10));if(!v||!v.produtos.ativo||!(i.qtd>0)||i.qtd>v.estoque)return res.status(400).json({erro:'item inválido'});total+=v.preco*i.qtd;reg.push({nome:(v.produtos.nome+' '+Object.values(v.opcoes||{}).join('/')).trim(),qtd:i.qtd,preco:v.preco})}
  total*=1-(C.cupons[(cupom||'').toUpperCase()]||0)/100;
  if(total<C.frete.gratis_acima)total+=C.frete.regioes[(cep||'0')[0]]??C.frete.base;
  total=Math.round(total*100)/100;
  const r=await fetch('https://wallet.ravenbot.com.br/api/pix/create',{method:'POST',headers:{'x-api-key':process.env.RAVEN_API_KEY||'','Content-Type':'application/json'},body:JSON.stringify({amount:total,description:'Pedido '+C.nome,external_id:'pedido-'+Date.now(),expiration:1800})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok||!j.transaction)return res.status(502).json({erro:'gateway',status:r.status,detalhe:j.error||j.message||''});
  const t=j.transaction;let qr='',copia='';
  for(const v of Object.values(t))if(typeof v==='string'){
   if(v.startsWith('000201'))copia=v;
   else if(v.startsWith('data:image'))qr=v;
   else if(v.length>200&&/^[A-Za-z0-9+/=]+$/.test(v))qr='data:image/png;base64,'+v;
  }
  try{await fetch(`${C.supabase_url}/rest/v1/pedidos`,{method:'POST',headers:{apikey:process.env.SUPABASE_SERVICE_KEY||'','Content-Type':'application/json'},body:JSON.stringify({total,pix_id:t.id,itens:reg,cliente:cliente||{}})})}catch{}
  res.json({id:t.id,total,qr,copia,expira:t.expires_at});
 }catch(e){res.status(500).json({erro:'falha',detalhe:String(e)})}
};