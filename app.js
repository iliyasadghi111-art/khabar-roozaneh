(() => {
const el = document.getElementById('news'), notice = document.getElementById('notice');
const ready = window.supabase && SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('PASTE_') && !SUPABASE_ANON_KEY.includes('PASTE_');
if (!ready) { document.getElementById('updated').textContent='نیازمند تنظیم اتصال'; notice.textContent='برای انتشار و نمایش خبرها، ابتدا راهنمای README را انجام دهید و اطلاعات Supabase را در config.js قرار دهید.'; notice.classList.remove('hidden'); return; }
const db = supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function load(){
 const {data,error}=await db.from('news').select('*').order('created_at',{ascending:false}).limit(60);
 if(error){el.innerHTML='<div class="empty">دریافت خبرها ممکن نشد. تنظیمات پایگاه داده را بررسی کنید.</div>';return;}
 if(!data.length){el.innerHTML='<div class="empty">هنوز خبری منتشر نشده است.</div>';return;}
 el.innerHTML=data.map(n=>`<article class="news-card">${n.image_url?`<img src="${esc(n.image_url)}" alt="">`:''}<div class="content"><span class="tag">${esc(n.category)}</span><h3>${esc(n.title)}</h3><p>${esc(n.body.slice(0,190))}${n.body.length>190?'…':''}</p><div class="meta"><span class="source">${esc(n.source||'خبر روزانه')}</span><span>${new Date(n.created_at).toLocaleDateString('fa-IR')}</span></div>${n.source_url?`<p><a class="source" target="_blank" rel="noopener" href="${esc(n.source_url)}">مشاهده منبع خبر ↗</a></p>`:''}</div></article>`).join('');
 document.getElementById('updated').textContent='آخرین بروزرسانی: '+new Date().toLocaleTimeString('fa-IR');
}
load(); setInterval(load,60000);
})();