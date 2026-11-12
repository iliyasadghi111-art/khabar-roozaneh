const $=id=>document.getElementById(id);
const url=window.SUPABASE_URL;
const key=window.SUPABASE_ANON_KEY;
const valid=window.supabase&&typeof url==='string'&&url.startsWith('https://')&&!url.includes('PASTE_')&&typeof key==='string'&&!key.includes('PASTE_');

if(!valid){
$('setup-warning').textContent='تنظیمات Supabase کامل نیست.';
$('setup-warning').classList.remove('hidden');
$('login-box').classList.add('hidden');
return;
}

const db=window.supabase.createClient(url,key);
