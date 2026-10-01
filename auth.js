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
      <p>Acceso seguro con código de 6 dígitos.</p>
    </div>
    <div class="auth-tabs" id="authTabs">
      <button id="loginTab" class="auth-tab active" type="button">Ingresar</button>
      <button id="registerTab" class="auth-tab" type="button">Crear cuenta</button>
    </div>
    <form id="authForm" class="auth-form">
      <input id="authName" class="auth-hidden" autocomplete="name" placeholder="Nombre completo">
      <input id="authEmail" type="email" autocomplete="email" placeholder="Correo electrónico" required>
      <div id="otpBox" class="auth-hidden">
        <input id="authOtp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="Código de 6 dígitos">
      </div>
      <button id="authSubmit" class="btn" type="submit">Enviar código</button>
      <button id="changeEmailBtn" class="auth-hidden" type="button">Cambiar correo</button>
    </form>
    <div id="authMessage" class="auth-message"></div>
    <div class="auth-note">Sin contraseña. Recibirás un código temporal en tu correo.</div>
  </div>`;
document.body.insertBefore(authShell,document.body.firstChild);

let authMode='login';
let otpStage=false;
let pendingEmail='';
let pendingName='';

const loginTab=document.getElementById('loginTab');
const registerTab=document.getElementById('registerTab');
const authTabs=document.getElementById('authTabs');
const authName=document.getElementById('authName');
const authEmail=document.getElementById('authEmail');
const otpBox=document.getElementById('otpBox');
const authOtp=document.getElementById('authOtp');
const authSubmit=document.getElementById('authSubmit');
const changeEmailBtn=document.getElementById('changeEmailBtn');
const authMessage=document.getElementById('authMessage');

function setAuthMessage(text,type=''){
  authMessage.textContent=text||'';
  authMessage.className='auth-message'+(type?' '+type:'');
}

function setMode(mode){
  if(otpStage) return;
  authMode=mode;
  const registering=mode==='register';
  loginTab.classList.toggle('active',!registering);
  registerTab.classList.toggle('active',registering);
  authName.classList.toggle('auth-hidden',!registering);
  authName.required=registering;
  authSubmit.textContent='Enviar código';
  setAuthMessage('');
}

function setOtpStage(enabled){
  otpStage=enabled;
  authTabs.classList.toggle('auth-hidden',enabled);
  authName.classList.toggle('auth-hidden',enabled || authMode!=='register');
  authEmail.classList.toggle('auth-hidden',enabled);
  otpBox.classList.toggle('auth-hidden',!enabled);
  authOtp.required=enabled;
  changeEmailBtn.classList.toggle('auth-hidden',!enabled);
  authSubmit.textContent=enabled?'Verificar y entrar':'Enviar código';
  if(enabled){
    setAuthMessage('Escribe el código de 6 dígitos enviado a '+pendingEmail+'.','ok');
    setTimeout(()=>authOtp.focus(),50);
  }
}

loginTab.addEventListener('click',()=>setMode('login'));
registerTab.addEventListener('click',()=>setMode('register'));
changeEmailBtn.addEventListener('click',()=>{
  authOtp.value='';
  pendingEmail='';
  pendingName='';
  setOtpStage(false);
  setAuthMessage('');
  authEmail.focus();
});

authOtp.addEventListener('input',()=>{
  authOtp.value=authOtp.value.replace(/\D/g,'').slice(0,6);
});

function friendlyAuthError(err){
  const msg=(err?.message||'').toLowerCase();
  if(msg.includes('rate limit')) return 'Se alcanzó temporalmente el límite de envío de correos. Espera unos minutos e inténtalo de nuevo.';
  if(msg.includes('token has expired')||msg.includes('expired')) return 'El código venció. Solicita uno nuevo.';
  if(msg.includes('invalid')&&msg.includes('token')) return 'El código no es válido. Revísalo e intenta nuevamente.';
  return err?.message||'No fue posible completar el acceso.';
}

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
  if(typeof window.loadCloudData==='function') await window.loadCloudData();
}

document.getElementById('authForm').addEventListener('submit',async(e)=>{
  e.preventDefault();
  authSubmit.disabled=true;
  try{
    if(!otpStage){
      const email=authEmail.value.trim().toLowerCase();
      const fullName=authName.value.trim();
      if(!email) throw new Error('Escribe tu correo electrónico.');
      if(authMode==='register'&&!fullName) throw new Error('Escribe tu nombre completo.');
      setAuthMessage('Enviando código...');
      const {error}=await sbClient.auth.signInWithOtp({
        email,
        options:{
          shouldCreateUser:authMode==='register',
          data:authMode==='register'?{full_name:fullName}:undefined
        }
      });
      if(error) throw error;
      pendingEmail=email;
      pendingName=fullName;
      setOtpStage(true);
    }else{
      const token=authOtp.value.trim();
      if(!/^\d{6}$/.test(token)) throw new Error('Escribe el código completo de 6 dígitos.');
      setAuthMessage('Verificando código...');
      const {data,error}=await sbClient.auth.verifyOtp({
        email:pendingEmail,
        token,
        type:'email'
      });
      if(error) throw error;
      if(!data?.session) throw new Error('No se pudo iniciar la sesión.');
      if(authMode==='register'&&pendingName){
        await sbClient.auth.updateUser({data:{full_name:pendingName}});
        await sbClient.from('profiles').update({full_name:pendingName}).eq('id',data.session.user.id);
      }
      authOtp.value='';
      setAuthMessage('Acceso correcto.','ok');
      await showApp(data.session);
    }
  }catch(err){
    setAuthMessage(friendlyAuthError(err),'error');
  }finally{
    authSubmit.disabled=false;
  }
});

sbClient.auth.onAuthStateChange((_event,session)=>showApp(session));
(async()=>{
  const {data}=await sbClient.auth.getSession();
  await showApp(data.session);
})();
