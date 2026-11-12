(() => {
const $=id=>document.getElementById(id), valid=window.supabase&&SUPABASE_URL.startsWith('https://')&&!SUPABASE_URL.includes('PASTE_')&&!SUPABASE_ANON_KEY.includes('PASTE_');
if(!valid){$('setup-warning').textContent='ابتدا فایل config.js را طبق README تنظیم کنید.';$('setup-warning').classList.remove('hidden');$('login-box').classList.add('hidden');return;}
const db=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let editing=null;
async function state(){const {data:{session}}=await db.auth.getSession();$('login-box').classList.toggle('hidden',!!session);$('dashboard').classList.toggle('hidden',!session);$('logout').classList.toggle('hidden',!session);if(session) await list();}
$('login-form').addEventListener('submit',async e=>{e.preventDefault();$('login-msg').textContent='در حال ورود…';const {error}=await db.auth.signInWithPassword({email:$('email').value,password:$('password').value});$('login-msg').textContent=error?'ورود ناموفق بود؛ ایمیل و رمز را بررسی کنید.':'';if(!error)state();});
$('logout').onclick=async()=>{await db.auth.signOut();state();};
async function list(){const {data,error}=await db.from('news').select('*').order('created_at',{ascending:false});$('admin-list').innerHTML=error?'خطا در دریافت فهرست':!data.length?'<p class="muted">هنوز خبری ثبت نشده است.</p>':data.map(n=>`<div class="adminitem"><div><strong>${esc(n.title)}</strong><small>${esc(n.category)} · ${new Date(n.created_at).toLocaleDateString('fa-IR')}</small></div><div><button class="secondary" data-edit="${n.id}">ویرایش</button><button class="secondary danger" data-del="${n.id}">حذف</button></div></div>`).join('');
document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(data.find(n=>n.id===b.dataset.edit)));document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>remove(b.dataset.del));}
function edit(n){editing=n.id;$('news-id').value=n.id;$('title').value=n.title;$('category').value=n.category;$('image').value=n.image_url||'';$('body').value=n.body;$('source').value=n.source||'';$('source-url').value=n.source_url||'';$('form-title').textContent='ویرایش خبر';$('cancel-edit').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'});}
function reset(){$('news-form').reset();editing=null;$('news-id').value='';$('form-title').textContent='افزودن خبر جدید';$('cancel-edit').classList.add('hidden');}
$('cancel-edit').onclick=reset;
$('news-form').onsubmit=async e=>{e.preventDefault();$('form-msg').textContent='در حال ذخیره…';const item={title:$('title').value.trim(),category:$('category').value,image_url:$('image').value.trim()||null,body:$('body').value.trim(),source:$('source').value.trim()||null,source_url:$('source-url').value.trim()||null};const result=editing?await db.from('news').update(item).eq('id',editing):await db.from('news').insert(item);if(result.error){$('form-msg').textContent='ذخیره نشد: '+result.error.message;return;}$('form-msg').textContent='خبر با موفقیت ذخیره شد.';reset();await list();};
async function remove(id){if(!confirm('این خبر حذف شود؟'))return;const {error}=await db.from('news').delete().eq('id',id);if(error)alert('حذف انجام نشد: '+error.message);else list();}
$('reload').onclick=list;db.auth.onAuthStateChange(()=>setTimeout(state,0));state();
})();