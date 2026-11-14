
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
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
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
    root.style.setProperty('--navy', '#142b4d');
    root.style.setProperty('--navy2', '#203e66');
    root.style.setProperty('--ink', '#17263b');
    root.style.setProperty('--bg', '#f5f7fb');

    if (data.font_url) {
      try {
        const font = new FontFace(
          'CustomSiteFont',
          `url("${data.font_url}")`
        );
        await font.load();
        document.fonts.add(font);
        document.body.style.fontFamily =
          'CustomSiteFont, Vazirmatn, Tahoma, sans-serif';
      } catch (e) {
        console.error('Font error:', e);
      }
    }

    if (data.font_size) {
      document.body.style.fontSize = Number(data.font_size) + 'px';
    }

    // لوگو: فقط لوگوی تصویری HTML باقی بماند
    document.querySelectorAll('#site-logo').forEach(logo => logo.remove());

    document.querySelectorAll('.brand').forEach(brand => {
      let logo = brand.querySelector('img.brandmark');

      if (!logo && data.logo_url) {
        const oldMark = brand.querySelector('.brandmark');
        if (oldMark) oldMark.remove();

        logo = document.createElement('img');
        logo.className = 'brandmark';
        logo.alt = 'لوگوی خبر روزانه';
        brand.prepend(logo);
      }

      if (logo && data.logo_url) {
        logo.src = data.logo_url;
      }
    });

    // بنر: بیرون از hero-in قرار می‌گیرد تا چیدمان خراب نشود
    const hero = document.querySelector('.hero');
    const heroIn = document.querySelector('.hero-in');

    if (hero && heroIn && data.banner_url) {
      let banner = $('site-banner');

      if (!banner) {
        banner = document.createElement('img');
        banner.id = 'site-banner';
        banner.alt = 'بنر خبر روزانه';
        banner.style.cssText =
          'display:block;width:100%;height:120px;object-fit:cover;margin-bottom:20px;border-radius:12px;';
        hero.insertBefore(banner, heroIn);
      }

      banner.src = data.banner_url;
    } else {
      const oldBanner = $('site-banner');
      if (oldBanner) oldBanner.remove();
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
