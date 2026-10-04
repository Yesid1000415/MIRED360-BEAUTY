async function buyBeautyPlan(sku){
 const {data:{session}}=await sbClient.auth.getSession();
 if(!session?.user){alert('Inicia sesión para comprar tu plan.');return}
 if(!currentBusinessId) await resolveBusiness();
 if(!currentBusinessId){alert('Tu cuenta aún no tiene una barbería asignada.');return}
 const url='https://mired360servicios.com/pagar-producto.html?sku='+encodeURIComponent(sku)+'&beauty_business='+encodeURIComponent(currentBusinessId);
 location.href=url;
}
async function loadPlanStatus(){
 const box=document.getElementById('planStatus'); if(!box||!currentBusinessId)return;
 const {data,error}=await sbClient.from('subscriptions').select('plan_code,months,status,starts_at,ends_at').eq('business_id',currentBusinessId).eq('status','active').order('ends_at',{ascending:false}).limit(1);
 if(error||!data?.length){box.textContent='Aún no tienes una suscripción activa. Elige un plan para comenzar.';return}
 const p=data[0], end=new Date(p.ends_at); box.textContent='Plan activo · '+p.months+' mes(es) · Vigente hasta '+end.toLocaleDateString('es-CO');
}
window.buyBeautyPlan=buyBeautyPlan; window.loadPlanStatus=loadPlanStatus;
setTimeout(()=>loadPlanStatus(),800);