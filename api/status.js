module.exports=async(req,res)=>{
 const id=String(req.query.id||'').replace(/[^\w-]/g,'');
 const r=await fetch('https://wallet.ravenbot.com.br/api/pix/'+id,{headers:{'x-api-key':process.env.RAVEN_API_KEY||''}});
 const j=await r.json().catch(()=>({}));
 const t=j.transaction||j;
 res.json({status:String(t.status||'')});
};
