window.pagar=async()=>{const d=pedido();if(!d)return;
 let j;try{j=await(await fetch(C.api_pagamento,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})).json()}catch{}
 if(!j||!j.id)return alert('Não foi possível gerar o PIX agora. Use o WhatsApp.');
 let m=$('#pix');if(!m){m=document.createElement('dialog');m.id='pix';document.body.append(m)}
 m.innerHTML=`<button class="x" onclick="pix.close()" aria-label="Fechar">✕</button><h2>Pague com PIX</h2><p>Total: <b>${R(j.total)}</b></p>${j.qr?`<img src="${j.qr}" alt="QR Code PIX">`:''}<p>Ou copie o código:</p><textarea readonly rows="4" style="width:100%">${E(j.copia||'')}</textarea><button class="btn" onclick="navigator.clipboard.writeText(pix.querySelector('textarea').value);this.textContent='Copiado!'">Copiar código</button><p id="ps">Aguardando pagamento…</p>`;
 dc.close();m.showModal();
 const t=setInterval(async()=>{if(!m.open)return clearInterval(t);
  try{const s=(await(await fetch('/api/status?id='+j.id)).json()).status;
  if(/paid|approved|confirm|complet|pago|success/i.test(s)){clearInterval(t);$('#ps').innerHTML='Pagamento confirmado! Envie os dados da entrega:<br><button class="btn" onclick="zap();cart={};save();badge()">Enviar pedido pelo WhatsApp</button>'}}catch{}},4000)};
