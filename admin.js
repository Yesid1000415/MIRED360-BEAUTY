(function(){
  function esc(v){return String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[s]));}
  async function callBiz(action,payload={}){
    const {data,error}=await window.sbClient.functions.invoke('admin-businesses',{body:{action,...payload}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    return data;
  }
  function cleanupForBusinessUser(){
    document.getElementById('adminNav')?.remove();
    const old=document.getElementById('admin'); if(old) old.style.display='none';
    const top=document.querySelector('.top .user');
    if(top && top.textContent.includes('Administrador General')) top.innerHTML='<span id="topBusinessName">Mi Barbería</span> · Administrador';
  }
  function buildSuperAdmin(){
    const nav=document.getElementById('nav');
    const main=document.querySelector('main');
    if(!nav||!main) return;
    nav.innerHTML=`<button id="saHomeBtn" class="active"><span>🛡️</span>Panel General</button><button id="saBizBtn"><span>🏪</span>Comercios</button>`;
    [...main.querySelectorAll('section.module')].forEach(s=>{s.classList.remove('active');s.style.display='none';});
    let sec=document.getElementById('superadmin');
    if(!sec){
      sec=document.createElement('section');sec.id='superadmin';sec.className='module active';
      sec.innerHTML=`
      <div class="hero"><h1>🛡️ Administrador General</h1><p>Control central de comercios, administradores y estado de la plataforma.</p></div>
      <div class="stats">
        <div class="card stat"><label>🏪 Comercios</label><strong id="saBusinesses">0</strong><em>Registrados</em></div>
        <div class="card stat"><label>✅ Activos</label><strong id="saActive">0</strong><em>Operando</em></div>
        <div class="card stat"><label>👥 Usuarios</label><strong id="saUsers">0</strong><em>Plataforma</em></div>
      </div>
      <div class="card" style="margin-top:18px">
        <div class="section-title"><h2>Crear comercio</h2><span class="status">Administrador General</span></div>
        <div class="form">
          <input id="bizName" placeholder="Nombre del comercio">
          <input id="bizOwner" placeholder="Nombre del administrador del comercio">
          <input id="bizEmail" type="email" placeholder="Correo del administrador">
          <input id="bizPhone" placeholder="Teléfono / WhatsApp">
          <input id="bizAddress" placeholder="Dirección">
          <button class="btn" id="bizCreateBtn">Crear comercio</button>
        </div>
        <div id="bizMsg" class="empty" style="padding:10px 0 0"></div>
      </div>
      <div class="card" style="margin-top:18px">
        <div class="section-title"><h2>Comercios registrados</h2><button class="btn" id="bizRefreshBtn">Actualizar</button></div>
        <div id="bizList" class="list"></div>
      </div>`;
      main.appendChild(sec);
    }
    sec.style.display='block';sec.classList.add('active');
    const top=document.querySelector('.top .user'); if(top) top.innerHTML='<strong>Administrador General</strong>';
    const search=document.querySelector('.top .search'); if(search){search.placeholder='Buscar comercio...';search.value='';}
    document.getElementById('saHomeBtn').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
    document.getElementById('saBizBtn').onclick=()=>document.getElementById('bizName')?.scrollIntoView({behavior:'smooth',block:'center'});
    document.getElementById('bizCreateBtn').onclick=createBusiness;
    document.getElementById('bizRefreshBtn').onclick=loadBusinesses;
  }
  async function loadSummary(){
    try{const d=await callBiz('summary');
      document.getElementById('saBusinesses').textContent=d.businesses??0;
      document.getElementById('saActive').textContent=d.active??0;
      document.getElementById('saUsers').textContent=d.users??0;
    }catch(e){}
  }
  async function loadBusinesses(){
    const box=document.getElementById('bizList'); if(!box) return;
    box.innerHTML='<div class="empty">Cargando comercios...</div>';
    try{
      const d=await callBiz('list'); const rows=d.businesses||[];
      if(!rows.length){box.innerHTML='<div class="empty">No hay comercios registrados.</div>';return;}
      box.innerHTML=rows.map(b=>`<div class="row" style="align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:240px"><b>${esc(b.name)}</b><div style="color:var(--muted);font-size:13px">${esc(b.admin_email||'')} · ${esc(b.phone||'')} · ${esc(b.address||'')}</div></div>
        <select id="st_${b.id}" style="background:#07121c;border:1px solid var(--line);border-radius:9px;color:white;padding:9px"><option value="active" ${b.status==='active'?'selected':''}>Activo</option><option value="pending" ${b.status==='pending'?'selected':''}>Pendiente</option><option value="suspended" ${b.status==='suspended'?'selected':''}>Suspendido</option></select>
        <button class="btn" onclick="window.editBusiness(${b.id},'${esc(b.name)}','${esc(b.phone||'')}','${esc(b.address||'')}')">Editar</button>
        <button class="btn" style="background:#6b1f1f" onclick="window.deleteBusiness(${b.id},'${esc(b.name)}')">Eliminar</button>
      </div>`).join('');
    }catch(e){box.innerHTML='<div class="empty">'+esc(e.message||'No fue posible cargar comercios')+'</div>';}
  }
  async function createBusiness(){
    const msg=document.getElementById('bizMsg');
    try{
      const payload={name:document.getElementById('bizName').value.trim(),owner_name:document.getElementById('bizOwner').value.trim(),owner_email:document.getElementById('bizEmail').value.trim(),phone:document.getElementById('bizPhone').value.trim(),address:document.getElementById('bizAddress').value.trim()};
      if(!payload.name||!payload.owner_email) throw new Error('Nombre del comercio y correo del administrador son obligatorios.');
      msg.textContent='Creando comercio...'; await callBiz('create',payload);
      ['bizName','bizOwner','bizEmail','bizPhone','bizAddress'].forEach(id=>document.getElementById(id).value='');
      msg.textContent='Comercio creado correctamente.'; await loadSummary();await loadBusinesses();
    }catch(e){msg.textContent=e.message||'No fue posible crear el comercio.';}
  }
  window.editBusiness=async function(id,name,phone,address){
    const n=prompt('Nombre del comercio:',name);if(n===null)return;
    const p=prompt('Teléfono / WhatsApp:',phone);if(p===null)return;
    const a=prompt('Dirección:',address);if(a===null)return;
    const status=document.getElementById('st_'+id)?.value||'active';
    try{await callBiz('update',{id,name:n,phone:p,address:a,status});await loadSummary();await loadBusinesses();}catch(e){alert(e.message||'No fue posible actualizar.');}
  };
  window.deleteBusiness=async function(id,name){
    if(!confirm('¿Eliminar el comercio '+name+'?'))return;
    try{await callBiz('delete',{id});await loadSummary();await loadBusinesses();}catch(e){alert(e.message||'No fue posible eliminar.');}
  };
  async function boot(){
    if(!window.sbClient) return;
    const {data:{session}}=await window.sbClient.auth.getSession(); if(!session?.user) return;
    const {data:profile}=await window.sbClient.from('profiles').select('role').eq('id',session.user.id).single();
    if(profile?.role==='superadmin'){buildSuperAdmin();await loadSummary();await loadBusinesses();}
    else cleanupForBusinessUser();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,350));else setTimeout(boot,350);
  window.sbClient?.auth?.onAuthStateChange?.((_e,s)=>{if(s?.user)setTimeout(boot,350);});
})();