(function(){
  function esc(v){return String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));}
  function ensureAdminUi(){
    if(document.getElementById('adminNav')) return;
    const nav=document.getElementById('nav');
    if(!nav) return;
    const btn=document.createElement('button');
    btn.id='adminNav';
    btn.style.display='none';
    btn.innerHTML='<span>🛡️</span>Admin General';
    btn.onclick=function(){ if(typeof show==='function') show('admin',btn); loadAdminUsers(); };
    nav.appendChild(btn);

    const main=document.querySelector('main');
    if(!main) return;
    const section=document.createElement('section');
    section.id='admin';
    section.className='module';
    section.innerHTML=`
      <div class="hero"><h1>🛡️ Administrador General</h1><p>Control total de usuarios y accesos de MIRED360 Beauty.</p></div>
      <div class="card">
        <div class="section-title"><h2>Crear usuario</h2><span class="status">Acceso protegido</span></div>
        <div class="form">
          <input id="admName" placeholder="Nombre completo">
          <input id="admEmail" type="email" placeholder="Correo electrónico">
          <select id="admRole"><option value="user">Usuario</option><option value="staff">Empleado</option><option value="admin">Administrador</option></select>
          <button class="btn" onclick="createAdminUser()">Crear usuario</button>
        </div>
        <div id="admMsg" class="empty" style="padding:10px 0 0"></div>
      </div>
      <div class="card" style="margin-top:18px">
        <div class="section-title"><h2>Usuarios registrados</h2><button class="btn" onclick="loadAdminUsers()">Actualizar</button></div>
        <div id="adminUsersList" class="list"></div>
      </div>`;
    main.appendChild(section);
  }

  async function callAdmin(action,payload={}){
    const {data,error}=await window.sbClient.functions.invoke('admin-users',{body:{action,...payload}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    return data;
  }

  window.loadAdminUsers=async function(){
    const box=document.getElementById('adminUsersList');
    if(!box) return;
    box.innerHTML='<div class="empty">Cargando usuarios...</div>';
    try{
      const data=await callAdmin('list');
      const users=data.users||[];
      if(!users.length){box.innerHTML='<div class="empty">No hay usuarios registrados.</div>';return;}
      box.innerHTML=users.map(u=>`<div class="row" style="align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div style="min-width:220px;flex:1"><b>${esc(u.full_name||'Sin nombre')}</b><div style="color:var(--muted);font-size:13px">${esc(u.email||'')}</div></div>
        <select id="role_${u.id}" style="background:#07121c;border:1px solid var(--line);border-radius:9px;color:white;padding:9px">
          <option value="user" ${u.role==='user'?'selected':''}>Usuario</option>
          <option value="staff" ${u.role==='staff'?'selected':''}>Empleado</option>
          <option value="admin" ${u.role==='admin'?'selected':''}>Administrador</option>
        </select>
        <button class="btn" onclick="editAdminUser('${u.id}','${esc(u.email||'')}','${esc(u.full_name||'')}')">Editar</button>
        <button class="btn" style="background:#6b1f1f" onclick="deleteAdminUser('${u.id}','${esc(u.email||'')}')">Eliminar</button>
      </div>`).join('');
    }catch(e){box.innerHTML='<div class="empty">'+esc(e.message||'No fue posible cargar usuarios')+'</div>';}
  };

  window.createAdminUser=async function(){
    const msg=document.getElementById('admMsg');
    try{
      const full_name=document.getElementById('admName').value.trim();
      const email=document.getElementById('admEmail').value.trim();
      const role=document.getElementById('admRole').value;
      if(!email) throw new Error('Escribe el correo del nuevo usuario.');
      msg.textContent='Creando usuario...';
      await callAdmin('create',{full_name,email,role});
      document.getElementById('admName').value='';document.getElementById('admEmail').value='';
      msg.textContent='Usuario creado correctamente.';
      await loadAdminUsers();
    }catch(e){msg.textContent=e.message||'No fue posible crear el usuario.';}
  };

  window.editAdminUser=async function(id,currentEmail,currentName){
    const email=prompt('Correo del usuario:',currentEmail); if(email===null) return;
    const full_name=prompt('Nombre completo:',currentName); if(full_name===null) return;
    const role=document.getElementById('role_'+id)?.value||'user';
    try{await callAdmin('update',{id,email,full_name,role});alert('Usuario actualizado.');await loadAdminUsers();}
    catch(e){alert(e.message||'No fue posible actualizar.');}
  };

  window.deleteAdminUser=async function(id,email){
    if(!confirm('¿Eliminar definitivamente al usuario '+email+'?')) return;
    try{await callAdmin('delete',{id});alert('Usuario eliminado.');await loadAdminUsers();}
    catch(e){alert(e.message||'No fue posible eliminar.');}
  };

  async function syncAdminAccess(session){
    ensureAdminUi();
    const btn=document.getElementById('adminNav');
    if(!btn){return;}
    if(!session?.user){btn.style.display='none';return;}
    const {data}=await window.sbClient.from('profiles').select('role').eq('id',session.user.id).single();
    btn.style.display=data?.role==='admin'?'':'none';
  }

  document.addEventListener('DOMContentLoaded',async()=>{
    ensureAdminUi();
    if(!window.sbClient) return;
    const {data}=await window.sbClient.auth.getSession();
    await syncAdminAccess(data.session);
    window.sbClient.auth.onAuthStateChange((_e,s)=>syncAdminAccess(s));
  });
})();