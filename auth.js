const SUPABASE_URL='https://lyefgbckvzfxkjjumvmp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_9WL85w0XrKJwr1CMAHl6-w__n2-Ziix';
const sbClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
window.sbClient=sbClient;

const appRoot=document.querySelector('.app');
if(appRoot) appRoot.classList.add('auth-hidden');

const authShell=document.createElement('div');
authShell.id='authShell';
authShell.className='auth-shell';
authShell.innerHTML=`
  <div class="auth-card">
    <div class="auth-brand">
      <div class="logo">MIRED<b>360</b><small>BEAUTY</small></div>
      <p>Ingresa para administrar tu negocio.</p>
    </div>
    <div class="auth-tabs">
      <button id="loginTab" class="auth-tab active" type="button">Ingresar</button>
      <button id="registerTab" class="auth-tab" type="button">Crear cuenta</button>
    </div>
    <form id="authForm" class="auth-form">
      <input id="authName" class="auth-hidden" autocomplete="name" placeholder="Nombre completo">
      <input id="authEmail" type="email" autocomplete="email" placeholder="Correo electrónico" required>
      <input id="authPassword" type="password" autocomplete="current-password" minlength="6" placeholder="Contraseña" required>
      <button id="authSubmit" class="btn" type="submit">Ingresar</button>
    </form>
    <div id="authMessage" class="auth-message"></div>
    <div class="auth-note">Acceso protegido por MIRED360 Beauty + Supabase.</div>
  </div>`;
document.body.insertBefore(authShell,document.body.firstChild);

let authMode='login';
const loginTab=document.getElementById('loginTab');
const registerTab=document.getElementById('registerTab');
const authName=document.getElementById('authName');
const authEmail=document.getElementById('authEmail');
const authPassword=document.getElementById('authPassword');
const authSubmit=document.getElementById('authSubmit');
const authMessage=document.getElementById('authMessage');

function setAuthMessage(text,type=''){
  authMessage.textContent=text||'';
  authMessage.className='auth-message'+(type?' '+type:'');
}
function setMode(mode){
  authMode=mode;
  const registering=mode==='register';
  loginTab.classList.toggle('active',!registering);
  registerTab.classList.toggle('active',registering);
  authName.classList.toggle('auth-hidden',!registering);
  authName.required=registering;
  authPassword.autocomplete=registering?'new-password':'current-password';
  authSubmit.textContent=registering?'Crear cuenta':'Ingresar';
  setAuthMessage('');
}
loginTab.addEventListener('click',()=>setMode('login'));
registerTab.addEventListener('click',()=>setMode('register'));

function ensureLogoutButton(user){
  const userBox=document.querySelector('.top .user');
  if(!userBox) return;
  let label=document.getElementById('authUserEmail');
  if(!label){
    label=document.createElement('small');
    label.id='authUserEmail';
    label.style.display='block';
    label.style.marginTop='4px';
    userBox.appendChild(label);
  }
  label.textContent=user?.email||'';
  if(!document.getElementById('logoutBtn')){
    const btn=document.createElement('button');
    btn.id='logoutBtn';
    btn.className='logout-btn';
    btn.type='button';
    btn.textContent='Cerrar sesión';
    btn.addEventListener('click',async()=>{
      btn.disabled=true;
      await sbClient.auth.signOut();
      btn.disabled=false;
    });
    userBox.appendChild(btn);
  }
}

async function showApp(session){
  if(!session?.user){
    if(appRoot) appRoot.classList.add('auth-hidden');
    authShell.classList.remove('auth-hidden');
    return;
  }
  authShell.classList.add('auth-hidden');
  if(appRoot) appRoot.classList.remove('auth-hidden');
  ensureLogoutButton(session.user);
}

document.getElementById('authForm').addEventListener('submit',async(e)=>{
  e.preventDefault();
  authSubmit.disabled=true;
  setAuthMessage(authMode==='register'?'Creando cuenta...':'Ingresando...');
  const email=authEmail.value.trim();
  const password=authPassword.value;
  try{
    if(authMode==='register'){
      const fullName=authName.value.trim();
      const {data,error}=await sbClient.auth.signUp({email,password,options:{data:{full_name:fullName}}});
      if(error) throw error;
      if(data.session){
        setAuthMessage('Cuenta creada correctamente.','ok');
        await showApp(data.session);
      }else{
        setAuthMessage('Cuenta creada. Revisa tu correo para confirmar el acceso.','ok');
      }
    }else{
      const {data,error}=await sbClient.auth.signInWithPassword({email,password});
      if(error) throw error;
      setAuthMessage('Acceso correcto.','ok');
      await showApp(data.session);
    }
  }catch(err){
    setAuthMessage(err?.message||'No fue posible completar el acceso.','error');
  }finally{
    authSubmit.disabled=false;
  }
});

sbClient.auth.onAuthStateChange((_event,session)=>showApp(session));
(async()=>{
  const {data}=await sbClient.auth.getSession();
  await showApp(data.session);
})();
