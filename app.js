
(() => {
  const el = document.getElementById('news');
  const notice = document.getElementById('notice');
  const updated = document.getElementById('updated');

  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;

  if (
    !window.supabase ||
    typeof url !== 'string' ||
    !url.startsWith('https://') ||
    typeof key !== 'string' ||
    key.length < 10
  ) {
    updated.textContent = 'نیازمند تنظیم اتصال';
    notice.textContent = 'تنظیمات Supabase را بررسی کنید.';
    notice.classList.remove('hidden');
    return;
  }

  const db = window.supabase.createClient(url, key);

  const esc = value =>
    String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[c]);

  async function load() {
    el.innerHTML = '<div class="empty">در حال دریافت خبرها...</div>';

    const { data, error } = await db
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60);

    if (error) {
      el.innerHTML =
        '<div class="empty">خطا در دریافت خبرها: ' +
        esc(error.message) + '</div>';
      return;
    }

    if (!data || data.length === 0) {
      el.innerHTML =
        '<div class="empty">هنوز خبری منتشر نشده است.</div>';
      return;
    }

    el.innerHTML = data.map(n => {
      const content = String(n.content ?? n.body ?? '');
      const title = String(n.title ?? 'بدون عنوان');

      return `
        <article class="news-card">
          ${n.image_url
            ? `<img src="${esc(n.image_url)}" alt="${esc(title)}">`
            : ''
          }
          <div class="content">
            <span class="tag">${esc(n.category || 'عمومی')}</span>
            <h3>${esc(title)}</h3>
            <p>${esc(content.slice(0, 190))}${content.length > 190 ? '…' : ''}</p>
            <div class="meta">
              <span class="source">${esc(n.source || 'خبر روزانه')}</span>
              <span>${n.created_at
                ? new Date(n.created_at).toLocaleDateString('fa-IR')
                : ''
              }</span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    updated.textContent =
      'آخرین بروزرسانی: ' +
      new Date().toLocaleTimeString('fa-IR');
  }

  load();
  setInterval(load, 60000);
})();
