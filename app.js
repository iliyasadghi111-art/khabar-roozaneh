
(() => {
  const $ = id => document.getElementById(id);

  const newsBox = $('news');
  const updated = $('updated');
  const notice = $('notice');

  if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    if (notice) {
      notice.textContent = 'تنظیمات اتصال پایگاه داده کامل نیست.';
      notice.classList.remove('hidden');
    }
    return;
  }

  const db = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  })[c]);

  async function loadTheme() {
    const { data, error } = await db
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('Theme loading error:', error);
      return;
    }

    if (!data) return;

    const root = document.documentElement;

    root.style.setProperty('--navy', data.primary_color || '#142b4d');
    root.style.setProperty('--navy2', data.primary_color || '#203e66');
    root.style.setProperty('--bg', data.background_color || '#f5f7fb');
    root.style.setProperty('--ink', data.text_color || '#17263b');

    if (data.font_size) {
      document.body.style.fontSize = Number(data.font_size) + 'px';
    }

    if (data.font_url) {
      try {
        const font = new FontFace(
          'CustomSiteFont',
          `url("${data.font_url}")`
        );
        await font.load();
        document.fonts.add(font);
        document.body.style.fontFamily = 'CustomSiteFont, Tahoma, sans-serif';
      } catch (e) {
        console.error('Font loading error:', e);
      }
    } else if (data.font_family && data.font_family !== 'custom') {
      document.body.style.fontFamily = data.font_family;
    }

    const brand = document.querySelector('.brand');
    if (brand && data.logo_url) {
      let logo = $('site-logo');
      if (!logo) {
        logo = document.createElement('img');
        logo.id = 'site-logo';
        logo.alt = 'لوگوی خبر روزانه';
        logo.style.cssText = 'width:48px;height:48px;object-fit:contain;border-radius:8px;';
        brand.prepend(logo);
      }
      logo.src = data.logo_url;
    }

    const hero = document.querySelector('.hero');
    if (hero && data.banner_url) {
      let banner = $('site-banner');
      if (!banner) {
        banner = document.createElement('img');
        banner.id = 'site-banner';
        banner.alt = 'بنر خبر روزانه';
        banner.style.cssText = 'display:block;width:100%;max-height:260px;object-fit:cover;';
        hero.prepend(banner);
      }
      banner.src = data.banner_url;
    }
  }

  async function loadNews() {
    if (!newsBox) return;

    const { data, error } = await db
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      newsBox.innerHTML = `<div class="empty">${esc(error.message)}</div>`;
      return;
    }

    if (!data || data.length === 0) {
      newsBox.innerHTML = '<div class="empty">هنوز خبری منتشر نشده است.</div>';
      return;
    }

    newsBox.innerHTML = data.map(n => {
      const content = String(n.content || '');
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
