
(() => {
  const $ = id => document.getElementById(id);

  const el = $('news');
  const notice = $('notice');
  const updated = $('updated');

  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;

  if (!window.supabase || !url || !key) {
    if (notice) {
      notice.textContent = 'تنظیمات اتصال کامل نیست.';
      notice.classList.remove('hidden');
    }
    return;
  }

  const db = window.supabase.createClient(url, key);

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  })[c]);

  async function loadTheme() {
    const { data, error } = await db
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      console.error('Theme error:', error);
      return;
    }

    const root = document.documentElement;

    if (data.primary_color)
      root.style.setProperty('--primary', data.primary_color);

    if (data.background_color)
      root.style.setProperty('--background', data.background_color);

    if (data.text_color)
      root.style.setProperty('--text', data.text_color);

    if (data.font_family) {
      root.style.setProperty('--site-font', data.font_family);
      document.body.style.fontFamily = data.font_family;
    }

    if (data.font_size) {
      document.body.style.fontSize = `${Number(data.font_size)}px`;
    }

    if (data.font_url) {
      const font = new FontFace(
        'CustomSiteFont',
        `url("${data.font_url}")`
      );

      try {
        await font.load();
        document.fonts.add(font);
        document.body.style.fontFamily = 'CustomSiteFont';
      } catch (error) {
        console.error('Font loading error:', error);
      }
    }

    if (data.logo_url) {
      let logo = $('site-logo');

      if (!logo) {
        logo = document.createElement('img');
        logo.id = 'site-logo';
        logo.alt = 'لوگوی خبر روزانه';
        const header = document.querySelector('header');
        if (header) header.prepend(logo);
      }

      if (logo) logo.src = data.logo_url;
    }

    if (data.banner_url) {
      let banner = $('site-banner');

      if (!banner) {
        banner = document.createElement('img');
        banner.id = 'site-banner';
        banner.alt = 'بنر خبر روزانه';
        banner.style.width = '100%';

        const header = document.querySelector('header');
        if (header) header.appendChild(banner);
      }

      if (banner) banner.src = data.banner_url;
    }
  }

  async function loadNews() {
    if (!el) return;

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

    if (updated) {
      updated.textContent = 'آخرین بروزرسانی: ' +
        new Date().toLocaleTimeString('fa-IR');
    }
  }

  async function refresh() {
    await loadTheme();
    await loadNews();
  }

  refresh();
  setInterval(refresh, 60000);
})();
