const SUPABASE_URL='https://lyefgbckvzfxkjjumvmp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_9WL85w0XrKJwr1CMAHl6-w__n2-Ziix';
const sbClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
window.sbClient=sbClient;

const appRoot=document.querySelector('.app');
if(appRoot) appRoot.classList.add('auth-hidden');

const ADMIN_EMAIL='yesidrojasrodriguez18@gmail.com';
const authShell=document.createElement('div');
authShell.id='authShell';authShell.className='auth-shell';
authShell.innerHTML=`<div class="auth-card"><div class="auth-brand"><div class="logo">MIRED<b>360</b><small>BEAUTY</small></div><p>Tu barbería o salón, en un solo lugar.</p></div><form id="authForm" class="auth-form"><input id="authEmail" type="email" autocomplete="email" placeholder="Correo electrónico" required><input id="authPass" type="password" autocomplete="current-password" minlength="6" placeholder="Contraseña (mínimo 6 caracteres)" required><button id="loginBtn" class="btn" type="submit">INGRESAR</button><button id="signupBtn" type="button">CREAR MI CUENTA</button><button id="forgotBtn" type="button">OLVIDÉ MI CONTRASEÑA</button></form><div id="authMessage" class="auth-message"></div><div class="auth-note">¿Nuevo? Crea tu propia cuenta y contraseña. Después registrarás tu barbería o salón y tendrás 24 horas de prueba gratis.</div></div>`;
document.body.insertBefore(authShell,document.body.firstChild);
const authEmail=document.getElementById('authEmail'),authPass=document.getElementById('authPass'),authMessage=document.getElementById('authMessage');
function setAuthMessage(t,type=''){authMessage.textContent=t||'';authMessage.className='auth-message'+(type?' '+type:'')}
function friendlyAuthError(e){const m=(e?.message||'').toLowerCase();if(m.includes('invalid login'))return 'Correo o contraseña incorrectos.';if(m.includes('already registered'))return 'Este correo ya tiene una cuenta. Usa INGRESAR.';return e?.message||'No fue posible completar el acceso.'}
function ensureLogoutButton(user){const userBox=document.querySelector('.top .user');if(!userBox)return;let label=document.getElementById('authUserEmail');if(!label){label=document.createElement('small');label.id='authUserEmail';label.style.display='block';label.style.marginTop='4px';userBox.appendChild(label)}label.textContent=user?.email||'';if(!document.getElementById('logoutBtn')){const b=document.createElement('button');b.id='logoutBtn';b.className='logout-btn';b.type='button';b.textContent='Cerrar sesión';b.onclick=()=>sbClient.auth.signOut();userBox.appendChild(b)}}
async function ensureBeautyBusiness(user){
 if(user.email?.toLowerCase()===ADMIN_EMAIL)return;
 const {data}=await sbClient.from('businesses').select('id,access_until').or('user_id.eq.'+user.id+',admin_user_id.eq.'+user.id).limit(1);
 if(data?.length){const b=data[0];if(b.access_until&&new Date(b.access_until)<=new Date()){if(appRoot)appRoot.classList.add('auth-hidden');authShell.classList.remove('auth-hidden');setAuthMessage('Tu prueba o plan terminó. Tus datos siguen guardados. Renueva tu plan para continuar.','error');throw new Error('subscription_expired')}return;}
 const name=prompt('Nombre de tu barbería o salón:');if(!name){await sbClient.auth.signOut();throw new Error('Debes registrar el nombre de tu negocio para comenzar.')}
 const phone=prompt('Teléfono del negocio (opcional):')||'';const address=prompt('Dirección (opcional):')||'';
 const {error}=await sbClient.rpc('start_beauty_trial',{p_name:name.trim(),p_phone:phone.trim(),p_address:address.trim()});if(error)throw error;
}
async function showApp(session){if(!session?.user){if(appRoot)appRoot.classList.add('auth-hidden');authShell.classList.remove('auth-hidden');return}try{await ensureBeautyBusiness(session.user);authShell.classList.add('auth-hidden');if(appRoot)appRoot.classList.remove('auth-hidden');ensureLogoutButton(session.user);if(typeof window.loadCloudData==='function')await window.loadCloudData()}catch(e){if(appRoot)appRoot.classList.add('auth-hidden');authShell.classList.remove('auth-hidden');setAuthMessage(e.message.includes('trial_already_used')?'Este correo ya utilizó la prueba gratuita.':friendlyAuthError(e),'error')}}
document.getElementById('authForm').addEventListener('submit',async e=>{e.preventDefault();setAuthMessage('Ingresando...');const{error}=await sbClient.auth.signInWithPassword({email:authEmail.value.trim().toLowerCase(),password:authPass.value});if(error)setAuthMessage(friendlyAuthError(error),'error')});
document.getElementById('signupBtn').addEventListener('click',async()=>{const email=authEmail.value.trim().toLowerCase(),password=authPass.value;if(!email||password.length<6)return setAuthMessage('Escribe tu correo y crea una contraseña de mínimo 6 caracteres.','error');setAuthMessage('Creando tu cuenta...');const{data,error}=await sbClient.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});if(error)return setAuthMessage(friendlyAuthError(error),'error');if(data.session){setAuthMessage('Cuenta creada. Registra tu negocio para iniciar la prueba.','ok');await showApp(data.session)}else setAuthMessage('Cuenta creada. Confirma tu correo y luego ingresa con la contraseña que acabas de crear.','ok')});
document.getElementById('forgotBtn').addEventListener('click',async()=>{const email=authEmail.value.trim().toLowerCase();if(!email)return setAuthMessage('Escribe primero tu correo electrónico.','error');setAuthMessage('Enviando enlace para cambiar contraseña...');const{error}=await sbClient.auth.resetPasswordForEmail(email,{redirectTo:'https://yesid1000415.github.io/MIRED360-BEAUTY/'});if(error)return setAuthMessage(friendlyAuthError(error),'error');setAuthMessage('Revisa tu correo. Te enviamos el enlace para cambiar tu contraseña.','ok')});
sbClient.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>showApp(session),0)});
(async()=>{const{data}=await sbClient.auth.getSession();await showApp(data.session)})();
