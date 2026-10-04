async function buyBeautyPlan(sku){
 const {data:{session}}=await sbClient.auth.getSession();
 if(!session?.user){alert('Inicia sesión para comprar tu plan.');return}
 if(!currentBusinessId) await resolveBusiness();
 if(!currentBusinessId){alert('Tu cuenta aún no tiene una barbería asignada.');return}
 const {data:token,error}=await sbClient.rpc('create_checkout_intent',{p_business_id:currentBusinessId,p_plan_code:sku});
 if(error||!token){alert('No pudimos preparar la compra. Intenta nuevamente.');return}
 location.href='https://mired360servicios.com/pagar-producto.html?beauty_token='+encodeURIComponent(token);
}
async function loadPlanStatus(){
 const box=document.getElementById('planStatus'); if(!box||!currentBusinessId)return;
 const {data,error}=await sbClient.from('subscriptions').select('plan_code,months,status,starts_at,ends_at').eq('business_id',currentBusinessId).eq('status','active').order('ends_at',{ascending:false}).limit(1);
 if(error||!data?.length){box.textContent='Aún no tienes una suscripción activa. Elige un plan para comenzar.';return}
 const p=data[0], end=new Date(p.ends_at); box.textContent='Plan activo · '+p.months+' mes(es) · Vigente hasta '+end.toLocaleDateString('es-CO');
}
window.buyBeautyPlan=buyBeautyPlan; window.loadPlanStatus=loadPlanStatus;
setTimeout(()=>loadPlanStatus(),800);