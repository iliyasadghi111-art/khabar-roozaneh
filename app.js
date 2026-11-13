(() => {
  const el = document.getElementById('news');
  const notice = document.getElementById('notice');
  const updated = document.getElementById('updated');

  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;

  if (!window.supabase || !url || !key) {
    notice.textContent = 'تنظیمات اتصال کامل نیست.';
    notice.classList.remove('hidden');
    return;
  }

  const db = window.supabase.createClient(url, key);

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  })[c]);

  async function load() {
    const { data, error } = await db
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      el.innerHTML = `<div class="empty">${esc(error.message)}</div>`;
      return;
    }

    if (!data || !data.length) {
      el.innerHTML = '<div class="empty">هنوز خبری منتشر نشده است.</div>';
      return;
    }

    el.innerHTML = data.map(n => {
      const content = String(n.content ?? '');

      return `
        <article class="news-card">
          ${n.image_url ? `<img src="${esc(n.image_url)}" alt="">` : ''}
          <div class="content">
            <span class="tag">${esc(n.category)}</span>
            <h3>${esc(n.title)}</h3>
            <p>${esc(content.slice(0, 190))}${content.length > 190 ? '…' : ''}</p>
            <div class="meta">
              <span class="source">${esc(n.source || 'خبر روزانه')}</span>
              <span>${n.created_at ? new Date(n.created_at).toLocaleDateString('fa-IR') : ''}</span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    updated.textContent = 'آخرین بروزرسانی: ' +
      new Date().toLocaleTimeString('fa-IR');
  }

  load();
  setInterval(load, 60000);
})();
