(function(){
  function esc(v){return String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));}
  function js(v){return JSON.stringify(String(v??''));}
  async function callBiz(action,payload={}){
    const {data,error}=await window.sbClient.functions.invoke('admin-businesses',{body:{action,...payload}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    return data;
  }
  async function ensureAccess(){
    const {data:{session}}=await window.sbClient.auth.getSession();
    if(!session?.user) return false;
    const {data}=await window.sbClient.from('profiles').select('role').eq('id',session.user.id).single();
    if(data?.role!=='superadmin'){
      document.querySelector('main').innerHTML='<section class="module active"><div class="hero"><h1>Acceso restringido</h1><p>Esta consola es exclusiva del Administrador General.</p></div></section>';
      document.getElementById('nav').innerHTML='';
      return false;
    }
    return true;
  }
  async function loadSummary(){
    const d=await callBiz('summary');
    saBusinesses.textContent=d.businesses??0; saActive.textContent=d.active??0; saUsers.textContent=d.users??0;
  }
  async function loadBusinesses(){
    bizList.innerHTML='<div class="empty">Cargando comercios...</div>';
    try{
      const d=await callBiz('list'); const rows=d.businesses||[];
      bizList.innerHTML=rows.length?rows.map(b=>`<div class="row" style="align-items:flex-start;gap:12px;flex-wrap:wrap"><div style="flex:1;min-width:240px"><b>${esc(b.name)}</b><div style="color:var(--muted);font-size:13px">Administrador: ${esc(b.admin_name||'Sin nombre')} · ${esc(b.admin_email||'')}<br>${esc(b.phone||'')} · ${esc(b.address||'')}</div></div><select id="st_${b.id}" style="background:#07121c;border:1px solid var(--line);border-radius:9px;color:white;padding:9px"><option value="active" ${b.status==='active'?'selected':''}>Activo</option><option value="pending" ${b.status==='pending'?'selected':''}>Pendiente</option><option value="suspended" ${b.status==='suspended'?'selected':''}>Suspendido</option></select><button class="btn" onclick='editBusiness(${b.id},${js(b.name)},${js(b.admin_name)},${js(b.admin_email)},${js(b.phone)},${js(b.address)})'>Editar</button><button class="btn" style="background:#6b1f1f" onclick='deleteBusiness(${b.id},${js(b.name)})'>Eliminar</button></div>`).join(''):'<div class="empty">No hay comercios registrados.</div>';
    }catch(e){bizList.innerHTML='<div class="empty">'+esc(e.message||'No fue posible cargar comercios')+'</div>';}
  }
  async function createBusiness(){
    try{
      const p={name:bizName.value.trim(),owner_name:bizOwner.value.trim(),owner_email:bizEmail.value.trim(),phone:bizPhone.value.trim(),address:bizAddress.value.trim()};
      if(!p.name||!p.owner_email) throw new Error('Nombre del comercio y correo del administrador son obligatorios.');
      bizMsg.textContent='Creando comercio...'; await callBiz('create',p);
      [bizName,bizOwner,bizEmail,bizPhone,bizAddress].forEach(x=>x.value=''); bizMsg.textContent='Comercio creado correctamente.';
      await loadSummary(); await loadBusinesses();
    }catch(e){bizMsg.textContent=e.message||'No fue posible crear el comercio.';}
  }
  window.editBusiness=async function(id,name,adminName,adminEmail,phone,address){
    const n=prompt('Nombre del comercio:',name); if(n===null)return;
    const an=prompt('Nombre del administrador:',adminName); if(an===null)return;
    const ae=prompt('Correo de acceso del administrador:',adminEmail); if(ae===null)return;
    const p=prompt('Teléfono / WhatsApp:',phone); if(p===null)return;
    const a=prompt('Dirección:',address); if(a===null)return;
    const status=document.getElementById('st_'+id)?.value||'active';
    if(!n.trim()||!ae.trim()){alert('El nombre del comercio y el correo del administrador son obligatorios.');return;}
    try{
      await callBiz('update',{id,name:n.trim(),admin_name:an.trim(),admin_email:ae.trim(),phone:p.trim(),address:a.trim(),status});
      alert('Datos actualizados. La cuenta y toda la información del comercio se conservaron.');
      await loadSummary(); await loadBusinesses();
    }catch(e){alert(e.message||'No fue posible actualizar.');}
  };
  window.deleteBusiness=async function(id,name){if(!confirm('¿Eliminar el comercio '+name+'?'))return;try{await callBiz('delete',{id});await loadSummary();await loadBusinesses();}catch(e){alert(e.message||'No fue posible eliminar.');}};
  async function boot(){
    if(!await ensureAccess())return;
    bizCreateBtn.onclick=createBusiness; bizRefreshBtn.onclick=loadBusinesses;
    goPanel.onclick=()=>window.scrollTo({top:0,behavior:'smooth'}); goBusinesses.onclick=()=>createCommerce.scrollIntoView({behavior:'smooth'});
    await loadSummary(); await loadBusinesses();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,350));else setTimeout(boot,350);
})();